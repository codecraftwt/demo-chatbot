import axios from "axios";
import slackClient from "../config/slackConfig.js";
import { openAppIDModal, sendMessageToUser } from "../services/slackService.js";
import { openLoginModal } from "../services/slackService.js";
import {
  getAccessToken,
  getAppDataWithToken,
  saveAccessToken,
} from "./authController.js";
import { authenticateUser, fetchAppData } from "../services/apiService.js";

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

  // Extracting the message and user details from the Slack event
  const { event } = req.body;

  console.log("Event Type --------->", event);

  // URL verification (Slack challenge response)
  if (req.body.type === "url_verification") {
    console.log("Received challenge:", req.body.challenge);
    return res.json({ challenge: req.body.challenge });
  }

  // Ignore messages from the bot
  if (event.user === process.env.BOT_USER_ID) {
    console.log("Ignoring message from bot and returning");
    return res.status(200).send();
  }

  // Ensure the event is of type "message"
  if (event.type !== "message") {
    console.log("Event type is not message. Ignoring.");
    return res.status(200).send();
  }

  // Process message event if it’s from a user (not the bot)
  try {
    console.log("Message Event detected from user not from bot");
    // Retrieve the access token from the database
    // const token = await getAccessToken(userId, event.team);

    // // Define the request payload
    // const payload = {
    //   questionArray: {
    //     dataSources: [
    //       {
    //         integrationDataId: 623,
    //         integrationId: 438,
    //       },
    //     ],
    //     question: question,
    //     conversationHistory: [],
    //     appId: "397",
    //   },
    // };
    const userId = event.user;
    const question = event.text;

    const userData = await getAppDataWithToken(userId, event.team);

    // Check if appId or dataSources are missing
    if (!userData.appId || !userData.dataSources) {
      console.log("App not selected or dataSources missing");

      // Send a message to the user asking to select an app
      await sendMessageToUser(
        userId,
        "Please first select an app before asking questions."
      );

      // Respond with a 200 OK to Slack (even though the user did not select an app)
      return res.status(200).send();
    }

    const token = userData.accessToken;

    const payload = {
      questionArray: {
        dataSources: userData.dataSources,
        question: question,
        conversationHistory: [],
        appId: userData.appId,
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

    console.log("API Response", response);

    // Check if the response is successful and contains data
    if (response.statusCode === 200 || response.data.data) {
      const answer = response.data.data;

      // Send the answer back to the user
      if (
        event.channel_type === "im" &&
        event.user !== process.env.BOT_USER_ID
      ) {
        await sendMessageToUser(userId, `${answer}`);
      }
      return res.status(200).send();
    }
  } catch (error) {
    console.log("Error handling question:", error);
    await sendMessageToUser(
      userId,
      "Selected App is not working, please select different app"
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

export const handleModalSubmission = async (req, res) => {
  try {
    // The interaction payload from Slack
    const payload = JSON.parse(req.body.payload);

    // Check if the payload is a modal submission (view_submission)
    if (payload.type === "view_submission") {
      // Handle login modal submission
      if (payload.view.callback_id === "login_modal") {
        console.log(
          "Email is",
          payload.view.state.values.email_input.email.value
        );
        console.log(
          "Password is",
          payload.view.state.values.password_input.password.value
        );

        // Extract email and password from the modal submission
        const email = payload.view.state.values.email_input.email.value;
        const password =
          payload.view.state.values.password_input.password.value;

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

      // Handle app selection modal submission
      if (payload.view.callback_id === "app_id_modal") {
        console.log(
          payload.view.state.values.app_list_section.app_select.selected_option,
          "payload of submission"
        );
        const appId =
          // payload.view.state.values.app_select.app_select.selected_option.value; // The app ID
          payload.view.state.values.app_list_section.app_select.selected_option
            .value; // The app ID
        const userId = payload.user.id;

        try {
          // Fetch app data from the backend using the app ID
          const appData = await fetchAppData(appId, userId);

          // Send a success message to the user via Slack
          await sendMessageToUser(
            userId,
            `You are now connected with the "${appData.name}" and App ID is ${appId}!`
            // appData.name
          );

          // Clear the modal after the operation
          return res.status(200).send({
            response_action: "clear",
          });
        } catch (error) {
          console.error("Error handling modal submission:", error);

          // Send an error message to the user via Slack
          await sendMessageToUser(
            userId,
            `Failed to fetch and save App data. Please try again.`
          );

          // Return an error response and show the error in the modal
          return res.status(200).send({
            response_action: "errors",
            errors: {
              app_select: "Invalid selection. Please try again.",
            },
          });
        }
      }
    }

    // If the payload doesn't match any known callback_id, just acknowledge with 200 OK
    res.status(200).send();
  } catch (error) {
    console.error("Error handling modal submission:", error);
    res.status(500).send("Internal server error");
  }
};

// This function will handle the /choose-app slash command
export const handleGetAppDataCommand = async (req, res) => {
  const { user_id, trigger_id } = req.body;

  try {
    if (!trigger_id) {
      return res.status(400).send({ message: "Missing trigger_id." });
    }
    // Open a modal asking for the App ID
    await openAppIDModal(user_id, trigger_id);
    return res.status(200).send();
  } catch (error) {
    console.error("Error handling slash command:", error);
    return res.status(500).send({ message: "Error processing the command" });
  }
};
