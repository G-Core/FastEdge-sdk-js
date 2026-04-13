# API Routes Setup

This project now has a clean separation between static site serving and API backend routes.

## Structure

```
fastedge-server/
├── server.tsx              # Main FastEdge server (production)
├── dev-server.ts           # Development API server
├── server.config.ts        # Static server configuration
└── api/
    └── routes.ts           # API route definitions
```

## Development

### Running the full stack in development:

```bash
npm run dev
```

This runs both:

- Frontend (Vite) on http://localhost:5173
- API server on http://localhost:3001

### Running individually:

```bash
# Frontend only
npm run dev:vite

# API server only
npm run dev:api
```

## API Endpoints

The API server provides the following endpoints:

- `GET /api/hello` - Simple hello message
- `GET /api/users` - Get list of users (mock data)
- `POST /api/users` - Create a new user
- `GET /api/status` - API status and environment info
- `GET /health` - Health check

### Example API calls:

```javascript
// Import the API utility
import { api } from "./utils/api";

// Fetch users
const users = await api.get("api/users");

// Create a user
const newUser = await api.post("api/users", {
  name: "John Doe",
  email: "john@example.com",
});

// Update a user
const updatedUser = await api.put("api/users/1", {
  name: "Jane Doe",
});

// Delete a user
await api.delete("api/users/1");
```

### Environment Configuration

The app automatically detects the environment and uses the correct API endpoint:

- **Development**: API calls are proxied through Vite dev server (same origin)
- **Production**: API calls go directly to `/api/*` on the same domain

Environment files:

- `.env.development` - Development settings
- `.env.production` - Production settings
- `.env` - Default fallback settings

## Production

In production (FastEdge WASM environment), both static files and API routes are served from the same server on the same domain, avoiding CORS issues.

The API routes will be available at:

- `https://yourdomain.com/api/*`

## Adding New API Routes

1. Edit `fastedge-server/api/routes.ts`
2. Add your new routes to the `api` Hono instance
3. The routes will automatically be available in both development and production

## Notes

- **Development**: Vite proxy forwards `/api/*` requests to the dev server on port 3001
- **Production**: API routes are served directly from the same WASM bundle
- CORS is enabled on the dev server for direct API access if needed
- The `api` utility automatically handles environment differences
- All API routes are prefixed with `/api/`
- Environment variables are automatically loaded by Vite based on the mode
