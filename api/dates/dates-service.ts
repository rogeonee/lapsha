import {
  createErrorResponse,
  createSuccessResponse,
  mapSupabaseError,
  mapValidationError,
} from '~/api/error-handling';
import { supabase } from '~/api/supabase';
import {
  Date,
  DateInsert,
  DateUpdate,
  ErrorCode,
  ServiceResponse,
} from '~/types/db';
import { createDateSchema, updateDateSchema } from './date-schema';

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
  // Ensure the parent person exists and is not soft-deleted
  const { data: person, error: personError } = await supabase
    .from('v_persons')
    .select('id, deleted_at')
    .eq('id', personId)
    .single();

  if (personError) {
    return createErrorResponse(mapSupabaseError(personError));
  }

  if (!person || person.deleted_at) {
    return createErrorResponse({
      code: ErrorCode.NOT_FOUND,
      message: 'Person not found',
    });
  }

  const { data, error } = await supabase
    .from('v_dates')
    .select('*')
    .eq('person_id', personId)
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
      .update(updates)
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
