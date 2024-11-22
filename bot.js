import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import { handleMessage } from "./src/controllers/messageController.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route for Slack verification (for URL verification)
app.post("/slack/events", handleMessage);

app.post("/hello", handleHelloCommand);

app.listen(port, () => {
  console.log(`Bot is running on port ${port}`);
});
