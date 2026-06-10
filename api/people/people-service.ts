import { randomUUID } from 'expo-crypto';
import { db } from '~/api/database';
import { rowToDate, type DateRow } from '~/api/dates/dates-service';
import {
  ErrorCode,
  NotFoundError,
  runServiceOperation,
} from '~/api/error-handling';
import { createPersonSchema } from '~/api/people/person-schema';
import {
  Person,
  PersonInsert,
  PersonUpdate,
  PersonWithDetails,
  ServiceResponse,
} from '~/types/db';

// Re-export types for backward compatibility
export type { Person, PersonInsert, PersonUpdate, PersonWithDetails };

function getPersonOrThrow(personId: string): Person {
  const person = db.getFirstSync<Person>(
    'SELECT * FROM persons WHERE id = ? AND deleted_at IS NULL',
    personId,
  );

  if (!person) {
    throw new NotFoundError('Person not found', ErrorCode.PERSON_NOT_FOUND);
  }

  return person;
}

/**
 * Create a new person
 */
export function createPerson(
  personData: PersonInsert,
): ServiceResponse<Person> {
  return runServiceOperation(() => {
    const validated = createPersonSchema.parse(personData);

    const id = personData.id ?? randomUUID();
    const now = new Date().toISOString();

    db.runSync(
      `INSERT INTO persons (id, name, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, NULL)`,
      id,
      validated.name,
      now,
      now,
    );

    return getPersonOrThrow(id);
  });
}

/**
 * Get all people, newest first
 */
export function getPeople(): ServiceResponse<Person[]> {
  return runServiceOperation(() =>
    db.getAllSync<Person>(
      'SELECT * FROM persons WHERE deleted_at IS NULL ORDER BY created_at DESC',
    ),
  );
}

/**
 * Get a single person by ID
 */
export function getPerson(personId: string): ServiceResponse<Person> {
  return runServiceOperation(() => getPersonOrThrow(personId));
}

/**
 * Update a person
 */
export function updatePerson(
  personId: string,
  updates: PersonUpdate,
): ServiceResponse<Person> {
  return runServiceOperation(() => {
    getPersonOrThrow(personId);

    if (updates.name !== undefined) {
      const validated = createPersonSchema.parse({ name: updates.name });

      db.runSync(
        'UPDATE persons SET name = ?, updated_at = ? WHERE id = ?',
        validated.name,
        new Date().toISOString(),
        personId,
      );
    }

    return getPersonOrThrow(personId);
  });
}

/**
 * Soft delete a person
 */
export function deletePerson(personId: string): ServiceResponse<Person> {
  return runServiceOperation(() => {
    getPersonOrThrow(personId);

    const now = new Date().toISOString();
    db.runSync(
      'UPDATE persons SET deleted_at = ?, updated_at = ? WHERE id = ?',
      now,
      now,
      personId,
    );

    const deleted = db.getFirstSync<Person>(
      'SELECT * FROM persons WHERE id = ?',
      personId,
    );

    if (!deleted) {
      throw new NotFoundError('Person not found', ErrorCode.PERSON_NOT_FOUND);
    }

    return deleted;
  });
}

/**
 * Get a person with all associated facts and dates
 */
export function getPersonWithDetails(
  personId: string,
): ServiceResponse<PersonWithDetails> {
  return runServiceOperation(() => {
    const person = getPersonOrThrow(personId);

    const facts = db.getAllSync<PersonWithDetails['facts'][number]>(
      `SELECT * FROM facts
       WHERE person_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      personId,
    );

    const dates = db.getAllSync<DateRow>(
      `SELECT * FROM dates
       WHERE person_id = ? AND deleted_at IS NULL
       ORDER BY date ASC`,
      personId,
    );

    return { ...person, facts, dates: dates.map(rowToDate) };
  });
}
