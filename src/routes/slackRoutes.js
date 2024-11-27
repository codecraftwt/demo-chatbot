// src/routes/slackRoutes.js
import { Router } from "express";
import {
  handleMessage,
  handleLoginCommand,
  handleModalSubmission,
  handleGetAppDataCommand,
  // handleAppModalSubmission,
  handleQuestion,
} from "../controllers/messageController.js";

const router = Router();

// Route for Slack event verification
// router.post("/events", handleMessage);

// Route for handling the question from Slack (direct interaction)
// router.post("/question", handleQuestion);
router.post("/events", handleQuestion);

// Route for handling login
router.post("/login", handleLoginCommand);

// Route for handling modal submissions (Slack interactions)
router.post("/interactions", handleModalSubmission);

// Route for handling the /choose-app slash command
router.post("/getAppData", handleGetAppDataCommand);

// Route for handling modal submissions getting App ID (Slack interactions)
// router.post("/interactions", handleAppModalSubmission);

router.post("/options-load-endpoint");

export default router;
