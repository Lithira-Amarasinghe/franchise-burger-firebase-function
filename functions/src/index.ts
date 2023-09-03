/*eslint-disable*/
import admin = require("firebase-admin");
admin.initializeApp();

const assignUserRoleOnSignUp=require("./modules/user/AssignUserRoleOnSignUp");
const placeOrder = require("./modules/order/placeOrder");
const orderReady = require("./modules/order/orderReady")
const getAllUsers = require('./modules/user/GetAllUsers')
const assignARole = require('./modules/user/AssignARole')

exports.placeOrder = placeOrder.placeOrder;
exports.orderReady = orderReady.orderReady;

exports.assignUserRoleOnSign = assignUserRoleOnSignUp.assignUserRoleOnSignUp;
exports.getAllUsers = getAllUsers.getAllUsers
exports.assignARole = assignARole.assignARole;
