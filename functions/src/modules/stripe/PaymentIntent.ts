/*eslint-disable*/

const {onRequest} = require("firebase-functions/v2/https");
const express = require('express');
const app = express();
const cors = require('cors')

app.use(cors({origin: true}))

app.post('/', async (request, response) => {
    const stripe = require('stripe')(process.env.STRIPE_API_KEY);

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
    const stripe = require('stripe')(process.env.STRIPE_API_KEY);

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

export const paymentIntent = onRequest(
    {
        secrets:['STRIPE_API_KEY'],
        maxInstances: 10
    },app);
