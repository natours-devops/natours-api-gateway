const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3001";

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  { method: "POST", path: /^\/api\/v1\/users\/signup$/ },
  { method: "POST", path: /^\/api\/v1\/users\/login$/ },
  { method: "GET", path: /^\/api\/v1\/users\/logout$/ },
  { method: "POST", path: /^\/api\/v1\/users\/forgotPassword$/ },
  { method: "PATCH", path: /^\/api\/v1\/users\/resetPassword\// },
  { method: "GET", path: /^\/api\/v1\/tours/ },
];

const isPublic = (req) =>
  PUBLIC_ROUTES.some((r) => r.method === req.method && r.path.test(req.path));

module.exports = async (req, res, next) => {
  if (isPublic(req)) return next();

  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({
      status: "failed",
      message: "You are not logged in! Please log in.",
    });
  }

  try {
    // Verify JWT locally (fast path — avoids a network call for every request)
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Inject user context as headers for downstream services
    req.headers["x-user-id"] = decoded.id;

    // Fetch full user role from Auth Service (needed for restrictTo checks)
    const { data } = await axios.post(
      `${AUTH_SERVICE_URL}/api/v1/users/verify-token`,
      { token },
      { timeout: 3000 },
    );

    req.headers["x-user-id"] = data.data.id;
    req.headers["x-user-role"] = data.data.role;

    next();
  } catch (err) {
    return res.status(401).json({
      status: "failed",
      message: "Invalid or expired token. Please log in again.",
    });
  }
};
