const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["multiple_choice", "rearrange", "rating"],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  choices: [{ type: String }],
  correctAnswer: { type: String },
  correctOrder: [{ type: String }],
  maxRating: { type: Number },
});

module.exports = mongoose.model("Question", questionSchema);
