import { Date, DateInsert, DateUpdate, ServiceResponse } from '~/types/db';
import { createDateSchema, updateDateSchema } from './date-schema';
import {
  createErrorResponse,
  createSuccessResponse,
  mapSupabaseError,
  mapValidationError,
} from './error-handling';
import { supabase } from './supabase';

/**
 * Create a new date for a person
 */
export async function createDate(
  dateData: DateInsert,
): Promise<ServiceResponse<Date>> {
  try {
    // Validate input data
    const validated = createDateSchema.parse(dateData);

    const { data, error } = await supabase
      .from('dates')
      .insert(validated)
      .select()
      .single();

    if (error) {
      return createErrorResponse(mapSupabaseError(error));
    }

    return createSuccessResponse(data);
  } catch (validationError) {
    return createErrorResponse(mapValidationError(validationError as any));
  }
}

/**
 * Get all dates for a specific person, ordered chronologically
 * Handles special case for unknown years (0001) by treating them as recurring events
 */
export async function getDatesByPerson(
  personId: string,
): Promise<ServiceResponse<Date[]>> {
  const { data, error } = await supabase
    .from('dates')
    .select('*')
    .eq('person_id', personId)
    .is('deleted_at', null)
    .order('date', { ascending: true });

  if (error) {
    return createErrorResponse(mapSupabaseError(error));
  }

  return createSuccessResponse(data || []);
}

/**
 * Update a date
 */
export async function updateDate(
  dateId: string,
  updates: DateUpdate,
): Promise<ServiceResponse<Date>> {
  try {
    // Validate update data if provided
    if (updates.label !== undefined || updates.date !== undefined) {
      updateDateSchema.parse(updates);
    }

    const { data, error } = await supabase
      .from('dates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', dateId)
      .select()
      .single();

    if (error) {
      return createErrorResponse(mapSupabaseError(error));
    }

    return createSuccessResponse(data);
  } catch (validationError) {
    return createErrorResponse(mapValidationError(validationError as any));
  }
}

/**
 * Soft delete a date
 */
export async function deleteDate(
  dateId: string,
): Promise<ServiceResponse<Date>> {
  const { data, error } = await supabase
    .from('dates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dateId)
    .select()
    .single();

  if (error) {
    return createErrorResponse(mapSupabaseError(error));
  }

  return createSuccessResponse(data);
}
