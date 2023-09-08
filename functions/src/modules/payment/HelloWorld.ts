/*eslint-disable*/

const functions = require('firebase-functions');
const express = require('express');
const app = express();

// Define routes and middleware here

// Example route
app.get('/api/hello', (req, res) => {
    res.status(200).json({ message: 'Hello from Express.js in Firebase Functions!' });
});

// Use the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
