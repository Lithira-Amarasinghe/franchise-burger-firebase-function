/*eslint-disable*/

const {onRequest} = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
const express = require('express');
const app = express();
const cors = require('cors')

app.use(cors({origin: true}))

app.post('/process_payment', async (request, response) => {
    const stripe = require('stripe')(process.env.STRIPE_API_KEY);
    let usersCollection='user';
    let cartsCollection='carts';

    const data = request?.body;
    const terminalId = data?.terminalId;
    const paymentIntentId = data?.paymentIntentId;
    const amount = +data?.amount;
    const uid = data?.uid;
    const name = data?.name;
    const phoneNo = data?.phoneNo;
    const email = data?.email;
    const note = data?.note;
    const mode = data?.mode;
    const paymentOption = data?.paymentOption;
    console.log('',uid)
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
        await admin.firestore().collection(usersCollection)
            .doc(uid).update({
                lastOrderId:'',
                lastOrderStatus:''
            })
            .then(result => console.log('Last Order id removed before terminal payment start'))
            .catch(error => console.error('Error in removing last order id : ', error))

        let data = {
            lastModifiedAt: new Date().toISOString(),
            customerName: name,
            phoneNo: phoneNo,
            email: email,
            amount:(+amount / 100),
            note:note,
            mode:mode,
            paymentOption:paymentOption,
            status: ''
        }
        await admin.firestore().collection(cartsCollection)
            .doc(uid).update(data)
            .then(result => console.log('Cart updated successfully. Updated data : ', data))
            .catch(error => console.error('Error in updating cart : ', error))

        console.log('Payment intent : ', paymentIntent)
        const reader = await stripe.terminal.readers.processPaymentIntent(
            terminalId,
            {
                payment_intent: paymentIntent.id,
            }
        );
        let dataAfterPayment = {
            paymentIntentId: paymentIntent?.id,
        }
        await admin.firestore().collection(cartsCollection).doc(uid)
            .update(dataAfterPayment)
            .then(result => console.log('Payment intent id saved '))
            .catch(error => console.error('Error in saving payment intent id : ', error))
        response.status(200).send(reader);

    } catch (error) {
        switch (error.type) {
            case 'StripeCardError':
                console.log(`A payment error occurred: ${error.message}`);
                break;
            case 'StripeInvalidRequestError':
                console.log(`An invalid request occurred.  ${error.message}`);
                break;
            default:
                console.log('Another problem occurred, maybe unrelated to Stripe.');
                break;
        }
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

export const terminalPayment = onRequest(
    {
        secrets:['STRIPE_API_KEY'],
        maxInstances: 10
    },app);
