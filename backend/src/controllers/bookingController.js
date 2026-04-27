const Booking = require("../models/Booking");
const Show = require("../models/Show");

async function createBooking(req, res) {
  const showCode = String(req.body.showId || "");
  const ticketCount = Number(req.body.ticketCount);

  if (!showCode || !Number.isInteger(ticketCount) || ticketCount < 1 || ticketCount > 6) {
    return res.status(400).json({ message: "Valid showId and ticketCount (1-6) are required." });
  }

  const show = await Show.findOne({ showCode }).lean();
  if (!show) {
    return res.status(404).json({ message: "Concert not found." });
  }

  const booking = await Booking.create({
    userId: req.auth.userId,
    showId: show._id,
    ticketCount,
    totalPrice: show.price * ticketCount
  });

  return res.status(201).json({
    bookingId: booking._id,
    show: {
      id: show.showCode,
      artist: show.artist
    },
    ticketCount: booking.ticketCount,
    totalPrice: booking.totalPrice
  });
}

module.exports = { createBooking };
