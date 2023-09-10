/*eslint-disable*/


const functions = require('firebase-functions');
const express = require('express');
const app = express();
const cors = require('cors'); // Import the cors module
const stripe = require('stripe')
('sk_test_51Nic2dLJfluVTg0aHqpKmjA7Y8SxySEOaDxrcTUxS49VZnO3rO9UlVSEsiPRwJCNygACyn0WCVFOmGTYpUf4BshT00lfRWpoHG');


app.use(cors({origin: true}))

app.post('/register', async (request, response) => {
        const data = request.body;
        const locationId = data.locationId;
        const registrationCode = data.registrationCode;
        const label = data.label;
        try {
            const reader = await stripe.terminal.readers.create({
                registration_code: registrationCode,
                label: label,
                location: locationId,
            });
            response.status(200).send(reader)
        } catch (error) {
            response.status(500).send(error)
        }
})

app.get('/readers', async (request, response) => {
        try {
            const readers = await stripe.terminal.readers.list();
            response.status(200).send(readers)
        } catch (error) {
            response.status(500).send(error)
        }
})


app.post('/cancel_payment', async (request, response) => {
    const data = request?.body;
    const terminalId = data?.terminalId;

    try {
        const reader = await stripe.terminal.readers.cancelAction(terminalId);
        response.status(200).send(reader);

    } catch (error) {
        response.status(500).send(error);
    }
})

app.get('', async (request, response) => {
        try {
            const data = request.body;
            const readerId = data.readerId
            const reader = await stripe.terminal.readers.retrieve(readerId);
            response.status(200).send(reader)
        } catch (error) {
            response.status(500).send(error)
        }
})

export const terminal = functions.https.onRequest(app);
