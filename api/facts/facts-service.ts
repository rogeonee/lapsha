import {
  createErrorResponse,
  createSuccessResponse,
  mapSupabaseError,
  mapValidationError,
} from '~/api/error-handling';
import { createFactSchema, updateFactSchema } from '~/api/facts/fact-schema';
import { supabase } from '~/api/supabase';
import { Fact, FactInsert, FactUpdate, ServiceResponse } from '~/types/db';

/**
 * Create a new fact for a person
 */
export async function createFact(
  factData: FactInsert,
): Promise<ServiceResponse<Fact>> {
  try {
    // Validate input data
    const validated = createFactSchema.parse(factData);

    const { data, error } = await supabase
      .from('facts')
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
 * Get all facts for a specific person
 */
export async function getFactsByPerson(
  personId: string,
): Promise<ServiceResponse<Fact[]>> {
  const { data, error } = await supabase
    .from('facts')
    .select('*')
    .eq('person_id', personId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return createErrorResponse(mapSupabaseError(error));
  }

  return createSuccessResponse(data || []);
}

/**
 * Update a fact
 */
export async function updateFact(
  factId: string,
  updates: FactUpdate,
): Promise<ServiceResponse<Fact>> {
  try {
    // Validate update data if provided
    if (updates.label !== undefined || updates.value !== undefined) {
      updateFactSchema.parse(updates);
    }

    const { data, error } = await supabase
      .from('facts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', factId)
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
 * Soft delete a fact
 */
export async function deleteFact(
  factId: string,
): Promise<ServiceResponse<Fact>> {
  const { data, error } = await supabase
    .from('facts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', factId)
    .select()
    .single();

  if (error) {
    return createErrorResponse(mapSupabaseError(error));
  }

  return createSuccessResponse(data);
}
