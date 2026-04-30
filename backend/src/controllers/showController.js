const Show = require("../models/Show");

function mapShow(show) {
  return {
    id: show.showCode,
    artist: show.artist,
    venue: show.venue,
    date: show.date.toISOString().slice(0, 10),
    genre: show.genre,
    category: show.category || show.genre,
    price: show.price
  };
}

async function listShows(_req, res) {
  const { category, date } = _req.query;
  const filter = {};

  if (category && category !== "all") {
    filter.category = category;
  }

  if (date) {
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    filter.date = {
      $gte: startDate,
      $lt: endDate
    };
  }

  const shows = await Show.find(filter).sort({ date: 1 }).lean();
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
