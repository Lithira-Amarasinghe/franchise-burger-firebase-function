/*eslint-disable*/

import functions = require("firebase-functions");
import admin = require("firebase-admin");
import {onDocumentWritten} from "firebase-functions/v2/firestore";


// eslint-disable-next-line require-jsdoc
function addOrderPlacedToFoodItem(data) {
  const foodItems = data.foodItems;
  for (const [key, value] of Object.entries(foodItems)) {
    data.foodItems[key].status = "ORDER_PLACED";
  }
}

function addLastOrderIdToUser(usersCollection, uid, orderId){
  admin.firestore().collection('user').doc(uid)
      .update(
          {
            lastOrderId:orderId,
            lastOrderStatus:'ORDER_PLACED'
          })
      .then(result=>console.log('Last order id added to user'))
      .catch(error => console.error('Error is saving last order id : ',error))
}

function orderFailed(usersCollection, uid){
  admin.firestore().collection(usersCollection).doc(uid)
      .update(
          {
            lastOrderStatus:'FAILED',
          })
      .then(result=>console.log('Last order id added to user'))
      .catch(error => console.error('Error is saving last order id : ',error))
}

export const placeOrder = functions.firestore.document("carts/{uid}")
  .onUpdate((change, context) => {
    const uid = context.params.uid;
    const usersCollection = "user"
    const cartsCollection = "carts"
    const ordersCollection = "orders"
    try {
      const newData = change.after.data();
      const previousData = change.before.data();
      if (!previousData.status && newData.status=="ORDER_PLACED") {
        const data = newData;
        const date = new Date();
        console.log(data);
        const orderId = ((+date.getTime()) * 37 + 5227509).toString().trim();
        data.orderId = orderId;
        data.createdAt = date.toISOString();
        data.isPrinted = false;
        console.log(data);
        addOrderPlacedToFoodItem(data);
        addLastOrderIdToUser(usersCollection, uid,orderId.toString());
        return admin.firestore().collection(ordersCollection).
          doc(orderId.toString()).set(data)
          .then((result)=>{
            console.log(result);
            console.log("Field added:", newData.yourField);
            admin.firestore().collection(cartsCollection).
              doc(uid).delete().then((del)=>{
                console.log("Cart cleared successfully");
              });
          })
          .catch((error)=>{
            console.log("Error in placing order: ", error);
          });
      }else if(!previousData.status && newData.status=="FAILED"){
        orderFailed(usersCollection, uid)
      }
      return null;
    } catch (error) {
      console.error("Error in placing the order", error);
      return null;
    }
  });
