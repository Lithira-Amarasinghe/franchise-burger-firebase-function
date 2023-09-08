/*eslint-disable*/

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();
const cors = require('cors')

const stripe = require('stripe')
('sk_test_51Nic2dLJfluVTg0aHqpKmjA7Y8SxySEOaDxrcTUxS49VZnO3rO9UlVSEsiPRwJCNygACyn0WCVFOmGTYpUf4BshT00lfRWpoHG');

app.use(cors({origin: true}))

app.post('/', async (request, response) => {
        const data = request?.body;
        const terminalId = data?.terminalId;
        const paymentIntentId = data?.paymentIntentId;
        const amount = data?.amount;
        const uid = data?.uid;

        try {
            await stripe.terminal.readers.setReaderDisplay(
                terminalId,
                {
                    type: 'cart',
                    cart: {
                        line_items: [
                            {
                                description: 'Caramel latte',
                                amount: 659,
                                quantity: 1,
                            },
                            {
                                description: 'Dozen donuts',
                                amount: 1239,
                                quantity: 1,
                            },
                        ],
                        currency: 'usd',
                        tax: 100,
                        total: amount,
                    },
                }
            );
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                payment_method_types: ['card_present'],
                capture_method: 'automatic',
                amount: amount,
            });

            console.log('Payment intent : ', paymentIntent)
            const reader = await stripe.terminal.readers.processPaymentIntent(
                terminalId,
                {
                    payment_intent: paymentIntent.id,
                }
            );

            // await admin.firestore().collection('carts')
            //     .doc(uid).update({'paymentIntentId': paymentIntent.id})
            //     .then(result => console.log('Payment intent id saved '))
            //     .catch(error => console.error('Error in saving payment intent id ', error))
            response.status(200).send(reader);

        } catch (error) {
            response.status(500).send(error);
        }

});

// const endpointSecret = "whsec_e2f71cbb3b3d28ae7d895cad181c4f9b959df375ed31b63d9f528fee2a27c5cd";

// app.post('/webhook/succeed', express.raw({type: 'application/json'}), (request, response) => {
//     const sig = request.headers['stripe-signature'];
//
//     let event;
//
//     try {
//         event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//     } catch (err) {
//         response.status(400).send(`Webhook Error: ${err.message}`);
//         return;
//     }
//
//     // Handle the event
//     switch (event.type) {
//         case 'terminal.reader.action_succeeded':
//             const terminalReaderActionSucceeded = event.data.object;
//             // Then define and call a function to handle the event terminal.reader.action_succeeded
//             break;
//         // ... handle other event types
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }
//
//     // Return a 200 response to acknowledge receipt of the event
//     response.send();
// });

export const processPayment = functions.https.onRequest(app);
