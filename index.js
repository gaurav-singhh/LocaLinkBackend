import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";
import userRouter from "./routes/user.routes.js";

import itemRouter from "./routes/item.routes.js";
import shopRouter from "./routes/shop.routes.js";
import orderRouter from "./routes/order.routes.js";
import http from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socket.js";

const app = express();
const server = http.createServer(app);

// Handle allowed origins based on environment
const getAllowedOrigins = () => {
  const origins =
    process.env.CLIENT_ORIGINS?.split(",").map((origin) => origin.trim()) || [];

  if (process.env.NODE_ENV === "development") {
    origins.push(process.env.DEVELOPMENT_CLIENT_URL || "http://localhost:5173");
  }

  if (process.env.NODE_ENV === "production") {
    origins.push(process.env.PRODUCTION_CLIENT_URL);
  }

  return [...new Set(origins)].filter(Boolean);
};

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  connectTimeout: 60000,
});

app.set("io", io);

const port = process.env.PORT || 5000;
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

socketHandler(io);
server.listen(port, "0.0.0.0", () => {
  connectDb();
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});
