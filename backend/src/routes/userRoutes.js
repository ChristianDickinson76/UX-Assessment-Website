const express = require("express");
const requireAuth = require("../middleware/auth");
const { listFavouriteShows, toggleFavouriteShow } = require("../controllers/userController");

const router = express.Router();

router.get("/me/favourites", requireAuth, listFavouriteShows);
router.post("/me/favourites/:showId", requireAuth, toggleFavouriteShow);

module.exports = router;