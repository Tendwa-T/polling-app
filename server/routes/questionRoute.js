const express = require("express");
const questionController = require("../controllers/questionController");
const router = express.Router();

router.post("/create", questionController.createQuestion);
router.get("/:eventID", questionController.getQuestions);

module.exports = router;
