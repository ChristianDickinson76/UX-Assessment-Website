const Show = require("../models/Show");
const User = require("../models/User");

async function listFavouriteShows(req, res) {
  const user = await User.findById(req.auth.userId).lean();
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.status(200).json({ favoriteShowCodes: Array.isArray(user.favoriteShowCodes) ? user.favoriteShowCodes : [] });
}

async function toggleFavouriteShow(req, res) {
  const showCode = String(req.params.showId || "").trim();
  if (!showCode) {
    return res.status(400).json({ message: "A valid showId is required." });
  }

  const show = await Show.findOne({ showCode }).lean();
  if (!show) {
    return res.status(404).json({ message: "Concert not found." });
  }

  const user = await User.findById(req.auth.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (!Array.isArray(user.favoriteShowCodes)) {
    user.favoriteShowCodes = [];
  }

  const isFavourite = user.favoriteShowCodes.includes(showCode);

  if (isFavourite) {
    user.favoriteShowCodes = user.favoriteShowCodes.filter((code) => code !== showCode);
  } else {
    user.favoriteShowCodes.push(showCode);
  }

  await user.save();

  return res.status(200).json({
    showId: showCode,
    favourite: !isFavourite,
    favoriteShowCodes: user.favoriteShowCodes
  });
}

module.exports = { listFavouriteShows, toggleFavouriteShow };