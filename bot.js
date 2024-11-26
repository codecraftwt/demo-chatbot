import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import slackRoutes from "./src/routes/slackRoutes.js";
import { handleMessage } from "./src/controllers/messageController.js";
import connectDB from "./src/config/db.js";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to DB
connectDB();
app.use(cors());

app.use("/slack", slackRoutes);

// app.post("/hello", handleHelloCommand);

app.listen(port, () => {
  console.log(`Bot is running on port ${port}`);
});
