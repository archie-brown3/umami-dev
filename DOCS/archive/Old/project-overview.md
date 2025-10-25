# Recipe Saver App - Project Overview

## 🍽️ What Is This App?

Recipe Saver is a cross-platform application that helps users discover, save, and organize their favorite recipes. It functions as a digital cookbook where you can store recipes you find online, add your own, and organize them into collections. The app works on both web and mobile platforms (iOS/Android).

## 🏗️ Architecture Overview

The app follows a modern cross-platform architecture:

- **Frontend**: React and React Native with Capacitor for mobile deployment
- **Backend**: Serverless architecture with Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with social login options

```
┌─────────────────────┐      ┌─────────────────────┐
│                     │      │                     │
│  React / React      │◄────►│  Supabase           │
│  Native + Capacitor │      │  (Auth, DB, Storage)│
│                     │      │                     │
└─────────────────────┘      └─────────────────────┘
```

## 🧩 Core Features

1. **User Authentication**

   - Sign up, login, and profile management
   - Social login options (Google, Apple)
   - Persistent authentication across devices

2. **Recipe Management**

   - Save recipes from the web
   - Create your own recipes
   - Edit and customize saved recipes
   - Offline access to saved recipes

3. **Organization**

   - Create collections/folders for recipes
   - Tag recipes for easy searching
   - Filter recipes by ingredients, cook time, etc.

4. **Sharing**

   - Share recipes with friends
   - Public/private recipe options

5. **Meal Planning**
   - Create weekly meal plans
   - Generate shopping lists
   - Nutritional information calculation

## 💾 Database Schema

Our database uses PostgreSQL through Supabase, which provides a structured relational database system.

### Users Table

```sql
profiles (
  id uuid references auth.users primary key,
  email text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
```

### Subscriptions Table

```sql
subscriptions (
  user_id uuid references profiles(id) primary key,
  tier text, -- 'free' or 'premium'
  extractions_remaining integer,
  valid_until timestamp with time zone
)
```

### Recipes Table

```sql
recipes (
  id uuid primary key,
  user_id uuid references profiles(id),
  title text,
  description text,
  image_url text,
  source_url text,
  prep_time integer,
  cook_time integer,
  servings integer,
  difficulty text,
  is_public boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
```

### Ingredients Table

```sql
ingredients (
  id uuid primary key,
  recipe_id uuid references recipes(id),
  name text,
  amount text,
  unit text,
  order integer
)
```

### Instructions Table

```sql
instructions (
  id uuid primary key,
  recipe_id uuid references recipes(id),
  step_text text,
  order integer
)
```

### Collections Table

```sql
collections (
  id uuid primary key,
  user_id uuid references profiles(id),
  name text,
  description text,
  created_at timestamp with time zone
)
```

### Collection Recipes Junction Table

```sql
collection_recipes (
  collection_id uuid references collections(id),
  recipe_id uuid references recipes(id),
  primary key (collection_id, recipe_id)
)
```

### Tags Table

```sql
tags (
  id uuid primary key,
  name text unique
)
```

### Recipe Tags Junction Table

```sql
recipe_tags (
  recipe_id uuid references recipes(id),
  tag_id uuid references tags(id),
  primary key (recipe_id, tag_id)
)
```

## 🔌 API Architecture

The app uses Supabase's RESTful and real-time APIs for data management:

### Authentication

- Supabase Auth provides built-in endpoints for registration, login, and session management
- PKCE authentication flow for mobile platforms
- Deep link handling for OAuth redirects

### Database Access

- Row-Level Security (RLS) policies control data access
- Real-time subscriptions for live updates
- PostgreSQL functions for complex operations

### Storage

- Supabase Storage for recipe images
- Local caching for offline access
- Capacitor Preferences API for mobile-specific storage

## 🔧 Tech Stack

### Frontend Frameworks

- **React**: UI library for web
- **React Native**: Mobile app development
- **Capacitor**: Native runtime for mobile
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Component library based on Radix UI
- **React Query**: Data fetching and state management

### Backend & Infrastructure

- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Storage
  - Realtime subscriptions
- **Row Level Security**: Database-level access control

### Mobile Specific

- **Capacitor**: Bridge to native mobile features
- **iOS WebKit**: iOS web rendering
- **Android WebView**: Android web rendering
- **Deep Linking**: Native app URL handling

### Development Tools

- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tooling
- **ESLint/Prettier**: Code quality and formatting
- **Vitest**: Testing framework

## 🌱 Platform Support

The app currently supports:

- **Web**: Modern browsers
- **iOS**: Native app via Capacitor
- **Android**: Coming soon

## 👩‍💻 Environment Variables

For development and deployment, the following environment variables are required:

```
# Supabase Connection
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# iOS Specific
VITE_SUPABASE_REDIRECT_URL=io.recipesaver://login
VITE_SUPABASE_REDIRECT_SCHEME=io.recipesaver
VITE_MOBILE_PLATFORM=ios

# API Keys for External Services
VITE_USDA_API_KEY=your-usda-api-key
VITE_SPOONACULAR_API_KEY=your-spoonacular-api-key
```

## 🚀 Getting Started for Developers

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables in `.env` file
4. For web development: `npm run dev`
5. For iOS development:
   ```
   npm run build
   npx cap sync ios
   npx cap open ios
   ```

## ✅ Future Enhancements

- Complete Android support
- Offline recipe extraction
- Enhanced recipe recommendations
- Integration with smart kitchen appliances
- Voice control for hands-free cooking
- AI-powered meal planning

## 🧠 What Is "Vibe Coding"?

"Vibe coding" is about focusing on creating a functional product without getting too caught up in perfect code or complex technical concepts. It's okay to:

- Learn as you go
- Focus on getting features working before making them perfect
- Use existing libraries rather than building everything from scratch
- Prioritize user experience over technical perfection

Remember: The best code is the code that works and solves a real problem!
