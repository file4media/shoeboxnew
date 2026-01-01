import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./context";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== "production";

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Auto-migrate database on startup
import("./autoMigrate").then(({ autoMigrate }) => {
  autoMigrate().catch(console.error);
});

// tRPC API endpoint
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Tracking pixel endpoint
app.get("/api/track/:token", async (req, res) => {
  try {
    const { recordEmailOpen } = await import("./db");
    await recordEmailOpen(req.params.token);
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": pixel.length,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    res.end(pixel);
  } catch (error) {
    console.error("Tracking pixel error:", error);
    res.status(500).end();
  }
});

// Start server
async function startServer() {
  // Development: Integrate Vite middleware
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
    
    console.log("[Server] Vite dev server integrated");
  }

  // Production: Serve static files
  if (!isDev) {
    const distPath = path.join(process.cwd(), "dist", "public");
    console.log("[Server] Serving static files from:", distPath);
    app.use(express.static(distPath));
    
    // Serve index.html for all other routes (SPA)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start listening
  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`[Server] tRPC endpoint: http://localhost:${PORT}/api/trpc`);
  });
}

startServer().catch(console.error);
