# AI Agent Development Rules

## App Purpose and State

This is a mobile application designed to help users discover, save, and manage recipes. The app is currently under active development, with a focus on implementing core features like recipe browsing, recipe details, user authentication, and recipe saving. Refer to the `DOCS/` folder, particularly `project-roadmap-mvp.md` and `project-roadmap.md`, for more details on the current development stage and planned features.

## Backend Integration

- **Supabase**: Used for primary backend services including:
  - User authentication (see `DOCS/supabase-authentication-implementation.md`)
  - Recipe data storage and retrieval (recipes, ingredients, steps - see `DOCS/database-schema.md` and `DOCS/recipe-detail-supabase-fetch.md`)
  - Saving user preferences and linking saved recipes to users (see `DOCS/RECIPE_SAVING.md`)
- **Local Storage**: May be used for:
  - Caching non-sensitive user preferences or app settings.
  - Storing temporary data to improve offline experience (e.g., recently viewed recipes if offline functionality is implemented).
  - Shopping list and cupboard features are designed with local storage in mind, potentially syncing with Supabase later (see `DOCS/shopping-list-cupboard-features.md`).

**Always refer to the specific feature documentation in `DOCS/` to determine if Supabase or local storage is the intended backend for a particular feature.**

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Backend**: Supabase
- **Styling**: Likely React Native StyleSheet. Review existing components in `components/` or `app/` to confirm styling conventions. (No explicit mention of Tailwind or Styled Components in provided file structure, but `utils/styleUtils.ts` suggests custom styling utilities).

## File Organization

- **Screens/Views**: Located in `app/` (e.g., `app/recipe/[id].tsx`, `app/(tabs)/recipes.tsx`). Expo Router is used for navigation.
- **Reusable UI Components**: Located in `components/`.
- **Context Providers**: Located in `context/`.
- **Services**: API calls and business logic abstracted into services in `services/` (e.g., `services/recipeService.ts`).
- **Custom Hooks**: Located in `hooks/`.
- **Type Definitions**: Located in `types/` (e.g., `types/database.types.ts`).
- **Utility Functions**: Located in `utils/`.
- **Supabase Client & Config**: Located in `lib/supabase.ts`.
- **Constants**: Located in `constants/`.
- **Static Assets**: Located in `assets/` (images, fonts, etc.).
- **Documentation**: Project-specific documentation is in the `DOCS/` folder.

## Development Conventions

1.  **Refer to `DOCS/`**: Before generating or modifying any feature, always consult relevant documents in the `DOCS/` folder to understand the intended functionality, design, and backend integration. Key documents include:
    - `database-schema.md` for data models.
    - Feature-specific documents (e.g., `recipe-detail-supabase-fetch.md`, `RECIPE_SAVING.md`).
    - `navigation-implementation.md` for navigation structure.
    - `component-adaptation-plan.md` for UI component guidelines.
2.  **Naming Conventions**:
    - **Hooks**: Prefix custom hooks with `use` (e.g., `useUserData`).
    - **Components**: Use PascalCase for component names (e.g., `RecipeCard`).
    - **Files**: Use kebab-case for file names (e.g., `recipe-card.tsx`) unless dictated by framework conventions (e.g., Expo Router `[id].tsx`).
3.  **Component Design**:
    - Write modular, functional components.
    - Prioritize reusability.
    - Keep components focused on a single responsibility.
4.  **State Management**:
    - Use React Context API (`context/`) for global or shared state.
    - Use `useState` and `useEffect` for local component state.
5.  **TypeScript**:
    - Utilize TypeScript for all new code.
    - Define types clearly, ideally in the `types/` directory, especially for database interactions and API responses.
6.  **Error Handling**: Implement robust error handling, especially for API calls and Supabase interactions.
7.  **Logging**: Use `console.log` for debugging during development but ensure sensitive information is not logged in production builds. Add context to log messages (e.g., `[ComponentName] Error fetching data:`).
8.  **Styling**: Adhere to the existing styling patterns found in `utils/styleUtils.ts` and components. Ensure styles are responsive and consistent.

## Anti-Patterns to Avoid

- **Class Components**: Do not use class components; use functional components with hooks instead.
- **Duplicated Logic**: Abstract reusable logic into custom hooks (`hooks/`) or utility functions (`utils/`). Avoid repeating code across multiple components or services.
- **Prop Drilling**: For state that needs to be shared across multiple nested components, prefer React Context over excessive prop drilling.
- **Large Components**: Break down complex components into smaller, more manageable ones.
- **Direct DOM Manipulation**: Avoid direct DOM manipulation if using React Native.
- **Ignoring Supabase Errors**: Always handle potential errors from Supabase calls (e.g., `data, error = await supabase...`).
- **Hardcoding Sensitive Information**: Use environment variables (`.env`) for API keys, Supabase URLs, etc.

## Common Error Patterns and Solutions

### Invalid Hook Call Error

**Error Message**: `"Invalid hook call. Hooks can only be called inside of the body of a function component"`

**Common Causes**:

1. **Context Provider Missing**: A component is trying to use a context hook (like `useAuth()`) but the corresponding provider is not wrapping it
2. **Provider Order Issues**: Context providers are nested in the wrong order in `app/_layout.tsx`
3. **Syntax Errors in Context**: Syntax errors in context files can cause the entire provider to fail
4. **Multiple React Versions**: Having multiple versions of React installed (check with `npm ls react`)

**Debugging Steps**:

1. Check that all context providers are properly nested in `app/_layout.tsx`
2. Verify that the component using the hook is wrapped by the corresponding provider
3. Look for syntax errors in context files (missing try/catch blocks, import errors)
4. Ensure only one version of React is installed
5. Clear cache with `npx expo start --clear`

**Example Fix**:

```tsx
// ❌ Wrong - using hook outside provider
function MyComponent() {
  const { user } = useAuth(); // Error if not wrapped by AuthProvider
}

// ✅ Correct - ensure provider wraps component
<AuthProvider>
  <MyComponent />
</AuthProvider>;
```

---

**Note to AI Agent:** Update this `rules.md` document during development when project structure, features, or backend integration changes.
