/*eslint-disable*/
import admin = require("firebase-admin");
import functions = require("firebase-functions");


export const calculateTaxOnCartUpdate = functions.firestore.document("carts/{uid}")
    .onWrite(async (change, context) => {
        try {
            // Get an object with the current document values.
            // If the document does not exist, it was deleted
            const newData = change.after?.data();
            const previousData = change.before?.data();

            const uid = context.params.uid

            let totalPrice: number = +newData?.subTotal;
            console.log('Updated cart document : ', newData)
            let taxPercentage: number = 0;
            if (newData) {
                await admin.firestore().collection('restaurants').doc('shop0001').get()
                    .then(result => {
                        taxPercentage = +result.data()?.taxPercentage;
                    })
                console.log('Tax percentage : ',taxPercentage)
                const tax = parseFloat((totalPrice * taxPercentage / 100).toFixed(2));
                console.log('Tax',tax)
                totalPrice = totalPrice + tax;
                return await admin.firestore().collection('carts').doc(uid)
                    .update(
                        {
                            tax: tax,
                            totalPrice : totalPrice
                        })
                    .then(result => {
                        console.log('Tax updated successfully');
                    })
                    .catch(error => {
                        console.error('Error in updating tax : ', error);
                    })
            }

            return null;
        } catch (error) {
            console.error('Error in updating tax ', error);
            return null;
        }

        // perform more operations ...
    });
