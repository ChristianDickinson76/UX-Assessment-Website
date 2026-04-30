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

async function deleteBooking(req, res) {
  const booking = await Booking.findOneAndDelete({
    _id: req.params.id,
    userId: req.auth.userId
  }).lean();

  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  return res.status(200).json({
    message: "Booking refunded.",
    bookingId: booking._id
  });
}

function mapBooking(booking) {
  const show = booking.showId;

  if (!show) {
    return null;
  }

  return {
    id: booking._id,
    ticketCount: booking.ticketCount,
    totalPrice: booking.totalPrice,
    bookedAt: booking.createdAt,
    show: {
      id: show.showCode,
      artist: show.artist,
      venue: show.venue,
      date: show.date.toISOString().slice(0, 10),
      category: show.category || show.genre,
      genre: show.genre,
      price: show.price
    }
  };
}

async function listMyBookings(req, res) {
  const bookings = await Booking.find({ userId: req.auth.userId })
    .sort({ createdAt: -1 })
    .populate("showId")
    .lean();

  return res.status(200).json(bookings.map(mapBooking).filter(Boolean));
}

module.exports = { createBooking, deleteBooking, listMyBookings };
