import {
  Person,
  PersonInsert,
  PersonUpdate,
  PersonWithDetails,
  ServiceResponse,
} from '~/types/db';
import {
  createErrorResponse,
  createSuccessResponse,
  mapSupabaseError,
} from './error-handling';
import { supabase } from './supabase';

// Re-export types for backward compatibility
export type { Person, PersonInsert, PersonUpdate, PersonWithDetails };

/**
 * Create a new person
 */
export async function createPerson(
  personData: PersonInsert,
): Promise<ServiceResponse<Person>> {
  const { data, error } = await supabase
    .from('persons')
    .insert(personData)
    .select()
    .single();

  if (error) {
    return createErrorResponse(mapSupabaseError(error));
  }

  return createSuccessResponse(data);
}

/**
 * Get all people for the current user
 */
export async function getPeople(
  userId: string,
): Promise<ServiceResponse<Person[]>> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return createErrorResponse(mapSupabaseError(error));
  }

  return createSuccessResponse(data || []);
}

/**
 * Get a single person by ID
 */
export async function getPerson(
  personId: string,
): Promise<ServiceResponse<Person>> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('id', personId)
    .is('deleted_at', null)
    .single();

  if (error) {
    return createErrorResponse(mapSupabaseError(error));
  }

  return createSuccessResponse(data);
}

/**
 * Update a person
 */
export async function updatePerson(
  personId: string,
  updates: PersonUpdate,
): Promise<ServiceResponse<Person>> {
  const { data, error } = await supabase
    .from('persons')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', personId)
    .select()
    .single();

  if (error) {
    return createErrorResponse(mapSupabaseError(error));
  }

  return createSuccessResponse(data);
}

/**
 * Soft delete a person
 */
export async function deletePerson(
  personId: string,
): Promise<ServiceResponse<Person>> {
  const { data, error } = await supabase
    .from('persons')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', personId)
    .select()
    .single();

  if (error) {
    return createErrorResponse(mapSupabaseError(error));
  }

  return createSuccessResponse(data);
}

/**
 * Get a person with all associated facts and dates in a single optimized query
 */
export async function getPersonWithDetails(
  personId: string,
): Promise<ServiceResponse<PersonWithDetails>> {
  // Get person with facts and dates in separate queries for better performance
  // and to maintain proper ordering for each collection

  // First get the person
  const { data: person, error: personError } = await supabase
    .from('persons')
    .select('*')
    .eq('id', personId)
    .is('deleted_at', null)
    .single();

  if (personError) {
    return createErrorResponse(mapSupabaseError(personError));
  }

  if (!person) {
    return createErrorResponse({
      code: 'NOT_FOUND',
      message: 'Person not found',
    });
  }

  // Get facts ordered by newest first (created_at desc)
  const { data: facts, error: factsError } = await supabase
    .from('facts')
    .select('*')
    .eq('person_id', personId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (factsError) {
    return createErrorResponse(mapSupabaseError(factsError));
  }

  // Get dates ordered chronologically (date asc)
  const { data: dates, error: datesError } = await supabase
    .from('dates')
    .select('*')
    .eq('person_id', personId)
    .is('deleted_at', null)
    .order('date', { ascending: true });

  if (datesError) {
    return createErrorResponse(mapSupabaseError(datesError));
  }

  // Combine into PersonWithDetails, handling cases where person has no facts or dates
  const personWithDetails: PersonWithDetails = {
    ...person,
    facts: facts || [],
    dates: dates || [],
  };

  return createSuccessResponse(personWithDetails);
}
