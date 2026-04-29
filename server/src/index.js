import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { verifyDatabaseConnection } from "./config/db.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { pasienRoutes } from "./routes/pasienRoutes.js";
import { rawatInapRoutes } from "./routes/rawatInapRoutes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: clientOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API Sistem Rawat Inap aktif." });
});

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pasien", pasienRoutes);
app.use("/api/rawat-inap", rawatInapRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan." });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan server. Periksa koneksi database dan coba lagi."
  });
});

verifyDatabaseConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`API berjalan di http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Gagal terhubung ke MySQL.");
    console.error(error.message);
    process.exit(1);
  });
