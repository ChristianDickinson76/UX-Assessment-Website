const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing authorization token." });
  }

  if (!env.jwtSecret) {
    return res.status(500).json({ message: "Server auth configuration is missing." });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();

    if (!user) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    req.auth = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = requireAuth;
