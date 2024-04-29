var express = require('express');
var router = express.Router();
const FitbitApiClient = require("fitbit-node");

const client = new FitbitApiClient({
	clientId: process.env.FITBIT_CLIENT_ID,
	clientSecret: process.env.FITBIT_CLIENT_SECRET,
	apiVersion: '1.2' // 1.2 is the default
});

// redirect the user to the Fitbit authorization page
router.get('/authorize', (req, res) => {
    res.redirect(client.getAuthorizeUrl('activity heartrate location nutrition profile settings sleep social weight', 'localhost:3000'));
});

// handle the callback from the Fitbit authorization flow
router.get("/callback", (req, res) => {
	// exchange the authorization code we just received for an access token
	client.getAccessToken(req.query.code, 'localhost:3000').then(result => {
		// use the access token to fetch the user's profile information
		client.get("/profile.json", result.access_token).then(results => {
			res.send(results[0]);
		}).catch(err => {
			res.status(err.status).send(err);
		});
	}).catch(err => {
		res.status(err.status).send(err);
	});
});

module.exports = router;
