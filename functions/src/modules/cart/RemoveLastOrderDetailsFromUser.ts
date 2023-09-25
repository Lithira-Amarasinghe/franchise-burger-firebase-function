/*eslint-disable*/

import functions = require("firebase-functions");
import admin = require("firebase-admin");


export const removeLastOrderDetailsFromUser = functions.firestore.document("carts/{uid}")
    .onCreate(async (change, context) => {
        const uid = context?.params?.uid;
        try {
            const data = {
                lastOrderId: '',
                lastOrderStatus: ''
            }
            await admin.firestore().doc(`user/${uid}`).update(data)
                .then(result => {
                    console.log('Last order details removed successfully')
                })
                .catch(error => {
                    console.error('Error in removing last order details : ', error)
                })
            return null;
        } catch (error) {
            console.error(`Error adding custom claims for user ${uid}:`, error);
            return null;
        }
    });
