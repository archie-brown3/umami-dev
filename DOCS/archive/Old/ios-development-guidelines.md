# iOS Development Guidelines

This document outlines the core principles and best practices for maintaining a clean, efficient codebase that works well on both web and iOS platforms.

## Core Development Principles

1. **Web-First, iOS-Ready**

   - Develop primarily for web
   - Use platform-agnostic code
   - Add iOS-specific features progressively

2. **Code Organization**

   - Keep files under 200-300 lines
   - Use clear component hierarchy
   - Separate platform-specific code

3. **Performance First**
   - Optimize for both platforms
   - Implement efficient data loading
   - Use appropriate caching strategies

## Project Structure

```plaintext
src/
  ├── components/          # Shared components
  │   ├── ui/             # Base UI components
  │   └── platform/       # Platform-specific components
  ├── hooks/              # React hooks
  ├── utils/
  │   └── platform.ts     # Platform detection
  └── services/           # API and business logic
```

## Code Standards

### 1. Component Design

```typescript
// Good: Platform-agnostic component
function RecipeList({ recipes }) {
  return (
    <div className="recipe-list safe-area-inset">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}

// Avoid: Platform-specific components unless necessary
function IOSRecipeList() {
  /* ... */
}
```

### 2. Hooks and Logic

```typescript
// Good: Reusable hook with platform awareness
function useCamera() {
  const takePhoto = async () => {
    if (isPlatform.ios()) {
      return await Camera.getPhoto();
    }
    return await webFileUpload();
  };

  return { takePhoto };
}
```

### 3. Data Management

```typescript
// Good: Platform-agnostic data fetching
function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: fetchRecipes,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}
```

## UI Guidelines

1. **Responsive Design**

```css
/* Use CSS that works well on both platforms */
.container {
  padding: env(safe-area-inset-top) 1rem env(safe-area-inset-bottom);
  max-width: min(100%, 64rem);
  margin: 0 auto;
}
```

2. **Touch Targets**

```css
/* Ensure adequate touch target sizes */
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}
```

## Network Handling

1. **Simple Network Status**

```typescript
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}
```

2. **Data Fetching**

```typescript
// Use React Query for efficient data management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

## Authentication

1. **Session Management**

```typescript
function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user };
}
```

## Testing Strategy

1. **Unit Tests**

   - Test components in isolation
   - Mock platform-specific features
   - Use React Testing Library

2. **Integration Tests**

   - Test key user flows
   - Verify platform-specific behavior
   - Check network handling

3. **Manual Testing**
   - Regular browser testing
   - Periodic iOS simulator checks
   - Test offline functionality

## Performance Guidelines

1. **Bundle Size**

   - Use code splitting
   - Lazy load components
   - Optimize images

2. **Data Management**

   - Implement efficient caching
   - Use optimistic updates
   - Handle offline data

3. **Rendering**
   - Avoid unnecessary re-renders
   - Use memo and callbacks wisely
   - Implement virtualization for lists

## Deployment Checklist

1. **Pre-deployment**

   - Run all tests
   - Check bundle size
   - Verify offline functionality

2. **iOS Specific**

   - Test on multiple iOS versions
   - Verify native features
   - Check app permissions

3. **Final Verification**
   - Test authentication flow
   - Verify data persistence
   - Check network handling

Remember: The goal is to maintain a clean, efficient codebase that provides a great experience on both web and iOS platforms while keeping development simple and straightforward.
