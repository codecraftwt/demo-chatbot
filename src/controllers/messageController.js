import slackClient from "../config/slackConfig.js";

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

export default handleMessage;
