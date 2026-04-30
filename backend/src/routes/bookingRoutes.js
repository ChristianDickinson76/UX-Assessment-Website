const express = require("express");
const { createBooking, deleteBooking, listMyBookings } = require("../controllers/bookingController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.get("/me", requireAuth, listMyBookings);
router.delete("/:id", requireAuth, deleteBooking);
router.post("/", requireAuth, createBooking);

module.exports = router;
