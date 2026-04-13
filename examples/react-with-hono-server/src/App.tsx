import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { api, apiConfig } from "./utils/api";

interface User {
  id: number;
  name: string;
  email: string;
}

function App() {
  const [count, setCount] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("api/users");
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + FastEdge</h1>

      {/* Environment Info */}
      <div className="card">
        <h3>Environment Info</h3>
        <p>Mode: {apiConfig.isDevelopment ? "Development" : "Production"}</p>
        <p>API Base URL: {apiConfig.baseUrl || "Same domain"}</p>
      </div>

      {/* Counter Demo */}
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

      {/* API Demo */}
      <div className="card">
        <h3>API Demo</h3>
        <div style={{ marginBottom: "1rem" }}>
          <button onClick={fetchUsers} disabled={loading}>
            {loading ? "Loading..." : "Fetch Users"}
          </button>
        </div>

        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {users.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h4>Users:</h4>
            <ul style={{ textAlign: "left" }}>
              {users.map((user) => (
                <li key={user.id}>
                  {user.name} ({user.email})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <p className="read-the-docs">Powered by FastEdge</p>
    </>
  );
}

export default App;
