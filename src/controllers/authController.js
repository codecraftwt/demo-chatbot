import UserToken from "../models/userToken.js";

export const saveAccessToken = async (slackUserId, teamId, accessToken, email) => {
  try {
    // Check if a token already exists for the user and team
    const existingToken = await UserToken.findOne({
      slack_user_id: slackUserId,
      team_id: teamId,
    });

    if (existingToken) {
      // Update the token if it already exists
      existingToken.access_token = accessToken;
      await existingToken.save();
      console.log("Token updated in the database");
    } else {
      // Create a new document for the user and team
      const newToken = new UserToken({
        slack_user_id: slackUserId,
        team_id: teamId,
        access_token: accessToken,
        email: email,
      });
      await newToken.save();
      console.log("Token saved in the database");
    }
  } catch (error) {
    console.error("Error saving token:", error);
  }
};

export const getAccessToken = async (slackUserId, teamId) => {
  try {
    // Find the user token by Slack user ID and team ID
    const userToken = await UserToken.findOne({
      slack_user_id: slackUserId,
      //   team_id: teamId,
    });

    if (!userToken) {
      throw new Error("No access token found for this user.");
    }
    const access_token = userToken.access_token;
    return access_token;
  } catch (error) {
    console.error("Error retrieving access token:", error);
    throw new Error("Could not retrieve access token");
  }
};
