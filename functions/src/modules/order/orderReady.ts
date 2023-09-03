/*eslint-disable*/

import functions = require("firebase-functions");
import admin = require("firebase-admin");

export const orderReady = functions.firestore.document("orders/{uid}")
    .onUpdate((change, context) => {
        const uid = context.params.uid;
        const previousData = change.after.data();
        const newData = change.after.data();
        const foodItems = newData.foodItems;
        const noOfFoodItems = Object.keys(foodItems).length;
        console.log('No of foodItems : ', noOfFoodItems)
        let readyCount = 0;
        for (const [key, value] of Object.entries(foodItems)) {
            //@ts-ignore
            if (value?.status == 'READY') {
                readyCount++;
            }
        }
        console.log('No of foodItems ready: ', readyCount)

        if (!previousData.readiedAt && readyCount == noOfFoodItems) {
            newData.status = 'READY';
            console.log('Order after ready: ', newData)
            newData['readiedAt'] = new Date().toISOString().toString();
        }else{
            return null;
        }

        return admin.firestore().collection('orders').doc(uid).set(newData)
            .then(result => {
                console.log('order saved after ready : ', result)
            })
            .catch(error => {
                console.error('Error in saving order after ready', error)
            })
    });
