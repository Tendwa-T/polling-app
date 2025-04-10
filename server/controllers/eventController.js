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
    if (!userID) userID = uuidv4();

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
    const eventUuid = uuidv7();
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
    // convert the uuids to string
    const eventsWithStringUUID = events.map((event) => ({
      ...event.toObject(),
      eventUuid: event.eventUuid.toString(),
      uuid: event.uuid.toString(),
    }));

    return res.status(200).json({
      data: eventsWithStringUUID,
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

    const questionUuid = uuidv7();

    questionData.map((questions) => {
      questions.uuid = questionUuid;
      questions.options.map((option) => {
        option.uuid = uuidv7();
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

async function setActiveQuestionV2(req, res) {}

async function startEventV2(req, res) {}

async function endEventV2(req, res) {}

async function joinEventV2(req, res) {}

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
};
