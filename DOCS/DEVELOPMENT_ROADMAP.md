# Recipe App Development Roadmap

## 📋 Task Tracking

### High Priority Issues (4/4 completed)

- [x] **Issue #20**: Recipe ingredient addition to shopping list ✅ **COMPLETED**
- [x] **Issue #17**: Meal plan shopping list generation ✅ **COMPLETED**
- [x] **Issue #9**: Recipe quantity scaling system ✅ **COMPLETED**
- [x] **Issue #3**: Tagging system overhaul ✅ **COMPLETED**

### Medium Priority Issues (19/19 completed)

- [x] **Issue #23**: Photo import enhancement ✅ **COMPLETED**
- [x] **Issue #24**: Photo text extraction functionality ✅ **COMPLETED**
- [x] **Issue #1**: Recipe and planned meals navigation buttons ✅ **COMPLETED**
- [x] **Issue #2**: Recently created section enhancement ✅ **COMPLETED**
- [x] **Issue #10**: Recipe detail header fix ✅ **COMPLETED**
- [x] **Issue #11**: Add all ingredients button ✅ **COMPLETED**
- [x] **Issue #12**: Responsive add ingredient button ✅ **COMPLETED**
- [x] **Issue #15**: Meal plan page decluttering ✅ **COMPLETED**
- [x] **Issue #16**: Enhanced weekly view ✅ **COMPLETED**
- [x] **Issue #18**: Recipe ingredients section formatting ✅ **COMPLETED**
- [x] **Issue #19**: Header styling and spacing fix ✅ **COMPLETED**
- [x] **Issue #21**: Recipe carousel scope fix ✅ **COMPLETED**
- [x] **Issue #4**: View management system ✅ **COMPLETED**
- [x] **Issue #5**: Favourites and lists feature ✅ **COMPLETED**
- [x] **Issue #6**: Recipe search and filtering ✅ **COMPLETED**
- [x] **Issue #7**: Meal planning interface ✅ **COMPLETED**
- [x] **Issue #8**: Shopping list management ✅ **COMPLETED**
- [x] **Issue #22**: Production-quality logic implementation ✅ **COMPLETED**
- [x] **Issue #29**: TypeScript error fixes ✅ **COMPLETED**

### Low Priority Issues (6/6 completed)

- [x] **Issue #13**: Recipe card visual improvements ✅ **COMPLETED**
- [x] **Issue #14**: Ingredient quantity display ✅ **COMPLETED**
- [x] **Issue #25**: Recipe sharing functionality ✅ **COMPLETED**
- [x] **Issue #26**: Offline mode support ✅ **COMPLETED**
- [x] **Issue #27**: Performance optimization ✅ **COMPLETED**
- [x] **Issue #28**: Accessibility improvements ✅ **COMPLETED**

### New High Priority Issues (2/12 completed)

- [x] **Issue #30**: Homepage duplicate buttons removal ✅ **COMPLETED**
- [x] **Issue #31**: Recently created page UI enhancement ✅ **COMPLETED**
- [ ] **Issue #32**: Recipe cards consistent sizing
- [ ] **Issue #33**: Recipe card tag formatting improvement
- [ ] **Issue #34**: Favorites and lists screens implementation
- [ ] **Issue #35**: Recipe detail servings button repositioning
- [ ] **Issue #36**: Recipe detail tag expansion functionality
- [ ] **Issue #37**: Get cooking button styling fix
- [ ] **Issue #38**: Recipe detail add button enhancement
- [ ] **Issue #39**: Recipe author link functionality
- [ ] **Issue #40**: Meal plan weekly view implementation
- [ ] **Issue #41**: Meal plan shopping list button functionality

### New Medium Priority Issues (0/15 completed)

- [ ] **Issue #42**: Recipe carousel ingredient addition fix
- [ ] **Issue #43**: Shopping list ingredient stacking
- [ ] **Issue #44**: Shopping list unit display correction
- [ ] **Issue #45**: Shopping list item editing functionality
- [ ] **Issue #46**: Shopping list item deletion state update
- [ ] **Issue #47**: Unknown recipe label update
- [ ] **Issue #48**: Shopping list recipe grouping
- [ ] **Issue #49**: Completed items removal/cupboard move
- [ ] **Issue #50**: Cupboard quantity increase functionality
- [ ] **Issue #51**: Cupboard item deletion
- [ ] **Issue #52**: Separate cupboard and shopping list data sources
- [ ] **Issue #53**: Cupboard and shopping list search functionality
- [ ] **Issue #54**: Recipe card ingredient addition accuracy
- [ ] **Issue #55**: Shopping item state persistence
- [ ] **Issue #56**: Complete shopping functionality

**TOTAL PROGRESS: 31/56 issues completed (55%)**

---

## Overview

This document outlines all identified issues and features that need to be developed for the Recipe App. Each section includes current state analysis, implementation requirements, and technical considerations.

---

## 🏠 Homepage Issues & Features

### 30. Homepage Duplicate Buttons Removal

**Current State:** Homepage contains duplicate navigation elements that create confusion
**Issues:**

- "4 recipes" button and planned button may be duplicating functionality
- Navigation buttons should redirect properly to their respective pages
- UI clutter from redundant elements

**Technical Analysis:**

- Current implementation in `app/(tabs)/index.tsx` has Quick Navigation section with proper routing
- Stats section shows recipe count and planned meals count
- Need to verify if there are additional duplicate buttons elsewhere

**Implementation Requirements:**

- Audit all navigation elements on homepage
- Remove any duplicate buttons that serve the same purpose
- Ensure remaining buttons have proper navigation paths
- Verify routing to recipes tab and meal-plan tab works correctly
- Update button labels and styling for clarity

**Technical Considerations:**

- Check `router.push("/(tabs)/recipes")` and `router.push("/(tabs)/meal-plan")` functionality
- Ensure proper tab navigation state management
- Test deep linking and back navigation behavior
- Verify button accessibility and touch targets

### 31. Recently Created Page UI Enhancement

**Current State:** Recently created section needs UI improvements
**Issues:**

- Visual inconsistencies in recipe card display
- Potential layout issues with image loading
- Need better empty state handling

**Technical Analysis:**

- Current implementation in `app/(tabs)/index.tsx` uses FlatList with horizontal scrolling
- Recipe cards use `renderRecentRecipeItem` function
- Image loading with fallback to placeholder icons
- Recipe badge system for tags

**Implementation Requirements:**

- Improve recipe card visual consistency
- Enhance image loading states and error handling
- Better spacing and alignment in horizontal scroll
- Improve recipe metadata display (time, servings)
- Add loading skeleton for better UX
- Enhance empty state with better messaging

**Technical Considerations:**

- Update `styles.recentRecipeCard` and related styles
- Implement proper image caching and optimization
- Add proper loading states with ActivityIndicator
- Consider lazy loading for performance
- Test across different screen sizes

---

## 📄 Recipe Page Issues

### 32. Recipe Cards Consistent Sizing

**Current State:** Recipe cards have inconsistent heights causing layout issues
**Issues:**

- Cards in grid layout have varying heights
- Text content length affects card dimensions
- Image aspect ratios cause size variations

**Technical Analysis:**

- `components/recipes/RecipeCard.tsx` uses flex layout
- Current styling: `flex: 1` in container
- Image container has fixed height: 140px
- Content section has variable height based on text

**Implementation Requirements:**

- Implement fixed height for all recipe cards
- Ensure consistent image container sizing
- Limit text content to prevent overflow
- Add proper text truncation with ellipsis
- Maintain visual hierarchy within fixed dimensions

**Technical Considerations:**

- Update `styles.container` to use fixed height instead of flex
- Implement `numberOfLines` prop consistently
- Add `ellipsizeMode="tail"` for text truncation
- Consider using `aspectRatio` for image containers
- Test with various content lengths

### 33. Recipe Card Tag Formatting Improvement

**Current State:** Tags in recipe cards need better visual formatting
**Issues:**

- Tag overflow handling is inconsistent
- Visual styling needs improvement
- "+X more" indicator needs better positioning

**Technical Analysis:**

- Current implementation shows max 2 tags with "+X" indicator
- Tags use `styles.tag` with gray background
- `flexWrap: "nowrap"` prevents wrapping
- Extra tag count shown in separate `moreTag` component

**Implementation Requirements:**

- Improve tag visual design with better colors and spacing
- Implement consistent tag sizing and truncation
- Better handling of tag overflow scenarios
- Improve "+X more" indicator styling
- Add tag interaction feedback

**Technical Considerations:**

- Update `styles.tagsRow`, `styles.tag`, and `styles.moreTag`
- Consider using primary color scheme for tags
- Implement proper touch feedback for tags
- Add accessibility labels for screen readers
- Test with various tag lengths and counts

### 34. Favorites and Lists Screens Implementation

**Current State:** Favorites functionality exists but dedicated screens are missing
**Issues:**

- No dedicated favorites screen
- Custom lists feature not fully implemented
- List management interface missing

**Technical Analysis:**

- Favorites toggle exists in `app/recipe/[id].tsx`
- `toggleRecipeFavorite` function in recipe service
- `isFavorite` property in Recipe type
- Favorites filter in recipes screen exists

**Implementation Requirements:**

- Create dedicated favorites screen (`app/favorites.tsx`)
- Implement custom lists management screen (`app/lists.tsx`)
- Add list creation, editing, and deletion functionality
- Create list assignment interface for recipes
- Add navigation to favorites and lists from main tabs

**Technical Considerations:**

- Create new database tables for custom lists
- Implement list CRUD operations in services
- Add list context for state management
- Create list picker component for recipe assignment
- Add proper error handling and loading states

---

## 🍽️ Recipe Detail Page Issues

### 35. Recipe Detail Servings Button Repositioning

**Current State:** Servings scaler needs to be moved next to servings information
**Issues:**

- Current ServingScaler component is positioned separately
- Should be integrated with recipe metadata display
- Visual changes when changing quantity need simplification

**Technical Analysis:**

- `ServingScaler` component currently positioned above ingredients
- Recipe metadata shows servings in `styles.metaText`
- Scaling affects ingredient amounts through `scaleIngredientAmount`

**Implementation Requirements:**

- Move ServingScaler component next to servings in metadata section
- Integrate scaler with recipe title/meta area
- Simplify visual feedback for quantity changes
- Ensure proper alignment with other metadata
- Maintain scaling functionality

**Technical Considerations:**

- Update layout in `app/recipe/[id].tsx`
- Modify `styles.titleContainer` to accommodate scaler
- Ensure responsive design for different screen sizes
- Test scaling functionality after repositioning
- Maintain accessibility for scaler controls

### 36. Recipe Detail Tag Expansion Functionality

**Current State:** Tags are limited to 6 visible with "+X more" indicator
**Issues:**

- No way to view all tags when "+X more" is shown
- Missing interaction to expand tag list
- Need modal or expandable view for all tags

**Technical Analysis:**

- Current implementation shows 6 tags with `recipe.tags.slice(0, 6)`
- "+X more" indicator in `moreTagsChip` has no interaction
- Tags displayed in `styles.tagsContainer` with horizontal layout

**Implementation Requirements:**

- Add touch interaction to "+X more" button
- Implement modal or expandable view for all tags
- Show complete tag list with proper formatting
- Add close functionality for expanded view
- Maintain tag interaction (potential filtering)

**Technical Considerations:**

- Create tag expansion modal component
- Add state management for expanded view
- Implement proper modal presentation
- Consider tag search/filter functionality in expanded view
- Add proper animations for smooth UX

### 37. Get Cooking Button Styling Fix

**Current State:** Get cooking button has incorrect white styling
**Issues:**

- Button appears white instead of primary color
- Styling inconsistent with design system
- May have contrast issues

**Technical Analysis:**

- Button styled in `styles.getCookingButton`
- Currently uses `colors.primary[600]` background
- Button text uses `colors.white`
- May be overridden by other styles

**Implementation Requirements:**

- Fix button background color to use primary color
- Ensure proper contrast for text
- Update styling to match design system
- Add proper visual feedback states
- Maintain accessibility standards

**Technical Considerations:**

- Update `styles.getCookingButton` styling
- Verify color imports from `utils/styleUtils`
- Check for style conflicts or overrides
- Test button states (pressed, disabled)
- Ensure consistent styling across platforms

### 38. Recipe Detail Add Button Enhancement

**Current State:** Individual ingredient add buttons need improvement and "add all" functionality
**Issues:**

- Individual add buttons may not be working properly
- Need "Add All Ingredients" button functionality
- Should add complete recipe to shopping list with proper quantities

**Technical Analysis:**

- Individual buttons in `RecipeIngredientRow` component
- "Add All" button exists in `styles.addAllButton`
- Uses `addItemToShoppingList` from GroceriesContext
- Scaling integration with `scaleIngredientAmount`

**Implementation Requirements:**

- Fix individual ingredient addition functionality
- Ensure "Add All Ingredients" button works correctly
- Add proper quantity scaling when adding ingredients
- Implement bulk addition with user feedback
- Handle duplicate ingredient scenarios

**Technical Considerations:**

- Debug `addItemToShoppingList` integration
- Ensure proper ingredient data transformation
- Add error handling for failed additions
- Implement progress feedback for bulk operations
- Test with scaled recipe quantities

### 39. Recipe Author Link Functionality

**Current State:** Recipe author section needs link functionality to source
**Issues:**

- Author button should redirect to original recipe source
- Need to implement source URL navigation
- Handle cases where source URL is missing

**Technical Analysis:**

- Recipe type includes `sourceUrl` property
- Author section exists in recipe detail view
- Need to implement link opening functionality

**Implementation Requirements:**

- Add touch interaction to author section
- Implement external URL opening with `Linking.openURL`
- Add fallback for missing source URLs
- Provide user feedback for link opening
- Handle URL validation and error cases

**Technical Considerations:**

- Use React Native `Linking` API for external URLs
- Add proper URL validation
- Implement error handling for invalid URLs
- Add loading states for link opening
- Consider in-app browser vs external browser

---

## 📅 Meal Plan Page Issues

### 40. Meal Plan Weekly View Implementation

**Current State:** Meal plan needs proper weekly view functionality
**Issues:**

- Current view may be limited to daily view
- Need comprehensive weekly overview
- Week navigation needs improvement

**Technical Analysis:**

- `WeeklyCalendar` component exists in `components/meal-plan/WeeklyCalendar.tsx`
- Uses daily view with day selector
- Week navigation with previous/next buttons
- Meal slots for each day and meal type

**Implementation Requirements:**

- Enhance weekly overview display
- Improve week navigation UX
- Add weekly meal summary
- Implement drag-and-drop for meal planning
- Add weekly meal statistics

**Technical Considerations:**

- Optimize `WeeklyCalendar` component performance
- Implement proper state management for week data
- Add gesture-based navigation
- Consider calendar library integration
- Test with large meal plan datasets

### 41. Meal Plan Shopping List Button Functionality

**Current State:** Shopping list generation from meal plan needs fixes
**Issues:**

- Button may not be adding ingredients properly
- Need to ensure all meal plan ingredients are included
- Integration with shopping list context

**Technical Analysis:**

- `generateShoppingList` function in `MealPlanContext`
- Header button in `
