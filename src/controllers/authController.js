import UserToken from "../models/userToken.js";
import { sendMessageToUser } from "../services/slackService.js";

export const saveAccessToken = async (
  slackUserId,
  teamId,
  accessToken,
  email
) => {
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
  console.log("Getting token from database");
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
    console.log("failed to get token");
    console.error("Error retrieving access token:", error);
    throw new Error("Could not retrieve access token");
  }
};

export const getAppDataWithToken = async (slackUserId, teamId) => {
  console.log("Getting app data with token from database");
  try {
    // Find the user token by Slack user ID and team ID
    const userData = await UserToken.findOne({
      slack_user_id: slackUserId,
      // team_id: teamId, // Uncomment if you need to filter by team ID
    });

    if (!userData) {
      console.log("No access token found for this user.");
      await sendMessageToUser(
        userId,
        "You are not authorized to use this app. Please Login first by /login"
      );
    }

    // Extract app data
    const appData = userData.app_data;

    // Parse the dataSource and capability fields if they are stored as JSON strings
    const dataSource = JSON.parse(appData.dataSource || "[]");

    // Extract only the relevant parts from dataSource
    const dataSources = dataSource.map((item) => ({
      integrationDataId: item.integrationDataId,
      integrationId: item.integrationId,
    }));

    // Extract the appId from the data
    const appId = appData.id || null; // Assuming 'id' is the appId

    // Extract the access token
    const accessToken = userData.access_token;

    // Create the final object with the extracted data
    const result = {
      dataSources,
      appId,
      accessToken, // Include the access_token
    };

    return result;
  } catch (error) {
    console.log("failed to get token");
    console.error("Error retrieving access token:", error);
    throw new Error("Could not retrieve access token");
  }
};
