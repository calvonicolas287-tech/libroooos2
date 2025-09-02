import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import booksRoutes from "./routes/books.js";
import cartRoutes from "./routes/cart.js";
import ordersRoutes from "./routes/orders.js";
import paymentsRoutes from "./routes/payments.js";
import initDB from "./dbInit.js";

dotenv.config();
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("tiny"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);

// health
app.get("/health", (_req, res) => res.json({ ok: true }));

// static
app.use(express.static(path.join(__dirname, "..", "public")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

const port = process.env.PORT || 3000;

// init DB once at boot
initDB().then(() => {
  app.listen(port, () => {
    console.log("Server listening on", port);
  });
}).catch((e) => {
  console.error("DB init failed:", e);
  // Still start the server; tables may exist already
  app.listen(port, () => {
    console.log("Server listening (with DB init error) on", port);
  });
});
