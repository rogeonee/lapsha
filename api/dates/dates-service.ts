import { randomUUID } from 'expo-crypto';
import { db } from '~/api/database';
import { createDateSchema, updateDateSchema } from '~/api/dates/date-schema';
import {
  ErrorCode,
  NotFoundError,
  runServiceOperation,
} from '~/api/error-handling';
import {
  DateInsert,
  DateUpdate,
  Date as PersonDate,
  ServiceResponse,
} from '~/types/db';

/**
 * Raw `dates` row as stored in SQLite (booleans are 0/1 integers)
 */
export type DateRow = Omit<PersonDate, 'year_known'> & { year_known: number };

export function rowToDate(row: DateRow): PersonDate {
  return { ...row, year_known: row.year_known === 1 };
}

/**
 * Derive the denormalized month/day/year_known columns from a
 * YYYY-MM-DD string. Year 0001 marks a recurring date with an
 * unknown year.
 */
function parseDateParts(date: string): {
  month: number;
  day: number;
  yearKnown: number;
} {
  const [year, month, day] = date.split('-');
  return {
    month: Number(month),
    day: Number(day),
    yearKnown: year === '0001' ? 0 : 1,
  };
}

function assertPersonExists(personId: string): void {
  const person = db.getFirstSync<{ id: string }>(
    'SELECT id FROM persons WHERE id = ? AND deleted_at IS NULL',
    personId,
  );

  if (!person) {
    throw new NotFoundError('Person not found', ErrorCode.PERSON_NOT_FOUND);
  }
}

function getDateRowOrThrow(dateId: string): DateRow {
  const row = db.getFirstSync<DateRow>(
    'SELECT * FROM dates WHERE id = ? AND deleted_at IS NULL',
    dateId,
  );

  if (!row) {
    throw new NotFoundError('Date not found', ErrorCode.DATE_NOT_FOUND);
  }

  return row;
}

/**
 * Create a new date for a person
 */
export function createDate(dateData: DateInsert): ServiceResponse<PersonDate> {
  return runServiceOperation(() => {
    const validated = createDateSchema.parse(dateData);

    assertPersonExists(validated.person_id);

    const id = dateData.id ?? randomUUID();
    const now = new globalThis.Date().toISOString();
    const { month, day, yearKnown } = parseDateParts(validated.date);

    db.runSync(
      `INSERT INTO dates (id, person_id, label, date, month, day, year_known, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      id,
      validated.person_id,
      validated.label,
      validated.date,
      month,
      day,
      yearKnown,
      now,
      now,
    );

    return rowToDate(getDateRowOrThrow(id));
  });
}

/**
 * Get all dates for a specific person, ordered chronologically
 */
export function getDatesByPerson(
  personId: string,
): ServiceResponse<PersonDate[]> {
  return runServiceOperation(() => {
    assertPersonExists(personId);

    const rows = db.getAllSync<DateRow>(
      `SELECT * FROM dates
       WHERE person_id = ? AND deleted_at IS NULL
       ORDER BY date ASC`,
      personId,
    );

    return rows.map(rowToDate);
  });
}

/**
 * Update a date
 */
export function updateDate(
  dateId: string,
  updates: DateUpdate,
): ServiceResponse<PersonDate> {
  return runServiceOperation(() => {
    const validated = updateDateSchema.parse(updates);
    const existing = getDateRowOrThrow(dateId);

    const date = validated.date ?? existing.date;
    const { month, day, yearKnown } = parseDateParts(date);

    db.runSync(
      `UPDATE dates
       SET label = ?, date = ?, month = ?, day = ?, year_known = ?, updated_at = ?
       WHERE id = ?`,
      validated.label ?? existing.label,
      date,
      month,
      day,
      yearKnown,
      new globalThis.Date().toISOString(),
      dateId,
    );

    return rowToDate(getDateRowOrThrow(dateId));
  });
}

/**
 * Soft delete a date
 */
export function deleteDate(dateId: string): ServiceResponse<PersonDate> {
  return runServiceOperation(() => {
    getDateRowOrThrow(dateId);

    const now = new globalThis.Date().toISOString();
    db.runSync(
      'UPDATE dates SET deleted_at = ?, updated_at = ? WHERE id = ?',
      now,
      now,
      dateId,
    );

    const deleted = db.getFirstSync<DateRow>(
      'SELECT * FROM dates WHERE id = ?',
      dateId,
    );

    if (!deleted) {
      throw new NotFoundError('Date not found', ErrorCode.DATE_NOT_FOUND);
    }

    return rowToDate(deleted);
  });
}
