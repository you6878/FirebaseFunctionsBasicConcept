// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');


exports.hello = functions.database.ref('/hello').onWrite(event => {
    // set() returns a promise. We keep the function alive by returning it.
    return event.data.ref.set('world!').then(() => {
        return event.data.ref.set('world2')
    }).then(() => {
        console.log("Success")
    });
});