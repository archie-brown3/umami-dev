# Recipe Backend API

A Node.js/Express backend API for the Recipe App, supporting the React Native (Expo) mobile frontend.

## Features

- **Authentication**: Supabase JWT token validation
- **Recipe Management**: Full CRUD operations for recipes
- **AI Integration**: Recipe extraction and analysis using DeepSeek AI
- **Web Scraping**: Extract recipes from URLs and Instagram posts
- **Flexible Deployment**: Docker support for multiple platforms
- **Security**: Rate limiting, CORS, input validation
- **Monitoring**: Health checks and logging

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with JWT
- **AI Service**: DeepSeek API
- **Containerization**: Docker
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### 1. Environment Setup

Copy the environment template:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# External APIs
DEEPSEEK_API_KEY=your-deepseek-api-key
RECIPE_EXTRACTION_SERVICE_URL=https://recipeextractionservice.onrender.com

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,https://your-flutter-app.com
```

### 2. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The API will be available at http://localhost:3000
```

### 3. Docker Development

```bash
# Build and start with Docker Compose
docker-compose up --build

# API available at http://localhost:3000
```

## API Endpoints

### Authentication

- `GET /api/auth/health` - Health check
- `POST /api/auth/verify` - Verify JWT token
- `GET /api/auth/profile` - Get user profile (authenticated)

### Recipes

- `GET /api/recipes` - Get user's recipes (with pagination)
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `POST /api/recipes/:id/favorite` - Toggle favorite status
- `POST /api/recipes/extract-url` - Extract recipe from URL
- `POST /api/recipes/analyze-text` - Analyze recipe text with AI

### System

- `GET /health` - System health check
- `GET /` - API information

## Request/Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

## Authentication

All recipe endpoints require authentication using Supabase JWT tokens:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/recipes
```

## Deployment

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/recipe-backend

# Deploy
gcloud run deploy recipe-backend \
  --image gcr.io/PROJECT_ID/recipe-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Docker Production

```bash
# Build production image
docker build -t recipe-backend:latest .

# Run with environment variables
docker run -p 3000:3000 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_ANON_KEY=your-key \
  recipe-backend:latest
```

## Development

### Project Structure

```
src/
├── config/          # Configuration files
│   └── supabase.js  # Supabase client setup
├── controllers/     # Request handlers
│   ├── authController.js
│   └── recipeController.js
├── middleware/      # Express middleware
│   ├── auth.js      # Authentication middleware
│   └── validation.js # Request validation
├── routes/          # Route definitions
│   ├── auth.js
│   └── recipes.js
├── services/        # Business logic
│   ├── deepseekService.js
│   └── recipeService.js
└── app.js          # Main application
```

### Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

#### Core Tables

**recipes**

- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `title` (text)
- `description` (text)
- `image_url` (text)
- `prep_time` (integer)
- `cook_time` (integer)
- `servings` (integer)
- `difficulty` (text)
- `source_url` (text)
- `is_favorite` (boolean)
- `is_public` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**recipe_ingredients**

- `id` (uuid, PK)
- `recipe_id` (uuid, FK to recipes)
- `ingredient_id` (uuid, FK to ingredients)
- `quantity` (text)
- `unit` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**recipe_steps**

- `id` (uuid, PK)
- `recipe_id` (uuid, FK to recipes)
- `step_number` (integer)
- `instruction` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**recipe_tags**

- `id` (uuid, PK)
- `recipe_id` (uuid, FK to recipes)
- `tag_id` (uuid, FK to tags)
- `created_at` (timestamp)

**ingredients**

- `id` (uuid, PK)
- `name` (text)
- `category` (text)
- `created_at` (timestamp)

**tags**

- `id` (uuid, PK)
- `name` (text)
- `created_at` (timestamp)

#### Supporting Tables

- `meal_plans` - User meal planning
- `meal_plan_recipes` - Recipes in meal plans
- `shopping_lists` - User shopping lists
- `shopping_list_items` - Items in shopping lists

### Adding New Endpoints

1. Create controller function in `controllers/`
2. Add route in `routes/`
3. Add validation schema in `middleware/validation.js`
4. Update this README

### Environment Variables

| Variable                        | Description                            | Required           |
| ------------------------------- | -------------------------------------- | ------------------ |
| `NODE_ENV`                      | Environment (development/production)   | No                 |
| `PORT`                          | Server port                            | No (default: 3000) |
| `SUPABASE_URL`                  | Supabase project URL                   | Yes                |
| `SUPABASE_ANON_KEY`             | Supabase anonymous key                 | Yes                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key              | No                 |
| `DEEPSEEK_API_KEY`              | DeepSeek AI API key                    | Yes                |
| `RECIPE_EXTRACTION_SERVICE_URL` | Recipe extraction service URL          | No                 |
| `CORS_ORIGIN`                   | Allowed CORS origins (comma-separated) | No                 |
| `RATE_LIMIT_WINDOW_MS`          | Rate limit window in ms                | No                 |
| `RATE_LIMIT_MAX_REQUESTS`       | Max requests per window                | No                 |

## Monitoring

### Health Checks

- `GET /health` - Basic health check
- `GET /api/auth/health` - Authentication service health

### Logging

- Request logging with Morgan
- Service-specific logging in development
- Error logging to console

### Development Endpoints

- `GET /api/recipes/logs` - View service logs (dev only)
- `POST /api/recipes/clear-cache` - Clear AI cache (dev only)

## Security

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable origin restrictions
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **Authentication**: JWT token verification
- **Error Handling**: No sensitive data in error responses

## License

MIT License - see LICENSE file for details
