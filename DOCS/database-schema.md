# Supabase Database Schema

This document details the database schema used in the Recipe Saver application. The application uses Supabase for data storage with the following tables and relationships.

## Core Tables

### recipes

| Column                | Type      | Constraints | Description                           |
| --------------------- | --------- | ----------- | ------------------------------------- |
| id                    | uuid      | PK          | Primary key for recipe                |
| user_id               | uuid      | FK          | Reference to user who created recipe  |
| title                 | text      |             | Recipe title                          |
| description           | text      |             | Recipe description                    |
| image_url             | text      |             | URL to recipe image                   |
| prep_time             | int4      |             | Preparation time in minutes           |
| cook_time             | int4      |             | Cooking time in minutes               |
| category              | text      |             | Recipe category                       |
| source                | text      |             | Source of recipe                      |
| source_url            | text      |             | URL to recipe source                  |
| author                | text      |             | Author of recipe                      |
| total_cost            | numeric   |             | Total cost of recipe                  |
| cost_per_serving      | numeric   |             | Cost per serving                      |
| price_confidence      | numeric   |             | Confidence level for price estimation |
| instagram_username    | text      |             | Instagram username                    |
| instagram_profile_pic | text      |             | Instagram profile picture URL         |
| servings              | int4      |             | Number of servings                    |
| is_favorite           | bool      |             | Whether recipe is marked as favorite  |
| is_saved              | bool      |             | Whether recipe is saved               |
| created_at            | timestamp |             | Creation timestamp                    |
| updated_at            | timestamp |             | Last update timestamp                 |

### recipe_steps

| Column      | Type      | Constraints | Description           |
| ----------- | --------- | ----------- | --------------------- |
| id          | uuid      | PK          | Primary key for step  |
| recipe_id   | uuid      | FK          | Reference to recipe   |
| step_number | int4      |             | Order of step         |
| instruction | text      |             | Step instruction      |
| created_at  | timestamp |             | Creation timestamp    |
| updated_at  | timestamp |             | Last update timestamp |

### recipe_ingredients

| Column           | Type      | Constraints | Description                           |
| ---------------- | --------- | ----------- | ------------------------------------- |
| id               | uuid      | PK          | Primary key for recipe ingredient     |
| recipe_id        | uuid      | FK          | Reference to recipe                   |
| ingredient_id    | uuid      | FK          | Reference to ingredient               |
| quantity         | text      |             | Quantity of ingredient                |
| unit             | text      |             | Unit of measurement                   |
| cost             | numeric   |             | Cost of ingredient for recipe         |
| package_size     | text      |             | Size of ingredient package            |
| package_price    | numeric   |             | Price of ingredient package           |
| portion_used     | numeric   |             | Portion of package used               |
| price_confidence | numeric   |             | Confidence level for price estimation |
| created_at       | timestamp |             | Creation timestamp                    |
| updated_at       | timestamp |             | Last update timestamp                 |

### ingredients

| Column     | Type      | Constraints | Description                   |
| ---------- | --------- | ----------- | ----------------------------- |
| id         | uuid      | PK          | Primary key for ingredient    |
| name       | text      |             | Ingredient name               |
| category   | text      |             | Ingredient category           |
| emoji      | text      |             | Emoji representing ingredient |
| created_at | timestamp |             | Creation timestamp            |
| updated_at | timestamp |             | Last update timestamp         |

### recipe_nutrition

| Column     | Type      | Constraints | Description                    |
| ---------- | --------- | ----------- | ------------------------------ |
| id         | uuid      | PK          | Primary key for nutrition info |
| recipe_id  | uuid      | FK          | Reference to recipe            |
| calories   | int4      |             | Calories per serving           |
| protein    | text      |             | Protein content                |
| carbs      | text      |             | Carbohydrate content           |
| fat        | text      |             | Fat content                    |
| fiber      | text      |             | Fiber content                  |
| created_at | timestamp |             | Creation timestamp             |
| updated_at | timestamp |             | Last update timestamp          |

### recipe_media

| Column      | Type      | Constraints | Description            |
| ----------- | --------- | ----------- | ---------------------- |
| id          | uuid      | PK          | Primary key for media  |
| recipe_id   | uuid      | FK          | Reference to recipe    |
| url         | text      |             | Media URL              |
| video_url   | text      |             | Video URL              |
| is_video    | bool      |             | Whether media is video |
| order_index | int4      |             | Display order          |
| created_at  | timestamp |             | Creation timestamp     |

### recipe_tags

| Column    | Type | Constraints | Description         |
| --------- | ---- | ----------- | ------------------- |
| recipe_id | uuid | FK          | Reference to recipe |
| tag_id    | uuid | FK          | Reference to tag    |

### tags

| Column     | Type      | Constraints | Description         |
| ---------- | --------- | ----------- | ------------------- |
| id         | uuid      | PK          | Primary key for tag |
| name       | text      |             | Tag name            |
| created_at | timestamp |             | Creation timestamp  |

## User Management

### profiles

| Column        | Type      | Constraints | Description             |
| ------------- | --------- | ----------- | ----------------------- |
| id            | uuid      | PK          | Primary key for profile |
| email         | text      |             | User email              |
| display_name  | text      |             | User display name       |
| avatar_url    | text      |             | URL to user avatar      |
| created_at    | timestamp |             | Creation timestamp      |
| updated_at    | timestamp |             | Last update timestamp   |
| auth_users_id | uuid      | FK          | Reference to auth user  |

### subscriptions

| Column                | Type      | Constraints | Description                  |
| --------------------- | --------- | ----------- | ---------------------------- |
| id                    | uuid      | PK          | Primary key for subscription |
| user_id               | uuid      | FK          | Reference to user            |
| tier                  | text      |             | Subscription tier            |
| valid_until           | timestamp |             | Expiration date              |
| extractions_remaining | int4      |             | Remaining extractions count  |
| created_at            | timestamp |             | Creation timestamp           |
| updated_at            | timestamp |             | Last update timestamp        |

## Meal Planning

### meal_plans

| Column     | Type      | Constraints | Description               |
| ---------- | --------- | ----------- | ------------------------- |
| id         | uuid      | PK          | Primary key for meal plan |
| user_id    | uuid      | FK          | Reference to user         |
| date       | date      |             | Meal plan date            |
| created_at | timestamp |             | Creation timestamp        |
| updated_at | timestamp |             | Last update timestamp     |

### meal_plan_items

| Column       | Type      | Constraints | Description                                   |
| ------------ | --------- | ----------- | --------------------------------------------- |
| id           | uuid      | PK          | Primary key for meal plan item                |
| meal_plan_id | uuid      | FK          | Reference to meal plan                        |
| recipe_id    | uuid      | FK          | Reference to recipe                           |
| meal_type    | text      |             | Type of meal (breakfast, lunch, dinner, etc.) |
| created_at   | timestamp |             | Creation timestamp                            |

## Shopping Lists

### shopping_lists

| Column             | Type      | Constraints | Description                           |
| ------------------ | --------- | ----------- | ------------------------------------- |
| id                 | uuid      | PK          | Primary key for shopping list         |
| user_id            | uuid      | FK          | Reference to user                     |
| title              | text      |             | Shopping list title                   |
| date               | date      |             | Shopping list date                    |
| total_cost         | numeric   |             | Total cost of items                   |
| total_package_cost | numeric   |             | Total cost of packages                |
| price_confidence   | numeric   |             | Confidence level for price estimation |
| created_at         | timestamp |             | Creation timestamp                    |
| updated_at         | timestamp |             | Last update timestamp                 |

### shopping_items

| Column           | Type      | Constraints | Description                           |
| ---------------- | --------- | ----------- | ------------------------------------- |
| id               | uuid      | PK          | Primary key for shopping item         |
| shopping_list_id | uuid      | FK          | Reference to shopping list            |
| ingredient_id    | uuid      | FK          | Reference to ingredient               |
| name             | text      |             | Item name                             |
| quantity         | text      |             | Item quantity                         |
| unit             | text      |             | Unit of measurement                   |
| category         | text      |             | Item category                         |
| recipe_id        | uuid      | FK          | Reference to recipe (optional)        |
| emoji            | text      |             | Emoji representing item               |
| cost             | numeric   |             | Cost of item                          |
| package_price    | numeric   |             | Price of package                      |
| package_cost     | numeric   |             | Cost of package                       |
| price_confidence | numeric   |             | Confidence level for price estimation |
| checked          | bool      |             | Whether item is checked off           |
| created_at       | timestamp |             | Creation timestamp                    |
| updated_at       | timestamp |             | Last update timestamp                 |

## Recipe Organization

### recipe_list_items

| Column         | Type      | Constraints | Description                   |
| -------------- | --------- | ----------- | ----------------------------- |
| recipe_list_id | uuid      | FK          | Reference to recipe list      |
| recipe_id      | uuid      | FK          | Reference to recipe           |
| added_at       | timestamp |             | When recipe was added to list |

### recipe_lists

| Column      | Type      | Constraints | Description                 |
| ----------- | --------- | ----------- | --------------------------- |
| id          | uuid      | PK          | Primary key for recipe list |
| user_id     | uuid      | FK          | Reference to user           |
| title       | text      |             | List title                  |
| description | text      |             | List description            |
| image_url   | text      |             | URL to list image           |
| color       | text      |             | Color theme for list        |
| created_at  | timestamp |             | Creation timestamp          |
| updated_at  | timestamp |             | Last update timestamp       |

### clipboard_items

| Column          | Type      | Constraints | Description                    |
| --------------- | --------- | ----------- | ------------------------------ |
| id              | uuid      | PK          | Primary key for clipboard item |
| user_id         | uuid      | FK          | Reference to user              |
| name            | text      |             | Item name                      |
| category        | text      |             | Item category                  |
| quantity        | text      |             | Item quantity                  |
| unit            | text      |             | Unit of measurement            |
| emoji           | text      |             | Emoji representing item        |
| expiration_date | date      |             | Expiration date                |
| added_date      | timestamp |             | When item was added            |
| updated_at      | timestamp |             | Last update timestamp          |

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
