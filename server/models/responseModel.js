const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  userID: { type: String, required: true },
  eventID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  questionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  answerCorrect: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Response", responseSchema);
