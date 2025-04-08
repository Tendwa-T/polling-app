const mongoose = require("mongoose");

/**
 * TODO: V2 implementation
 * 1. Adjust the question schema with the following fields:
 *   - order: number
 *   - active: boolean
 *   - timer: Object ({enabled: boolean, duration:number})
 *   - result: Object ({participantCount:number, voteCount:number})
 *   - maxSelectableOptions: number
 */

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
