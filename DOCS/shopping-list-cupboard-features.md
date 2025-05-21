# Shopping List & Cupboard Features

## UI/UX Implementation Guidelines

### Tab Structure & Navigation

- Implement as a single tab "Groceries" in the main navigation
- Use a horizontal slider/swiper component for switching between Shopping List and Cupboard views
- Add tab indicators at the top of the screen for visual feedback
- Maintain state when switching between views

```typescript
// Example Component Structure
// app/(tabs)/groceries.tsx

import { View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import ShoppingListScreen from "../components/groceries/ShoppingListScreen";
import CupboardScreen from "../components/groceries/CupboardScreen";

const Tab = createMaterialTopTabNavigator();

export default function GroceriesTab() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Shopping List" component={ShoppingListScreen} />
      <Tab.Screen name="Cupboard" component={CupboardScreen} />
    </Tab.Navigator>
  );
}
```

### Component Organization

```
components/groceries/
├── ShoppingListScreen.tsx      # Main shopping list view
├── CupboardScreen.tsx         # Main cupboard view
├── shared/
│   ├── ItemCard.tsx          # Reusable item card component
│   ├── CategorySection.tsx   # Grouping component for items
│   └── AddItemModal.tsx      # Shared modal for adding items
├── shopping/
│   ├── ListHeader.tsx        # Shopping list specific header
│   └── CheckableItem.tsx     # Shopping item with checkbox
└── cupboard/
    ├── CupboardHeader.tsx    # Cupboard specific header
    └── InventoryItem.tsx     # Cupboard item with quantity
```

### State Management

- Create dedicated contexts for shopping list and cupboard data:

  ```typescript
  // context/GroceriesContext.tsx

  interface GroceriesContextType {
    shoppingList: ShoppingItem[];
    cupboardItems: CupboardItem[];
    activeView: "shopping" | "cupboard";
    // ... other state and methods
  }
  ```

### Shared Features

1. **Item Management**:

   - Common add/edit/delete functionality
   - Shared search and filtering
   - Category organization
   - Quantity and unit handling

2. **Data Persistence**:

   - Initially use local storage (AsyncStorage)
   - Prepare for Supabase migration as specified in integration plan
   - Implement offline support

3. **UI Components**:
   - Use consistent styling from `utils/styleUtils.ts`
   - Implement smooth animations for transitions
   - Support dark/light mode

## Implementation Recommendations

1. **Phase 1: Local Storage Implementation**

   - Create base UI components
   - Implement local storage logic
   - Set up context providers
   - Add basic CRUD operations

2. **Phase 2: Enhanced Features**

   - Add categories and sorting
   - Implement search functionality
   - Add item suggestions
   - Integrate with recipe ingredients

3. **Phase 3: Supabase Migration**
   - Follow the database schema defined above
   - Implement sync logic
   - Add offline support
   - Handle data migration

### Code Guidelines

1. **Use TypeScript Interfaces**:

   ```typescript
   interface GroceryItem {
     id: string;
     name: string;
     quantity?: number;
     unit?: string;
     category?: string;
     createdAt: Date;
     updatedAt: Date;
   }

   interface ShoppingItem extends GroceryItem {
     checked: boolean;
     recipeId?: string;
   }

   interface CupboardItem extends GroceryItem {
     expirationDate?: Date;
   }
   ```

2. **Custom Hooks**:

   ```typescript
   // hooks/useGroceries.ts
   export const useGroceries = () => {
     // Shopping list operations
     const addToShoppingList = () => {};
     const removeFromShoppingList = () => {};

     // Cupboard operations
     const addToCupboard = () => {};
     const removeFromCupboard = () => {};

     // Shared operations
     const searchItems = () => {};
     const filterByCategory = () => {};

     return {
       addToShoppingList,
       removeFromShoppingList,
       addToCupboard,
       removeFromCupboard,
       searchItems,
       filterByCategory,
     };
   };
   ```

3. **Error Handling**:

   - Implement proper error boundaries
   - Handle offline scenarios gracefully
   - Provide user feedback for actions

4. **Performance Considerations**:
   - Implement virtualized lists for large datasets
   - Optimize state updates
   - Use proper memoization

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
