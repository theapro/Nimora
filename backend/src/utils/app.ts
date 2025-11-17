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
  }

  private initializeControllers(controllers: any[]) {
    controllers.forEach((controller) => {
      this.app.use("/api", controller.router);
    });
  }

  public listen() {
    return this.app;
  }
}

export default App;
