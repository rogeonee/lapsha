# API Layer Documentation

## Overview

The `api/` folder contains all backend-related logic for the Lapsha app, organized in a domain-driven structure. This includes services, schemas, context providers, and shared utilities for interacting with Supabase.

## Folder Structure

```
api/
├── auth/                    # Authentication domain
│   ├── auth-service.ts     # Auth operations (sign in, sign up, etc.)
│   ├── auth-schema.ts      # Zod schemas for auth forms
│   └── auth-context.tsx    # React context for auth state
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
└── supabase.ts            # Supabase client configuration
```

## Domain Organization

Each domain folder contains:

- **Service file**: Business logic and API calls
- **Schema file**: Zod validation schemas
- **Context file** (auth only): React context for state management

### Service Pattern

All services follow a consistent pattern:

```typescript
// Standard return type for all service functions
interface ServiceResponse<T> {
  data: T | null;
  error: ServiceError | null;
}

// Example service function
export async function createPerson(
  personData: PersonInsert,
): Promise<ServiceResponse<Person>> {
  try {
    // Validate input
    const validated = createPersonSchema.parse(personData);

    // Execute query
    const { data, error } = await supabase
      .from('persons')
      .insert(validated)
      .select()
      .single();

    if (error) {
      return createErrorResponse(mapSupabaseError(error));
    }

    return createSuccessResponse(data);
  } catch (validationError) {
    return createErrorResponse(mapValidationError(validationError));
  }
}
```

## Shared Utilities

### Error Handling (`error-handling.ts`)

Provides consistent error handling across all services:

- **`ServiceResponse<T>`**: Standard return type for all service functions
- **`ServiceError`**: Structured error with code, message, and details
- **`ErrorCode`**: Enum of error categories (validation, auth, not found, etc.)
- **`mapSupabaseError()`**: Maps Supabase errors to our standard format
- **`mapValidationError()`**: Maps Zod validation errors
- **`createSuccessResponse()` / `createErrorResponse()`**: Helper functions

### Supabase Client (`supabase.ts`)

Centralized Supabase configuration with:

- Client initialization
- Environment configuration
- Type safety integration

## Usage Examples

### In React Components

```typescript
// People service
import { getPeople, createPerson } from '~/api/people/people-service';

// Auth context
import { useSession } from '~/api/auth/auth-context';

// Schema validation
import { createPersonSchema } from '~/api/people/person-schema';
```

### Error Handling

```typescript
const response = await createPerson(personData);

if (response.error) {
  // Handle specific error types
  switch (response.error.code) {
    case 'VALIDATION_ERROR':
      // Show validation message
      break;
    case 'FORBIDDEN':
      // Handle permission error
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
   - Use `ServiceResponse<T>` return type
   - Implement proper error handling
   - Add Zod validation schemas
   - Export types from `types/db.ts`

### Example New Domain Structure

```
api/notes/
├── notes-service.ts    # CRUD operations
└── note-schema.ts     # Zod schemas
```

## Type Safety

All services are fully typed with TypeScript:

- Database types from `types/db.ts`
- Service response types
- Zod schema types for validation
- Composite types for complex queries

## Best Practices

1. **Always use ServiceResponse**: Never return raw data or errors
2. **Validate inputs**: Use Zod schemas for all user inputs
3. **Handle errors gracefully**: Map to user-friendly messages
4. **Keep services focused**: One service per domain
5. **Use consistent naming**: `*-service.ts`, `*-schema.ts`
6. **Export types centrally**: All types in `types/db.ts`

## Testing Considerations

- Services can be easily mocked using the `ServiceResponse` interface
- Error scenarios can be tested by checking `response.error`
- Validation can be tested using Zod schemas directly
- Integration tests can verify Supabase interactions

## Migration Notes

If you haven't worked on this project in a while:

1. **Check for new domains**: Look for new folders in `api/`
2. **Review error handling**: All services use the same error pattern
3. **Update imports**: If you see old `~/lib/` imports, update to `~/api/`
4. **Check types**: All types are centralized in `types/db.ts`

## Common Patterns

### Creating a New Service Function

```typescript
export async function createResource(
  data: ResourceInsert,
): Promise<ServiceResponse<Resource>> {
  try {
    const validated = createResourceSchema.parse(data);

    const { data: result, error } = await supabase
      .from('resources')
      .insert(validated)
      .select()
      .single();

    if (error) {
      return createErrorResponse(mapSupabaseError(error));
    }

    return createSuccessResponse(result);
  } catch (validationError) {
    return createErrorResponse(mapValidationError(validationError));
  }
}
```

### Using Services in Components

```typescript
const [data, setData] = useState<Resource[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  const response = await getResources(userId);

  if (response.error) {
    setError(response.error.message);
    setData([]);
  } else {
    setData(response.data || []);
  }

  setLoading(false);
};
```

This structure provides a clean, scalable, and maintainable API layer that's easy to understand and extend.
