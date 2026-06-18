import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { errorHandler } from "./errors.js";
import { authRouter } from "./routes.auth.js";
import { categoriesRouter } from "./routes.categories.js";
import { transactionsRouter } from "./routes.transactions.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/transactions", transactionsRouter);
  app.use(errorHandler);

  return app;
}
