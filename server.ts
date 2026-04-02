import express from "express";
import cors from "cors";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  console.log("Starting server...");
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy API route
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    console.log(`Proxy request for: ${targetUrl}`);
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    try {
      // Forward headers from the request
      const headers: Record<string, string> = {};
      if (req.headers['x-api-key']) {
        headers['x-api-key'] = req.headers['x-api-key'] as string;
      }
      
      const response = await axios.get(targetUrl, { headers });
      res.json(response.data);
    } catch (error: any) {
      console.error(`Proxy error for ${targetUrl}:`, error.message);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      res.status(500).json({ error: "Failed to fetch from proxy", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
