/*eslint-disable*/
// @ts-ignore

import * as corsModule from 'cors'
import {from} from "rxjs";

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');
const {Storage} = require('@google-cloud/storage');
const path = require('path');
const os = require('os');

const cors = corsModule({origin: true}); // Import the cors module

const dimensionConst = 2.83464567;


export const generateReceipt = functions.https.onRequest((request, response) => {

    cors(request, response, async () => {
        try {
            const data = request.body;
            const orderId = data.orderId;
            console.log('Order id : ', orderId);
            // Create a PDF document
            const pdfDoc: any = new PDFDocument({
                size: [226, 300], // Width and height in points (8.5 x 11 inches)
                margins: {
                    top: 20,       // Top margin in points (1 inch)
                    bottom: 20,    // Bottom margin in points (1 inch)
                    left: 10,      // Left margin in points (0.5 inch)
                    right: 10,     // Right margin in points (0.5 inch)
                },
            });
            const filePath = `receipts/${orderId}.pdf`; // Specify your custom path here
            const writeStream = admin
                .storage()
                .bucket()
                .file(filePath)
                .createWriteStream();

            // Set up the PDF content
            pdfDoc.pipe(writeStream);

            const taxRate = 0.1; // 10% tax rate

            // await createReceiptHeader(pdfDoc, orderId);
            await admin.firestore().collection("orders").doc(orderId.toString())
                .get().then(snapshot => {
                    const docData = snapshot.data();
                    console.log('Order details (firestore) : ', docData)
                    let orderDate = new Date(docData.createdAt).toLocaleString();

                    // Receipt Header
                    const restaurantName = "FRANCHISE BURGER";
                    pdfDoc.fontSize(10).text(restaurantName, {align: 'center', height: 10});
                    pdfDoc.moveDown(2);
                    pdfDoc.fontSize(8).text(`Order Number: ${orderId}`);
                    pdfDoc.moveDown(1)
                    pdfDoc.text(`Order Date: ${orderDate}`);
                    pdfDoc.text('-----------------------------------------------------------------------------', {align: 'center'})
                    pdfDoc.moveDown();
                })


            // createReceiptItemsHeader(pdfDoc);
            // Receipt Items
            pdfDoc.font('Helvetica-Bold');
            pdfDoc.text('Item Name', 10, 100, { width: 50, align: 'left'});
            pdfDoc.text('Unit Price', 80, 100, { width: 50,  align: 'right'});
            pdfDoc.text('Quantity', 130, 100, { width: 50, align: 'right'});
            pdfDoc.text('total', 200, 100, { width: 50,  align: 'right'});
            pdfDoc.moveDown(1);


            // await addReceiptItems(pdfDoc, orderId);
            const items = [];
            await admin.firestore().collection("orders").doc(orderId.toString())
                .get().then(snapshot => {
                    const docData = snapshot.data();
                    const foodItems = docData.foodItems;
                    for (const [key, value] of Object.entries(foodItems)) {
                        items.push(
                            // @ts-ignore
    {  name: value?.name,unitPrice: value?.sellingPrice, quantity: value.quantity,total: value.quantity * value.sellingPrice,
                            })
                    }
                });
            pdfDoc.font('Helvetica');
            console.log('FoodItems : ', items);
            const tableTop = 100;
            let y = tableTop + 20;
            for (const item of items) {
                pdfDoc.text(item?.name, 10, y,{width: 50, align: 'left'});
                pdfDoc.text(`$${item?.unitPrice}`, 100, y + 10,{width: 50, align: 'right' });
                pdfDoc.text(`${item?.quantity}`, 130, y + 10, {width: 0, align: 'right'});
                pdfDoc.text(`$${item?.total}`, 170, y + 10, {width: 0, align: 'right' });
                pdfDoc.moveDown(1);
                y += 30;
            }

            pdfDoc.text('-----------------------------------------------------------------------------', {align: 'center'})
            pdfDoc.moveDown();

            pdfDoc.font('Helvetica');
            let totalPrice = 0;

            // await createReceiptSummary(pdfDoc, orderId);
            await admin.firestore().collection("orders").doc(orderId.toString()).get()
                .then(snapshot => {
                    const docData = snapshot.data();
                    const totalPrice = docData.totalPrice;
                    // Receipt Summary
                    pdfDoc.font('Helvetica-Bold');
                    pdfDoc.text('Subtotal:', { width:'150',align: 'left', continued: true});
                    pdfDoc.text(`$${totalPrice.toFixed(2)}`, { align: 'right'});
                    pdfDoc.text('Tax (1%):', {width:'150', align: 'left', continued: true});
                    const taxAmount = totalPrice * 0.03;
                    pdfDoc.text(`$${taxAmount.toFixed(2)}`, { align: 'right'});
                    pdfDoc.text('Total:', {width:'150', align: 'left', continued: true});
                    const grandTotal = totalPrice + taxAmount;
                    pdfDoc.text(`$${grandTotal.toFixed(2)}`, { align: 'right'});
                    pdfDoc.moveDown();
                });

            // createReceiptFooter(pdfDoc);
            // Thank You Message
            pdfDoc.fontSize(8).text('Thank you for dining with us!', {width:'215', align: 'center'});
            pdfDoc.fontSize(8).text('-----------------------------------------------------------------------------', {width:'215',align: 'center'});
            // End the PDF

            pdfDoc.end();

            console.log('pdf generation ended')

            writeStream.on('finish', async () => {
                response.setHeader('Content-Type', 'application/pdf');
                response.setHeader('Content-Disposition', 'attachment; filename=Receipt.pdf');
                // Once the PDF is created and saved with a custom path, send a response
                // Generate a signed URL with a 1-hour expiration time
                // const options = {
                //     action: 'read',
                //     expires: Date.now() + 60 * 60 * 1000, // 1 hour in milliseconds
                // };
                // // Generate the signed URL
                // let signURL;
                // await admin.storage().bucket().file('receipts/16161616.pdf').getSignedUrl(options)
                //     .then((urls) => {
                //          signURL = urls;
                //         console.log('Access Link:', signURL);
                //         // You can now use the accessLink to provide public access to the file.
                //         return admin.firestore().collection('orders').doc(orderId)
                //             .update({receiptURL: signURL})
                //     }).then(result =>{
                //         console.log('URL saved :',result)
                //     })
                //     .catch((error) => {
                //         console.error('Error generating access link:', error);
                //         // Handle the error appropriately.
                //     });
                response.status(200).send('Receipt PDF saved successfully');
            });
        }catch (error){
            console.log('Error : ',error);
            response.status(500).send('Error in generating receipt')
        }
    })
});

// // Replace with your restaurant and order details
// function createReceiptHeader(pdfDoc, orderId) {
//
// }
//
// function createReceiptItemsHeader(pdfDoc) {
//
// }
//
// function addReceiptItems(pdfDoc: any, orderId) {
//
// }
//
// function createReceiptSummary(pdfDoc: any, orderId) {
//
// }
//
// function createReceiptFooter(pdfDoc: any) {
//
// }
