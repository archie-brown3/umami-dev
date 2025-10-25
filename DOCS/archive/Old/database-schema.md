# Supabase Database Schema

This document details the database schema used in the Recipe Saver application. The application uses Supabase for data storage with the following tables and relationships.

## Core Tables

### recipes

- `id` (uuid, primary key)
- `user_id` (uuid) - Foreign key to profiles.id
- `title` (text)
- `description` (text)
- `image_url` (text)
- `prep_time` (int4)
- `cook_time` (int4)
- `servings` (int4)
- `category` (text)
- `source` (text)
- `source_url` (text)
- `author` (text)
- `is_favorite` (bool)
- `is_saved` (bool)
- `total_cost` (numeric)
- `cost_per_serving` (numeric)
- `price_confidence` (numeric)
- `instagram_username` (text)
- `instagram_profile_picture` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### ingredients

- `id` (uuid, primary key)
- `name` (text)
- `category` (text)
- `emoji` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### recipe_ingredients

- `id` (uuid, primary key)
- `recipe_id` (uuid) - Foreign key to recipes.id
- `ingredient_id` (uuid) - Foreign key to ingredients.id
- `quantity` (text)
- `unit` (text)
- `cost` (numeric)
- `package_size` (text)
- `package_price` (numeric)
- `portion_used` (numeric)
- `price_confidence` (numeric)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### steps

- `id` (uuid, primary key)
- `recipe_id` (uuid) - Foreign key to recipes.id
- `description` (text)
- `order_index` (int4)
- `created_at` (timestamptz)

### tags

- `id` (uuid, primary key)
- `name` (text)
- `created_at` (timestamptz)

### recipe_tags

- `recipe_id` (uuid) - Foreign key to recipes.id
- `tag_id` (uuid) - Foreign key to tags.id

## Meal Planning and Shopping

### meal_plans

- `id` (uuid, primary key)
- `user_id` (uuid) - Foreign key to profiles.id
- `date` (date)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### meal_plan_items

- `id` (uuid, primary key)
- `meal_plan_id` (uuid) - Foreign key to meal_plans.id
- `recipe_id` (uuid) - Foreign key to recipes.id
- `meal_type` (text) - e.g., 'breakfast', 'lunch', 'dinner', 'snacks'
- `created_at` (timestamptz)

### shopping_lists

- `id` (uuid, primary key)
- `user_id` (uuid) - Foreign key to profiles.id
- `title` (text)
- `date` (date)
- `total_cost` (numeric)
- `total_package_cost` (numeric)
- `price_confidence` (numeric)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### shopping_items

- `id` (uuid, primary key)
- `shopping_list_id` (uuid) - Foreign key to shopping_lists.id
- `ingredient_id` (uuid) - Foreign key to ingredients.id
- `name` (text)
- `quantity` (text)
- `unit` (text)
- `category` (text)
- `checked` (bool)
- `recipe_id` (uuid) - Foreign key to recipes.id
- `emoji` (text)
- `cost` (numeric)
- `package_price` (numeric)
- `package_cost` (numeric)
- `price_confidence` (numeric)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Recipe Organization

### recipe_lists

- `id` (uuid, primary key)
- `user_id` (uuid) - Foreign key to profiles.id
- `title` (text)
- `description` (text)
- `image_url` (text)
- `color` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### recipe_list_items

- `recipe_list_id` (uuid) - Foreign key to recipe_lists.id
- `recipe_id` (uuid) - Foreign key to recipes.id
- `added_at` (timestamptz)

## User Data

### profiles

- `id` (uuid, primary key) - Maps to auth.users.id
- `email` (text)
- `display_name` (text)
- `avatar_url` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### cupboard_items

- `id` (uuid, primary key)
- `user_id` (uuid) - Foreign key to profiles.id
- `name` (text)
- `category` (text)
- `quantity` (text)
- `unit` (text)
- `emoji` (text)
- `expiration_date` (date)
- `added_date` (timestamptz)
- `updated_at` (timestamptz)

## Media and Nutrition

### recipe_media

- `id` (uuid, primary key)
- `recipe_id` (uuid) - Foreign key to recipes.id
- `url` (text)
- `is_video` (bool)
- `video_url` (text)
- `order_index` (int4)
- `created_at` (timestamptz)

### recipe_nutrition

- `id` (uuid, primary key)
- `recipe_id` (uuid) - Foreign key to recipes.id
- `calories` (int4)
- `protein` (text)
- `carbs` (text)
- `fat` (text)
- `fiber` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Subscription Management

### subscriptions

- `id` (uuid, primary key)
- `user_id` (uuid) - Foreign key to profiles.id
- `tier` (text)
- `extractions_remaining` (int4)
- `valid_until` (timestamptz)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Data Flow and Relationships

1. Each `recipe` belongs to a `user` (profile)
2. Recipe ingredients are stored in a junction table (`recipe_ingredients`) connecting `recipes` and `ingredients`
3. Recipe steps are stored in the `steps` table with a foreign key to `recipes`
4. Tags are connected to recipes through the `recipe_tags` junction table
5. Meal plans consist of multiple `meal_plan_items` that reference recipes
6. Shopping lists contain multiple `shopping_items` that may reference ingredients and recipes
7. Recipe lists organize recipes through the `recipe_list_items` junction table
8. Nutrition data is stored in the `recipe_nutrition` table with a one-to-one relationship to recipes
9. Media attachments (e.g., for Instagram recipes) are stored in `recipe_media`

## Type Conversion Notes

When mapping database fields to frontend models, the following transformations occur:

- Snake case DB fields (`image_url`) → Camel case JS properties (`imageUrl`)
- Boolean fields with `is_` prefix → Standard boolean properties (e.g., `is_favorite` → `favorite`)
- Nested relationships:
  - `ingredients` → Array of ingredient objects with their associated `recipe_ingredients` data merged
  - `steps` → Array of step description strings
  - `tags` → Array of tag name strings

The mapping logic is implemented in the `toRecipe` function in the `dbUtils.ts` file.
