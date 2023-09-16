/*eslint-disable*/

const {onRequest} = require("firebase-functions/v2/https");
const express = require('express');
const app = express();

app.post('/', async (request, response) => {
    const stripe = require('stripe')(process.env.STRIPE_API_KEY);

    const data = request?.body;
    const terminalId = data?.terminalId;
    try {
        const reader = await stripe.testHelpers.terminal.readers.presentPaymentMethod(terminalId);
        response.status(200).send(reader)
    } catch (error) {
        response.status(500).send(error)
    }
})

export const simulateCardTapping = onRequest(
    {
        secrets:['STRIPE_API_KEY'],
        maxInstances: 10
    },app);
