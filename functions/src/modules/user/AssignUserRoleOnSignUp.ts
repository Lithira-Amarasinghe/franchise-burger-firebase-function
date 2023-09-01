import functions = require("firebase-functions");
import admin = require("firebase-admin");


export const assignUserRoleOnSignUp = functions.auth.user()
  .onCreate(async (user) => {
    try {
      // Add custom role to the user's custom claims
      const customClaims = {roles: ["user"]};
      await admin.auth().setCustomUserClaims(user.uid, customClaims);

      console.log(`Custom claims added for user: ${user.uid}`);
      return null;
    } catch (error) {
      console.error(`Error adding custom claims for user ${user.uid}:`, error);
      return null;
    }
  });
