import dotenv from "dotenv";
dotenv.config();

import App from "./utils/app";
import UserController from "./routes/Controller/user";

const app = new App([new UserController()]);
const PORT = process.env.PORT || 3001;

app.app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
