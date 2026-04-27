const Show = require("../models/Show");

function mapShow(show) {
  return {
    id: show.showCode,
    artist: show.artist,
    venue: show.venue,
    date: show.date.toISOString().slice(0, 10),
    genre: show.genre,
    price: show.price
  };
}

async function listShows(_req, res) {
  const shows = await Show.find().sort({ date: 1 }).lean();
  return res.status(200).json(shows.map(mapShow));
}

async function getShowByCode(req, res) {
  const show = await Show.findOne({ showCode: req.params.id }).lean();
  if (!show) {
    return res.status(404).json({ message: "Concert not found." });
  }

  return res.status(200).json(mapShow(show));
}

module.exports = { listShows, getShowByCode };
