# iOS Development Workflow

This document outlines the streamlined workflow for developing the Recipe Saver app, focusing on efficient web-first development while maintaining iOS compatibility.

## Development Philosophy

- **Web-First Development**: Develop and test primarily in the browser for faster iterations
- **Progressive Enhancement**: Add iOS-specific features only when necessary
- **Regular Testing**: Periodically verify iOS compatibility without disrupting workflow

## Development Cycle

### 1. Web Development (Primary)

```bash
# Start development server
npm run dev
```

- Make changes to React components and test in browser
- Use hot reload for rapid development
- Fix any TypeScript/linter errors immediately

### 2. iOS Testing (Periodic)

Only build for iOS when:

- Testing iOS-specific features
- Verifying major functionality
- Preparing for deployment

```bash
# Build and test on iOS
npm run build
npx cap sync ios
npx cap open ios  # or: npm run ios
```

## Code Organization

Keep your codebase clean and platform-agnostic:

```typescript
// src/utils/platform.ts
import { Capacitor } from "@capacitor/core";

export const isPlatform = {
  web: () => !Capacitor.isNativePlatform(),
  ios: () => Capacitor.getPlatform() === "ios",
};
```

## Best Practices

1. **Platform-Agnostic Components**

```typescript
// Prefer this
function RecipeCard({ recipe }) {
  return <div className="recipe-card">{/* ... */}</div>;
}

// Instead of platform-specific components
function IOSRecipeCard() {
  /* ... */
}
function WebRecipeCard() {
  /* ... */
}
```

2. **Progressive Enhancement**

```typescript
function Camera() {
  const takePhoto = async () => {
    if (isPlatform.ios()) {
      return await Camera.getPhoto();
    }
    return await webFileUpload();
  };
}
```

3. **Safe Areas and Layout**

```css
.app-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

## Troubleshooting

### Common Issues

1. **Network Connectivity**

   - Check Supabase connection in browser first
   - Verify allowed domains in `capacitor.config.ts`
   - Test offline functionality

2. **UI Inconsistencies**

   - Test responsive layouts in browser
   - Use iOS simulator for native UI verification
   - Check safe areas and notch compatibility

3. **Authentication Issues**
   - Verify auth flow in browser
   - Check token persistence
   - Test session handling

### Quick Fixes

1. **Clearing Cache**

```bash
# Clean build files
rm -rf dist/
rm -rf ios/App/public/

# Full rebuild
npm run build
npx cap sync ios
```

2. **Network Reset**
   - Clear browser cache
   - Reset iOS simulator
   - Check Supabase connection status

## Development Tips

1. **Fast Development Cycle**

   - Make changes in browser
   - Use React DevTools for debugging
   - Only build for iOS when necessary

2. **Code Quality**

   - Keep components simple and reusable
   - Avoid platform-specific code when possible
   - Use TypeScript for better type safety

3. **Testing Strategy**
   - Unit test in browser
   - Integration test key features
   - Periodic iOS compatibility checks

Remember: Focus on web development for rapid iteration, and only switch to iOS testing when needed for platform-specific features or verification.
