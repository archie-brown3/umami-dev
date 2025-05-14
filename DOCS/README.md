# Recipe Saver App - Migration to Expo

This project is a migration of a React web application to a React Native mobile app using Expo. The migration follows a structured approach to ensure all components and functionality are properly adapted for mobile.

## Project Overview

Recipe Saver is a comprehensive recipe management app that allows users to:

- Save and organize recipes
- Plan meals for the week
- Generate shopping lists
- Track nutritional information

## Migration Status

The migration has successfully implemented:

1. **Project Structure**

   - Organized component folders by functionality
   - Created supporting directories for hooks, context, services, and utils

2. **Navigation System**

   - Tab-based navigation using Expo Router
   - Dynamic routing for recipe details
   - Modal presentation for adding recipes
   - Floating action button for quick access

3. **Core Components**

   - Empty state component
   - Network status indicator
   - Recipe context for state management
   - Core screen UI implementation

4. **Key Screens**
   - Home dashboard
   - Recipe listing
   - Meal planning
   - Shopping list
   - Recipe details
   - Add recipe form with multiple input methods

## Running the App

1. **Prerequisites**

   - Node.js 14+ and npm
   - Expo CLI: `npm install -g expo-cli`
   - iOS Simulator or Android Emulator (or physical device with Expo Go app)

2. **Installation**

   ```bash
   # Install dependencies
   npm install
   ```

3. **Starting the Development Server**

   ```bash
   # Start Expo development server
   npx expo start
   ```

4. **Running on a Device/Simulator**
   - Press `i` to open in iOS Simulator
   - Press `a` to open in Android Emulator
   - Scan QR code with Expo Go app on your device

## Documentation

Additional documentation is available in the DOCS directory:

- `component-adaptation-plan.md` - Detailed plans for converting React to React Native components
- `migration-summary.md` - Summary of completed work and next steps
- `navigation-implementation.md` - Overview of the navigation structure
- `project-overview.md` - General project information and goals

## Dependencies

Key dependencies used in this project:

- `expo`: ^50.0.2
- `expo-router`: ^3.4.2
- `react`: 18.2.0
- `react-native`: 0.73.2
- `@react-native-async-storage/async-storage`: For persistent storage
- `@react-native-community/netinfo`: For network connectivity detection
- `react-native-safe-area-context`: For safe area handling

## Next Steps

See `migration-summary.md` for a detailed breakdown of next steps, including:

1. Component migration
2. State management completion
3. API integration
4. Testing
5. Polish and refinement
