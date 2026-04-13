import { Hono } from "hono";

const api = new Hono();

// Example API routes
api.get("/hello", async (c) => {
  return c.json({ message: "Hello from API!" });
});

api.get("/users", async (c) => {
  // Mock data - replace with your actual data source
  const users = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
  ];
  return c.json(users);
});

api.post("/users", async (c) => {
  try {
    const body = await c.req.json();
    // Handle user creation logic here
    return c.json({ success: true, data: body }, 201);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
});

api.get("/status", async (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: "fastedge",
  });
});

export { api };
