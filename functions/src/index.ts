/*eslint-disable*/
import admin = require("firebase-admin");
admin.initializeApp();

const assignUserRoleOnSignUp =
    require("./modules/user/AssignUserRoleOnSignUp");
const placeOrder = require("./modules/order/placeOrder");
const orderReady =
    require("./modules/order/orderReady")
const getAllUsers = require('./modules/user/GetAllUsers')
exports.placeOrder = placeOrder.placeOrder;
exports.assignUserRoleOnSign =
    assignUserRoleOnSignUp.assignUserRoleOnSignUp;
exports.orderReady =
    orderReady.orderReady;
exports.getAllUsers = getAllUsers.getAllUsers
