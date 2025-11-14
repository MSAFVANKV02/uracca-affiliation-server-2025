import express from "express";
import chalk from "chalk";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import cookieSession from "cookie-session";

import "./utils/loadEnv.js";


import dotenv from "dotenv";
import path from "path";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// routers =======
import userRouter from "./routes/user-route.js";
import withdrawalRouter from "./routes/withdrawal-route.js";
import feedbackRouter from "./routes/feedback-route.js";
import platformRouter from "./routes/platform-routes.js";
import testRouter from "./routes/test-route.js";
import productRouter from "./routes/product-route.js";
import campaignRouter from "./routes/campaign-route.js";
import affiliateRouter from "./routes/affiliate-route.js";
import walletRouter from "./routes/wallet-route.js";
import bulkRouter from "./routes/bulk-route.js";

// === web hook ====== //
import WebHookRouter from "./routes/web-hook-route.js";

// import { createLimiter } from "./middleware/rateLimit.js";
import { rateLimitConfig } from "./config/rateLimitConfig.js";
import { makeLimiter } from "./middleware/rateLimiter.js";





import "./cron/commissionPayoutJob.js";

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
  "http://localhost:3002",
  "http://localhost:3005",
  "http://192.168.31.146:3000",
  "http://localhost:5001"

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



// ------- admins apis ----------- ////

// Sort routes so deeper paths apply first
rateLimitConfig
  .sort((a, b) => b.route.length - a.route.length)
  .forEach((item) => {
    if (item.noLimit) {
      console.log("No limit applied for", item.route);
      return;
    }

    const limiter = makeLimiter(item.window, item.max);

    console.log(
      `Rate limit applied → ${item.route} | ${item.max} req / ${item.window}`
    );

    app.use(item.route, limiter);
  });


app.get("/", (req, res) => res.send("success"));


// Dynamically apply rate limits for each route
// rateLimitConfig.forEach((item) => {
//   if (item.noLimit) {
//     // no limit, skip applying limiter
//     console.log("No limit applied for", item.route);
//     return;
//   }

//   const limiter = makeLimiter(item.window, item.max);

//   console.log(
//     `Rate limit applied → ${item.route} | ${item.max} req / ${item.window}`
//   );

//   app.use(item.route, limiter);
// });



app.use("/api/user", userRouter);
app.use("/api/admin/withdrawal", withdrawalRouter);
app.use("/api/admin/feedbacks", feedbackRouter);
app.use("/api/admin/platform", platformRouter);
app.use("/api/admin/products", productRouter);
app.use("/test/order", testRouter);

app.use("/api/admin/bulk-details", bulkRouter);


// ------- users apis ----------- ////
app.use("/api/users/products", productRouter);
app.use("/api/users/campaign", campaignRouter);

// ------- affiliate apis ----------- ////
app.use("/api/affiliate", affiliateRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/user/withdrawal", withdrawalRouter);

// ------- webhook apis ----------- ////

app.use("/api/web-hook", WebHookRouter);


app.use(errorHandler);

app.listen(PORT, "0.0.0.0",() => {
  console.log(chalk.cyan(`Server is running on port ${PORT}`));
});

connectDB();
