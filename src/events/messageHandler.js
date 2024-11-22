import slackClient from "../config/slackConfig.js";

export const handleDirectMessage = async (channel, message) => {
  try {
    // Ensure the bot is in the channel
    await slackClient.conversations.join({ channel });

    // Send the message
    await slackClient.chat.postMessage({
      channel: message.channel,
      text: `Hello! You sent me: "${message.text}"`,
    });
  } catch (error) {
    console.error("Error handling direct message:", error);
  }
};

export default handleDirectMessage;
