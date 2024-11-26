import axios from "axios";
import slackClient from "../config/slackConfig.js";
// import dotenv from "dotenv";

// dotenv.config();

// Function to send user credentials to your backend for authentication
export const authenticateUser = async (email, password) => {
  try {
    // Replace with your actual backend API for authentication
    const response = await axios.post(
      "https://acme.dev.airrived.ai/api/auth/login",
      {
        email: email,
        password: password,
      },
      {
        headers: {
          tenantid: "acme",
        },
      }
    );
    // If the response contains a token, return it
    if (response.data.access_token) {
      return response.data.access_token;
    } else {
      console.log("Error at credentials at backedn API");
      throw new Error("Invalid credentials");
    }
  } catch (error) {
    console.log("Error at backedn API", error);
    throw new Error("Authentication failed");
  }
};

// Function to open the login modal (request for email and password)
export const openLoginModal = async (userId, trigger_id) => {
  const modalPayload = {
    trigger_id: trigger_id,
    view: {
      type: "modal",
      callback_id: "login_modal", // Unique identifier for the modal
      title: {
        type: "plain_text",
        text: "Login",
      },
      blocks: [
        {
          type: "section",
          block_id: "email_section",
          text: {
            type: "mrkdwn",
            text: "*Enter your email address:*",
          },
        },
        {
          type: "input",
          block_id: "email_input",
          label: {
            type: "plain_text",
            text: "Email",
          },
          element: {
            type: "plain_text_input",
            action_id: "email",
            placeholder: {
              type: "plain_text",
              text: "Enter your email",
            },
          },
          optional: false,
        },
        {
          type: "section",
          block_id: "password_section",
          text: {
            type: "mrkdwn",
            text: "*Enter your password:*",
          },
        },
        {
          type: "input",
          block_id: "password_input",
          label: {
            type: "plain_text",
            text: "Password",
          },
          element: {
            type: "plain_text_input",
            action_id: "password",
            placeholder: {
              type: "plain_text",
              text: "Enter your password",
            },
            multiline: false, // If you don't want multiline input
          },
          optional: false,
        },
      ],
      close: {
        type: "plain_text",
        text: "Cancel",
      },
      submit: {
        type: "plain_text",
        text: "Submit", // Button text to submit the form
        // action_id: "submit_button",
      },
      private_metadata: "Login modal metadata", // Optional metadata for your backend
    },
  };

  try {
    // Use slackClient to open the modal
    await slackClient.views.open(modalPayload);
  } catch (error) {
    console.error("Error opening modal: ", error);
  }
};

// Function to open a modal asking for the App ID
export const openAppIDModal = async (userId, trigger_id) => {
  const modalPayload = {
    trigger_id: trigger_id,
    view: {
      type: "modal",
      callback_id: "app_id_modal", // Unique identifier for the modal
      title: {
        type: "plain_text",
        text: "Enter App ID",
      },
      blocks: [
        {
          type: "section",
          block_id: "app_id_section",
          text: {
            type: "mrkdwn",
            text: "*Please enter your App ID:*",
          },
        },
        {
          type: "input",
          block_id: "app_id_input",
          label: {
            type: "plain_text",
            text: "App ID",
          },
          element: {
            type: "plain_text_input",
            action_id: "app_id",
            placeholder: {
              type: "plain_text",
              text: "Enter your App ID",
            },
            optional: false,
          },
        },
      ],
      close: {
        type: "plain_text",
        text: "Cancel",
      },
      submit: {
        type: "plain_text",
        text: "Submit",
      },
    },
  };

  try {
    await slackClient.views.open(modalPayload);
  } catch (error) {
    console.error("Error opening modal: ", error);
  }
};

// Function to send a message to Slack user
export const sendMessageToUser = async (userId, text) => {
  try {
    await slackClient.chat.postMessage({
      channel: userId,
      text: text,
    });
    return;
  } catch (error) {
    console.error("Error sending message to user: ", error);
  }
};
