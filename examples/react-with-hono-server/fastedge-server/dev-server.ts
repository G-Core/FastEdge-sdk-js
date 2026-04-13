import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { api } from './api/routes.js';

const app = new Hono();

// Enable CORS for development
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Mount API routes
app.route('/api', api);

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'API Development Server',
    version: '1.0.0',
    endpoints: {
      api: '/api/*',
      health: '/health',
    },
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const port = Number(process.env.PORT) || 3001;

console.log(`🚀 API Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
