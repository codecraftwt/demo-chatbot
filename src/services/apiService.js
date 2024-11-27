import axios from "axios";
import { getAccessToken } from "../controllers/authController.js";
import UserToken from "../models/userToken.js";

// Function to send user credentials to your backend for authentication
export const authenticateUser = async (email, password) => {
  try {
    // Replace with your actual backend API for authentication
    const response = await axios.post(
      "https://acme.dev.airrived.ai/api/auth/login",
      {
        email: email,
        password: password,
      },
      {
        headers: {
          tenantid: "acme",
        },
      }
    );
    // If the response contains a token, return it
    if (response.data.access_token) {
      return response.data.access_token;
    } else {
      console.log("Error at credentials at backedn API");
      throw new Error("Invalid credentials");
    }
  } catch (error) {
    console.log("Error at backedn API", error);
    throw new Error("Authentication failed");
  }
};

// Function to fetch the list of apps from your backend API
export const fetchAppsFromBackend = async (user_id) => {
  console.log("Fetching apps from backedn ...........");
  const token = await getAccessToken(user_id);

  try {
    const response = await axios.get("https://acme.dev.airrived.ai/api/app", {
      headers: {
        tenantid: "acme",
        wsid: "1",
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Fetching apps successfully ...........", response.data.data);
    const filteredData = response.data.data.filter((item) => {
      const capabilities = JSON.parse(item.capability);
      return capabilities.some((capability) => capability.featureId === 3);
    });

    return filteredData;
  } catch (error) {
    console.log("Fetching apps failed ...........");
    console.error("Error fetching apps from backend:", error);
    throw new Error("Failed to fetch apps");
  }
};

// Function to fetch app data based on the selected app ID
export const fetchAppData = async (appId, userId) => {
  const token = await getAccessToken(userId);
  try {
    // Fetch the app data using the app ID
    const response = await axios.get(
      `https://acme.dev.airrived.ai/api/app/${appId}`,
      {
        headers: {
          tenantid: "acme",
          //   wsid: "1",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const appData = response.data.data;

    console.log(
      "-------=-=================App Data===============-=-=------------------",
      appData
    );

    // Update the existing UserToken document with the app data
    const updatedUserToken = await UserToken.findOneAndUpdate(
      {
        slack_user_id: userId, // Find the user based on Slack ID
      },
      {
        app_data: appData, // Save the entire app data object
      },
      { new: true } // Return the updated document
    );

    if (!updatedUserToken) {
      console.log("No user found for this team ID and Slack user ID");
    }

    console.log("App data saved to the existing UserToken document");

    return appData; // Return the app data after saving it
  } catch (error) {
    console.log("Error fetching app data:", error);
  }
};
