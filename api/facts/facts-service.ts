import { randomUUID } from 'expo-crypto';
import { db } from '~/api/database';
import {
  ErrorCode,
  NotFoundError,
  runServiceOperation,
} from '~/api/error-handling';
import { createFactSchema, updateFactSchema } from '~/api/facts/fact-schema';
import { Fact, FactInsert, FactUpdate, ServiceResponse } from '~/types/db';

function assertPersonExists(personId: string): void {
  const person = db.getFirstSync<{ id: string }>(
    'SELECT id FROM persons WHERE id = ? AND deleted_at IS NULL',
    personId,
  );

  if (!person) {
    throw new NotFoundError('Person not found', ErrorCode.PERSON_NOT_FOUND);
  }
}

function getFactOrThrow(factId: string): Fact {
  const fact = db.getFirstSync<Fact>(
    'SELECT * FROM facts WHERE id = ? AND deleted_at IS NULL',
    factId,
  );

  if (!fact) {
    throw new NotFoundError('Fact not found', ErrorCode.FACT_NOT_FOUND);
  }

  return fact;
}

/**
 * Create a new fact for a person
 */
export function createFact(factData: FactInsert): ServiceResponse<Fact> {
  return runServiceOperation(() => {
    const validated = createFactSchema.parse(factData);

    assertPersonExists(validated.person_id);

    const id = factData.id ?? randomUUID();
    const now = new Date().toISOString();

    db.runSync(
      `INSERT INTO facts (id, person_id, label, value, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      id,
      validated.person_id,
      validated.label,
      validated.value,
      now,
      now,
    );

    return getFactOrThrow(id);
  });
}

/**
 * Get all facts for a specific person, newest first
 */
export function getFactsByPerson(personId: string): ServiceResponse<Fact[]> {
  return runServiceOperation(() => {
    assertPersonExists(personId);

    return db.getAllSync<Fact>(
      `SELECT * FROM facts
       WHERE person_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      personId,
    );
  });
}

/**
 * Update a fact
 */
export function updateFact(
  factId: string,
  updates: FactUpdate,
): ServiceResponse<Fact> {
  return runServiceOperation(() => {
    const validated = updateFactSchema.parse(updates);
    const existing = getFactOrThrow(factId);

    db.runSync(
      'UPDATE facts SET label = ?, value = ?, updated_at = ? WHERE id = ?',
      validated.label ?? existing.label,
      validated.value ?? existing.value,
      new Date().toISOString(),
      factId,
    );

    return getFactOrThrow(factId);
  });
}

/**
 * Soft delete a fact
 */
export function deleteFact(factId: string): ServiceResponse<Fact> {
  return runServiceOperation(() => {
    getFactOrThrow(factId);

    const now = new Date().toISOString();
    db.runSync(
      'UPDATE facts SET deleted_at = ?, updated_at = ? WHERE id = ?',
      now,
      now,
      factId,
    );

    const deleted = db.getFirstSync<Fact>(
      'SELECT * FROM facts WHERE id = ?',
      factId,
    );

    if (!deleted) {
      throw new NotFoundError('Fact not found', ErrorCode.FACT_NOT_FOUND);
    }

    return deleted;
  });
}
