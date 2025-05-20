## Supabase Integration Status

### Current Implementation Status

The shopping list and cupboard features are currently using local storage for data persistence. While Supabase authentication and recipe storage have been implemented, these features have not yet been migrated to Supabase:

- **Shopping List**: Currently uses local storage via React Context
- **Cupboard Items**: Currently uses local storage via React Context

### Planned Database Schema

The following tables are planned for Supabase integration:

1. **Shopping Lists Table**:

   ```sql
   create table shopping_lists (
     id uuid primary key default uuid_generate_v4(),
     user_id uuid references auth.users not null,
     name text not null,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   ```

2. **Shopping Items Table**:

   ```sql
   create table shopping_items (
     id uuid primary key default uuid_generate_v4(),
     shopping_list_id uuid references shopping_lists not null,
     name text not null,
     quantity text,
     unit text,
     category text,
     checked boolean default false,
     recipe_id uuid references recipes,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   ```

3. **Inventory/Cupboard Table**:
   ```sql
   create table inventory_items (
     id uuid primary key default uuid_generate_v4(),
     user_id uuid references auth.users not null,
     name text not null,
     quantity text,
     unit text,
     category text,
     expiration_date date,
     added_date timestamptz default now(),
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   ```

### Integration Tasks

The following tasks are needed to complete the Supabase integration:

1. **Shopping List Service**:

   - Create a service module for shopping list operations
   - Implement CRUD operations for shopping lists and items
   - Add real-time updates for shared shopping lists
   - Modify the RecipeContext to use Supabase for persistence

2. **Cupboard/Inventory Service**:

   - Create a service module for inventory management
   - Implement CRUD operations for cupboard items
   - Add expiration tracking and notifications
   - Modify the CupboardContext to use Supabase for persistence

3. **Data Migration**:

   - Extend the existing migration utility to include shopping and cupboard data
   - Create a seamless migration experience for users
   - Implement data validation and cleanup during migration

4. **Row-Level Security**:

   - Implement RLS policies to ensure users can only access their own data
   - Create policies for shared shopping lists (future feature)
   - Add validation rules to prevent data corruption

5. **Offline Support**:
   - Implement local caching for offline shopping
   - Create synchronization mechanisms for offline changes
   - Add conflict resolution for concurrent edits

### Timeline

Integration of shopping list and cupboard features with Supabase is planned for Phase 2 of the backend integration plan, which is currently in progress.
