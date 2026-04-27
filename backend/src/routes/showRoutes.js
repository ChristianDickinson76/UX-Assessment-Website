const express = require("express");
const { listShows, getShowByCode } = require("../controllers/showController");

const router = express.Router();

router.get("/", listShows);
router.get("/:id", getShowByCode);

module.exports = router;
