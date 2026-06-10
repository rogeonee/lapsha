# API Layer Documentation

## Overview

The `api/` folder contains all data-layer logic for the Lapsha app, organized in a domain-driven structure. This includes services, schemas, and shared utilities for working with the local SQLite database (`expo-sqlite`).

## Folder Structure

```
api/
├── people/                 # People management domain
│   ├── people-service.ts   # CRUD operations for people
│   └── person-schema.ts    # Zod schemas for person forms
├── facts/                  # Facts domain
│   ├── facts-service.ts    # CRUD operations for person facts
│   └── fact-schema.ts      # Zod schemas for fact forms
├── dates/                  # Dates domain
│   ├── dates-service.ts    # CRUD operations for person dates
│   └── date-schema.ts      # Zod schemas for date forms
├── timeline/               # Timeline domain
│   └── timeline-service.ts # Cross-person date aggregation
├── error-handling.ts       # Shared error handling utilities
└── database.ts             # SQLite setup, schema migrations, singleton db
```

## Domain Organization

Each domain folder contains:

- **Service file**: Business logic and database queries
- **Schema file**: Zod validation schemas

### Service Pattern

All services are **synchronous** (expo-sqlite sync APIs) and follow a consistent pattern:

```typescript
// Standard return type for all service functions
interface ServiceResponse<T> {
  data: T | null;
  error: ServiceError | null;
}

// Example service function
export function createPerson(
  personData: PersonInsert,
): ServiceResponse<Person> {
  return runServiceOperation(() => {
    // Validate input (throws ZodError on failure)
    const validated = createPersonSchema.parse(personData);

    const id = personData.id ?? randomUUID();
    const now = new Date().toISOString();

    db.runSync(
      'INSERT INTO persons (id, name, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, NULL)',
      id,
      validated.name,
      now,
      now,
    );

    return getPersonOrThrow(id);
  });
}
```

## Shared Utilities

### Database (`database.ts`)

- **`db`**: Singleton database handle (`openDatabaseSync('lapsha.db')`)
- **Schema migrations**: Versioned via `PRAGMA user_version`; bump
  `SCHEMA_VERSION` and add a migration block for schema changes
- **`clearAllData()`**: Permanently deletes all rows (settings "Clear All Data")

All tables use soft deletes (`deleted_at`); queries must filter
`deleted_at IS NULL`. IDs are UUIDs generated via `randomUUID()` from
`expo-crypto`.

### Error Handling (`error-handling.ts`)

Provides consistent error handling across all services:

- **`ServiceResponse<T>`**: Standard return type for all service functions
- **`ServiceError`**: Structured error with code, message, and details
- **`ErrorCode`**: Enum of error categories (validation, not found, database)
- **`runServiceOperation()`**: Wraps a synchronous operation and maps thrown
  errors to a `ServiceResponse`
- **`NotFoundError`**: Throw inside `runServiceOperation` for NOT_FOUND results
- **`mapDatabaseError()`**: Maps SQLite errors to our standard format
- **`mapValidationError()`**: Maps Zod validation errors
- **`createSuccessResponse()` / `createErrorResponse()`**: Helper functions

## Usage Examples

### In React Components

```typescript
// People service
import { getPeople, createPerson } from '~/api/people/people-service';

// Schema validation
import { createPersonSchema } from '~/api/people/person-schema';
```

### Error Handling

```typescript
const response = createPerson(personData);

if (response.error) {
  // Handle specific error types
  switch (response.error.code) {
    case 'VALIDATION_ERROR':
      // Show validation message
      break;
    case 'PERSON_NOT_FOUND':
      // Handle missing person
      break;
    default:
    // Handle generic error
  }
} else {
  // Success - use response.data
}
```

## Adding New Domains

To add a new domain (e.g., `notes`):

1. **Create domain folder**: `api/notes/`
2. **Add service file**: `notes-service.ts`
3. **Add schema file**: `note-schema.ts`
4. **Follow the established patterns**:
   - Use `ServiceResponse<T>` return type (synchronous, no Promises)
   - Wrap operations in `runServiceOperation`
   - Add Zod validation schemas
   - Export types from `types/db.ts`
   - Add tables via a new migration block in `database.ts`

## Type Safety

All services are fully typed with TypeScript:

- Database types from `types/db.ts`
- Service response types
- Zod schema types for validation
- Composite types for complex queries

Note: SQLite stores booleans as 0/1 integers; services convert raw rows to
domain types at the boundary (see `rowToDate` in `dates-service.ts`).

## Best Practices

1. **Always use ServiceResponse**: Never return raw data or errors
2. **Validate inputs**: Use Zod schemas for all user inputs
3. **Respect soft deletes**: Filter `deleted_at IS NULL` in every query
4. **Keep services focused**: One service per domain
5. **Use consistent naming**: `*-service.ts`, `*-schema.ts`
6. **Export types centrally**: All types in `types/db.ts`

## Testing Considerations

- Services can be easily mocked using the `ServiceResponse` interface
- Error scenarios can be tested by checking `response.error`
- Validation can be tested using Zod schemas directly
