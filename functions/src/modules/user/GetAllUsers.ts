/*eslint-disable*/
import admin = require("firebase-admin");
import functions = require('firebase-functions');
import * as corsModule from 'cors'

const cors = corsModule({origin: true}); // Import the cors module

export const getAllUsers = functions.https.onRequest((request, response) => {
    cors(request, response, () => {

        // if(!request.user) response.status(403).send("Unauthorized")
        const auth = admin.auth();
        auth.listUsers()
            .then((listUsersResult) => {
                response.send(listUsersResult);
            })
            .catch((error) => {
                console.error('Error listing users:', error);
                response.status(500).send('Error listing users');
            });
    })

});
