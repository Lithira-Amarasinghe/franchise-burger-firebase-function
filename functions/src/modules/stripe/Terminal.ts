/*eslint-disable*/

import admin = require("firebase-admin");
import {runWith} from "firebase-functions";
// const functions = require('firebase-functions');
const {onRequest} = require("firebase-functions/v2/https");
const express = require('express');
const app = express();
const cors = require('cors'); // Import the cors module

const {defineSecret} = require("firebase-functions/params");

// Define the secret parameter
// const stripeApiKey = defineSecret("STRIPE_API_KEY");

// const stripe = require('stripe')
// ('sk_test_51Nic2dLJfluVTg0aHqpKmjA7Y8SxySEOaDxrcTUxS49VZnO3rO9UlVSEsiPRwJCNygACyn0WCVFOmGTYpUf4BshT00lfRWpoHG');

// const endpointSecret = "whsec_e2f71cbb3b3d28ae7d895cad181c4f9b959df375ed31b63d9f528fee2a27c5cd";
// const endpointSecret = "whsec_2f644nf6isYGMWsjheZjTms6FrjDKRgu";
// const endpointSecret = defineSecret("STRIPE_ENDPOINT_SECRET")


app.use(cors({origin: true}))

app.post('/register', async (request, response) => {
    const stripe = require('stripe')(process.env.STRIPE_API_KEY);
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
    const stripe = require('stripe')(process.env.STRIPE_API_KEY);
    try {
        const readers = await stripe.terminal.readers.list();
        response.status(200).send(readers)
    } catch (error) {
        response.status(500).send(error)
    }
})

app.post('/cancel_payment', async (request, response) => {
    const stripe = require('stripe')(process.env.STRIPE_API_KEY);
    const data = request?.body;
    const terminalId = data?.terminalId;

    try {
        const reader = await stripe.terminal.readers.cancelAction(terminalId);
        response.status(200).send(reader);

    } catch (error) {
        response.status(500).send(error);
    }
})

app.get('/:terminalId', async (request, response) => {
    const stripe = require('stripe')(process.env.STRIPE_API_KEY);
    try {
        const readerId = request.params.terminalId;
        const reader = await stripe.terminal.readers.retrieve(readerId);
        response.status(200).send(reader)
    } catch (error) {
        response.status(500).send(error)
    }
})

app.post('/webhook/terminal_payment_success', express.raw({type: 'application/json'}),
    async (request, response) => {
        // functions.runWith({secrets:['SUPER_SRETE']})
        const stripe = require('stripe')(process.env.STRIPE_API_KEY);
        console.log('Stripe api key : ', process.env.STRIPE_API_KEY)
        let event;
        const sig = request.headers['stripe-signature'];
        console.log('endpointSecret : ', process.env.STRIPE_ENDPOINT_SECRET)
        console.log('endpointSecret value : ', process.env.STRIPE_ENDPOINT_SECRET)
        try {
            event = stripe.webhooks.constructEvent(request.rawBody, sig, process.env.STRIPE_ENDPOINT_SECRET);
        } catch (err) {
            response.status(400).send(`Webhook Error: ${err.message}`);
        }
        // event=request.body;
        // console.log('Request data : ',event)
        // console.log('Event type   : ', event.type)
        // response.status(200).send();
        // Handle the event
        switch (event.type) {
            case 'terminal.reader.action_succeeded':
                const paymentIntent = event.data.object;
                // console.log('Payment intent: ',paymentIntent)
                console.log('payment intent succeeded')
                let cartDocData;
                let docId;
                let paymentIntentId = paymentIntent.action.process_payment_intent.payment_intent;
                console.log('payment intend Id : ',paymentIntentId)
                await admin.firestore().collection('carts')
                    .where('paymentIntentId', '==', paymentIntentId)
                    .get()
                    .then((querySnapshot) => {
                        // Iterate through the filtered documents
                        querySnapshot.forEach((doc) => {
                            // Access the data of each document
                            const data = doc.data();
                            cartDocData = data;
                            docId = cartDocData.uid
                            console.log('cart doc data : ',cartDocData);
                        })
                    })
                admin.firestore().collection('carts').doc(docId)
                    .update({
                        status: 'ORDER_PLACED'
                    }).then((result:any) => {
                    console.log('Order placed successfully');
                });
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

// export const terminal = functions.https.onRequest(app);
export const terminal = onRequest(
    {
        secrets:['STRIPE_API_KEY','STRIPE_ENDPOINT_SECRET'],
        maxInstances: 10
    },app);
