const express = require("express");
const {
  getEventResults,
  getTopScorer,
} = require("../controllers/resultController");

const router = express.Router();

router.get("/:eventID", getEventResults);
router.get("/top/:eventID", getTopScorer);

module.exports = router;
