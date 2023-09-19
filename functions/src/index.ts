/*eslint-disable*/
import admin = require("firebase-admin");
admin.initializeApp();

const assignUserRoleOnSignUp=require("./modules/user/AssignUserRoleOnSignUp");
const placeOrder = require("./modules/order/PlaceOrder");
const orderReady = require("./modules/order/orderReady");
const generateReceipt = require('./modules/order/GenerateReceipt');

const getAllUsers = require('./modules/user/GetAllUsers');
const assignARole = require('./modules/user/AssignARole');
const assignRoles = require('./modules/user/AssignRoles');

const terminal = require('./modules/stripe/Terminal');
const terminal_payment = require('./modules/stripe/TerminalPayment');
const simulate_card_tap = require('./modules/stripe/SimulateCardTapping');
const payment_intent = require('./modules/stripe/PaymentIntent');

const calculateTaxOnCartUpdate = require('./modules/cart/CartTaxCalculate');

exports.placeOrder = placeOrder.placeOrder;
exports.orderReady = orderReady.orderReady;

exports.assignUserRoleOnSign = assignUserRoleOnSignUp.assignUserRoleOnSignUp;
exports.getAllUsers = getAllUsers.getAllUsers
exports.assignARole = assignARole.assignARole;
exports.assignRoles = assignRoles.assignRoles;

exports.generateReceipt = generateReceipt.generateReceipt;

exports.terminal = terminal.terminal;
exports.terminal_payment = terminal_payment.terminalPayment;
exports.simulate_card_tapping = simulate_card_tap.simulateCardTapping;
exports.payment_intent = payment_intent.paymentIntent;

exports.calculateTaxOnCartUpdate = calculateTaxOnCartUpdate.calculateTaxOnCartUpdate;

// exports.webhooks = webhooks.webhooks;
