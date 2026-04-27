const express = require("express");
const { createBooking } = require("../controllers/bookingController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, createBooking);

module.exports = router;
