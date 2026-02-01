import express, { Application } from "express";
import cors from "cors";

class App {
  public app: Application;

  constructor(controllers: any[]) {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
  }

  private initializeMiddlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    // Cloud storage is used for uploads, so local static serving is no longer needed
    // this.app.use("/uploads", express.static("uploads"));
  }

  private initializeControllers(controllers: any[]) {
    controllers.forEach((controller) => {
      // Mount under both paths so clients can call either:
      // - /api/... (preferred)
      // - /...     (useful for serverless platforms that strip prefixes)
      this.app.use("/api", controller.router);
      this.app.use("/", controller.router);
    });
  }

  public listen() {
    return this.app;
  }
}

export default App;
