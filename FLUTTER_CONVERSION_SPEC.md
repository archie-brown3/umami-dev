# Flutter Conversion Specification - Umami Recipe App

## Executive Summary

This document provides a complete specification for converting the Umami Recipe App from React Native/Expo to Flutter while maintaining the existing Supabase backend infrastructure.

**App Name:** Umami Recipe App  
**Current Stack:** React Native + Expo + TypeScript  
**Target Stack:** Flutter + Dart  
**Backend:** Supabase (PostgreSQL + Auth + Storage)  
**Version:** 1.0.0

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Dependencies & Packages](#3-dependencies--packages)
4. [Data Models](#4-data-models)
5. [Backend Integration](#5-backend-integration)
6. [Navigation Structure](#6-navigation-structure)
7. [Screen Specifications](#7-screen-specifications)
8. [State Management](#8-state-management)
9. [Services & API Layer](#9-services--api-layer)
10. [UI Components](#10-ui-components)
11. [Features & Functionality](#11-features--functionality)
12. [Platform-Specific Considerations](#12-platform-specific-considerations)
13. [Migration Strategy](#13-migration-strategy)
14. [Testing Requirements](#14-testing-requirements)

---

## 1. Project Overview

### 1.1 App Description
Umami is a comprehensive recipe management application that allows users to:
- Discover and save recipes
- Extract recipes from URLs (Instagram, websites) using AI
- Plan meals for the week
- Manage shopping lists
- Track pantry/cupboard inventory
- Create custom recipes manually

### 1.2 Core Features
1. **Authentication** - Email/password login with Supabase Auth
2. **Recipe Discovery** - Browse and search recipes
3. **AI Recipe Extraction** - Extract recipes from Instagram and recipe websites
4. **Recipe Management** - Create, edit, delete, favorite recipes
5. **Meal Planning** - Weekly meal planner
6. **Shopping Lists** - Generate and manage shopping lists from recipes
7. **Cupboard Management** - Track pantry ingredients and expiration dates
8. **User Profile** - Manage account settings and preferences

### 1.3 Current Tech Stack
- **Frontend:** React Native 0.76.9, Expo SDK 52
- **Language:** TypeScript 5.3.3
- **Navigation:** Expo Router 4.0.20
- **State Management:** React Context API + React Query
- **Backend:** Supabase (Auth + Database + Storage)
- **AI Service:** DeepSeek API for recipe extraction
- **Web Scraping:** Custom extraction service (Render API)

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Flutter App Layer                     │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer (UI Screens & Widgets)              │
├─────────────────────────────────────────────────────────┤
│  State Management (Provider/Riverpod/Bloc)              │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer (Services & Repositories)         │
├─────────────────────────────────────────────────────────┤
│  Data Layer (API Clients & Local Storage)               │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│               Backend Services (Existing)                │
├─────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + Auth + Storage)                 │
│  DeepSeek AI API (Recipe Extraction)                    │
│  Render API (Web Scraping Service)                      │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Recommended Flutter Architecture Pattern

**Clean Architecture with Repository Pattern:**

```
lib/
├── main.dart
├── app/
│   ├── app.dart (Main app widget)
│   └── routes.dart (Route definitions)
├── core/
│   ├── constants/
│   │   ├── api_constants.dart
│   │   ├── colors.dart
│   │   └── strings.dart
│   ├── errors/
│   │   └── failures.dart
│   ├── utils/
│   │   ├── validators.dart
│   │   └── formatters.dart
│   └── network/
│       └── network_info.dart
├── data/
│   ├── models/
│   │   ├── recipe_model.dart
│   │   ├── ingredient_model.dart
│   │   ├── user_model.dart
│   │   └── ... (all data models)
│   ├── datasources/
│   │   ├── remote/
│   │   │   ├── supabase_remote_datasource.dart
│   │   │   ├── deepseek_remote_datasource.dart
│   │   │   └── recipe_scraper_datasource.dart
│   │   └── local/
│   │       ├── shared_prefs_datasource.dart
│   │       └── cache_datasource.dart
│   └── repositories/
│       ├── recipe_repository_impl.dart
│       ├── auth_repository_impl.dart
│       └── ... (repository implementations)
├── domain/
│   ├── entities/
│   │   ├── recipe.dart
│   │   ├── ingredient.dart
│   │   └── ... (domain entities)
│   ├── repositories/
│   │   ├── recipe_repository.dart (interfaces)
│   │   ├── auth_repository.dart
│   │   └── ...
│   └── usecases/
│       ├── get_recipes.dart
│       ├── create_recipe.dart
│       ├── extract_recipe_from_url.dart
│       └── ... (use cases)
├── presentation/
│   ├── screens/
│   │   ├── home/
│   │   │   ├── home_screen.dart
│   │   │   └── widgets/
│   │   ├── recipes/
│   │   │   ├── recipes_screen.dart
│   │   │   ├── recipe_detail_screen.dart
│   │   │   └── add_recipe_screen.dart
│   │   ├── meal_plan/
│   │   ├── shopping_list/
│   │   ├── cupboard/
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   └── signup_screen.dart
│   │   └── profile/
│   ├── providers/ (or bloc/cubit)
│   │   ├── auth_provider.dart
│   │   ├── recipe_provider.dart
│   │   ├── meal_plan_provider.dart
│   │   └── ...
│   └── widgets/
│       ├── common/
│       │   ├── custom_button.dart
│       │   ├── custom_text_field.dart
│       │   ├── loading_indicator.dart
│       │   └── error_widget.dart
│       ├── recipe_card.dart
│       ├── ingredient_item.dart
│       └── ...
└── generated/
    └── l10n.dart (Localization - optional)
```

---

## 3. Dependencies & Packages

### 3.1 Core Dependencies

```yaml
# pubspec.yaml

name: umami_recipe_app
description: A comprehensive recipe management app
version: 1.0.0+1

environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  
  # State Management (Choose one approach)
  provider: ^6.1.1                    # Simple state management
  # OR
  flutter_riverpod: ^2.4.9            # More advanced state management
  # OR
  flutter_bloc: ^8.1.3                # BLoC pattern
  
  # Backend & Authentication
  supabase_flutter: ^2.0.0            # Supabase SDK for Flutter
  
  # HTTP & API
  http: ^1.1.0                        # HTTP client
  dio: ^5.4.0                         # Advanced HTTP client
  
  # Navigation
  go_router: ^12.1.3                  # Declarative routing
  
  # Local Storage
  shared_preferences: ^2.2.2          # Simple key-value storage
  hive_flutter: ^1.1.0                # NoSQL database
  
  # Image Handling
  cached_network_image: ^3.3.0        # Cached images
  image_picker: ^1.0.5                # Pick images from gallery/camera
  
  # UI Components
  flutter_svg: ^2.0.9                 # SVG support
  shimmer: ^3.0.0                     # Loading placeholders
  flutter_slidable: ^3.0.1            # Swipeable list items
  flutter_staggered_grid_view: ^0.7.0 # Grid layouts
  
  # Forms & Validation
  flutter_form_builder: ^9.1.1        # Form building
  
  # Date & Time
  intl: ^0.18.1                       # Internationalization
  timeago: ^3.6.0                     # Time ago formatting
  table_calendar: ^3.0.9              # Calendar widget
  
  # Utilities
  uuid: ^4.2.1                        # Generate UUIDs
  url_launcher: ^6.2.2                # Launch URLs
  share_plus: ^7.2.1                  # Share functionality
  connectivity_plus: ^5.0.2           # Network connectivity
  
  # JSON Serialization
  json_annotation: ^4.8.1             # JSON annotations
  
  # Icons
  cupertino_icons: ^1.0.6
  font_awesome_flutter: ^10.6.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Code Generation
  build_runner: ^2.4.7
  json_serializable: ^6.7.1
  
  # Linting
  flutter_lints: ^3.0.1
  
  # Testing
  mockito: ^5.4.4
  bloc_test: ^9.1.5                   # If using BLoC
```

### 3.2 Package Mapping from React Native to Flutter

| React Native Package | Flutter Equivalent | Purpose |
|---------------------|-------------------|---------|
| @supabase/supabase-js | supabase_flutter | Supabase client |
| @react-navigation/native | go_router | Navigation |
| @react-native-async-storage | shared_preferences | Local storage |
| expo-image-picker | image_picker | Image selection |
| @tanstack/react-query | provider + FutureBuilder | Data fetching |
| expo-haptics | flutter_vibrate | Haptic feedback |
| react-native-safe-area-context | SafeArea widget | Safe area insets |
| date-fns | intl | Date formatting |
| axios | dio | HTTP requests |

---

## 4. Data Models

### 4.1 Recipe Model

```dart
// lib/data/models/recipe_model.dart

import 'package:json_annotation/json_annotation.dart';

part 'recipe_model.g.dart';

@JsonSerializable()
class RecipeModel {
  final String id;
  final String title;
  final String? description;
  @JsonKey(name: 'prep_time')
  final int? prepTime;
  @JsonKey(name: 'cook_time')
  final int? cookTime;
  final int? servings;
  final String? category;
  final String? source;
  @JsonKey(name: 'source_url')
  final String? sourceUrl;
  final String? author;
  @JsonKey(name: 'image_url')
  final String? imageUrl;
  @JsonKey(name: 'is_favorite')
  final bool isFavorite;
  @JsonKey(name: 'is_saved')
  final bool isSaved;
  @JsonKey(name: 'total_cost')
  final double? totalCost;
  @JsonKey(name: 'cost_per_serving')
  final double? costPerServing;
  @JsonKey(name: 'price_confidence')
  final double? priceConfidence;
  @JsonKey(name: 'instagram_username')
  final String? instagramUsername;
  @JsonKey(name: 'instagram_profile_picture')
  final String? instagramProfilePicture;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;
  @JsonKey(name: 'user_id')
  final String? userId;
  
  // Relationships
  @JsonKey(name: 'recipe_ingredients')
  final List<RecipeIngredientModel>? recipeIngredients;
  @JsonKey(name: 'recipe_steps')
  final List<RecipeStepModel>? recipeSteps;
  @JsonKey(name: 'recipe_tags')
  final List<RecipeTagModel>? recipeTags;
  @JsonKey(name: 'recipe_nutrition')
  final RecipeNutritionModel? recipeNutrition;
  @JsonKey(name: 'recipe_media')
  final List<RecipeMediaModel>? recipeMedia;

  RecipeModel({
    required this.id,
    required this.title,
    this.description,
    this.prepTime,
    this.cookTime,
    this.servings,
    this.category,
    this.source,
    this.sourceUrl,
    this.author,
    this.imageUrl,
    required this.isFavorite,
    required this.isSaved,
    this.totalCost,
    this.costPerServing,
    this.priceConfidence,
    this.instagramUsername,
    this.instagramProfilePicture,
    this.createdAt,
    this.updatedAt,
    this.userId,
    this.recipeIngredients,
    this.recipeSteps,
    this.recipeTags,
    this.recipeNutrition,
    this.recipeMedia,
  });

  factory RecipeModel.fromJson(Map<String, dynamic> json) =>
      _$RecipeModelFromJson(json);

  Map<String, dynamic> toJson() => _$RecipeModelToJson(this);
  
  // Computed property
  int get totalTime => (prepTime ?? 0) + (cookTime ?? 0);
}
```

### 4.2 Ingredient Model

```dart
// lib/data/models/ingredient_model.dart

@JsonSerializable()
class IngredientModel {
  final String id;
  final String name;
  final String? category;
  final String? emoji;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  IngredientModel({
    required this.id,
    required this.name,
    this.category,
    this.emoji,
    this.createdAt,
    this.updatedAt,
  });

  factory IngredientModel.fromJson(Map<String, dynamic> json) =>
      _$IngredientModelFromJson(json);

  Map<String, dynamic> toJson() => _$IngredientModelToJson(this);
}
```

### 4.3 Recipe Ingredient Model

```dart
// lib/data/models/recipe_ingredient_model.dart

@JsonSerializable()
class RecipeIngredientModel {
  final String id;
  @JsonKey(name: 'recipe_id')
  final String recipeId;
  @JsonKey(name: 'ingredient_id')
  final String ingredientId;
  final String? quantity;
  final String? unit;
  final double? cost;
  @JsonKey(name: 'package_size')
  final String? packageSize;
  @JsonKey(name: 'package_price')
  final double? packagePrice;
  @JsonKey(name: 'portion_used')
  final double? portionUsed;
  @JsonKey(name: 'price_confidence')
  final double? priceConfidence;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;
  
  // Relationship
  final IngredientModel? ingredient;

  RecipeIngredientModel({
    required this.id,
    required this.recipeId,
    required this.ingredientId,
    this.quantity,
    this.unit,
    this.cost,
    this.packageSize,
    this.packagePrice,
    this.portionUsed,
    this.priceConfidence,
    this.createdAt,
    this.updatedAt,
    this.ingredient,
  });

  factory RecipeIngredientModel.fromJson(Map<String, dynamic> json) =>
      _$RecipeIngredientModelFromJson(json);

  Map<String, dynamic> toJson() => _$RecipeIngredientModelToJson(this);
}
```

### 4.4 Additional Models

```dart
// Recipe Step
@JsonSerializable()
class RecipeStepModel {
  final String id;
  @JsonKey(name: 'recipe_id')
  final String recipeId;
  final String instruction;
  @JsonKey(name: 'step_number')
  final int stepNumber;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;

  RecipeStepModel({
    required this.id,
    required this.recipeId,
    required this.instruction,
    required this.stepNumber,
    this.createdAt,
  });

  factory RecipeStepModel.fromJson(Map<String, dynamic> json) =>
      _$RecipeStepModelFromJson(json);
  Map<String, dynamic> toJson() => _$RecipeStepModelToJson(this);
}

// Tag
@JsonSerializable()
class TagModel {
  final String id;
  final String name;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;

  TagModel({required this.id, required this.name, this.createdAt});

  factory TagModel.fromJson(Map<String, dynamic> json) =>
      _$TagModelFromJson(json);
  Map<String, dynamic> toJson() => _$TagModelToJson(this);
}

// Recipe Tag (Junction table)
@JsonSerializable()
class RecipeTagModel {
  @JsonKey(name: 'recipe_id')
  final String recipeId;
  @JsonKey(name: 'tag_id')
  final String tagId;
  final TagModel? tag;

  RecipeTagModel({
    required this.recipeId,
    required this.tagId,
    this.tag,
  });

  factory RecipeTagModel.fromJson(Map<String, dynamic> json) =>
      _$RecipeTagModelFromJson(json);
  Map<String, dynamic> toJson() => _$RecipeTagModelToJson(this);
}

// Recipe Nutrition
@JsonSerializable()
class RecipeNutritionModel {
  final String id;
  @JsonKey(name: 'recipe_id')
  final String recipeId;
  final int? calories;
  final String? protein;
  final String? carbs;
  final String? fat;
  final String? fiber;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  RecipeNutritionModel({
    required this.id,
    required this.recipeId,
    this.calories,
    this.protein,
    this.carbs,
    this.fat,
    this.fiber,
    this.createdAt,
    this.updatedAt,
  });

  factory RecipeNutritionModel.fromJson(Map<String, dynamic> json) =>
      _$RecipeNutritionModelFromJson(json);
  Map<String, dynamic> toJson() => _$RecipeNutritionModelToJson(this);
}

// Recipe Media
@JsonSerializable()
class RecipeMediaModel {
  final String id;
  @JsonKey(name: 'recipe_id')
  final String recipeId;
  final String url;
  @JsonKey(name: 'is_video')
  final bool? isVideo;
  @JsonKey(name: 'video_url')
  final String? videoUrl;
  @JsonKey(name: 'order_index')
  final int? orderIndex;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;

  RecipeMediaModel({
    required this.id,
    required this.recipeId,
    required this.url,
    this.isVideo,
    this.videoUrl,
    this.orderIndex,
    this.createdAt,
  });

  factory RecipeMediaModel.fromJson(Map<String, dynamic> json) =>
      _$RecipeMediaModelFromJson(json);
  Map<String, dynamic> toJson() => _$RecipeMediaModelToJson(this);
}

// Cupboard Item
@JsonSerializable()
class CupboardItemModel {
  final String id;
  final String name;
  final String? quantity;
  final String? unit;
  final String? category;
  final String? emoji;
  @JsonKey(name: 'added_date')
  final DateTime addedDate;
  @JsonKey(name: 'expiration_date')
  final DateTime? expirationDate;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  @JsonKey(name: 'user_id')
  final String userId;

  CupboardItemModel({
    required this.id,
    required this.name,
    this.quantity,
    this.unit,
    this.category,
    this.emoji,
    required this.addedDate,
    this.expirationDate,
    required this.updatedAt,
    required this.userId,
  });

  factory CupboardItemModel.fromJson(Map<String, dynamic> json) =>
      _$CupboardItemModelFromJson(json);
  Map<String, dynamic> toJson() => _$CupboardItemModelToJson(this);
}

// Shopping List
@JsonSerializable()
class ShoppingListModel {
  final String id;
  final String title;
  final DateTime date;
  @JsonKey(name: 'total_cost')
  final double? totalCost;
  @JsonKey(name: 'total_package_cost')
  final double? totalPackageCost;
  @JsonKey(name: 'price_confidence')
  final double? priceConfidence;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  @JsonKey(name: 'user_id')
  final String userId;
  
  @JsonKey(name: 'shopping_items')
  final List<ShoppingItemModel>? shoppingItems;

  ShoppingListModel({
    required this.id,
    required this.title,
    required this.date,
    this.totalCost,
    this.totalPackageCost,
    this.priceConfidence,
    required this.createdAt,
    required this.updatedAt,
    required this.userId,
    this.shoppingItems,
  });

  factory ShoppingListModel.fromJson(Map<String, dynamic> json) =>
      _$ShoppingListModelFromJson(json);
  Map<String, dynamic> toJson() => _$ShoppingListModelToJson(this);
}

// Shopping Item
@JsonSerializable()
class ShoppingItemModel {
  final String id;
  final String name;
  final String? quantity;
  final String? unit;
  final String? category;
  final String? emoji;
  final bool? checked;
  final double? cost;
  @JsonKey(name: 'package_cost')
  final double? packageCost;
  @JsonKey(name: 'package_price')
  final double? packagePrice;
  @JsonKey(name: 'price_confidence')
  final double? priceConfidence;
  @JsonKey(name: 'recipe_id')
  final String? recipeId;
  @JsonKey(name: 'ingredient_id')
  final String? ingredientId;
  @JsonKey(name: 'shopping_list_id')
  final String shoppingListId;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;

  ShoppingItemModel({
    required this.id,
    required this.name,
    this.quantity,
    this.unit,
    this.category,
    this.emoji,
    this.checked,
    this.cost,
    this.packageCost,
    this.packagePrice,
    this.priceConfidence,
    this.recipeId,
    this.ingredientId,
    required this.shoppingListId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ShoppingItemModel.fromJson(Map<String, dynamic> json) =>
      _$ShoppingItemModelFromJson(json);
  Map<String, dynamic> toJson() => _$ShoppingItemModelToJson(this);
}

// Meal Plan
@JsonSerializable()
class MealPlanModel {
  final String id;
  final DateTime date;
  @JsonKey(name: 'user_id')
  final String userId;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  
  @JsonKey(name: 'meal_plan_items')
  final List<MealPlanItemModel>? mealPlanItems;

  MealPlanModel({
    required this.id,
    required this.date,
    required this.userId,
    required this.createdAt,
    required this.updatedAt,
    this.mealPlanItems,
  });

  factory MealPlanModel.fromJson(Map<String, dynamic> json) =>
      _$MealPlanModelFromJson(json);
  Map<String, dynamic> toJson() => _$MealPlanModelToJson(this);
}

// Meal Plan Item
@JsonSerializable()
class MealPlanItemModel {
  final String id;
  @JsonKey(name: 'meal_plan_id')
  final String mealPlanId;
  @JsonKey(name: 'recipe_id')
  final String recipeId;
  @JsonKey(name: 'meal_type')
  final String mealType; // breakfast, lunch, dinner, snack
  @JsonKey(name: 'created_at')
  final DateTime createdAt;

  MealPlanItemModel({
    required this.id,
    required this.mealPlanId,
    required this.recipeId,
    required this.mealType,
    required this.createdAt,
  });

  factory MealPlanItemModel.fromJson(Map<String, dynamic> json) =>
      _$MealPlanItemModelFromJson(json);
  Map<String, dynamic> toJson() => _$MealPlanItemModelToJson(this);
}

// User Profile
@JsonSerializable()
class UserProfileModel {
  final String id;
  final String email;
  @JsonKey(name: 'display_name')
  final String? displayName;
  @JsonKey(name: 'avatar_url')
  final String? avatarUrl;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;

  UserProfileModel({
    required this.id,
    required this.email,
    this.displayName,
    this.avatarUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) =>
      _$UserProfileModelFromJson(json);
  Map<String, dynamic> toJson() => _$UserProfileModelToJson(this);
}
```

---

## 5. Backend Integration

### 5.1 Supabase Configuration

```dart
// lib/core/config/supabase_config.dart

import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '', // Set in --dart-define
  );
  
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '', // Set in --dart-define
  );

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
        autoRefreshToken: true,
        localStorage: SecureLocalStorage(), // Use secure storage
      ),
      debug: true, // Set to false in production
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
```

### 5.2 Authentication Repository

```dart
// lib/data/repositories/auth_repository_impl.dart

import 'package:supabase_flutter/supabase_flutter.dart';

class AuthRepositoryImpl {
  final SupabaseClient _supabase;

  AuthRepositoryImpl(this._supabase);

  // Get current user
  User? get currentUser => _supabase.auth.currentUser;

  // Stream of auth state changes
  Stream<AuthState> get authStateChanges => _supabase.auth.onAuthStateChange;

  // Sign in with email and password
  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    return await _supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  // Sign up with email and password
  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
  }) async {
    return await _supabase.auth.signUp(
      email: email,
      password: password,
    );
  }

  // Sign out
  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }

  // Reset password
  Future<void> resetPassword(String email) async {
    await _supabase.auth.resetPasswordForEmail(email);
  }

  // Update user profile
  Future<UserResponse> updateProfile({
    String? displayName,
    String? avatarUrl,
  }) async {
    return await _supabase.auth.updateUser(
      UserAttributes(
        data: {
          if (displayName != null) 'display_name': displayName,
          if (avatarUrl != null) 'avatar_url': avatarUrl,
        },
      ),
    );
  }
}
```

### 5.3 Recipe Repository

```dart
// lib/data/repositories/recipe_repository_impl.dart

import 'package:supabase_flutter/supabase_flutter.dart';

class RecipeRepositoryImpl {
  final SupabaseClient _supabase;

  RecipeRepositoryImpl(this._supabase);

  // Get all recipes for current user
  Future<List<RecipeModel>> getUserRecipes() async {
    final response = await _supabase
        .from('recipes')
        .select('''
          *,
          recipe_ingredients (
            *,
            ingredient:ingredients (*)
          ),
          recipe_steps (*),
          recipe_tags (
            tag:tags (*)
          ),
          recipe_nutrition (*),
          recipe_media (*)
        ''')
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => RecipeModel.fromJson(json))
        .toList();
  }

  // Get recipe by ID
  Future<RecipeModel?> getRecipeById(String id) async {
    final response = await _supabase
        .from('recipes')
        .select('''
          *,
          recipe_ingredients (
            *,
            ingredient:ingredients (*)
          ),
          recipe_steps (*),
          recipe_tags (
            tag:tags (*)
          ),
          recipe_nutrition (*),
          recipe_media (*)
        ''')
        .eq('id', id)
        .single();

    return RecipeModel.fromJson(response);
  }

  // Create new recipe
  Future<RecipeModel> createRecipe(RecipeModel recipe) async {
    final response = await _supabase
        .from('recipes')
        .insert(recipe.toJson())
        .select()
        .single();

    return RecipeModel.fromJson(response);
  }

  // Update recipe
  Future<RecipeModel> updateRecipe(String id, RecipeModel recipe) async {
    final response = await _supabase
        .from('recipes')
        .update(recipe.toJson())
        .eq('id', id)
        .select()
        .single();

    return RecipeModel.fromJson(response);
  }

  // Delete recipe
  Future<void> deleteRecipe(String id) async {
    await _supabase.from('recipes').delete().eq('id', id);
  }

  // Toggle favorite
  Future<void> toggleFavorite(String id, bool isFavorite) async {
    await _supabase
        .from('recipes')
        .update({'is_favorite': isFavorite})
        .eq('id', id);
  }

  // Search recipes
  Future<List<RecipeModel>> searchRecipes(String query) async {
    final response = await _supabase
        .from('recipes')
        .select('*')
        .textSearch('title', query, config: 'english')
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => RecipeModel.fromJson(json))
        .toList();
  }
}
```

### 5.4 AI Recipe Extraction Service

```dart
// lib/data/datasources/remote/deepseek_remote_datasource.dart

import 'package:dio/dio.dart';

class DeepSeekRemoteDatasource {
  final Dio _dio;
  final String _apiKey;
  final String _baseUrl = 'https://api.deepseek.com/v1';

  DeepSeekRemoteDatasource(this._dio, this._apiKey) {
    _dio.options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $_apiKey',
    };
  }

  // Analyze recipe text using AI
  Future<Map<String, dynamic>> analyzeRecipeText({
    required String text,
    bool isInstagramContent = false,
  }) async {
    final prompt = _buildRecipeExtractionPrompt(text, isInstagramContent);
    
    final response = await _dio.post(
      '$_baseUrl/chat/completions',
      data: {
        'model': 'deepseek-chat',
        'messages': [
          {'role': 'user', 'content': prompt}
        ],
        'temperature': 0.1,
        'max_tokens': 2000,
      },
    );

    final content = response.data['choices'][0]['message']['content'];
    return _parseAIResponse(content);
  }

  String _buildRecipeExtractionPrompt(String text, bool isInstagram) {
    return '''
You are a professional chef and recipe expert. Analyze this recipe content and extract comprehensive structured information.

RECIPE CONTENT:
${text.substring(0, 3000)}

Return ONLY valid JSON in this exact format:
{
  "title": "Recipe title",
  "description": "Detailed description",
  "ingredients": [
    {"amount": 200, "unit": "g", "name": "ingredient name"}
  ],
  "instructions": ["Step 1", "Step 2"],
  "prepTime": 25,
  "cookTime": 30,
  "servings": 4,
  "tags": ["Cuisine", "Main ingredient", "Cooking method", "Dietary"]
}

Generate 6-8 comprehensive tags covering cuisine, main ingredient, cooking method, meal type, difficulty, and dietary restrictions.
''';
  }

  Map<String, dynamic> _parseAIResponse(String content) {
    // Extract JSON from response
    final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(content);
    if (jsonMatch == null) {
      throw Exception('No JSON found in AI response');
    }
    
    return json.decode(jsonMatch.group(0)!);
  }
}

// lib/data/datasources/remote/recipe_scraper_datasource.dart

class RecipeScraperDatasource {
  final Dio _dio;
  final String _baseUrl;

  RecipeScraperDatasource(this._dio, this._baseUrl);

  // Extract recipe from URL using Render API
  Future<Map<String, dynamic>> extractRecipeFromUrl(String url) async {
    // Check if Instagram URL
    if (url.contains('instagram.com')) {
      return await _extractFromInstagram(url);
    }
    
    // Generic website extraction
    return await _extractFromWebsite(url);
  }

  Future<Map<String, dynamic>> _extractFromInstagram(String url) async {
    final response = await _dio.post(
      '$_baseUrl/api/extract-enhanced',
      data: {'url': url},
    );

    if (response.data['success']) {
      return {
        'caption': response.data['data']['caption'],
        'author': response.data['data']['metadata']['og_title']
            ?.split(' on Instagram')[0],
        'imageUrl': response.data['data']['metadata']['og_image'],
        'url': url,
      };
    }
    
    throw Exception('Failed to extract Instagram content');
  }

  Future<Map<String, dynamic>> _extractFromWebsite(String url) async {
    final response = await _dio.post(
      '$_baseUrl/api/scrape-web',
      data: {
        'url': url,
        'options': {
          'text': true,
          'metadata': true,
          'images': true,
          'headings': true,
        },
      },
    );

    return {
      'title': response.data['metadata']['title'],
      'content': response.data['text']['full_text'],
      'imageUrl': response.data['metadata']['open_graph']['image'],
      'author': response.data['metadata']['author'],
      'url': url,
    };
  }
}
```

---

## 6. Navigation Structure

### 6.1 Route Configuration

```dart
// lib/app/routes.dart

import 'package:go_router/go_router.dart';

class AppRoutes {
  static const String splash = '/';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String home = '/home';
  static const String recipes = '/recipes';
  static const String recipeDetail = '/recipe/:id';
  static const String addRecipe = '/add-recipe';
  static const String mealPlan = '/meal-plan';
  static const String shoppingList = '/shopping-list';
  static const String cupboard = '/cupboard';
  static const String explore = '/explore';
  static const String plus = '/plus';
  static const String profile = '/profile';
  static const String settings = '/settings';

  static final GoRouter router = GoRouter(
    initialLocation: splash,
    routes: [
      // Auth routes
      GoRoute(
        path: login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: signup,
        builder: (context, state) => const SignupScreen(),
      ),
      
      // Main app with bottom navigation
      ShellRoute(
        builder: (context, state, child) {
          return MainLayout(child: child);
        },
        routes: [
          GoRoute(
            path: home,
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: recipes,
            builder: (context, state) => const RecipesScreen(),
          ),
          GoRoute(
            path: mealPlan,
            builder: (context, state) => const MealPlanScreen(),
          ),
          GoRoute(
            path: shoppingList,
            builder: (context, state) => const ShoppingListScreen(),
          ),
          GoRoute(
            path: cupboard,
            builder: (context, state) => const CupboardScreen(),
          ),
          GoRoute(
            path: explore,
            builder: (context, state) => const ExploreScreen(),
          ),
          GoRoute(
            path: plus,
            builder: (context, state) => const PlusMenuScreen(),
          ),
        ],
      ),
      
      // Detail screens
      GoRoute(
        path: recipeDetail,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return RecipeDetailScreen(recipeId: id);
        },
      ),
      GoRoute(
        path: addRecipe,
        builder: (context, state) => const AddRecipeScreen(),
      ),
      GoRoute(
        path: profile,
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: settings,
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
    redirect: (context, state) {
      // Authentication guard
      final isAuthenticated = context.read<AuthProvider>().isAuthenticated;
      final isAuthRoute = state.matchedLocation == login || 
                         state.matchedLocation == signup;
      
      if (!isAuthenticated && !isAuthRoute) {
        return login;
      }
      
      if (isAuthenticated && isAuthRoute) {
        return home;
      }
      
      return null; // No redirect needed
    },
  );
}
```

### 6.2 Bottom Navigation

```dart
// lib/presentation/widgets/main_layout.dart

class MainLayout extends StatefulWidget {
  final Widget child;

  const MainLayout({required this.child, super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;

  final List<BottomNavigationBarItem> _items = [
    BottomNavigationBarItem(
      icon: Icon(Icons.home_outlined),
      activeIcon: Icon(Icons.home),
      label: 'Home',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.explore_outlined),
      activeIcon: Icon(Icons.explore),
      label: 'Explore',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.add_circle_outline),
      activeIcon: Icon(Icons.add_circle),
      label: 'Add',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.calendar_today_outlined),
      activeIcon: Icon(Icons.calendar_today),
      label: 'Meal Plan',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.book_outlined),
      activeIcon: Icon(Icons.book),
      label: 'Recipes',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.shopping_cart_outlined),
      activeIcon: Icon(Icons.shopping_cart),
      label: 'Shopping',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
          _navigateToTab(index);
        },
        items: _items,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Theme.of(context).primaryColor,
        unselectedItemColor: Colors.grey,
      ),
    );
  }

  void _navigateToTab(int index) {
    final routes = [
      AppRoutes.home,
      AppRoutes.explore,
      AppRoutes.plus,
      AppRoutes.mealPlan,
      AppRoutes.recipes,
      AppRoutes.shoppingList,
    ];
    context.go(routes[index]);
  }
}
```

---

## 7. Screen Specifications

### 7.1 Home Screen (Discover Recipes)

**File:** `lib/presentation/screens/home/home_screen.dart`

**Features:**
- Search bar for filtering recipes
- Grid layout of recipe cards
- Pull-to-refresh
- Loading states
- Error handling with retry

**Key Widgets:**
```dart
class HomeScreen extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Discover Recipes'),
        actions: [
          IconButton(
            icon: Icon(Icons.person),
            onPressed: () => context.push(AppRoutes.profile),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search recipes...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onChanged: (query) => context.read<RecipeProvider>()
                  .searchRecipes(query),
            ),
          ),
          
          // Recipe grid
          Expanded(
            child: Consumer<RecipeProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading) {
                  return LoadingIndicator();
                }
                
                if (provider.error != null) {
                  return ErrorWidget(
                    message: provider.error!,
                    onRetry: () => provider.loadRecipes(),
                  );
                }
                
                return RefreshIndicator(
                  onRefresh: () => provider.loadRecipes(),
                  child: GridView.builder(
                    padding: EdgeInsets.all(16),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.75,
                    ),
                    itemCount: provider.recipes.length,
                    itemBuilder: (context, index) {
                      return RecipeCard(recipe: provider.recipes[index]);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
```

### 7.2 Recipes Screen

**File:** `lib/presentation/screens/recipes/recipes_screen.dart`

**Features:**
- List of user's recipes
- Favorite indicator
- Recipe details (time, servings)
- Pull-to-refresh
- Swipe to delete

```dart
class RecipesScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('My Recipes'),
        actions: [
          IconButton(
            icon: Icon(Icons.add),
            onPressed: () => context.push(AppRoutes.addRecipe),
          ),
        ],
      ),
      body: Consumer<RecipeProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return LoadingIndicator();
          }
          
          if (provider.recipes.isEmpty) {
            return EmptyState(
              icon: Icons.book,
              message: 'No recipes found',
              actionText: 'Add your first recipe',
              onAction: () => context.push(AppRoutes.addRecipe),
            );
          }
          
          return RefreshIndicator(
            onRefresh: () => provider.loadRecipes(),
            child: ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: provider.recipes.length,
              itemBuilder: (context, index) {
                final recipe = provider.recipes[index];
                return Slidable(
                  endActionPane: ActionPane(
                    motion: ScrollMotion(),
                    children: [
                      SlidableAction(
                        onPressed: (_) => provider.deleteRecipe(recipe.id),
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        icon: Icons.delete,
                        label: 'Delete',
                      ),
                    ],
                  ),
                  child: RecipeListCard(recipe: recipe),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
```

### 7.3 Recipe Detail Screen

**File:** `lib/presentation/screens/recipes/recipe_detail_screen.dart`

**Features:**
- Recipe image/media carousel
- Title, description, author
- Ingredients list
- Step-by-step instructions
- Nutrition information
- Tags
- Favorite toggle
- Share button
- Add to meal plan
- Add to shopping list

```dart
class RecipeDetailScreen extends StatefulWidget {
  final String recipeId;

  const RecipeDetailScreen({required this.recipeId, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<RecipeModel?>(
        future: context.read<RecipeProvider>().getRecipeById(recipeId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return LoadingIndicator();
          }
          
          if (snapshot.hasError || !snapshot.hasData) {
            return ErrorWidget(message: 'Recipe not found');
          }
          
          final recipe = snapshot.data!;
          
          return CustomScrollView(
            slivers: [
              // App bar with image
              SliverAppBar(
                expandedHeight: 300,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  background: recipe.imageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: recipe.imageUrl!,
                          fit: BoxFit.cover,
                        )
                      : Container(color: Colors.grey),
                ),
                actions: [
                  IconButton(
                    icon: Icon(
                      recipe.isFavorite ? Icons.favorite : Icons.favorite_border,
                      color: recipe.isFavorite ? Colors.red : Colors.white,
                    ),
                    onPressed: () => context.read<RecipeProvider>()
                        .toggleFavorite(recipe.id, !recipe.isFavorite),
                  ),
                  IconButton(
                    icon: Icon(Icons.share),
                    onPressed: () => _shareRecipe(recipe),
                  ),
                ],
              ),
              
              // Recipe content
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title
                      Text(
                        recipe.title,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      SizedBox(height: 8),
                      
                      // Meta information
                      Row(
                        children: [
                          Icon(Icons.schedule, size: 16, color: Colors.grey),
                          SizedBox(width: 4),
                          Text('${recipe.totalTime} min'),
                          SizedBox(width: 16),
                          Icon(Icons.restaurant, size: 16, color: Colors.grey),
                          SizedBox(width: 4),
                          Text('${recipe.servings} servings'),
                        ],
                      ),
                      SizedBox(height: 16),
                      
                      // Description
                      if (recipe.description != null)
                        Text(recipe.description!),
                      SizedBox(height: 24),
                      
                      // Ingredients section
                      Text(
                        'Ingredients',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      SizedBox(height: 12),
                      ...recipe.recipeIngredients?.map((ing) => 
                        IngredientItem(ingredient: ing)
                      ) ?? [],
                      SizedBox(height: 24),
                      
                      // Instructions section
                      Text(
                        'Instructions',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      SizedBox(height: 12),
                      ...recipe.recipeSteps?.asMap().entries.map((entry) =>
                        InstructionStep(
                          number: entry.key + 1,
                          instruction: entry.value.instruction,
                        )
                      ) ?? [],
                      SizedBox(height: 24),
                      
                      // Nutrition (if available)
                      if (recipe.recipeNutrition != null)
                        NutritionCard(nutrition: recipe.recipeNutrition!),
                      SizedBox(height: 24),
                      
                      // Tags
                      if (recipe.recipeTags != null && recipe.recipeTags!.isNotEmpty)
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: recipe.recipeTags!.map((tag) =>
                            Chip(label: Text(tag.tag?.name ?? ''))
                          ).toList(),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _addToMealPlan(recipe),
                  icon: Icon(Icons.calendar_today),
                  label: Text('Add to Meal Plan'),
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _addToShoppingList(recipe),
                  icon: Icon(Icons.shopping_cart),
                  label: Text('Add to List'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### 7.4 Add Recipe Screen

**File:** `lib/presentation/screens/recipes/add_recipe_screen.dart`

**Features:**
- Manual recipe entry form
- URL extraction input
- Image upload
- Dynamic ingredient list
- Dynamic instruction steps
- Form validation

```dart
class AddRecipeScreen extends StatefulWidget {
  @override
  State<AddRecipeScreen> createState() => _AddRecipeScreenState();
}

class _AddRecipeScreenState extends State<AddRecipeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _urlController = TextEditingController();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  bool _isExtracting = false;
  bool _showManualForm = false;
  
  List<IngredientInput> _ingredients = [IngredientInput()];
  List<String> _steps = [''];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Add Recipe'),
        actions: [
          if (_showManualForm)
            TextButton(
              onPressed: _saveRecipe,
              child: Text('Save'),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // URL extraction
            if (!_showManualForm) ...[
              Text(
                'Extract from URL',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              SizedBox(height: 12),
              TextField(
                controller: _urlController,
                decoration: InputDecoration(
                  hintText: 'Paste Instagram or recipe URL...',
                  border: OutlineInputBorder(),
                  suffixIcon: _isExtracting
                      ? Padding(
                          padding: EdgeInsets.all(12),
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : IconButton(
                          icon: Icon(Icons.search),
                          onPressed: _extractFromUrl,
                        ),
                ),
              ),
              SizedBox(height: 24),
              Row(
                children: [
                  Expanded(child: Divider()),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text('OR'),
                  ),
                  Expanded(child: Divider()),
                ],
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => setState(() => _showManualForm = true),
                child: Text('Create Recipe Manually'),
              ),
            ],
            
            // Manual form
            if (_showManualForm)
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Title
                    TextFormField(
                      controller: _titleController,
                      decoration: InputDecoration(
                        labelText: 'Recipe Name',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) =>
                          value?.isEmpty ?? true ? 'Required' : null,
                    ),
                    SizedBox(height: 16),
                    
                    // Description
                    TextFormField(
                      controller: _descriptionController,
                      decoration: InputDecoration(
                        labelText: 'Description',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 3,
                    ),
                    SizedBox(height: 24),
                    
                    // Ingredients section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Ingredients',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        IconButton(
                          icon: Icon(Icons.add_circle),
                          onPressed: () {
                            setState(() => _ingredients.add(IngredientInput()));
                          },
                        ),
                      ],
                    ),
                    ..._ingredients.asMap().entries.map((entry) =>
                      IngredientFormField(
                        ingredient: entry.value,
                        onRemove: _ingredients.length > 1
                            ? () => setState(() => _ingredients.removeAt(entry.key))
                            : null,
                      )
                    ),
                    SizedBox(height: 24),
                    
                    // Instructions section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Instructions',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        IconButton(
                          icon: Icon(Icons.add_circle),
                          onPressed: () {
                            setState(() => _steps.add(''));
                          },
                        ),
                      ],
                    ),
                    ..._steps.asMap().entries.map((entry) =>
                      InstructionFormField(
                        stepNumber: entry.key + 1,
                        instruction: entry.value,
                        onChanged: (value) => _steps[entry.key] = value,
                        onRemove: _steps.length > 1
                            ? () => setState(() => _steps.removeAt(entry.key))
                            : null,
                      )
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _extractFromUrl() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;
    
    setState(() => _isExtracting = true);
    
    try {
      final recipe = await context.read<RecipeProvider>()
          .extractRecipeFromUrl(url);
      
      // Navigate to detail or edit screen
      context.push(AppRoutes.recipeDetail, extra: recipe);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to extract recipe: $e')),
      );
    } finally {
      setState(() => _isExtracting = false);
    }
  }

  Future<void> _saveRecipe() async {
    if (!_formKey.currentState!.validate()) return;
    
    final recipe = RecipeModel(
      id: Uuid().v4(),
      title: _titleController.text,
      description: _descriptionController.text,
      // ... map all fields
      isFavorite: false,
      isSaved: true,
    );
    
    await context.read<RecipeProvider>().createRecipe(recipe);
    context.pop();
  }
}
```

### 7.5 Meal Plan Screen

**File:** `lib/presentation/screens/meal_plan/meal_plan_screen.dart`

**Features:**
- Weekly calendar view
- Drag-and-drop recipes to days
- Meal types (breakfast, lunch, dinner, snack)
- Add recipes to specific meals
- Generate shopping list from meal plan

### 7.6 Shopping List Screen

**File:** `lib/presentation/screens/shopping_list/shopping_list_screen.dart`

**Features:**
- Checkbox for each item
- Grouped by category
- Add custom items
- Cost tracking
- Export/share list

### 7.7 Cupboard Screen

**File:** `lib/presentation/screens/cupboard/cupboard_screen.dart`

**Features:**
- List of pantry items
- Expiration date tracking
- Add/edit/delete items
- Category organization
- Search functionality

### 7.8 Authentication Screens

**Files:**
- `lib/presentation/screens/auth/login_screen.dart`
- `lib/presentation/screens/auth/signup_screen.dart`

**Features:**
- Email/password fields
- Form validation
- Loading states
- Error handling
- Forgot password link

---

## 8. State Management

### 8.1 Recommended Approach: Provider

```dart
// lib/presentation/providers/recipe_provider.dart

import 'package:flutter/material.dart';

class RecipeProvider extends ChangeNotifier {
  final RecipeRepositoryImpl _repository;
  final DeepSeekRemoteDatasource _deepSeek;
  final RecipeScraperDatasource _scraper;

  RecipeProvider(this._repository, this._deepSeek, this._scraper);

  List<RecipeModel> _recipes = [];
  List<RecipeModel> get recipes => _recipes;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  // Load all recipes
  Future<void> loadRecipes() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _recipes = await _repository.getUserRecipes();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get recipe by ID
  Future<RecipeModel?> getRecipeById(String id) async {
    try {
      return await _repository.getRecipeById(id);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  // Create recipe
  Future<void> createRecipe(RecipeModel recipe) async {
    _isLoading = true;
    notifyListeners();

    try {
      final newRecipe = await _repository.createRecipe(recipe);
      _recipes.insert(0, newRecipe);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Update recipe
  Future<void> updateRecipe(String id, RecipeModel recipe) async {
    try {
      final updated = await _repository.updateRecipe(id, recipe);
      final index = _recipes.indexWhere((r) => r.id == id);
      if (index != -1) {
        _recipes[index] = updated;
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Delete recipe
  Future<void> deleteRecipe(String id) async {
    try {
      await _repository.deleteRecipe(id);
      _recipes.removeWhere((r) => r.id == id);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Toggle favorite
  Future<void> toggleFavorite(String id, bool isFavorite) async {
    try {
      await _repository.toggleFavorite(id, isFavorite);
      final index = _recipes.indexWhere((r) => r.id == id);
      if (index != -1) {
        _recipes[index] = _recipes[index].copyWith(isFavorite: isFavorite);
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Extract recipe from URL
  Future<RecipeModel> extractRecipeFromUrl(String url) async {
    _isLoading = true;
    notifyListeners();

    try {
      // Step 1: Scrape content from URL
      final scrapedData = await _scraper.extractRecipeFromUrl(url);
      
      // Step 2: Analyze with AI
      final aiData = await _deepSeek.analyzeRecipeText(
        text: scrapedData['content'] ?? scrapedData['caption'],
        isInstagramContent: url.contains('instagram.com'),
      );
      
      // Step 3: Combine data into recipe model
      final recipe = RecipeModel(
        id: Uuid().v4(),
        title: aiData['title'] ?? scrapedData['title'],
        description: aiData['description'],
        prepTime: aiData['prepTime'],
        cookTime: aiData['cookTime'],
        servings: aiData['servings'],
        imageUrl: scrapedData['imageUrl'],
        author: scrapedData['author'],
        sourceUrl: url,
        isFavorite: false,
        isSaved: true,
        // Map ingredients, steps, tags, etc.
      );
      
      return recipe;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Search recipes
  Future<void> searchRecipes(String query) async {
    if (query.isEmpty) {
      await loadRecipes();
      return;
    }

    _isLoading = true;
    notifyListeners();

    try {
      _recipes = await _repository.searchRecipes(query);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

### 8.2 Auth Provider

```dart
// lib/presentation/providers/auth_provider.dart

class AuthProvider extends ChangeNotifier {
  final AuthRepositoryImpl _repository;

  AuthProvider(this._repository) {
    _init();
  }

  User? _user;
  User? get user => _user;
  bool get isAuthenticated => _user != null;

  bool _isLoading = true;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  void _init() {
    _user = _repository.currentUser;
    _isLoading = false;

    // Listen to auth state changes
    _repository.authStateChanges.listen((state) {
      _user = state.session?.user;
      notifyListeners();
    });
  }

  Future<void> signIn(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _repository.signInWithEmail(
        email: email,
        password: password,
      );
      _user = response.user;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signUp(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _repository.signUpWithEmail(
        email: email,
        password: password,
      );
      _user = response.user;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _repository.signOut();
    _user = null;
    notifyListeners();
  }
}
```

### 8.3 Provider Setup in main.dart

```dart
// lib/main.dart

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseConfig.initialize();

  runApp(
    MultiProvider(
      providers: [
        // Auth provider
        ChangeNotifierProvider(
          create: (_) => AuthProvider(
            AuthRepositoryImpl(SupabaseConfig.client),
          ),
        ),
        
        // Recipe provider
        ChangeNotifierProvider(
          create: (_) => RecipeProvider(
            RecipeRepositoryImpl(SupabaseConfig.client),
            DeepSeekRemoteDatasource(Dio(), deepSeekApiKey),
            RecipeScraperDatasource(Dio(), extractApiUrl),
          ),
        ),
        
        // Meal plan provider
        ChangeNotifierProvider(
          create: (_) => MealPlanProvider(
            MealPlanRepositoryImpl(SupabaseConfig.client),
          ),
        ),
        
        // Shopping list provider
        ChangeNotifierProvider(
          create: (_) => ShoppingListProvider(
            ShoppingListRepositoryImpl(SupabaseConfig.client),
          ),
        ),
        
        // Cupboard provider
        ChangeNotifierProvider(
          create: (_) => CupboardProvider(
            CupboardRepositoryImpl(SupabaseConfig.client),
          ),
        ),
      ],
      child: const UmamiApp(),
    ),
  );
}

class UmamiApp extends StatelessWidget {
  const UmamiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Umami Recipe App',
      theme: ThemeData(
        primarySwatch: Colors.green,
        useMaterial3: true,
      ),
      routerConfig: AppRoutes.router,
    );
  }
}
```

---

## 9. Services & API Layer

### 9.1 API Constants

```dart
// lib/core/constants/api_constants.dart

class ApiConstants {
  // Supabase
  static const String supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const String supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  
  // DeepSeek AI
  static const String deepSeekApiUrl = 'https://api.deepseek.com/v1';
  static const String deepSeekApiKey = String.fromEnvironment('DEEPSEEK_API_KEY');
  
  // Recipe Extraction Service
  static const String extractApiUrl = String.fromEnvironment('EXTRACT_API_URL');
  
  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
```

### 9.2 Error Handling

```dart
// lib/core/errors/failures.dart

abstract class Failure {
  final String message;
  const Failure(this.message);
}

class ServerFailure extends Failure {
  const ServerFailure(super.message);
}

class NetworkFailure extends Failure {
  const NetworkFailure(super.message);
}

class AuthFailure extends Failure {
  const AuthFailure(super.message);
}

class CacheFailure extends Failure {
  const CacheFailure(super.message);
}

// lib/core/errors/exceptions.dart

class ServerException implements Exception {
  final String message;
  const ServerException(this.message);
}

class NetworkException implements Exception {
  final String message;
  const NetworkException(this.message);
}

class AuthException implements Exception {
  final String message;
  const AuthException(this.message);
}
```

---

## 10. UI Components

### 10.1 Recipe Card

```dart
// lib/presentation/widgets/recipe_card.dart

class RecipeCard extends StatelessWidget {
  final RecipeModel recipe;
  final Color? backgroundColor;

  const RecipeCard({
    required this.recipe,
    this.backgroundColor,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(
        AppRoutes.recipeDetail,
        extra: {'id': recipe.id},
      ),
      child: Container(
        decoration: BoxDecoration(
          color: backgroundColor ?? Colors.primaries[
            recipe.title.hashCode % Colors.primaries.length
          ],
          borderRadius: BorderRadius.circular(12),
        ),
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Initials
            Text(
              recipe.title.substring(0, min(2, recipe.title.length)).toUpperCase(),
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            
            // Info
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  recipe.title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 16, color: Colors.white),
                    SizedBox(width: 4),
                    Text(
                      '${recipe.totalTime} min',
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

### 10.2 Loading Indicator

```dart
// lib/presentation/widgets/common/loading_indicator.dart

class LoadingIndicator extends StatelessWidget {
  final String? message;

  const LoadingIndicator({this.message, super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          if (message != null) ...[
            SizedBox(height: 16),
            Text(message!),
          ],
        ],
      ),
    );
  }
}
```

### 10.3 Error Widget

```dart
// lib/presentation/widgets/common/error_widget.dart

class ErrorDisplay extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorDisplay({
    required this.message,
    this.onRetry,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16),
            ),
            if (onRetry != null) ...[
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: onRetry,
                child: Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

### 10.4 Empty State

```dart
// lib/presentation/widgets/common/empty_state.dart

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? actionText;
  final VoidCallback? onAction;

  const EmptyState({
    required this.icon,
    required this.message,
    this.actionText,
    this.onAction,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 64,
            color: Colors.grey,
          ),
          SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
          if (actionText != null && onAction != null) ...[
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: onAction,
              child: Text(actionText!),
            ),
          ],
        ],
      ),
    );
  }
}
```

---

## 11. Features & Functionality

### 11.1 AI Recipe Extraction Flow

```
User Input URL
      ↓
Validate URL
      ↓
Detect Source (Instagram/Website)
      ↓
Call Scraper API
      ↓
Extract Content (Text, Images, Metadata)
      ↓
Send to DeepSeek AI
      ↓
Parse AI Response (JSON)
      ↓
Create Recipe Model
      ↓
Save to Supabase
      ↓
Show Recipe Detail
```

### 11.2 Meal Planning Flow

```
Select Date
      ↓
Choose Meal Type (Breakfast/Lunch/Dinner/Snack)
      ↓
Browse Recipes
      ↓
Add Recipe to Meal Slot
      ↓
Save Meal Plan
      ↓
Generate Shopping List (Optional)
```

### 11.3 Shopping List Generation

```
Select Recipes from Meal Plan
      ↓
Extract All Ingredients
      ↓
Group by Category
      ↓
Merge Duplicate Ingredients
      ↓
Calculate Quantities
      ↓
Estimate Costs (Optional)
      ↓
Create Shopping List
```

---

## 12. Platform-Specific Considerations

### 12.1 iOS Considerations

- Use `CupertinoIcons` for iOS-style icons
- Implement iOS-style navigation with `CupertinoPageRoute`
- Use `CupertinoSwitch`, `CupertinoButton` for native feel
- Handle safe area properly with `SafeArea` widget
- Implement haptic feedback with `HapticFeedback.lightImpact()`

### 12.2 Android Considerations

- Use Material Design 3 components
- Implement Android back button handling
- Use `MaterialPageRoute` for navigation
- Handle Android permissions properly (camera, storage)

### 12.3 Web Considerations (Optional)

- Responsive design for different screen sizes
- Browser-specific features (URL navigation)
- PWA support

---

## 13. Migration Strategy

### 13.1 Phase 1: Setup & Core Infrastructure (Week 1-2)

1. **Project Setup**
   - Create Flutter project
   - Configure dependencies
   - Set up folder structure
   - Configure Supabase connection
   - Set up environment variables

2. **Data Models**
   - Create all data models with JSON serialization
   - Run code generation
   - Test model serialization

3. **Backend Integration**
   - Implement Supabase client
   - Create repository interfaces
   - Implement authentication repository
   - Test authentication flow

### 13.2 Phase 2: Core Features (Week 3-5)

4. **Authentication**
   - Login screen
   - Signup screen
   - Auth state management
   - Protected routes

5. **Recipe Management**
   - Recipe list screen
   - Recipe detail screen
   - Create recipe screen
   - Recipe repository implementation
   - State management

6. **Home/Discovery**
   - Home screen with recipe grid
   - Search functionality
   - Loading states

### 13.3 Phase 3: Advanced Features (Week 6-8)

7. **AI Recipe Extraction**
   - URL input interface
   - Scraper API integration
   - DeepSeek AI integration
   - Result parsing and display

8. **Meal Planning**
   - Calendar view
   - Meal plan repository
   - Add recipes to plan
   - State management

9. **Shopping List**
   - List view
   - Add/edit items
   - Generate from recipes
   - State management

10. **Cupboard Management**
    - Item list view
    - Add/edit items
    - Expiration tracking
    - State management

### 13.4 Phase 4: Polish & Testing (Week 9-10)

11. **UI/UX Refinement**
    - Animations
    - Error handling
    - Loading states
    - Empty states

12. **Testing**
    - Unit tests for repositories
    - Widget tests for screens
    - Integration tests
    - Performance testing

13. **Deployment**
    - iOS build and TestFlight
    - Android build and Play Store
    - App store assets

---

## 14. Testing Requirements

### 14.1 Unit Tests

```dart
// test/data/repositories/recipe_repository_test.dart

void main() {
  group('RecipeRepository', () {
    late MockSupabaseClient mockSupabase;
    late RecipeRepositoryImpl repository;

    setUp(() {
      mockSupabase = MockSupabaseClient();
      repository = RecipeRepositoryImpl(mockSupabase);
    });

    test('getUserRecipes returns list of recipes', () async {
      // Arrange
      when(mockSupabase.from('recipes').select(any))
          .thenAnswer((_) async => [/* mock data */]);

      // Act
      final recipes = await repository.getUserRecipes();

      // Assert
      expect(recipes, isA<List<RecipeModel>>());
    });
  });
}
```

### 14.2 Widget Tests

```dart
// test/presentation/screens/home_screen_test.dart

void main() {
  testWidgets('HomeScreen displays recipes', (tester) async {
    // Arrange
    final mockProvider = MockRecipeProvider();
    when(mockProvider.recipes).thenReturn([/* mock recipes */]);

    // Act
    await tester.pumpWidget(
      MaterialApp(
        home: ChangeNotifierProvider<RecipeProvider>.value(
          value: mockProvider,
          child: HomeScreen(),
        ),
      ),
    );

    // Assert
    expect(find.text('Discover Recipes'), findsOneWidget);
    expect(find.byType(RecipeCard), findsWidgets);
  });
}
```

### 14.3 Integration Tests

```dart
// integration_test/app_test.dart

void main() {
  testWidgets('Complete recipe flow', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    // Login
    await tester.enterText(find.byKey(Key('email')), 'test@test.com');
    await tester.enterText(find.byKey(Key('password')), 'password');
    await tester.tap(find.text('Login'));
    await tester.pumpAndSettle();

    // Navigate to recipes
    await tester.tap(find.byIcon(Icons.book));
    await tester.pumpAndSettle();

    // Add recipe
    await tester.tap(find.byIcon(Icons.add));
    await tester.pumpAndSettle();
    
    // Verify
    expect(find.text('Add Recipe'), findsOneWidget);
  });
}
```

---

## 15. Environment Configuration

### 15.1 Environment Variables

Create `.env` file:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
EXTRACT_API_URL=your_extraction_service_url
```

### 15.2 Running with Environment Variables

```bash
flutter run \
  --dart-define=SUPABASE_URL=your_url \
  --dart-define=SUPABASE_ANON_KEY=your_key \
  --dart-define=DEEPSEEK_API_KEY=your_key \
  --dart-define=EXTRACT_API_URL=your_url
```

---

## 16. Deployment Checklist

### 16.1 Pre-Deployment

- [ ] All environment variables configured
- [ ] App icons and splash screens created
- [ ] All features tested
- [ ] Performance optimized
- [ ] Security audit completed
- [ ] Privacy policy and terms of service ready

### 16.2 iOS Deployment

- [ ] Apple Developer account set up
- [ ] App ID created
- [ ] Provisioning profiles configured
- [ ] TestFlight testing completed
- [ ] App Store Connect metadata filled
- [ ] Screenshots and promotional materials ready
- [ ] Submit for App Store review

### 16.3 Android Deployment

- [ ] Google Play Console account set up
- [ ] Signing key generated and secured
- [ ] App bundle created
- [ ] Internal testing completed
- [ ] Play Store listing completed
- [ ] Screenshots and promotional materials ready
- [ ] Submit for Play Store review

---

## 17. Performance Optimization

### 17.1 Image Optimization

- Use `CachedNetworkImage` for all network images
- Implement lazy loading for image lists
- Compress images before upload
- Use appropriate image sizes

### 17.2 Database Queries

- Implement pagination for large lists
- Use proper indexes in Supabase
- Cache frequently accessed data
- Minimize nested queries

### 17.3 State Management

- Avoid unnecessary rebuilds
- Use `const` constructors where possible
- Implement proper disposal of resources
- Use `ListView.builder` for long lists

---

## 18. Security Considerations

### 18.1 API Keys

- Never commit API keys to version control
- Use environment variables
- Implement key rotation strategy
- Use secure storage for sensitive data

### 18.2 Authentication

- Implement proper session management
- Use PKCE flow for OAuth
- Implement refresh token rotation
- Handle token expiration gracefully

### 18.3 Data Validation

- Validate all user inputs
- Sanitize data before sending to backend
- Implement rate limiting
- Use HTTPS for all network requests

---

## 19. Maintenance & Updates

### 19.1 Regular Updates

- Keep Flutter SDK updated
- Update dependencies regularly
- Monitor for security vulnerabilities
- Test thoroughly after updates

### 19.2 Monitoring

- Implement crash reporting (Firebase Crashlytics)
- Monitor API performance
- Track user analytics
- Monitor backend health

---

## Conclusion

This specification provides a comprehensive blueprint for converting the Umami Recipe App from React Native to Flutter while maintaining the existing Supabase backend. The architecture is designed to be scalable, maintainable, and testable, following Flutter best practices and clean architecture principles.

Key success factors:
1. Proper separation of concerns (UI, business logic, data)
2. Robust error handling and loading states
3. Comprehensive testing at all levels
4. Performance optimization
5. Security best practices
6. Smooth migration path with minimal disruption

Estimated Timeline: **10-12 weeks** for complete migration and testing.

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-27  
**Author:** AI Assistant  
**Status:** Ready for Implementation
