# API Environment Setup Summary

## What was set up:

### 1. Environment Variables

- `.env` - Default/fallback settings
- `.env.development` - Development mode settings
- `.env.production` - Production mode settings
- `src/vite-env.d.ts` - TypeScript declarations for env variables

### 2. API Utility (`src/utils/api.ts`)

- Automatically detects environment (dev vs prod)
- Provides convenient methods: `api.get()`, `api.post()`, `api.put()`, `api.delete()`
- Handles URL building for different environments
- TypeScript typed for better developer experience

### 3. Vite Proxy Configuration

- Development: Proxies `/api/*` requests to `localhost:3001`
- Production: Serves API routes from same domain

### 4. Updated React App

- Demo component showing how to use the API utility
- Environment info display
- API interaction examples

## How it works:

### Development Mode:

1. Run `npm run dev` to start both frontend and API server
2. Frontend runs on `http://localhost:5173`
3. API server runs on `http://localhost:3001`
4. Vite proxy forwards `/api/*` requests from frontend to API server
5. Your React code just calls `api.get('/api/users')` - no URL management needed

### Production Mode:

1. Build with `npm run build`
2. Both frontend and API are served from the same FastEdge WASM bundle
3. API routes available at `https://yourdomain.com/api/*`
4. Same React code works without changes

## Usage in React Components:

```tsx
import { api } from "../utils/api";

// In your component
const fetchData = async () => {
  try {
    const users = await api.get("api/users");
    setUsers(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
  }
};

const createUser = async (userData) => {
  try {
    const newUser = await api.post("api/users", userData);
    return newUser;
  } catch (error) {
    console.error("Failed to create user:", error);
  }
};
```

## Benefits:

✅ **No hardcoded URLs** - Environment automatically detected
✅ **Same code works in dev and prod** - No environment-specific changes needed
✅ **Type safety** - TypeScript support throughout
✅ **Easy to use** - Simple API methods instead of manual fetch calls
✅ **Proxy in dev** - No CORS issues during development
✅ **Clean separation** - API routes separate from static serving logic

## Commands:

```bash
# Run frontend only
npm run dev:vite

# Run API server only
npm run dev:api

# Run both frontend and API
npm run dev

# Build for production
npm run build
```
