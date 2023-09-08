/*eslint-disable*/
const functions = require('firebase-functions');
const express = require('express');
const app = express();

const stripe = require('stripe')
('sk_test_51Nic2dLJfluVTg0aHqpKmjA7Y8SxySEOaDxrcTUxS49VZnO3rO9UlVSEsiPRwJCNygACyn0WCVFOmGTYpUf4BshT00lfRWpoHG');

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const signingSecret = "whsec_2f644nf6isYGMWsjheZjTms6FrjDKRgu";
// Use body-parser middleware to capture the raw request body as a Buffer
app.use(express.json());
app.post('/terminal-payment-success', express.raw({type: 'application/json'}), (request, response) => {
    let event = request.body;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (signingSecret) {
        // Get the signature sent by Stripe
        const signature = request.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(
                request.body,
                signature,
                signingSecret
            );
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`, err.message);
            return response.sendStatus(400);
        }
    }

    console.log('Type : ',event.type)
    // // Handle the event
    // switch (event.type) {
    //     case 'terminal.reader.action_succeeded':
    //         const terminalReaderActionSucceeded = event.data.object;
    //         // Then define and call a function to handle the event terminal.reader.action_succeeded
    //         break;
    //     // ... handle other event types
    //     default:
    //         console.log(`Unhandled event type ${event.type}`);
    // }

    // Return a 200 response to acknowledge receipt of the event
    response.status(200).send({success:true});

});

export const webhooks = functions.https.onRequest(app);
