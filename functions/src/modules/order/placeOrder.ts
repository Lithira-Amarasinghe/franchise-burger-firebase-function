import functions = require("firebase-functions");
import admin = require("firebase-admin");

// eslint-disable-next-line require-jsdoc
function addOrderPlacedToFoodItem(data) {
  const foodItems = data.foodItems;
  for (const [key, value] of Object.entries(foodItems)) {
    data.foodItems[key].status = "ORDER_PLACED";
  }
}

export const placeOrder = functions.firestore.document("carts/{uid}")
  .onUpdate((change, context) => {
    const uid = context.params.uid;
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
        console.log(data);
        addOrderPlacedToFoodItem(data);
        return admin.firestore().collection("orders").
          doc(orderId.toString()).set(data)
          .then((result)=>{
            console.log(result);
            console.log("Field added:", newData.yourField);
            admin.firestore().collection("carts").
              doc(uid).delete().then((del)=>{
                console.log(del);
              });
          })
          .catch((error)=>{
            console.log("Error in placing order: ", error);
          });
      }
      return null;
    } catch (error) {
      console.error("Error in placing the order", error);
      return null;
    }
  });
