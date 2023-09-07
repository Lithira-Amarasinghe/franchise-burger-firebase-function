/*eslint-disable*/
import * as corsModule from 'cors'

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');
const {Storage} = require('@google-cloud/storage');
const path = require('path');
const os = require('os');

const cors = corsModule({origin: true}); // Import the cors module

const dimensionConst = 2.83464567;

function calculateReceiptHeight(items: any[]) {
    let noOfItems = items.length;
    let height = noOfItems * 35
    height += 410;
    return height;
}

export const generateReceipt = functions.https.onRequest((request, response) => {

    cors(request, response, async () => {
        try {
            const data = request.body;
            const orderId = data.orderId;
            const address = data.address;
            const email = data.email;
            const phoneNo = data.phoneNo;
            const amount = data.amount;

            console.log('Order id : ', orderId);

            const items = [];
            await admin.firestore().collection("orders").doc(orderId.toString())
                .get().then(snapshot => {
                    const docData = snapshot.data();
                    const foodItems = docData?.foodItems;
                    for (const [key, value] of Object.entries(foodItems)) {
                        items.push(
                            // @ts-ignore
                            { name: value?.name, unitPrice: value?.sellingPrice, quantity: value.quantity, total: value.quantity * value.sellingPrice,
                            })
                    }
                });


            const pdfDocHeight = calculateReceiptHeight(items);
            let y = 0;

            console.log('Receipt height : ', pdfDocHeight)
            // Create a PDF document
            const pdfDoc: any = new PDFDocument({
                size: [227, pdfDocHeight],
                margins:{
                    left:10,
                    top:10,
                    bottom:10,
                    right:10
                }
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

            await admin.firestore().collection("orders").doc(orderId.toString()).get()
                .then(snapshot => {
                    const docData = snapshot.data();
                    console.log('Order details (firestore) : ', docData)
                    let orderDate = new Date(docData.createdAt).toLocaleString();

                    // Receipt Header
                    const restaurantName = "FRANCHISE BURGER";
                    pdfDoc.font('Helvetica-Bold');
                    pdfDoc.fontSize(14).text(restaurantName, {align: 'center'});
                    pdfDoc.moveDown();
                    pdfDoc.fontSize(10).text(`Order Number: ${orderId}`,{width:200});
                    pdfDoc.moveDown();
                    pdfDoc.text(`Order Date: ${orderDate}`,);
                    pdfDoc.moveDown();
                    pdfDoc.text(`Location : ${address}`,);
                    pdfDoc.moveDown();
                    pdfDoc.text(`${phoneNo} / ${email}`,);
                    pdfDoc.moveDown();
                    pdfDoc.text(`Mode      : ${docData.mode}`);
                    pdfDoc.fontSize(8).text('______________________________________________', {align: 'center'})
                })
                .catch(error =>{
                    console.error(error)
                })
            y = 190;
            // Receipt Items
            pdfDoc.font('Helvetica-Bold').fontSize(10);
            pdfDoc.text('Item Name', 10, y, {width: 60, align: 'left'});
            pdfDoc.text('Unit Price', 70, y, {width: 50, align: 'right'});
            pdfDoc.text('Quantity', 130, y, {width: 50, align: 'right'});
            pdfDoc.text('Total', 180, y, {width: 40, align: 'right'});
            pdfDoc.moveDown(1);

            pdfDoc.font('Helvetica').fontSize(10);
            console.log('FoodItems : ', items);
            y += 20;
            for (const item of items) {
                pdfDoc.text(item?.name, 10, y, {width: 200, align: 'left'});
                pdfDoc.text(`$${item?.unitPrice}`, 50, (y + 15), {width: 50, align: 'right'});
                pdfDoc.text(`${item?.quantity}`, 110,  (y + 15) , {width: 50, align: 'right'});
                pdfDoc.text(`$${item?.total}`, 180,  (y + 15) , {width: 40, align: 'right'});
                pdfDoc.moveDown(1);
                y += 35;
            }
            y+=10
            pdfDoc.text('--------------------------------------------------------------', 10, y,
                {align: 'center'})

            pdfDoc.moveDown();

            pdfDoc.font('Helvetica');
            let totalPrice = 0;

            // await createReceiptSummary(pdfDoc, orderId);
            await admin.firestore().collection("orders").doc(orderId.toString()).get()
                .then(snapshot => {
                    const docData = snapshot.data();
                    const totalPrice = docData.totalPrice;
                    const taxPercentage = data?.taxPercentage || 0;
                    // Receipt Summary
                    pdfDoc.font('Helvetica-Bold');
                    y+=20
                    pdfDoc.text('Subtotal  :', 10 , y,  { align: 'left', continued:true});
                    pdfDoc.text(`$${totalPrice.toFixed(2)}`, {align: 'right'});
                    y+=20;
                    pdfDoc.text('Tax         :',10 , y,  { align: 'left', continued:true});
                    const taxAmount = totalPrice * taxPercentage/100;
                    pdfDoc.text(`$${taxAmount.toFixed(2)}`, {align: 'right'});
                    y+=20;
                    pdfDoc.fontSize(12).text('Grand Total :',10 , y, {align: 'left', continued:true});
                    const grandTotal = (totalPrice + taxAmount).toFixed(2);
                    pdfDoc.text(`$${grandTotal}`, { align: 'right'});
                    y+=20;
                    pdfDoc.fontSize(10).text('CASH/CARD  :', 10 , y,  { align: 'left', continued:true});
                    pdfDoc.text(`$${amount.toFixed(2)}`, {align: 'right'});
                    y+=20;
                    pdfDoc.text('Balance  :', 10 , y,  { align: 'left', continued:true});
                    pdfDoc.text(`$${amount - grandTotal}`, {align: 'right'});

                    pdfDoc.moveDown();
                });
            // Receipt footer

            // Thank You Message
            pdfDoc.fontSize(11).text('Thank you for dining with us!', { align: 'center'});
            pdfDoc.fontSize(8).text('______________________________________________', {align: 'center'});
            pdfDoc.fontSize(6).text('System by Lithira Amarasinghe . Contact me : amarasinghelithira@gmail.com', {align:'left'})
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
        } catch (error) {
            console.log(error);
            response.status(500).send('Error in generating receipt')
        }
    })
});
