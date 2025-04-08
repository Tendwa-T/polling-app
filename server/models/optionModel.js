const mongoose = require("mongoose");

// TODO: V2 implementation

const optionsSchema = new mongoose.Schema({
  questionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  voteCount: {
    type: Number,
    default: 0,
  },
  votesPercentage: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Options", optionsSchema);
