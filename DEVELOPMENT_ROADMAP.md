# Recipe App Development Roadmap

## 📋 Task Tracking

### High Priority (Critical Issues) - Work on these first

- [ ] **Issue #20**: Recipe ingredient addition to shopping list
- [ ] **Issue #17**: Meal plan shopping list generation
- [ ] **Issue #9**: Recipe quantity scaling system
- [ ] **Issue #3**: Tagging system overhaul

### Medium Priority (UX Improvements) - Work on these second

- [ ] **Issue #1**: Recipe and planned meals navigation buttons
- [ ] **Issue #2**: Recently created section enhancement
- [ ] **Issue #10**: Recipe detail header fix
- [ ] **Issue #11**: Add all ingredients button
- [ ] **Issue #12**: Responsive add ingredient button
- [ ] **Issue #15**: Meal plan page decluttering
- [ ] **Issue #16**: Enhanced weekly view
- [ ] **Issue #18**: Recipe ingredients section formatting
- [ ] **Issue #19**: Header styling and spacing fix
- [ ] **Issue #21**: Recipe carousel scope fix

### Low Priority (Feature Enhancements) - Work on these last

- [ ] **Issue #4**: View management system
- [ ] **Issue #5**: Favourites and lists functionality
- [ ] **Issue #6**: Filter button functionality
- [ ] **Issue #7**: Manual recipe creation testing
- [ ] **Issue #8**: Text/photo recipe import testing
- [ ] **Issue #13**: Quantity and name parsing fix
- [ ] **Issue #14**: AI recipe quality enhancement
- [ ] **Issue #22**: Production-quality logic implementation

---

## Overview

This document outlines all identified issues and features that need to be developed for the Recipe App. Each section includes current state analysis, implementation requirements, and technical considerations.

---

## 🏠 Homepage Issues & Features

### 1. Recipe and Planned Meals Navigation Buttons

**Current State:** Navigation buttons may not be properly redirecting to their respective pages
**Issues:**

- Recipe button navigation needs verification
- Planned meals button routing may be broken
- Button styling and positioning may need adjustment

**Implementation Requirements:**

- Verify router navigation paths for recipe and meal plan pages
- Ensure proper navigation stack configuration
- Test deep linking and back navigation
- Add loading states during navigation

**Technical Considerations:**

- Check `app/(tabs)/index.tsx` for button implementations
- Verify route definitions in `app/(tabs)/recipes.tsx` and meal plan pages
- Ensure proper TypeScript types for navigation props

### 2. Recently Created Section Enhancement

**Current State:** Recently created section needs thumbnail images and repositioning
**Issues:**

- Missing thumbnail images for recently created recipes
- Section positioning relative to "Today's Highlights" needs adjustment
- Visual hierarchy and spacing issues

**Implementation Requirements:**

- Add thumbnail image support to recently created recipe cards
- Implement image loading with fallback placeholders
- Reposition section above "Today's Highlights" (meal plan)
- Improve visual design and spacing
- Add proper loading states for images

**Technical Considerations:**

- Update recipe card components to include thumbnail support
- Implement image caching and optimization
- Consider lazy loading for performance
- Update layout structure in homepage component

---

## 📖 Recipes Page Issues & Features

### 3. Tagging System Overhaul

**Current State:** Tagging system needs to be more strict and organized
**Issues:**

- Tags are not consistently applied or validated
- No standardized tag categories
- Tag filtering may not work properly
- Inconsistent tag display across components

**Implementation Requirements:**

- Create predefined tag categories (meal type, cuisine, dietary, difficulty, etc.)
- Implement tag validation and standardization
- Create tag management interface
- Ensure consistent tag display and filtering
- Add tag autocomplete functionality

**Technical Considerations:**

- Update database schema for standardized tags
- Create tag validation service
- Update recipe creation/editing forms
- Implement tag search and filtering logic
- Consider tag hierarchy and relationships

### 4. View Management System

**Current State:** Folder button for view changes needs to be removed, only filtered tags should be shown
**Issues:**

- Unnecessary folder/view button cluttering interface
- Tag filtering should be the primary organization method
- UI needs simplification

**Implementation Requirements:**

- Remove folder/view button from recipes page
- Enhance tag filtering as primary organization method
- Implement clean, tag-based navigation
- Add tag-based sorting and grouping options

**Technical Considerations:**

- Update recipes page layout and navigation
- Refactor filtering logic to focus on tags
- Remove unused view management code
- Optimize tag-based queries

### 5. Favourites and Lists Functionality

**Current State:** Favourites and custom lists features need implementation
**Issues:**

- Favourites button may not be functional
- Custom recipe lists feature missing
- No list management interface

**Implementation Requirements:**

- Implement favourites toggle functionality
- Create custom recipe lists feature
- Add list management interface (create, edit, delete lists)
- Enable adding/removing recipes from lists
- Add list sharing capabilities

**Technical Considerations:**

- Update database schema for favourites and lists
- Create list management service
- Implement list-based filtering and display
- Add proper state management for lists
- Consider list permissions and sharing

### 6. Filter Button Functionality

**Current State:** Filter button needs to be implemented or fixed
**Issues:**

- Filter button may not be working
- Filtering options may be limited
- Filter UI may be missing or broken

**Implementation Requirements:**

- Implement comprehensive filtering system
- Add multiple filter criteria (tags, difficulty, time, etc.)
- Create filter UI with clear/reset options
- Add filter persistence across sessions
- Implement advanced search with filters

**Technical Considerations:**

- Create filter state management
- Implement filter query logic
- Design filter UI components
- Add filter persistence to storage
- Optimize filtered queries for performance

---

## ➕ Add Recipe Features

### 7. Manual Recipe Creation Testing

**Current State:** Manual recipe creation needs thorough testing
**Issues:**

- Form validation may be incomplete
- Error handling needs improvement
- User experience during creation process

**Implementation Requirements:**

- Comprehensive testing of manual recipe creation flow
- Improve form validation and error messages
- Add step-by-step guidance for users
- Implement draft saving functionality
- Add recipe preview before saving

**Technical Considerations:**

- Test all form fields and validation rules
- Implement proper error handling and user feedback
- Add form state persistence
- Consider multi-step form approach
- Test database integration thoroughly

### 8. Text/Photo Recipe Import Testing

**Current State:** Text and photo import functionality needs testing and improvement
**Issues:**

- OCR accuracy may be inconsistent
- Text parsing may miss important details
- Error handling for failed imports

**Implementation Requirements:**

- Test and improve OCR accuracy
- Enhance text parsing algorithms
- Add manual correction interface for imported recipes
- Implement confidence scoring for parsed data
- Add support for multiple image formats

**Technical Considerations:**

- Test OCR service integration
- Improve text parsing and extraction logic
- Add image preprocessing for better OCR results
- Implement fallback manual entry options
- Consider AI-powered recipe enhancement

---

## 📄 Recipe Detail Page ([id])

### 9. Recipe Quantity Adjustment System

**Current State:** Quantity adjustment needs to update across all related features
**Issues:**

- Quantity changes don't propagate to shopping list
- Meal plan quantities not updated
- Cooking mode doesn't reflect quantity changes
- Scaling calculations may be incorrect

**Implementation Requirements:**

- Implement dynamic quantity scaling system
- Update shopping list when recipe quantities change
- Sync quantities with meal plan entries
- Update cooking mode with scaled quantities
- Add visual feedback for quantity changes

**Technical Considerations:**

- Create quantity scaling service
- Update all quantity-dependent calculations
- Implement real-time updates across components
- Add proper state management for quantity changes
- Consider fractional quantity handling

### 10. Recipe Detail Header Fix

**Current State:** Header formatting and functionality needs improvement
**Issues:**

- Header layout may be broken
- Missing or incorrect information display
- Navigation issues within header

**Implementation Requirements:**

- Fix header layout and styling
- Ensure proper information hierarchy
- Add proper navigation controls
- Implement responsive header design
- Add action buttons (edit, share, etc.)

**Technical Considerations:**

- Review header component structure
- Fix CSS/styling issues
- Ensure proper responsive behavior
- Add proper TypeScript types
- Test across different screen sizes

### 11. Add All Ingredients Button

**Current State:** Bulk ingredient addition functionality needed
**Issues:**

- No quick way to add all recipe ingredients to shopping list
- Individual ingredient addition is tedious
- Missing bulk action feedback

**Implementation Requirements:**

- Implement "Add All Ingredients" button
- Add quantity adjustment before adding to shopping list
- Provide clear feedback on successful addition
- Handle duplicate ingredients intelligently
- Add undo functionality

**Technical Considerations:**

- Integrate with shopping list service
- Handle quantity scaling and units
- Implement proper error handling
- Add loading states and feedback
- Consider ingredient conflict resolution

### 12. Responsive Add Ingredient Button

**Current State:** Add ingredient button needs better click event handling
**Issues:**

- Button may not respond properly to clicks
- Missing visual feedback on interaction
- Possible event handling issues

**Implementation Requirements:**

- Fix click event handling for add ingredient button
- Add proper visual feedback (loading, success states)
- Implement haptic feedback for mobile
- Add keyboard accessibility
- Ensure proper touch target sizing

**Technical Considerations:**

- Debug event handling issues
- Add proper state management for button states
- Implement accessibility features
- Test across different devices
- Add proper error handling

### 13. Quantity and Name Parsing Fix

**Current State:** Issues with quantity parsing when ingredient names include quantities
**Issues:**

- Ingredient names with embedded quantities cause parsing errors
- Quantity defaulting to 1 incorrectly
- Inconsistent quantity/unit handling

**Implementation Requirements:**

- Improve ingredient parsing logic
- Separate quantity extraction from name parsing
- Add intelligent quantity detection
- Implement fallback parsing strategies
- Add manual correction interface

**Technical Considerations:**

- Enhance regex patterns for quantity extraction
- Implement natural language processing for ingredients
- Add validation for parsed quantities
- Create robust fallback mechanisms
- Test with various ingredient formats

### 14. AI Recipe Quality Enhancement

**Current State:** DeepSeek AI integration needs to return higher quality recipes
**Issues:**

- AI-generated recipes may lack detail or accuracy
- Inconsistent recipe formatting from AI
- Missing nutritional or preparation details

**Implementation Requirements:**

- Improve AI prompts for better recipe generation
- Add recipe quality validation
- Implement recipe enhancement post-processing
- Add human review workflow for AI recipes
- Create recipe quality scoring system

**Technical Considerations:**

- Optimize AI prompts and parameters
- Implement recipe validation algorithms
- Add post-processing for AI responses
- Create quality metrics and scoring
- Consider multiple AI model integration

---

## 📅 Meal Plan Page Issues

### 15. Page Decluttering

**Current State:** Meal plan page needs UI simplification and organization
**Issues:**

- Too many UI elements causing confusion
- Poor information hierarchy
- Cluttered layout affecting usability

**Implementation Requirements:**

- Simplify page layout and remove unnecessary elements
- Improve information hierarchy and visual flow
- Add clear section divisions
- Implement progressive disclosure for advanced features
- Focus on core meal planning functionality

**Technical Considerations:**

- Audit current page components and remove unused elements
- Redesign layout with better spacing and organization
- Implement clean, minimal design principles
- Add proper responsive behavior
- Test usability with simplified interface

### 16. Enhanced Weekly View

**Current State:** Weekly view needs better UI and accessibility
**Issues:**

- Current weekly view may be hard to navigate
- Poor visual design and layout
- Limited interaction capabilities
- Accessibility issues

**Implementation Requirements:**

- Redesign weekly view with better visual hierarchy
- Add intuitive navigation between weeks
- Implement drag-and-drop meal planning
- Add quick meal addition/removal
- Improve mobile responsiveness

**Technical Considerations:**

- Create new weekly view component with better UX
- Implement gesture-based navigation
- Add proper state management for weekly data
- Optimize performance for large meal plan data
- Add accessibility features (screen reader support, keyboard navigation)

### 17. Shopping List Generation Fix

**Current State:** Create shopping list button functionality needs repair
**Issues:**

- Button may not generate shopping lists properly
- Missing ingredients from meal plan recipes
- Poor error handling and user feedback

**Implementation Requirements:**

- Fix shopping list generation from meal plan
- Ensure all meal plan ingredients are included
- Add ingredient consolidation and deduplication
- Implement proper error handling and user feedback
- Add customization options for generated lists

**Technical Considerations:**

- Debug shopping list generation service
- Implement proper ingredient aggregation logic
- Add error handling and validation
- Create user feedback mechanisms
- Test with various meal plan configurations

---

## 🛒 Groceries Page Issues

### 18. Recipe Ingredients Section Formatting

**Current State:** "Recipe ingredients" text formatting is incorrect and may be unnecessary
**Issues:**

- Poor text formatting and styling
- Section may be redundant or confusing
- Inconsistent with overall design

**Implementation Requirements:**

- Fix text formatting and styling issues
- Evaluate necessity of "Recipe ingredients" section
- Improve section organization and labeling
- Ensure consistency with app design system
- Add proper visual hierarchy

**Technical Considerations:**

- Review and fix CSS styling issues
- Consider removing or redesigning section
- Ensure proper responsive behavior
- Update typography to match design system
- Test across different screen sizes

### 19. Header Styling and Spacing Fix

**Current State:** Header has incorrect color (black) and wrong spacing
**Issues:**

- Header color doesn't match design system
- Spacing issues affecting layout
- Inconsistent with other page headers

**Implementation Requirements:**

- Fix header color to match design system
- Correct spacing and padding issues
- Ensure consistency across all page headers
- Add proper responsive behavior
- Implement proper visual hierarchy

**Technical Considerations:**

- Update header styles to use design system colors
- Fix spacing using consistent spacing utilities
- Ensure header component reusability
- Test responsive behavior
- Validate against design specifications

### 20. Recipe Ingredient Addition Fix

**Current State:** Adding recipes doesn't properly add ingredients to shopping list
**Issues:**

- Recipe ingredients not being added to shopping list
- Possible service integration issues
- Missing error handling and user feedback

**Implementation Requirements:**

- Fix recipe to shopping list ingredient addition
- Ensure proper ingredient quantity and unit handling
- Add ingredient deduplication logic
- Implement proper error handling
- Add user feedback for successful additions

**Technical Considerations:**

- Debug recipe ingredient addition service
- Fix integration between recipe and shopping list services
- Implement proper data transformation
- Add comprehensive error handling
- Test with various recipe configurations

### 21. Recipe Carousel Scope Fix

**Current State:** Recipe carousel appears in cupboard section when it should be shopping-list specific
**Issues:**

- Component appearing in wrong sections
- Poor component scoping and organization
- Confusing user experience

**Implementation Requirements:**

- Limit recipe carousel to shopping list section only
- Improve component organization and scoping
- Add proper conditional rendering
- Ensure clear section boundaries
- Improve overall page organization

**Technical Considerations:**

- Add proper conditional rendering logic
- Improve component organization and structure
- Implement clear section boundaries
- Add proper state management for section-specific components
- Test component visibility across different sections

### 22. Production-Quality Logic Implementation

**Current State:** Overall groceries logic needs improvement for production quality
**Issues:**

- Inconsistent state management
- Poor error handling
- Missing edge case handling
- Performance issues

**Implementation Requirements:**

- Implement robust state management
- Add comprehensive error handling
- Handle all edge cases properly
- Optimize performance for large datasets
- Add proper loading states and user feedback
- Implement data persistence and sync

**Technical Considerations:**

- Refactor state management for better consistency
- Add comprehensive error boundaries and handling
- Implement proper data validation
- Optimize queries and data operations
- Add proper caching and persistence
- Test thoroughly with various data scenarios

---

## 🔧 Technical Implementation Priorities

### High Priority (Critical Issues)

1. Recipe ingredient addition to shopping list (Issue #20)
2. Meal plan shopping list generation (Issue #17)
3. Recipe quantity scaling system (Issue #9)
4. Tagging system overhaul (Issue #3)

### Medium Priority (UX Improvements)

1. Homepage navigation fixes (Issues #1, #2)
2. Recipe detail header and functionality (Issues #10, #11, #12)
3. Meal plan page decluttering and weekly view (Issues #15, #16)
4. Groceries page formatting and organization (Issues #18, #19, #21)

### Low Priority (Feature Enhancements)

1. Favourites and lists functionality (Issue #5)
2. AI recipe quality enhancement (Issue #14)
3. Advanced filtering and search (Issue #6)
4. Recipe import testing and improvement (Issues #7, #8)

---

## 📋 Testing Requirements

### Unit Testing

- All service functions (recipe, shopping list, meal plan)
- Component rendering and interaction
- State management and data flow
- Error handling and edge cases

### Integration Testing

- Recipe to shopping list workflow
- Meal plan to shopping list generation
- Recipe quantity scaling across features
- Navigation and routing

### User Acceptance Testing

- Complete user workflows
- Cross-platform compatibility
- Performance under load
- Accessibility compliance

---

## 🚀 Deployment Considerations

### Performance Optimization

- Image loading and caching
- Database query optimization
- Component lazy loading
- Bundle size optimization

### Error Monitoring

- Crash reporting implementation
- User feedback collection
- Performance monitoring
- Error logging and analysis

### Data Management

- Backup and recovery procedures
- Data migration strategies
- Cache invalidation policies
- Offline functionality

---

_This roadmap should be regularly updated as issues are resolved and new requirements emerge._
