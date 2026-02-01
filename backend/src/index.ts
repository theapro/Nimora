import dotenv from "dotenv";
dotenv.config();

import App from "./utils/app";
import UserController from "./routes/Controller/user";
import PostController from "./routes/Controller/post";
import CommunityController from "./routes/Controller/community";
import AiController from "./routes/Controller/ai";
import AdminController from "./routes/Controller/admin";

const app = new App([
  new UserController(),
  new PostController(),
  new CommunityController(),
  new AiController(),
  new AdminController(),
]);
const PORT = process.env.PORT || 3001;

// Basic health check
app.app.get("/", (req, res) => {
  res.send("✅ Nimora Backend running successfully on Vercel!");
});

app.app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Same test route without /api prefix (for platforms that strip it)
app.app.get("/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

let server: any;
if (process.env.NODE_ENV !== "production") {
  server = app.app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Test route: http://localhost:${PORT}/api/test`);
  });
}

export default app.app;

process.on("SIGTERM", () => {
  if (server) {
    server.close(() => {
      console.log("Server closed");
    });
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});
