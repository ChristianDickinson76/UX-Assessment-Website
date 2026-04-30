const express = require("express");
const { createBooking, listMyBookings } = require("../controllers/bookingController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.get("/me", requireAuth, listMyBookings);
router.post("/", requireAuth, createBooking);

module.exports = router;
