import express from "express";
import { config } from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

config({
  path: "./config/config.env",
});

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use("/", (req, res) => {
  res.status(200).send("Working Fine");
});

//importing routes
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseroutes.js";

//using routes
app.use("/api/v1", userRoutes);
app.use("/api/v1", courseRoutes);

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./frontend/build/index.html"));
});

export default app;
