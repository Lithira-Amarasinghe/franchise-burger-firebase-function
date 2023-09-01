/*eslint-disable*/
import admin = require("firebase-admin");
admin.initializeApp();

const assignUserRoleOnSignUp =
    require("./modules/user/AssignUserRoleOnSignUp");
const placeOrder = require("./modules/order/placeOrder");

exports.placeOrder = placeOrder.placeOrder;
exports.assignUserRoleOnSign =
    assignUserRoleOnSignUp.assignUserRoleOnSignUp;
