"use client";

import { createContext, useState } from "react";

export const AppContext = createContext();
const baseAPI = process.env.NEXT_PUBLIC_BASE_API;

export function AppProvider({ children }) {
  const [event, setEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Creates a new event by sending a POST request to the backend API.
   *
   * @async
   * @function createEvent
   * @param {string} name - The name of the event.
   * @param {string} desc - A description of the event.
   * @param {string} adminID - The ID of the admin creating the event.
   * @param {string} startTime - The start time of the event in ISO 8601 format.
   * @param {string} endTime - The end time of the event in ISO 8601 format.
   * @returns {Promise<void>} A promise that resolves when the event is created.
   * @throws {Error} If there is an issue with the network request or response.
   */
  async function createEvent(name, desc, adminID, startTime, endTime) {
    //Receives eventID and eventCode from the backend
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${baseAPI}/api/v1/events/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, desc, adminID, startTime, endTime }),
      });
      const data = await response.json();
      if (data.success) {
        setEvent(data.data);
        setError(null);
        return {
          success: true,
          message: "Event created",
        };
      } else {
        setError(data.message);
        return {
          success: false,
          message: data.message,
        };
      }
    } catch (error) {
      setError(error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Retrieves a list of events from the backend API.
   *
   * @async
   * @function getEvents
   * @param {string} adminID - The ID of the admin whose events are being retrieved.
   * @returns {Promise<void>} A promise that resolves when the events are retrieved.
   * @throws {Error} If there is an issue with the network request or response.
   */

  async function getEvents(adminID) {
    // Receives a list of events from the backend
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${baseAPI}/api/v1/events/events/${adminID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setEvents(data.data);
        setError(null);
        return {
          success: true,
          message: "Events retrieved",
        };
      } else {
        if (data.message === "jwt expired") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setError("Session expired. Please login again.");
          return {
            success: false,
            message: "Session expired. Please login again.",
            redirect: true,
            route: "/auth",
          };
        }
        return {
          success: false,
          message: data.message,
        };
      }
    } catch (error) {
      setError(error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Fetches a single event from the backend using the provided event ID.
   *
   * @async
   * @function
   * @param {string} eventID - The unique identifier of the event to retrieve.
   * @returns {Promise<Object>} A promise that resolves to an object containing:
   *   - {boolean} success - Indicates whether the operation was successful.
   *   - {string} message - A message describing the result of the operation.
   * @throws {Error} If an error occurs during the fetch operation.
   */

  async function getEvent(eventID) {
    // Receives a single event from the backend
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${baseAPI}/api/v1/events/event/${eventID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setEvent(data.data);
        setError(null);
        return {
          data: data.data,
          success: true,
          message: "Event retrieved",
        };
      } else {
        setError(data.message);
        return {
          success: false,
          message: data.message,
        };
      }
    } catch (error) {
      setError(error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Starts an event by sending a GET request to the backend API.
   *
   * @async
   * @function startEvent
   * @param {string} eventID - The unique identifier of the event to start.
   * @returns {Promise<void>} Resolves when the event is successfully started or an error is handled.
   * @throws {Error} If the fetch request fails or an unexpected error occurs.
   */
  async function startEvent(eventID) {
    // Starts the event by sending a GET request to the backend
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${baseAPI}/api/v1/events/start-event/${eventID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setEvent(data.data);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError(error.message);
    }
  }

  /**
   * Ends an event by sending a GET request to the backend API.
   *
   * @async
   * @function
   * @param {string} eventID - The unique identifier of the event to be ended.
   * @returns {Promise<void>} Resolves when the event is successfully ended or an error occurs.
   * @throws {Error} If the fetch request fails or the response contains an error.
   */
  async function endEvent(eventID) {
    // Ends the event by sending a GET request to the backend
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${baseAPI}/api/v1/events/end-event/${eventID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setEvent(data.data);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError(error.message);
    }
  }

  // Question functions

  async function createQuestion(type, eventID, text, choices, correctAnswer) {
    // Receives questionID from the backend
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${baseAPI}/api/v1/questions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, eventID, text, choices, correctAnswer }),
      });
      const data = await response.json();
      if (data.success) {
        setEvent(data.data);
        setError(null);
        return {
          success: true,
          message: "Question created",
        };
      } else {
        setError(data.message);
        return {
          success: false,
          message: data.message,
        };
      }
    } catch (error) {
      setError(error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  const value = {
    createEvent,
    getEvents,
    getEvent,
    startEvent,
    endEvent,
    event,
    events,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
