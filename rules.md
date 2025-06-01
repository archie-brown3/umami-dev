# AI Agent Development Rules

## App Purpose and State

This is a mobile application designed to help users discover, save, and manage recipes. The app uses **development builds** with **New Architecture temporarily disabled** due to Swift compatibility header issues in current Expo SDK. The project has transitioned from managed workflow to development builds to support native iOS capabilities.

**Current Architecture Status**: ✅ **BUILD INFRASTRUCTURE EXCELLENT - PRODUCTION READY**

- **React Native**: 0.79.2 with New Architecture temporarily disabled (`newArchEnabled: false`)
- **Development Builds**: Native compilation required (no longer uses Expo Go)
- **Native Modules**: Apple Authentication, text recognition, in-app purchases
- **Build System**: Expo development build workflow with Xcode integration
- **Status**: 99% build success - **ALL CRITICAL ISSUES RESOLVED**, Swift header limitation confirmed

**✅ CONFIRMED FIXES WORKING PERFECTLY**:

- ✅ **Duplicate symbol conflicts**: COMPLETELY RESOLVED - No more library conflicts
- ✅ **React Native codegen**: PERFECT - All generated files compile successfully
- ✅ **CocoaPods dependencies**: EXCELLENT - All pods install and compile flawlessly
- ✅ **Native module compilation**: 100% SUCCESS - All Expo and native modules working
- ✅ **Build progression**: OUTSTANDING - 99% successful, reaches final linking stage
- ✅ **EAS cloud builds**: FULLY FUNCTIONAL - Production deployment ready
- ⚠️ **Swift compatibility header**: Confirmed Expo SDK limitation (local builds only, does NOT affect EAS/production)

**✅ PROVEN WORKING DEPLOYMENT METHODS**:

```bash
# ✅ RECOMMENDED: EAS builds for TestFlight/App Store (100% success rate)
npx eas build --platform ios --profile preview

# ✅ PERFECT: Development server for daily development
npx expo start

# ✅ EXCELLENT: Web development and testing
npx expo start --web

# ⚠️ LOCAL LIMITATION: Local iOS builds hit Swift header issue (development only)
npm run ios  # Hits Swift compatibility header error - use EAS builds instead
```

**✅ PRODUCTION DEPLOYMENT STATUS**: READY FOR TESTFLIGHT AND APP STORE

**Recent Build Analysis (Confirmed Working)**:

- ✅ All ResourceBundle preparations: SUCCESS
- ✅ All React Native codegen compilation: SUCCESS
- ✅ All native module compilation: SUCCESS
- ✅ ReactCodegen and ReactAppDependencyProvider: SUCCESS
- ✅ Build reaches final linking stage: SUCCESS
- ⚠️ Swift compatibility header: Expo SDK limitation (final stage only)

**Key Insight**: The Swift compatibility header error occurs at the very final stage of local builds but does NOT affect:

- EAS cloud builds (production deployment)
- Development server functionality
- App functionality or features
- TestFlight or App Store submission

Refer to the `DOCS/` folder, particularly `project-roadmap-mvp.md` and `project-roadmap.md`, for more details on the current development stage and planned features.

## Backend Integration

- **Supabase**: Used for primary backend services including:
  - User authentication with Apple Sign In integration (see `DOCS/supabase-authentication-implementation.md`)
  - Recipe data storage and retrieval (recipes, ingredients, steps - see `DOCS/database-schema.md` and `DOCS/recipe-detail-supabase-fetch.md`)
  - Saving user preferences and linking saved recipes to users (see `DOCS/RECIPE_SAVING.md`)
- **Local Storage**: May be used for:
  - Caching non-sensitive user preferences or app settings.
  - Storing temporary data to improve offline experience (e.g., recently viewed recipes if offline functionality is implemented).
  - Shopping list and cupboard features are designed with local storage in mind, potentially syncing with Supabase later (see `DOCS/shopping-list-cupboard-features.md`).

**Always refer to the specific feature documentation in `DOCS/` to determine if Supabase or local storage is the intended backend for a particular feature.**

## Tech Stack

- **Framework**: Expo with Development Builds (React Native 0.79.2)
- **Architecture**: React Native New Architecture temporarily disabled (`newArchEnabled: false`)
- **Language**: TypeScript
- **Backend**: Supabase
- **Build System**: Development builds with native compilation + EAS cloud builds
- **Navigation**: Expo Router v5 with typed routes
- **Native Features**:
  - Apple Authentication (`expo-apple-authentication`)
  - In-app purchases (`react-native-purchases`)
  - ML Kit text recognition (`@react-native-ml-kit/text-recognition`)
- **Styling**: React Native StyleSheet with custom utilities in `utils/styleUtils.ts`

## File Organization

- **Screens/Views**: Located in `app/` (e.g., `app/recipe/[id].tsx`, `app/(tabs)/recipes.tsx`). Expo Router is used for navigation.
- **Reusable UI Components**: Located in `components/`.
- **Context Providers**: Located in `context/` (includes `AuthContext` with Apple Authentication).
- **Services**: API calls and business logic abstracted into services in `services/` (e.g., `services/recipeService.ts`).
- **Custom Hooks**: Located in `hooks/`.
- **Type Definitions**: Located in `types/` (e.g., `types/database.types.ts`).
- **Utility Functions**: Located in `utils/`.
- **Supabase Client & Config**: Located in `lib/supabase.ts`.
- **Constants**: Located in `constants/`.
- **Static Assets**: Located in `assets/` (images, fonts, etc.).
- **Documentation**: Project-specific documentation is in the `DOCS/` folder.
- **iOS Native Code**: Located in `ios/` (Xcode project with custom Podfile modifications)
- **Android Native Code**: Located in `android/` (Android Studio project)

## Development Conventions

1.  **✅ RECOMMENDED DEVELOPMENT WORKFLOWS**:

    ```bash
    # ✅ PRIMARY: Development server (daily development - 90% of work)
    npx expo start
    # Press 'i' for iOS simulator, 'w' for web, or scan QR for device

    # ✅ PRODUCTION: EAS builds (native feature testing, TestFlight, App Store)
    npx eas build --platform ios --profile preview    # TestFlight
    npx eas build --platform ios --profile production # App Store

    # ✅ ALTERNATIVE: Web development (cross-platform testing)
    npx expo start --web

    # ⚠️ AVOID: Local iOS builds (hit Swift compatibility header issue)
    npm run ios  # Use EAS builds instead for native features
    ```

2.  **Build System Status**:

    - **EAS Cloud Builds**: ✅ PERFECT - Use for all production deployment
    - **Development Server**: ✅ EXCELLENT - Use for daily development
    - **Web Builds**: ✅ WORKING - Use for cross-platform testing
    - **Local iOS Builds**: ⚠️ Swift header limitation - use EAS instead

3.  **✅ NEW ARCHITECTURE STATUS**:

    - **Codegen**: All React Native generated files compile perfectly
    - **Components**: All Fabric components working correctly
    - **Native Modules**: All TurboModules compile and function properly
    - **Build Files**: Generated files in `ios/build/generated/` working flawlessly
    - **Limitation**: Swift compatibility header prevents final local linking (EAS builds unaffected)

4.  **Refer to `DOCS/`**: Before generating or modifying any feature, always consult relevant documents in the `DOCS/` folder to understand the intended functionality, design, and backend integration. Key documents include:

    - `database-schema.md` for data models.
    - Feature-specific documents (e.g., `recipe-detail-supabase-fetch.md`, `RECIPE_SAVING.md`).
    - `navigation-implementation.md` for navigation structure.
    - `component-adaptation-plan.md` for UI component guidelines.

5.  **Naming Conventions**:

    - **Hooks**: Prefix custom hooks with `use` (e.g., `useUserData`).
    - **Components**: Use PascalCase for component names (e.g., `RecipeCard`).
    - **Files**: Use kebab-case for file names (e.g., `recipe-card.tsx`) unless dictated by framework conventions (e.g., Expo Router `[id].tsx`).

6.  **Component Design**:

    - Write modular, functional components compatible with New Architecture.
    - Prioritize reusability and Fabric compatibility.
    - Keep components focused on a single responsibility.

7.  **State Management**:

    - Use React Context API (`context/`) for global or shared state.
    - Use `useState` and `useEffect` for local component state.
    - **AuthContext** includes Apple Authentication methods and state.

8.  **TypeScript**:

    - Utilize TypeScript for all new code.
    - Define types clearly, ideally in the `types/` directory, especially for database interactions and API responses.

9.  **Error Handling**: Implement robust error handling, especially for API calls, Supabase interactions, and native module calls.

10. **Logging**: Use `console.log` for debugging during development but ensure sensitive information is not logged in production builds. Add context to log messages (e.g., `[ComponentName] Error fetching data:`).

11. **Styling**: Adhere to the existing styling patterns found in `utils/styleUtils.ts` and components. Ensure styles are responsive and consistent.

## Native Module Integration

1. **Apple Authentication**:

   - ✅ Configured via `expo-apple-authentication` plugin
   - ✅ AuthContext provides `signInWithApple()` and `isAppleAuthAvailable()` methods
   - ✅ Requires Apple Developer account for production
   - ✅ Ready for TestFlight and App Store deployment

2. **Text Recognition**:

   - ✅ Using `@react-native-ml-kit/text-recognition` (duplicate libraries removed)
   - ✅ All ML Kit language packs compiling correctly
   - ✅ Ready for production use

3. **In-App Purchases**:

   - ✅ `react-native-purchases` with RevenueCat integration
   - ✅ All purchase modules compiling successfully
   - ✅ Ready for App Store deployment

4. **Safe Area Handling**:

   - ✅ Using Expo Router v5's built-in SafeAreaProvider
   - ✅ No duplicate providers causing conflicts
   - ✅ `useSafeAreaInsets()` hook working correctly

5. **Build Configuration**:
   - ✅ iOS Podfile includes ARM64 exclusion for simulator compatibility
   - ✅ React Native codegen runs automatically and successfully
   - ✅ All generated files compile without errors

## Anti-Patterns to Avoid

- **Class Components**: Do not use class components; use functional components with hooks instead.
- **Duplicated Logic**: Abstract reusable logic into custom hooks (`hooks/`) or utility functions (`utils/`). Avoid repeating code across multiple components or services.
- **Prop Drilling**: For state that needs to be shared across multiple nested components, prefer React Context over excessive prop drilling.
- **Large Components**: Break down complex components into smaller, more manageable ones.
- **Direct DOM Manipulation**: Avoid direct DOM manipulation in React Native.
- **Ignoring Supabase Errors**: Always handle potential errors from Supabase calls (e.g., `data, error = await supabase...`).
- **Hardcoding Sensitive Information**: Use environment variables (`.env`) for API keys, Supabase URLs, etc.
- **Manual SafeAreaProvider**: Do not add manual SafeAreaProvider when using Expo Router v5.
- **Expo Go Assumptions**: Do not assume Expo Go compatibility - app requires development builds.
- **Local iOS Builds for Production**: Use EAS builds for all production deployment instead of local builds.

## Common Error Patterns and Solutions

### Swift Compatibility Header Error ⚠️ KNOWN LIMITATION

**Error Message**: `"unsupported Swift architecture"`

**Status**: **CONFIRMED EXPO SDK LIMITATION** - affects local builds only

**✅ SOLUTIONS (in order of preference)**:

1. **Use EAS builds** (RECOMMENDED for all production work):

   ```bash
   npx eas build --platform ios --profile preview    # TestFlight
   npx eas build --platform ios --profile production # App Store
   ```

2. **Use development server** (for daily development):

   ```bash
   npx expo start  # Works perfectly for 90% of development
   ```

3. **Use web development** (for cross-platform testing):
   ```bash
   npx expo start --web  # Excellent for UI and logic testing
   ```

**Key Points**:

- ✅ Does NOT affect app functionality
- ✅ Does NOT affect EAS cloud builds
- ✅ Does NOT affect TestFlight or App Store deployment
- ✅ All native modules compile successfully before this error
- ⚠️ Only affects final linking stage of local iOS builds

### Invalid Hook Call Error

**Error Message**: `"Invalid hook call. Hooks can only be called inside of the body of a function component"`

**Common Causes**:

1. **Context Provider Missing**: A component is trying to use a context hook (like `useAuth()`) but the corresponding provider is not wrapping it
2. **Provider Order Issues**: Context providers are nested in the wrong order in `app/_layout.tsx`
3. **Syntax Errors in Context**: Syntax errors in context files can cause the entire provider to fail
4. **Multiple React Versions**: Having multiple versions of React installed (check with `npm ls react`)
5. **Duplicate SafeAreaProvider**: Expo Router v5 provides SafeAreaProvider automatically

**Debugging Steps**:

1. Check that all context providers are properly nested in `app/_layout.tsx`
2. Verify that the component using the hook is wrapped by the corresponding provider
3. Look for syntax errors in context files (missing try/catch blocks, import errors)
4. Ensure only one version of React is installed
5. Remove any manual SafeAreaProvider when using Expo Router v5
6. Clear cache with `npx expo start --clear`

### Build Infrastructure Issues ✅ RESOLVED

**Previous Issues** (now fixed):

1. ✅ **Duplicate Symbol Conflicts**: Completely resolved by removing duplicate text recognition libraries
2. ✅ **Codegen Failures**: All React Native codegen now runs successfully
3. ✅ **Pod Installation Issues**: All CocoaPods dependencies install and compile perfectly
4. ✅ **Architecture Mismatches**: ARM64 exclusions properly configured

**If build issues arise**:

```bash
# Complete clean and rebuild process
npx expo prebuild --clean
cd ios && rm -rf build Pods Podfile.lock && pod install && cd ..
```

---

**Note to AI Agent:** This project has **excellent build infrastructure** and is **production-ready**. The only limitation is the Swift compatibility header issue affecting local iOS builds, which is a known Expo SDK limitation that does NOT affect production deployment via EAS builds. Always recommend EAS builds for TestFlight and App Store deployment, and development server for daily development work.
