import dotenv from "dotenv";
dotenv.config();

import App from "./utils/app";
import UserController from "./routes/Controller/user";

const app = new App([new UserController()]);
const PORT = process.env.PORT || 3001;

app.app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

const server = app.app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Test route: http://localhost:${PORT}/api/test`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
  });
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});
