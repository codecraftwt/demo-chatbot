import axios from "axios";
import slackClient from "../config/slackConfig.js";
import { fetchAppsFromBackend } from "./apiService.js";
// import dotenv from "dotenv";

// dotenv.config();

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

// Function to open a modal asking for the App ID (with a list of apps)
// export const openAppIDModal = async (user_id, trigger_id) => {
//   try {
//     console.log("Opening ID modal.........................");
//     // Fetch the list of apps from your backend or API
//     const apps = await fetchAppsFromBackend(user_id);
//     // const apps = [
//     //   {
//     //     name: "AggegationAgent",
//     //     id: 422,
//     //   },
//     //   {
//     //     name: "NewAggegation",
//     //     id: 412,
//     //   },
//     // ];

//     console.log("Apps got successfully.........................");
//     // Map the apps to Slack select menu options
//     const appOptions = apps.map((app) => ({
//       text: {
//         type: "plain_text",
//         text: app.name, // Display the app name
//       },
//       value: app.id.toString(), // Use the app ID as the value
//     }));

//     // console.log(appOptions, "appOptions-----------------------");

//     // Create the modal payload
//     const modalPayload = {
//       trigger_id: trigger_id,
//       view: {
//         type: "modal",
//         callback_id: "app_id_modal",
//         title: {
//           type: "plain_text",
//           text: "Select an App",
//         },
//         blocks: [
//           {
//             type: "section",
//             block_id: "app_list_section",
//             text: {
//               type: "mrkdwn",
//               text: "*Please select an App:*",
//             },
//             accessory: {
//               type: "static_select",
//               action_id: "app_select", // Unique action ID for the select menu
//               placeholder: {
//                 type: "plain_text",
//                 text: "Select an app",
//               },
//               options: appOptions, // List of apps to choose from
//             },
//           },
//         ],
//         close: {
//           type: "plain_text",
//           text: "Cancel",
//         },
//         submit: {
//           type: "plain_text",
//           text: "Submit",
//         },
//       },
//     };

//     // Open the modal with the app list
//     await slackClient.views.open(modalPayload);
//   } catch (error) {
//     console.error("Error opening modal with app list: ", error);
//   }
// };

export const openAppIDModal = async (user_id, trigger_id) => {
  try {
    // Step 1: Open the loading modal immediately after receiving the trigger_id
    const loadingModalPayload = {
      trigger_id: trigger_id,
      view: {
        type: "modal",
        callback_id: "loading_modal",
        title: {
          type: "plain_text",
          text: "Select an App",
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Loading app list, please wait...*",
            },
          },
        ],
      },
    };

    // Open the loading modal
    const loadingModalResponse = await slackClient.views.open(
      loadingModalPayload
    );
    const viewId = loadingModalResponse.view.id; // Get the view_id for updating the modal

    // Step 2: Fetch the app data asynchronously
    const apps = await fetchAppsFromBackend(user_id);

    // Step 3: Map the apps to Slack select menu options
    const appOptions = apps.map((app) => ({
      text: {
        type: "plain_text",
        text: app.name, // Display the app name
      },
      value: app.id.toString(), // Use the app ID as the value
    }));

    // Step 4: Create the actual modal payload with the app list
    const modalPayload = {
      view_id: viewId, // Use the view_id to update the existing loading modal
      view: {
        type: "modal",
        callback_id: "app_id_modal",
        title: {
          type: "plain_text",
          text: "Select an App",
        },
        blocks: [
          {
            type: "section",
            block_id: "app_list_section",
            text: {
              type: "mrkdwn",
              text: "*Please select an App:*",
            },
            accessory: {
              type: "static_select",
              action_id: "app_select", // Unique action ID for the select menu
              placeholder: {
                type: "plain_text",
                text: "Select an app",
              },
              options: appOptions, // List of apps to choose from
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

    // Step 5: Update the modal with the actual app list
    await slackClient.views.update(modalPayload);
  } catch (error) {
    console.error("Error opening modal with app list: ", error);
  }
};

// Function to send a message to Slack user
export const sendMessageToUser = async (userId, text, appName) => {
  try {
    await slackClient.chat.postMessage({
      channel: userId,
      text: text,
      // username: `MyChatBot - ${appName}`,  // Dynamic bot name (includes app name)
      // icon_emoji: ":robot_face:",  // Set bot emoji or image
    });
    return;
  } catch (error) {
    console.error("Error sending message to user: ", error);
  }
};
