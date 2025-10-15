import express from "express";
import chalk from "chalk";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import cookieSession from "cookie-session";

import dotenv from "dotenv";
import path from "path";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// routers =======
import userRouter from './routes/user-route.js'
import withdrawalRouter from './routes/withdrawal-route.js'
import feedbackRouter from './routes/feedback-route.js'
import platformRouter from './routes/platform-routes.js'
import testRouter from './routes/test-route.js'





dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;



const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

app.use("/public", express.static(path.join(__dirname, "public")));

app.use(
    cookieSession({
      name: "session",
      keys: ["key1", "key2"],
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );
  
app.use(morgan("dev"));

const allowedOrigins = [
    "https://www.uracca.com",
    "https://www.admin.uracca.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3005",
  ];
  
  // app.use(
  //   cors({
  //     origin: "http://localhost:3005",
  //     credentials: true,
  //   })
  // );
  
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: "GET,POST,PUT,DELETE,PATCH",
      credentials: true,
    })
  );
  

  app.use(errorHandler);

  app.use('/api/user',userRouter)
  app.use('/api/admin/withdrawal',withdrawalRouter)
  app.use('/api/admin/feedbacks',feedbackRouter)
  app.use('/api/admin/platform',platformRouter)
  app.use('/test/order',testRouter)





app.listen(PORT, () => {
  console.log(chalk.cyan(`Server is running on port ${PORT}`));
});

connectDB();