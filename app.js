const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authMiddleware = require("./middleware/auth");
const proxy = require("./middleware/proxy");

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use(
  rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again in an hour",
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// JWT validation — injects x-user-id and x-user-role headers
app.use(authMiddleware);

// Route traffic to microservices
const AUTH_URL = process.env.AUTH_SERVICE_URL
const TOUR_URL = process.env.TOUR_SERVICE_URL 
const REVIEW_URL = process.env.REVIEW_SERVICE_URL
const BOOKING_URL = process.env.BOOKING_SERVICE_URL

app.use("/api/v1/users", proxy(AUTH_URL));
app.use("/api/v1/tours", proxy(TOUR_URL));
app.use("/api/v1/reviews", proxy(REVIEW_URL));
app.use("/api/v1/bookings", proxy(BOOKING_URL));

app.all("*", (req, res) =>
  res
    .status(404)
    .json({
      status: "failed",
      message: `Can't find ${req.originalUrl} on this server`,
    }),
);

module.exports = app;
