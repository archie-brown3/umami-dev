<img src="assets/images/header.png" alt="Fullstack Recipe App — React Native, Node.js, Supabase" width="100%">

A fullstack mobile recipe management platform — React Native (Expo) frontend with a Node.js/Express REST API, Supabase PostgreSQL, and DeepSeek AI for recipe extraction and nutrition analysis.

## Architecture

```
+--------------------+       +---------------------------+       +------------------+
|  React Native App  | ----> |  Node.js/Express REST API | ----> |  Supabase (PG)   |
|  (Expo Router)     |       |  (JWT Auth + Joi)         |       |  Auth + Storage  |
+--------------------+       +---------------------------+       +------------------+
        |                                  |
        | camera OCR                      | AI prompts
        v                                  v
+--------------------+           +------------------+
|  On-device ML Kit  |           |  DeepSeek API    |
|  text recognition  |           |  recipe analysis |
+--------------------+           +------------------+
```

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native 0.79, Expo SDK 53, TypeScript |
| Navigation | Expo Router (file-based, 21 routes) |
| State management | React Context (Auth, Recipe, MealPlan, Groceries, Subscription) |
| UI | Custom components (50+), shadcn/ui-inspired design system |
| Backend | Node.js 18+, Express |
| Auth | Supabase Auth (JWT + Apple Sign In) |
| Database | Supabase (PostgreSQL) — 8 tables |
| AI | DeepSeek API (recipe extraction, nutrition analysis) |
| Validation | Joi (API), TypeScript (frontend) |
| Infrastructure | Docker, docker-compose |
| Security | Helmet, CORS, rate limiting, JWT verification |

## Project Structure

```
umami-dev/
├── app/                   Expo Router routes (21 screens)
│   ├── (auth)/            Login, register, forgot password
│   ├── (tabs)/            Home, recipes, add, meal plan, groceries
│   ├── recipe/            Recipe detail, create, edit
│   └── cooking/           Step-by-step cooking mode
├── src/
│   ├── components/        50+ React components
│   │   ├── recipes/       RecipeCard, RecipeList, IngredientInput, TagEditor
│   │   ├── groceries/     ShoppingListScreen, CupboardScreen, item cards
│   │   ├── meal-plan/     WeeklyCalendar, MealSlot, RecipePicker
│   │   ├── recipe/edit/   ImageEditSection, IngredientsCard, InstructionsCard
│   │   ├── ui/            Button, Card, Input, Badge, Toast, Avatar
│   │   └── ...
│   ├── services/          API clients, extractors, migrations
│   ├── context/           React Context providers
│   ├── hooks/             Custom hooks
│   ├── lib/               Supabase client, auth, revenuecat
│   └── utils/             Image processing, validation, scaling
├── backend/               Node.js/Express REST API
│   └── src/
│       ├── routes/        Express route definitions
│       ├── controllers/   Request handlers
│       ├── services/      Business logic + DeepSeek AI
│       ├── middleware/     Auth (JWT) + validation (Joi)
│       └── config/        Supabase client setup
├── .github/workflows/     CI for frontend and backend
└── assets/images/         App icons, header image
```

## Features

### Mobile App (React Native)

- Recipe CRUD with ingredient parsing, step-by-step instructions
- Meal planning with weekly calendar and drag-to-assign
- Shopping lists and cupboard/pantry tracking
- Camera-based recipe capture (ML Kit OCR)
- Nutrition analysis per recipe (DeepSeek AI)
- Recipe scaling by servings
- Tag-based categorization and search
- Supabase authentication (email/password + Apple Sign In)
- RevenueCat subscription management
- Offline-aware with network status detection

### REST API (Backend)

- JWT token verification against Supabase
- Full recipe CRUD with pagination, search, and tag filtering
- Structured AI recipe extraction from text (DeepSeek)
- URL-based recipe scraping via external extraction service
- Request validation (Joi schemas)
- Rate limiting (100 req/15min per IP)
- CORS with configurable origins
- Health check endpoints
- Docker multi-stage production build

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Server health check |
| GET | `/api/auth/health` | No | Auth service health |
| POST | `/api/auth/verify` | No | Verify JWT token |
| GET | `/api/auth/profile` | Yes | Get user profile |
| GET | `/api/recipes` | Yes | List recipes (paginated, searchable) |
| GET | `/api/recipes/:id` | Yes | Get single recipe |
| POST | `/api/recipes` | Yes | Create recipe |
| PUT | `/api/recipes/:id` | Yes | Update recipe |
| DELETE | `/api/recipes/:id` | Yes | Delete recipe |
| POST | `/api/recipes/:id/favorite` | Yes | Toggle favorite |
| POST | `/api/recipes/extract-url` | Yes | Extract recipe from URL |
| POST | `/api/recipes/analyze-text` | Yes | AI recipe text analysis |

All authenticated endpoints require: `Authorization: Bearer <supabase_jwt>`
Response format: `{ "success": true, "data": {...} }` or `{ "success": false, "error": "..." }`

## Database Schema

```
recipes
  id (uuid PK), user_id (FK auth.users), title, description, image_url,
  prep_time, cook_time, servings, difficulty, source_url, is_favorite, is_public

recipe_ingredients          ingredients
  recipe_id (FK recipes) ──>  id (uuid PK), name, category
  ingredient_id (FK)
  quantity, unit

recipe_steps                tags ──< recipe_tags >── recipes
  recipe_id (FK recipes)         id (uuid PK), name
  step_number, instruction

Supporting: meal_plans, meal_plan_recipes, shopping_lists, shopping_list_items
```

## Quickstart

### Frontend

```bash
npm install
npx expo start        # scan QR code with Expo Go
```

### Backend

```bash
cd backend
npm install
cp env.example .env   # add SUPABASE_URL, SUPABASE_ANON_KEY, DEEPSEEK_API_KEY
npm run dev            # http://localhost:3000
```

### Docker (backend only)

```bash
cd backend
docker-compose up --build
```

## Design Decisions

**Monorepo structure.** Frontend, backend, and database schema live in one repository so a reviewer can see the full system — client code, API, data model, and infrastructure — in a single view.

**Expo Router over React Navigation.** File-based routing maps directory structure to navigation, reducing boilerplate and making the screen hierarchy self-documenting.

**React Context over Redux.** With five bounded state domains (auth, recipes, meal plans, groceries, subscriptions), context providers with custom hooks are simpler and require less ceremony than a global store.

**Supabase over custom auth.** Managed auth (JWT, social login, row-level security) and PostgreSQL eliminates two infrastructure concerns while keeping the database relational.

**JWT passthrough in the API.** The backend verifies Supabase-issued tokens rather than issuing its own — the API trusts the same auth provider the frontend uses, avoiding a separate auth system.

**AI as a service dependency.** Recipe extraction via DeepSeek is a call-out, not core logic. The service layer wraps it with caching and timeout handling so the API remains responsive if the AI endpoint is slow.

## Known Limitations

- No end-to-end test suite (backend integration tests in progress)
- Recipe extraction from URLs relies on an external scraping service
- iOS build pipeline requires an Apple Developer account for TestFlight/App Store
- Real-time sync is polling-based via Supabase (no WebSocket support)
