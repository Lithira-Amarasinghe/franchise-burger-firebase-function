/*eslint-disable*/

const functions = require('firebase-functions');
const express = require('express');
const app = express();
const cors = require('cors')
const stripe = require('stripe')
('sk_test_51Nic2dLJfluVTg0aHqpKmjA7Y8SxySEOaDxrcTUxS49VZnO3rO9UlVSEsiPRwJCNygACyn0WCVFOmGTYpUf4BshT00lfRWpoHG');

app.use(cors({origin: true}))

app.post('/', async (request, response) => {

    const data = request?.body;
    const amount = data?.amount;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            currency: 'usd',
            payment_method_types: ['card_present'],
            capture_method: 'automatic',
            amount: amount,
        });
        response.status(200).send(paymentIntent)

    } catch (error) {
        response.status(500).send(error)
    }
});

app.get('/:paymentIntentId', async (request, response) => {
    const paymentIntentId = request.params.paymentIntentId;
    console.log('payment intent id : ', request)
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        response.status(200).send(paymentIntent)
    } catch (error) {
        console.log(error)
        response.status(500).send(error)
    }
});

export const paymentIntent = functions.https.onRequest(app);
