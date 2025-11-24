import { ServiceResponse, TimelineEntry, UpcomingDate } from '~/types/db';
import {
  createErrorResponse,
  createSuccessResponse,
  mapGenericError,
  mapSupabaseError,
} from './error-handling';
import { supabase } from './supabase';

/**
 * Options for filtering timeline results
 */
export interface TimelineOptions {
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  limit?: number;
  includeUnknownYears?: boolean; // Whether to include dates with year 0001
}

/**
 * Get timeline of all dates across all user's people, sorted chronologically
 * Handles recurring dates (year 0001) by treating them as annual events
 */
export async function getTimelineForUser(
  userId: string,
  options: TimelineOptions = {},
): Promise<ServiceResponse<TimelineEntry[]>> {
  try {
    const { startDate, endDate, limit, includeUnknownYears = true } = options;

    // Build the base query with person context
    let query = supabase
      .from('dates')
      .select(
        `
        *,
        person:persons!inner(
          id,
          name
        )
      `,
      )
      .eq('persons.user_id', userId)
      .is('deleted_at', null)
      .is('persons.deleted_at', null);

    // Apply date range filters if provided
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Filter out unknown years if requested
    if (!includeUnknownYears) {
      query = query.not('date', 'like', '0001-%');
    }

    // Apply limit if provided
    if (limit) {
      query = query.limit(limit);
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      return createErrorResponse(mapSupabaseError(error));
    }

    if (!data) {
      return createSuccessResponse([]);
    }

    // Transform the data to match TimelineEntry type
    const timelineEntries: TimelineEntry[] = data.map((item: any) => ({
      id: item.id,
      person_id: item.person_id,
      label: item.label,
      date: item.date,
      month: item.month,
      day: item.day,
      year_known: item.year_known,
      created_at: item.created_at,
      updated_at: item.updated_at,
      deleted_at: item.deleted_at,
      person: {
        id: item.person.id,
        name: item.person.name,
      },
    }));

    // Sort chronologically with special handling for recurring dates (year 0001)
    const sortedEntries = timelineEntries.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      // Handle recurring dates (year 0001) by projecting them to current year
      const yearA = dateA.getFullYear();
      const yearB = dateB.getFullYear();

      let sortDateA = dateA;
      let sortDateB = dateB;

      // If year is 0001, project to current year for sorting
      if (yearA === 1) {
        const currentYear = new Date().getFullYear();
        sortDateA = new Date(dateA);
        sortDateA.setFullYear(currentYear);
      }

      if (yearB === 1) {
        const currentYear = new Date().getFullYear();
        sortDateB = new Date(dateB);
        sortDateB.setFullYear(currentYear);
      }

      return sortDateA.getTime() - sortDateB.getTime();
    });

    return createSuccessResponse(sortedEntries);
  } catch (unexpectedError) {
    return createErrorResponse(mapGenericError(unexpectedError));
  }
}

/**
 * Get upcoming dates within a specified number of days
 * Useful for dashboard widgets or notifications
 */
export async function getUpcomingDates(
  daysAhead: number = 30,
): Promise<ServiceResponse<UpcomingDate[]>> {
  try {
    const { data, error } = await supabase.rpc('upcoming_dates', {
      days_ahead: daysAhead,
    });

    if (error) {
      return createErrorResponse(mapSupabaseError(error));
    }

    return createSuccessResponse(data || []);
  } catch (unexpectedError) {
    return createErrorResponse(mapGenericError(unexpectedError));
  }
}

/**
 * Get dates for a specific month across all people
 * Useful for calendar views
 */
export async function getTimelineForMonth(
  userId: string,
  year: number,
  month: number,
): Promise<ServiceResponse<TimelineEntry[]>> {
  // Create start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of the month

  return getTimelineForUser(userId, {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    includeUnknownYears: true,
  });
}
