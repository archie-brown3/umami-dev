# Authentication and Storage in Recipe Saver

This document provides an overview of the authentication flow and data storage/retrieval mechanisms in the Recipe Saver application.

## Authentication Architecture

### Technology Stack

- **Supabase Auth**: Handles all user authentication (login, registration, sessions)
- **Capacitor**: Provides cross-platform capabilities for mobile deployment
- **React Context**: Manages auth state throughout the application
- **LocalStorage/Preferences**: Caches authentication tokens and user data

### Authentication Flow

#### 1. User Sign-Up Process

1. User enters email/password in the `AuthForm` component
2. `signUp` method in `AuthContext` calls Supabase Auth API
3. Upon successful registration:
   - A confirmation email is sent to the user (unless disabled in dev mode)
   - Basic user profile and subscription records are created in the database
   - Success message displayed to the user

#### 2. User Sign-In Process

1. User enters credentials in the `AuthForm` component
2. `signIn` method in `AuthContext` calls Supabase Auth API
3. Upon successful authentication:
   - Session token is stored securely
   - User data is fetched with `fetchAndSetUserData`
   - Navigation event is emitted to redirect to the home page
   - Multiple fallback navigation mechanisms ensure successful redirection

#### 3. Session Management

1. On app initialization:

   - `AuthContext` checks for existing sessions via `supabase.auth.getSession()`
   - If a valid session exists, user data is loaded
   - Authentication state is maintained across app restarts

2. Session Monitoring:
   - Auth state changes are tracked using `supabase.auth.onAuthStateChange()`
   - Events like "SIGNED_IN" and "SIGNED_OUT" trigger appropriate state updates

#### 4. Sign-Out Process

1. When user triggers sign-out:
   - React state is immediately cleared (user, session, userData)
   - Query cache is purged with `queryClient.clear()` and `queryClient.resetQueries()`
   - Local storage auth tokens are removed
   - Supabase auth session is terminated with `supabase.auth.signOut()`
   - User is redirected to the login page

#### 5. Offline Support

- Authentication requires network connectivity
- Auth state is preserved during offline periods
- Re-authentication is attempted when the network is restored

## Data Storage and Retrieval

### Database Architecture

The Recipe Saver app uses a Supabase PostgreSQL database with the following key tables:

1. **profiles**: User profile information

   - `id`: Maps to auth.users.id
   - `email`: User's email
   - `created_at`: Account creation timestamp

2. **subscriptions**: User subscription details

   - `user_id`: References profiles.id
   - `tier`: "free" or "premium"
   - `extractions_remaining`: Available recipe extractions for free tier
   - `valid_until`: Premium subscription expiration date

3. **recipes**: Core recipe data

   - `id`: Recipe identifier
   - `user_id`: Owner of the recipe
   - `title`, `description`, `image_url`, etc.

4. **Additional tables** for ingredients, steps, tags, meal plans, etc.

### Data Storage Strategy

#### 1. Server Storage (Supabase)

- Primary data store for all user recipes and related information
- Real-time capabilities for dynamic updates
- Structured relational database with foreign key relationships
- Row-level security enforces proper access control

#### 2. Local Storage Strategy

- **Browser Environment**:

  - `localStorage` used for caching recipes, user preferences
  - `recipeCache` service manages caching with expiration/invalidation

- **Mobile Environment**:
  - Capacitor's `Preferences` plugin used for persistent storage
  - Cross-platform abstracted through `localStorageService`

#### 3. Offline Support

- Essential data is cached locally during online sessions
- Network status is monitored via Capacitor's Network plugin
- Offline mode displays cached data when no connection is available
- Write operations are queued for later execution when back online

### Data Fetching Process

#### 1. Recipe List Fetching

1. `recipeService.getRecipes()` attempts to fetch from Supabase
2. Implements a caching strategy:
   - Checks for cached recipes with timestamp validation
   - Falls back to localStorage if Supabase request fails
   - Stores fresh data in both cache and localStorage

#### 2. Recipe Detail Fetching

1. `recipeService.getRecipeById()` implements a progressive loading strategy:
   - First checks cache for immediate display
   - Fetches basic recipe data from Supabase
   - Performs deeper fetches for ingredients, steps, and tags
   - Updates cache with complete recipe information

#### 3. Optimistic Updates

The app uses optimistic updates for a responsive UX:

1. UI is immediately updated with the expected result
2. Server operation is performed in the background
3. UI is reconciled with server response if needed

## Security Considerations

1. **Authentication Security**:

   - PKCE auth flow for enhanced security
   - Token refresh mechanisms to maintain sessions
   - Proper token storage management

2. **Data Protection**:

   - Row-level security in Supabase ensures users only access their data
   - Client-side validation complemented by server-side validation
   - Secure token storage practices

3. **Error Handling**:
   - Comprehensive error catching and recovery mechanisms
   - Clear user feedback for authentication failures
   - Graceful degradation when services are unavailable

## Mobile-Specific Considerations

1. **Capacitor Integration**:

   - Native auth token storage via Capacitor Preferences
   - Enhanced network status monitoring for mobile environments
   - Platform detection for iOS/Android specific optimizations

2. **Offline Experience**:
   - Extended caching for mobile environments
   - Connection state awareness throughout the application
   - Background synchronization when connection is restored
