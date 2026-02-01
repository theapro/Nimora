import app from "../src/index";

// Vercel Serverless Function catch-all.
// This makes the Express app available at /api/* without relying on custom rewrites.
export default app;
