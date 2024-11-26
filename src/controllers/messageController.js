import axios from "axios";
import slackClient from "../config/slackConfig.js";
import {
  authenticateUser,
  openAppIDModal,
  sendMessageToUser,
} from "../services/slackService.js";
import { openLoginModal } from "../services/slackService.js";
import { getAccessToken, saveAccessToken } from "./authController.js";

export const handleMessage = async (req, res) => {
  // Handle Slack URL Verification challenge
  if (req.body.type === "url_verification") {
    console.log("Received challenge:", req.body.challenge);
    return res.json({ challenge: req.body.challenge });
  }

  // Handle message events from Slack
  const { event } = req.body;

  // Check if the event is a message, contains text, and it's not from the bot itself
  if (
    event &&
    event.type === "message" &&
    event.subtype !== "bot_message" &&
    event.user !== process.env.BOT_USER_ID
  ) {
    console.log(`Received message: ${event.text}`);

    // Check if the message contains text and if the bot was mentioned
    if (event.text && event.text.includes(`<@${process.env.BOT_USER_ID}>`)) {
      // Respond to the message if the bot is mentioned
      try {
        await slackClient.chat.postMessage({
          channel: event.channel,
          text: `Hello <@${event.user}>! How are you?`,
        });
        return res.status(200).send();
      } catch (error) {
        console.error("Error responding to message:", error);
        return res.status(500).send();
      }
    } else {
      return res.status(200).send(); // Ignore messages that don't mention the bot
    }
  } else {
    return res.status(200).send(); // Respond with OK for non-message events or bot messages
  }
};

export const handleQuestion = async (req, res) => {
  console.log("Handle question api called");

  // Handle Slack URL Verification challenge 
  if (req.body.type === "url_verification") {
    console.log("Received challenge:", req.body.challenge);
    return res.json({ challenge: req.body.challenge });
  } 

  // Extracting the message and user details from the Slack event
  const { event } = req.body;
  const userId = event.user;
  const question = event.text; // The question that the user asked

  // If the message is from the bot itself, we don't need to process it
  if (
    event.subtype === "bot_message" ||
    event.user === process.env.BOT_USER_ID
  ) {
    return res.status(200).send();
  }

  try {
    // Retrieve the access token from the database
    const token = await getAccessToken(userId, event.team);

    // Define the request payload
    const payload = {
      questionArray: {
        dataSources: [
          {
            integrationDataId: 623,
            integrationId: 438,
          },
        ],
        question: question,
        conversationHistory: [],
        appId: "397",
      },
    };   

    // Make the API call to your backend
    const response = await axios.post(
      "https://acme.dev.airrived.ai/api/app/question",
      payload,
      {
        headers: {
          tenantid: "acme",
          wsid: "1",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Check if the response status is successful
    if (response.statusCode === 200 || response.data.data) {
      // Send the response data back to Slack
      const answer = response.data.data;
      await sendMessageToUser(userId, `${answer}`);
      return res.status(200).send();
    } else {
      await sendMessageToUser(
        userId,
        "Sorry, I couldn't fetch the answer at the moment."
      );
      return res.status(200).send();
    }
  } catch (error) {
    console.error("Error handling question:", error);
    await sendMessageToUser(
      userId,
      "There was an error processing your request. Please try again. or Login to your account."
    );
    return res.status(500).send();
  }
};

// This function will handle the /login command to open the modal
export const handleLoginCommand = async (req, res) => {
  const { user_id, trigger_id } = req.body;

  console.log(req.body, "Body data");

  try {
    // Open a modal to ask for email and password
    await openLoginModal(user_id, trigger_id);
    return res.status(200).send();
  } catch (error) {
    return res.status(500).send({ message: "Error opening the modal" });
  }
};

// This function will handle the submission of the modal (email/password)
export const handleModalSubmission = async (req, res) => {
  // The interaction payload from Slack
  const payload = JSON.parse(req.body.payload);

  // Log the parsed payload to verify its structure
  // console.log("Payload received:", payload);

  // Check if the payload is a modal submission (view_submission)
  if (
    payload.type === "view_submission" ||
    payload?.view?.callback_id === "login_modal" // Ensure it's our login modal
  ) {
    console.log("Email is", payload.view.state.values.email_input.email.value);
    console.log(
      "Password is",
      payload.view.state.values.password_input.password.value
    );

    // Extract the email and password values from the modal submission
    const email = payload.view.state.values.email_input.email.value;
    const password = payload.view.state.values.password_input.password.value;

    try {
      // Call the backend service to authenticate the user
      const token = await authenticateUser(email, password);

      // If authentication is successful, send a success message to the user
      await sendMessageToUser(
        payload.user.id,
        `Authentication successful! Welcome <@${payload.user.id}>!! :tada: :smile:`
      );

      // Save the token to the database
      await saveAccessToken(payload.user.id, payload.team.id, token, email);

      // Respond to Slack to clear (close) the modal after submission
      return res.status(200).send({
        response_action: "clear", // This clears the modal from the user's screen
      });
    } catch (error) {
      console.log("Error in modal submission:", error);
      // If authentication fails, send an error message
      await sendMessageToUser(
        payload.user.id,
        "Authentication failed. Please try again. :disappointed:"
      );

      // Respond with validation errors for the modal
      return res.status(200).send({
        response_action: "errors", // This triggers Slack's error handling for the modal
        errors: {
          email_input: "Invalid credentials. Please try again.", // Show error on the email input field
        },
      });
    }
  }

  // Respond with 200 OK to acknowledge Slack
  res.status(200).send();
};

// This function will handle the /add_app_id slash command
export const handleGetAppDataCommand = async (req, res) => {
  const { user_id, trigger_id } = req.body;

  try {
    // Open a modal asking for the App ID
    await openAppIDModal(user_id, trigger_id);
    return res.status(200).send();
  } catch (error) {
    console.error("Error handling slash command:", error);
    return res.status(500).send({ message: "Error processing the command" });
  }
};

export const handleAppModalSubmission = async (req, res) => {
  const payload = JSON.parse(req.body.payload);

  if (
    payload.type === "view_submission" &&
    payload.view.callback_id === "app_id_modal"
  ) {
    const appId = payload.view.state.values.app_id_input.app_id.value;
    const userId = payload.user.id;

    try {
      // Call the backend to get data using the App ID
      const appData = await getAppDataFromAPI(appId);

      // Save the data to the database under the userToken schema
      await saveAppDataToDB(userId, appData);

      // Send a success message to the user
      await sendMessageToUser(userId, `App data saved successfully!`);

      // Clear the modal
      return res.status(200).send({
        response_action: "clear",
      });
    } catch (error) {
      console.error("Error handling modal submission:", error);
      // Send an error message to the user
      await sendMessageToUser(
        userId,
        `Failed to fetch and save App data. Please try again.`
      );
      return res.status(200).send({
        response_action: "errors",
        errors: {
          app_id_input: "Invalid App ID. Please try again.",
        },
      });
    }
  }

  // Respond with 200 OK
  res.status(200).send();
};

export default handleMessage;
