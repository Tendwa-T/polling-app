const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const Counter = require("./counter");
const { redisPub } = require("../config/redis");
/**
 * TODO: V2 Implementation
 * 1. Adjust the event schema with the following fields:
 *    - name -> Title : string
 *    - isQuiz : boolean
 *    - eventCode : string
 */

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  eventCode: {
    type: String,
    required: true,
  },
  adminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: { type: String },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
  ],
  activeQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
  },
  isLastQuestion: { type: Boolean, default: false },
  participants: [
    {
      userID: { type: String, required: true },
      userName: { type: String, required: true },
    },
  ],
  status: {
    type: String,
    enum: ["pending", "live", "completed"],
    default: "pending",
  },
});

/**
 * Event Schema V2
 *
 * This schema defines the structure for an event in the polling application.
 * It includes details about the event, its questions, and associated options.
 *
 * @typedef {Object} EventSchemaV2
 * @property {UUID} uuid - Unique identifier for the event.
 * @property {UUID} eventUuid - Secondary unique identifier for the event.
 * @property {string} eventCode - Unique code for the event.
 * @property {string} title - Title of the event.
 * @property {boolean} isQuiz - Indicates if the event is a quiz.
 * @property {boolean} active - Indicates if the event is currently active.
 * @property {boolean} votingLocked - Indicates if voting is locked for the event.
 * @property {boolean} showResults - Indicates if results should be displayed.
 * @property {number} order - Order of the event (must be unique).
 * @property {Array<Question>} questions - List of questions associated with the event.
 * @property {Object} results - Aggregated results for the event.
 * @property {number} results.participantCount - Total number of participants in the event.
 *
 * @typedef {Object} Question
 * @property {UUID} uuid - Unique identifier for the question.
 * @property {UUID} eventUUID - Identifier of the event the question belongs to.
 * @property {string} input_type - Type of input for the question (e.g., "multiple_choice", "rearrange", "rating").
 * @property {string} title - Title of the question.
 * @property {number} order - Order of the question (must be unique).
 * @property {boolean} active - Indicates if the question is active.
 * @property {Object} timer - Timer settings for the question.
 * @property {boolean} timer.enabled - Indicates if the timer is enabled.
 * @property {number} timer.votingTime - Voting time in milliseconds.
 * @property {Object} result - Aggregated results for the question.
 * @property {number} result.participantCount - Number of participants for the question.
 * @property {number} result.voteCount - Total votes for the question.
 * @property {number} maxSelectableOptions - Maximum number of selectable options for the question.
 * @property {Object} correctAnswers - Settings for correct answers.
 * @property {boolean} correctAnswers.allow - Indicates if correct answers are allowed.
 * @property {boolean} correctAnswers.show - Indicates if correct answers should be shown.
 * @property {Array<Option>} options - List of options for the question.
 *
 * @typedef {Object} Option
 * @property {UUID} uuid - Unique identifier for the option.
 * @property {UUID} questionUuid - Identifier of the question the option belongs to.
 * @property {string} label - Label for the option.
 * @property {number} voteCount - Number of votes for the option.
 * @property {boolean} isCorrect - Indicates if the option is correct.
 * @property {number} votePercentage - Percentage of votes for the option.
 */

const eventSchemaV2 = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
    default: uuidv7,
  },
  eventUuid: {
    type: String,
    required: true,
    default: uuidv7,
  },
  eventCode: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  isQuiz: {
    type: Boolean,
    required: true,
    default: false,
  },
  active: {
    type: Boolean,
    required: true,
    default: false,
  },
  votingLocked: {
    type: Boolean,
    required: true,
    default: false,
  },
  showResults: {
    type: Boolean,
    required: true,
    default: false,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  questions: [
    {
      uuid: {
        type: String,
        required: true,
        default: uuidv7,
      },
      eventUuid: {
        type: String,
        required: true,
      },
      inputType: {
        type: String,
        enum: ["multiple_choice", "rearrange", "rating"],
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      order: {
        type: Number,
        required: true,
        default: 0,
      },
      active: {
        type: Boolean,
        default: false,
      },
      timer: {
        enabled: {
          type: Boolean,
          default: true,
        },
        votingTime: {
          type: Number,
          default: 20000,
        },
      },
      result: {
        participantCount: {
          type: Number,
          required: true,
          default: 0,
        },
        voteCount: {
          type: Number,
          default: 0,
        },
      },
      maxSelectableOptions: {
        type: Number,
        default: 1,
      },
      correctAnswers: {
        allow: {
          type: Boolean,
          default: true,
        },
        show: {
          type: Boolean,
          default: false,
        },
      },
      options: [
        {
          uuid: {
            type: String,
            required: true,
            default: uuidv7,
          },
          questionUuid: {
            type: String,
            required: true,
          },
          label: {
            type: String,
            required: true,
          },
          voteCount: {
            type: Number,
            required: true,
            default: 0,
          },
          isCorrect: {
            type: Boolean,
            default: false,
          },
          votePercentage: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
  ],
  participants: [
    {
      userID: {
        type: String,
        required: true,
      },
      userName: {
        type: String,
        required: true,
      },
      responses: [
        {
          questionUuid: {
            type: String,
            required: true,
          },
          selectedOptionUuid: {
            type: String,
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  ],
  results: {
    participantCount: {
      type: Number,
      default: 0,
    },
  },
});

//Calculate the percentage of votes for each option after saving
eventSchemaV2.pre("save", function (next) {
  this.questions.forEach((question) => {
    question.options.forEach((option) => {
      if (question.result.voteCount > 0) {
        option.votePercentage =
          (option.voteCount / question.result.voteCount) * 100;
      } else {
        option.votePercentage = 0;
      }
    });
  });
  // Publish the data to the Redis channel
  redisPub(
    `live-event-${this.eventUuid}`,
    JSON.stringify({
      eventState: "result-update",
      eventUuid: this.eventUuid,
      activeQuestion: this.activeQuestion,
    })
  );
  next();
});

module.exports = mongoose.model("Event", eventSchema);
module.exports = mongoose.model("EventV2", eventSchemaV2);
