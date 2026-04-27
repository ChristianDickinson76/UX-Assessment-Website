const bcrypt = require("bcryptjs");
const User = require("../models/User");
const createToken = require("../utils/createToken");

async function signup(req, res) {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return res.status(409).json({ message: "An account already exists with this email." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  const token = createToken(user);

  return res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email }
  });
}

async function signin(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }

  const token = createToken(user);
  return res.status(200).json({
    token,
    user: { id: user._id, name: user.name, email: user.email }
  });
}

module.exports = { signup, signin };
