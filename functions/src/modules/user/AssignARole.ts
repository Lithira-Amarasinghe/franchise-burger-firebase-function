/*eslint-disable*/
import admin = require("firebase-admin");
import functions = require('firebase-functions');
import * as corsModule from 'cors'

const cors = corsModule({origin: true}); // Import the cors module

export const assignARole = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        let uid;
        let roles = [];
        try {
            const data = request?.body
            uid = data?.uid
            roles.push(data?.role);
            console.log('received data : ', data)
            await admin.auth().getUser(uid).then(result => {
                result?.customClaims?.roles.forEach(role => {
                    roles.push(role);
                });
            });
            // Add custom role to the user's custom claims
            console.log('Roles to assign : ', roles);
            roles = Array.from(new Set(roles));
            const customClaims = {roles: roles};
            await admin.auth().setCustomUserClaims(uid, customClaims);
            console.log(`A role assign to user: ${uid}`);
            return response.status(200).send({status:'success'});
        } catch (error) {
            console.error(`Error assigning role for user ${uid}:`, error);
            return response.status(500).send();
        }
    })
});
