# Recipe Saver - Project Rules & Guidelines

This document outlines the core technologies, application context, and best practices for developing the Recipe Saver Expo application.

## 1. Application Context

Recipe Saver is a mobile application designed to help users store, organize, and manage their recipes. Key features include:

- Browsing and viewing recipe details (including images, prep/cook times).
- Adding new recipes.
- Marking recipes as favorites.
- Organizing recipes (potentially via tags or lists).
- Meal planning features.
- Shopping list generation.
- "Cupboard" feature for tracking ingredients (inferred).

The application is being migrated from a React/Capacitor web application to a native mobile experience using React Native and Expo.

## 2. Tech Stack

- **Framework**: React Native with Expo SDK
- **Language**: TypeScript
- **UI**: React Native core components, `StyleSheet` API for styling
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Persistent Client Storage**: `@react-native-async-storage/async-storage`
- **Backend & Database**: Supabase (Auth, Database, Storage)
- **Testing**: Jest, React Native Testing Library

## 3. Software Engineering Best Practices

### 3.1. Expo & React Native

- **Project Structure**: Follow the established `app/` directory structure driven by Expo Router. Keep components (`app/components/`), context (`app/context/`), and types (`app/types/`) organized.
- **Routing**: Utilize Expo Router's conventions for file-based routing, including layout routes (`_layout.tsx`), route groups (`(group)`), and dynamic routes (`[param].tsx`).
- **Component Design**: Create reusable, modular components. Use TypeScript for prop types.
- **Styling**: Define styles using `StyleSheet.create` for performance and maintainability. Avoid excessive inline styles. Use `Platform.select` for platform-specific adjustments when unavoidable.
- **State Management**: Keep Context providers focused on specific domains (e.g., `RecipeContext`, `AuthContext`). Use `useContext` hooks to consume state. Be mindful of performance; consider optimization techniques (`React.memo`) or alternative state managers if Context becomes a bottleneck.
- **AsyncStorage**: Use for storing simple, non-sensitive persistent data like user preferences or cached session info (if not handled solely by Supabase auth persistence).
- **Native APIs**: Use Expo's universal APIs (Camera, FileSystem, Permissions, etc.) for accessing native features. Handle permissions requests and states gracefully.
- **TypeScript**: Maintain strong typing throughout the application for props, state, API interactions, and utility functions.
- **Performance**: Optimize list rendering (`FlatList`, `SectionList`). Use `React.memo`, `useMemo`, `useCallback` where appropriate to prevent unnecessary re-renders. Optimize image loading and caching.
- **Testing**: Write unit tests for components and business logic using React Native Testing Library. Aim for integration tests covering key user flows (navigation, state updates).

### 3.2. Supabase

- **Initialization**: Initialize the Supabase client in a single, dedicated file (e.g., `app/lib/supabase.ts`). Use environment variables for Supabase URL and Anon Key. Configure `AsyncStorage` for React Native session persistence as recommended by Supabase docs.
- **Authentication**: Implement secure authentication flows using Supabase Auth. Protect routes and API calls based on user authentication status. Manage sessions effectively.
- **Database**:
  - Define clear Row Level Security (RLS) policies in the Supabase dashboard for all tables to ensure data security. **Never disable RLS.**
  - Use the Supabase JS library for all database interactions.
  - Leverage TypeScript for typed Supabase queries and responses (e.g., using generated types if set up).
  - Fetch only the data required for each view. Use `.select()` wisely.
  - Handle database errors gracefully.
- **Storage**: Use Supabase Storage for user-uploaded content like recipe photos. Define Storage RLS policies to control access.
- **Security**: **Never embed Service Role or other private keys in the app's code.** Rely solely on the Anon Key and RLS policies enforced by Supabase.
- **Error Handling**: Implement comprehensive error handling for all Supabase client operations (auth, database, storage).

## 4. Code Style & Linting

- Follow standard TypeScript and React coding conventions.
- Utilize ESLint and Prettier (configure if not already present) to enforce consistent code style and catch potential errors.
- Keep functions small and focused.
- Add comments only for complex logic, not obvious code.
