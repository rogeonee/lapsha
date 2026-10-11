import { getDatesByPerson } from '~/api/dates/dates-service';
import { getFactsByPerson } from '~/api/facts/facts-service';
import { ErrorCode } from '~/api/error-handling';
import { getPerson } from '~/api/people/people-service';
import type { EntrySort, Fact, Person, Date as PersonDate } from '~/types/db';

// Invalidation tokens make database changes and explicit retries visible to React Compiler.
export function loadPersonData(
  id: string | undefined,
  factSort: EntrySort,
  _dataVersion: number,
  _retryNonce: number,
): {
  person: Person | null;
  facts: Fact[] | null;
  dates: PersonDate[] | null;
  error: string | null;
  canRetry: boolean;
} {
  const missing = {
    person: null,
    facts: null,
    dates: null,
    error: 'Person not found',
    canRetry: false,
  };
  if (!id) return missing;

  const personRes = getPerson(id);
  if (personRes.error) {
    if (personRes.error.code === ErrorCode.PERSON_NOT_FOUND) return missing;
    return {
      ...missing,
      error: "Couldn't load this person. Please try again.",
      canRetry: true,
    };
  }
  if (!personRes.data) return missing;

  const factsRes = getFactsByPerson(id, factSort);
  // Dates keep their defined order: birthday pinned, then date added.
  const datesRes = getDatesByPerson(id);
  return {
    person: personRes.data,
    facts: factsRes.error ? null : factsRes.data,
    dates: datesRes.error ? null : datesRes.data,
    error: null,
    canRetry: false,
  };
}
