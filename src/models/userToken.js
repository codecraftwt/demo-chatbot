import mongoose from "mongoose";

const userTokenSchema = new mongoose.Schema({
  slack_user_id: { type: String, required: true }, // User's Slack ID
  team_id: { type: String, required: true }, // Team ID (workspace)
  access_token: { type: String, required: true }, // Store the access token here
  email: { type: String, required: true }, // User's email (for reference)
  createdAt: { type: Date, default: Date.now },
});

const UserToken = mongoose.model("UserToken", userTokenSchema);

export default UserToken;
