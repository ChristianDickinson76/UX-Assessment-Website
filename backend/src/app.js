const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const showRoutes = require("./routes/showRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

function isLocalDevOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch (_error) {
    return false;
  }
}

function isAllowedCorsOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (env.corsOrigin === "*") {
    return true;
  }

  const allowedOrigins = String(env.corsOrigin)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (isLocalDevOrigin(origin)) {
    return allowedOrigins.some((entry) => isLocalDevOrigin(entry));
  }

  return false;
}

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedCorsOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

module.exports = app;
