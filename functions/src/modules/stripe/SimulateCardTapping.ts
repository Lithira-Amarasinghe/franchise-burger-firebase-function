/*eslint-disable*/
const functions = require('firebase-functions');
const express = require('express');
const app = express();

const stripe = require('stripe')
('sk_test_51Nic2dLJfluVTg0aHqpKmjA7Y8SxySEOaDxrcTUxS49VZnO3rO9UlVSEsiPRwJCNygACyn0WCVFOmGTYpUf4BshT00lfRWpoHG');

app.post('/', async (request, response) => {
    const data = request?.body;
    const terminalId = data?.terminalId;
    try {
        const reader = await stripe.testHelpers.terminal.readers.presentPaymentMethod(terminalId);
        response.status(200).send(reader)
    } catch (error) {
        response.status(500).send(error)
    }
})

export const simulateCardTapping = functions.https.onRequest(app);
