import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import router from "./routes/index.js";

const app = express();

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
  }),
);
app.use(express.json());

app.use(router);

app.use(errorHandler);

export default app;
