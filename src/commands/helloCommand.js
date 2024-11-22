import slackClient from "../config/slackConfig.js"; // Change to 'import' statement
import { logInfo, logError } from "../utils/logger.js"; // Change to 'import' statement

// Command handler for /hello
export const handleHelloCommand = async (req, res) => {
  const { user_id, channel_id } = req.body; // Extract necessary details from the request

  // Craft the message you want to send
  const message = `Hello <@${user_id}>! How can I assist you today?`;

  // Respond to Slack with a message
  try {
    await slackClient.chat.postMessage({
      channel: channel_id, // Send the response to the same channel
      text: message,
    });

    // Respond back to Slack API with an acknowledgment
    res.status(200).json({
      response_type: "ephemeral", // Shows the response only to the user who triggered the command
      text: "I am greeting you in the channel!",
    });
  } catch (error) {
    console.error("Error responding to /hello command:", error);
    res.status(500).json({
      response_type: "ephemeral",
      text: "Sorry, something went wrong while processing your command.",
    });
  }
};

export default handleHelloCommand; 
