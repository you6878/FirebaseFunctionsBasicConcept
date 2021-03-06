const chai = require('chai')
const sinon = require('sinon')

const assert = chai.assert
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)




var myFunctions, configStub, adminInitStub, functions, admin;


// Since index.js makes calls to functions.config and admin.initializeApp at the top of the file,
// we need to stub both of these functions before requiring index.js. This is because the
// functions will be executed as a part of the require process.
// Here we stub admin.initializeApp to be a dummy function that doesn't do anything.
admin = require('firebase-admin');
adminInitStub = sinon.stub(admin, 'initializeApp');
// Next we stub functions.config(). Normally config values are loaded from Cloud Runtime Config;
// here we'll just provide some fake values for firebase.databaseURL and firebase.storageBucket
// so that an error is not thrown during admin.initializeApp's parameter check
functions = require('firebase-functions');
configStub = sinon.stub(functions, 'config').returns({
    firebase: {
        databaseURL: 'https://not-a-project.firebaseio.com',
        storageBucket: 'not-a-project.appspot.com',
    }
    // You can stub any other config values needed by your functions here, for example:
    // foo: 'bar'
});
// Now we can require index.js and save the exports inside a namespace called myFunctions.
// This includes our cloud functions, which can now be accessed at myFunctions.makeUppercase
// and myFunctions.addMessage
myFunctions = require('../index');


// Restoring our stubs to the original methods.
configStub.restore();
adminInitStub.restore();

const refParam = '/messages';
const pushParam = { original: 'input' };
const refStub = sinon.stub();
const pushStub = sinon.stub();



// The following 4 lines override the behavior of admin.database().ref('/messages')
// .push({ original: 'input' }) to return a promise that resolves with { ref: 'new_ref' }.
// This mimics the behavior of a push to the database, which returns an object containing a
// ref property representing the URL of the newly pushed item.
databaseStub = sinon.stub(admin, 'database');
databaseStub.returns( { ref: refStub });
refStub.withArgs(refParam).returns( { push: pushStub });
pushStub.withArgs(pushParam).returns( Promise.resolve({ ref: 'new_ref' }));


// A fake request object, with req.query.text set to 'input'
const req = { query: {text: 'input'} };
// A fake response object, with a stubbed redirect function which asserts that it is called
// with parameters 303, 'new_ref'.
const res = {
    redirect: (code, url) => {
        assert.equal(code, 303);
        assert.equal(url, 'new_ref');

    }
};

// Invoke addMessage with our fake request and response objects. This will cause the
// assertions in the response object to be evaluated.
myFunctions.addMessage(req, res);