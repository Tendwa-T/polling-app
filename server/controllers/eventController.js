const { redisPub } = require("../config/redis");
const Event = require("../models/eventModel");
const EventV2 = require("../models/eventModel");

const { validate: uuidValidate } = require("uuid");
const { version: uuidVersion } = require("uuid");
const { v7: uuidv7 } = require("uuid");

// V1 Controllers
async function createEvent(req, res) {
  try {
    const { name, description, adminID, startTime, endTime } = req.body;
    const eventCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    let setStartTime = new Date();
    let setEndTime = new Date();
    if (!startTime) {
      setStartTime.setDate(setStartTime.getDate());
    }
    if (!endTime) {
      setEndTime.setDate(setEndTime.getDate() + 2);
    }

    const newEvent = await Event.create({
      name,
      eventCode,
      adminID,
      description: description || "",
      startTime: startTime || setStartTime,
      endTime: endTime || setEndTime,
    });
    if (!newEvent) {
      return res
        .status(400)
        .json({ data: null, message: "Event not saved", success: false });
    }

    return res.status(201).json({
      data: { eventID: newEvent._id, eventCode },
      message: "Event Created",
      success: true,
    });
  } catch (err) {
    console.log("Create Event Error:", err.message);
    return res.status(500).json({
      data: null,
      message: `An error occurred: ${err.message}`,
      success: false,
    });
  }
}

async function getEvents(req, res) {
  try {
    const { adminID } = req.params;
    const events = await Event.find({ adminID });
    if (!events) {
      return res
        .status(404)
        .json({ data: null, message: "Events not found", success: false });
    }
    return res.status(200).json({
      data: events,
      message: "Events retrieved",
      success: true,
    });
  } catch (err) {
    console.log("Get Events Error:", err.message);
    return res.status(500).json({
      data: null,
      message: `An error occurred: ${err.message}`,
      success: false,
    });
  }
}

async function getEvent(req, res) {
  try {
    const { eventID } = req.params;
    const event = await Event.findById(eventID).populate("questions");
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    return res.status(200).json({
      data: event,
      message: "Event retrieved",
      success: true,
    });
  } catch (err) {
    console.log("Get Event Error:", err.message);
    return res.status(500).json({
      data: null,
      message: `An error occurred: ${err.message}`,
      success: false,
    });
  }
}

async function joinEvent(req, res) {
  const { eventID } = req.params;
  let { userID, userName } = req.body;

  if (!userName)
    return res
      .status(400)
      .json({ data: null, message: "Username is Required", success: false });
  try {
    const event = await Event.findOne({ eventCode: eventID }).populate(
      "activeQuestion"
    );
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    if (!userID) userID = uuidv7();

    const participant = event.participants.find((p) => p.userName === userName);
    //prevent duplicate usernames
    if (participant) {
      return res.status(400).json({
        data: null,
        message: "Username already exists",
        success: false,
      });
    }
    event.participants.push({ userID, userName });

    await event.save();

    return res.status(200).json({
      data: {
        event: {
          eventID: event._id,
          eventCode: event.eventCode,
          eventName: event.name,
          eventDescription: event.description,
          eventStartTime: event.startTime,
          eventEndTime: event.endTime,
        },
        userID,
        userName,
        activeQuestion: event.activeQuestion,
      },
      message: "Event Joined Successfully",
      success: true,
    });
  } catch (err) {
    console.log(`Join Event Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}
async function setActiveQuestion(req, res) {
  const { eventID, questionID, isLastQuestion } = req.body;

  try {
    const event = await Event.findByIdAndUpdate(
      eventID,
      {
        activeQuestion: questionID,
        isLastQuestion,
      },
      { new: true }
    );
    if (!event)
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });

    const resEvent = await Event.findById(eventID).populate("activeQuestion");
    const channel = `live-event-${event.eventCode}`;

    redisPub(
      channel,
      JSON.stringify({
        eventCode: event.eventCode,
        activeQuestion: resEvent.activeQuestion,
        isLastQuestion: resEvent.isLastQuestion,
      })
    );
    console.log(`Published to ${channel}:`);

    return res
      .status(200)
      .json({ data: null, message: "Active question updated", success: true });
  } catch (err) {
    console.log(`Set Active Question Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}

async function getActiveQuestion(req, res) {
  const { eventID } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  async function sendQuestionUpdate() {
    const event = await Event.findById(eventID).populate("activeQuestion");
    res.write(
      `data: ${JSON.stringify({
        activeQuestion: event.activeQuestion,
        isLastQuestion: event.isLastQuestion,
      })}\n\n`
    );
  }
  sendQuestionUpdate();

  const interval = setInterval(sendQuestionUpdate, 5000);
  req.on("close", () => {
    clearInterval(interval);
  });
}

async function resetActiveQuestion(req, res) {
  const { eventID } = req.params;

  try {
    const event = await Event.findById(eventID);
    if (!event)
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    event.activeQuestion = null;
    event.isLastQuestion = false;
    await event.save();

    return res
      .status(200)
      .json({ data: null, message: "Active question reset", success: true });
  } catch (err) {
    console.log(`Reset Active Question Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}

async function startEvent(req, res) {
  try {
    const { eventID } = req.params;
    const event = await Event.findByIdAndUpdate(
      eventID,
      { status: "live" },
      { new: true }
    );
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    return res.status(200).json({
      data: null,
      message: "Event Started",
      success: true,
    });
  } catch (err) {}
}

async function endEvent(req, res) {
  try {
    const { eventID } = req.params;
    const event = await Event.findByIdAndUpdate(eventID, {
      status: "completed",
    });
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    redisPub(
      `live-event-${eventID}`,
      JSON.stringify({
        eventCode: event.eventCode,
        eventEnded: true,
      })
    );
    return res.status(200).json({
      data: null,
      message: "Event Ended",
      success: true,
    });
  } catch (err) {
    console.log("End Event Error:", err.message);
    return res.status(500).json({
      data: null,
      message: `An error occurred: ${err.message}`,
      success: false,
    });
  }
}

// V2 Controllers
async function createEventV2(req, res) {
  try {
    const { title } = req.body;
    const eventCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const eventUuid = uuidv7().toString();
    const newEvent = await EventV2.create({
      title,
      eventCode,
      eventUuid,
    });
    if (!newEvent) {
      return res
        .status(400)
        .json({ data: null, message: "Event not saved", success: false });
    }
    return res.status(201).json({
      data: { eventID: newEvent.eventUuid, eventCode },
      message: "Event Created",
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      data: null,
      message: `An error occurred: ${err.message}`,
      success: false,
    });
  }
}

async function getEventsV2(req, res) {
  try {
    // const {adminID} = req.params;
    const events = await EventV2.find();
    if (!events) {
      return res
        .status(404)
        .json({ data: null, message: "Events not found", success: false });
    }

    return res.status(200).json({
      data: events,
      message: "Events retrieved",
      success: true,
    });
  } catch (err) {
    console.log("Get Events Error:", err.message);
    return res.status(500).json({
      data: null,
      message: `An error occurred: ${err.message}`,
      success: false,
    });
  }
}

async function getEventV2(req, res) {
  try {
    const { eventUuid } = req.params;
    const isValid = uuidValidate(eventUuid);
    const version = uuidVersion(eventUuid);
    console.log("Version:", version);
    if (version !== 7) {
      return res.status(400).json({
        data: null,
        message: "Malformed UUID",
        success: false,
      });
    }
    if (!isValid) {
      return res
        .status(400)
        .json({ data: null, message: "Invalid event UUID", success: false });
    }
    const event = await EventV2.findOne({ eventUuid });
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    // convert the uuid to string
    const eventWithStringUUID = {
      ...event.toObject(),
      eventUuid: event.eventUuid.toString(),
      uuid: event.uuid.toString(),
    };
    // Convert other UUIDs to string if needed
    return res.status(200).json({
      data: eventWithStringUUID,
      message: "Event retrieved",
      success: true,
    });
  } catch (err) {
    console.log("Get Event Error:", err.message);
    return res.status(500).json({
      data: null,
      message: `An error occurred: ${err.message}`,
      success: false,
    });
  }
}

async function addQuestionToEvent(req, res) {
  try {
    const { eventUuid, questionData } = req.body;
    const isValid = uuidValidate(eventUuid);
    const version = uuidVersion(eventUuid);
    if (version !== 7) {
      return res.status(400).json({
        data: null,
        message: "Malformed UUID",
        success: false,
      });
    }
    if (!isValid) {
      return res
        .status(400)
        .json({ data: null, message: "Invalid event UUID", success: false });
    }

    const questionUuid = uuidv7().toString();

    questionData.map((questions) => {
      questions.uuid = questionUuid;
      questions.eventUuid = eventUuid;
      questions.options.map((option) => {
        option.uuid = uuidv7().toString();
        option.questionUuid = questionUuid;
        return option;
      });
      return questions;
    });

    const event = await EventV2.findOneAndUpdate(
      { eventUuid },
      { $push: { questions: questionData } },
      { new: true }
    );
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    return res.status(200).json({
      data: null,
      message: "Question added to event",
      success: true,
    });
  } catch (err) {
    console.log("Add Question to Event Error:", err.message);
    return res.status(500).json({
      data: null,
      message: `An error occurred: ${err.message}`,
      success: false,
    });
  }
}

async function deleteEventV2(req, res) {}

async function getEventResultsV2(req, res) {}

async function setActiveQuestionV2(req, res) {
  const { eventUuid, questionUuid } = req.body;
  try {
    const event = await EventV2.findOneAndUpdate(
      { eventUuid },
      { activeQuestion: questionUuid },
      { new: true }
    );
    if (!event)
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    const resEvent = await EventV2.findOne({ eventUuid });
    //find the question with a matching uuid
    const question = resEvent.questions.find((q) => q.uuid === questionUuid);
    if (!question) {
      return res
        .status(404)
        .json({ data: null, message: "Question not found", success: false });
    }
    const channel = `live-event-${eventUuid}`;
    redisPub(
      channel,
      JSON.stringify({
        eventState: "question",
        eventCode: event.eventCode,
        eventUuid: event.eventUuid,
        activeQuestion: question,
      })
    );
    return res
      .status(200)
      .json({ data: null, message: "Active question updated", success: true });
  } catch (err) {
    console.log(`Set Active Question Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}

async function startEventV2(req, res) {}

async function endEventV2(req, res) {}

async function joinEventV2(req, res) {
  const { eventUuid } = req.params;

  let { userID, userName } = req.body;
  if (!userName)
    return res
      .status(400)
      .json({ data: null, message: "Username is Required", success: false });
  try {
    let eventV2;
    if (eventUuid > 6) {
      eventV2 = await EventV2.findOne({ eventUuid });
    } else {
      eventV2 = await EventV2.findOne({ eventCode: eventUuid });
    }
    if (!eventV2) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    if (!userID) userID = uuidv7();

    const participant = eventV2.participants.find(
      (p) => p.userName === userName
    );
    //find the user with a matching username
    //prevent duplicate usernames
    if (participant) {
      return res.status(400).json({
        data: null,
        message: "Username already exists",
        success: false,
      });
    }
    eventV2.participants.push({ userID, userName });

    await eventV2.save();

    return res.status(200).json({
      data: {
        event: {
          eventUuid: eventV2.eventUuid,
          eventCode: eventV2.eventCode,
          eventTitle: eventV2.title,
        },
        userID,
        userName,
      },
      message: "Event Joined Successfully",
      success: true,
    });
  } catch (err) {
    console.log(`Join Event Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}
/**
 * Vote function
 * - Receives a vote from a user
 */
async function voteV2(req, res) {
  try {
    const { eventUuid, questionUuid, optionUuid, userID } = req.body;
    const isValid =
      uuidValidate(eventUuid) &&
      uuidVersion(eventUuid) === 7 &&
      uuidValidate(questionUuid) &&
      uuidVersion(questionUuid) === 7 &&
      uuidValidate(optionUuid) &&
      uuidVersion(optionUuid) === 7;
    const version = uuidVersion(eventUuid);
    if (version !== 7) {
      return res.status(400).json({
        data: null,
        message: "Malformed UUID",
        success: false,
      });
    }
    if (!isValid) {
      return res
        .status(400)
        .json({ data: null, message: "Invalid event UUID", success: false });
    }
    const event = await EventV2.findOne({ eventUuid });
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }

    const question = event.questions.find((q) => q.uuid === questionUuid);
    if (!question) {
      return res
        .status(404)
        .json({ data: null, message: "Question not found", success: false });
    }

    const participant = event.participants.find((p) => p.userID === userID);
    if (!participant) {
      return res
        .status(404)
        .json({ data: null, message: "Participant not found", success: false });
    }

    const alreadyVoted = participant.responses?.find(
      (r) => r.questionUuid === questionUuid
    );
    if (alreadyVoted) {
      return res.status(200).json({
        data: null,
        message: "Already voted for this question",
        success: true,
      });
    }

    // Add the vote to the question
    const option = question.options.find((o) => o.uuid === optionUuid);
    if (!option) {
      return res
        .status(404)
        .json({ data: null, message: "Option not found", success: false });
    }
    option.voteCount = (option.voteCount || 0) + 1;
    question.result.voteCount = (question.result.voteCount || 0) + 1;
    option.votePercentage =
      (option.voteCount / question.result.voteCount) * 100;

    participant.responses = participant.responses || [];
    participant.responses.push({
      questionUuid,
      selectedOptionUuid: optionUuid,
    });

    await event.save();
    const channel = `live-event-${eventUuid}`;
    redisPub(
      channel,
      JSON.stringify({
        eventState: "result-wait",
        eventCode: event.eventCode,
        eventUuid: event.eventUuid,
        activeQuestion: question,
        questionUuid,
        optionUuid,
        userID,
      })
    );
    return res.status(200).json({
      data: null,
      message: "Vote recorded",
      success: true,
    });
  } catch (err) {
    console.log(`Vote Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}

async function correctOptionV2(req, res) {
  const { eventUuid, questionUuid, show } = req.body;
  try {
    // Get the question
    const event = await EventV2.findOne({ eventUuid });
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    const question = event.questions.find((q) => q.uuid === questionUuid);
    if (!question) {
      return res
        .status(404)
        .json({ data: null, message: "Question not found", success: false });
    }
    // Get the correct option
    const correctOption = question.options.find((o) => o.isCorrect);
    if (!correctOption) {
      return res.status(404).json({
        data: null,
        message: "Correct option not found",
        success: false,
      });
    }
    // Publish the correct option to the channel
    const channel = `live-event-${eventUuid}`;
    if (show) {
      redisPub(
        channel,
        JSON.stringify({
          eventState: "result-show",
          questionUuid,
          correctOption: correctOption.uuid,
        })
      );
      return res.status(200).json({
        data: {
          eventState: "result-show",
          optionUuid: correctOption.uuid,
          optionText: correctOption.label,
        },
        message: "API Call Success",
        success: true,
      });
    }
    redisPub(
      channel,
      JSON.stringify({
        eventState: "result-wait",
        questionUuid,
        correctOption: correctOption.uuid,
      })
    );
    return res.status(200).json({
      data: {
        eventState: "result-show",
        optionUuid: correctOption.uuid,
        optionText: correctOption.label,
      },
      message: "API Call Success",
      success: true,
    });
  } catch (err) {
    console.log(`Correct Option Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}
async function resetVotesV2(req, res) {
  const { eventUuid } = req.params;
  try {
    const event = await EventV2.findOne({ eventUuid });
    if (!event) {
      return res
        .status(404)
        .json({ data: null, message: "Event not found", success: false });
    }
    event.questions.forEach((question) => {
      question.options.forEach((option) => {
        option.voteCount = 0;
        option.votePercentage = 0;
      });
      question.result.voteCount = 0;
    });
    event.participants.forEach((participant) => {
      participant.responses = [];
    });
    await event.save();
    const channel = `live-event-${eventUuid}`;
    redisPub(
      channel,
      JSON.stringify({
        eventState: "reset-votes",
        eventCode: event.eventCode,
        eventUuid: event.eventUuid,
      })
    );
    return res.status(200).json({
      data: null,
      message: "Votes reset",
      success: true,
    });
  } catch (err) {
    console.log(`Reset Votes Error: ${err.message}`);
    return res.status(500).json({
      data: null,
      message: `An Error Occurred: ${err.message}`,
      success: false,
    });
  }
}

module.exports = {
  joinEvent,
  setActiveQuestion,
  getActiveQuestion,
  createEvent,
  resetActiveQuestion,
  startEvent,
  endEvent,
  getEvents,
  getEvent,
  // v2
  createEventV2,
  addQuestionToEvent,
  getEventV2,
  getEventsV2,
  deleteEventV2,
  getEventResultsV2,
  setActiveQuestionV2,
  startEventV2,
  endEventV2,
  joinEventV2,
  voteV2,
  correctOptionV2,
  resetVotesV2,
};
