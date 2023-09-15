/*eslint-disable*/
import {raw} from "express";

const cors = require('cors'); // Import the cors module
const functions = require('firebase-functions');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const stripe = require('stripe')
('sk_test_51Nic2dLJfluVTg0aHqpKmjA7Y8SxySEOaDxrcTUxS49VZnO3rO9UlVSEsiPRwJCNygACyn0WCVFOmGTYpUf4BshT00lfRWpoHG');

// This is your Stripe CLI webhook secret for testing your endpoint locally.
// const signingSecret = "whsec_2f644nf6isYGMWsjheZjTms6FrjDKRgu";
// const endpointSecret = 'whsec_e2f71cbb3b3d28ae7d895cad181c4f9b959df375ed31b63d9f528fee2a27c5cd';
// Use body-parser middleware to capture the raw request body as a Buffer
const endpointSecret = "whsec_e2f71cbb3b3d28ae7d895cad181c4f9b959df375ed31b63d9f528fee2a27c5cd";

app.use(cors({origin: true}))

// app.use(bodyParser.json({
//     verify(req, res, buf: Buffer, encoding: string) {
//         req.rawBody = buf
//     }
// }))

app.post('/terminal-payment-success', express.raw({type: 'application/json'}), (request, response) => {
    let event;
    const sig = request.headers['stripe-signature'];
    console.log('signature', sig)
    try {
        event = stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret);
        console.log('Verification successfull...')
    }
    catch (err) {
        console.log('Error in verifing the request')
        response.status(400).send(`Webhook Error: ${err.message}`);
    }
    // event=request.body;
    // console.log('Request data : ',event)
    console.log('Event type   : ',event.type)
    // response.status(200).send();
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('payment intent succeeded')
            // Then define and call a method to handle the successful payment intent.
            // handlePaymentIntentSucceeded(paymentIntent);
            break;
        case 'payment_method.attached':
            const paymentMethod = event.data.object;
            // Then define and call a method to handle the successful attachment of a PaymentMethod.
            console.log('payment method attached')
            // handlePaymentMethodAttached(paymentMethod);
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.status(200).send();
});

export const webhooks = functions.https.onRequest(app);
