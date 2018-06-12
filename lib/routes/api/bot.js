'use strict';

// Imports dependencies and set up http server

const router = require('express').Router();

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Accepts POST requests at /webhook endpoint
router.post('/webhook', (req, res) => {

	// Parse the request body from the POST
	let body = req.body;

	// Check the webhook event is from a Page subscription
	if (body.object === 'page') {

		body.entry.forEach(function (entry) {

			// Gets the body of the webhook event
			let webhook_event = entry.messaging[0];
			console.log(webhook_event);

			// Get the sender PSID
			let sender_psid = webhook_event.sender.id;
			console.log('Sender PSID: ' + sender_psid);

			// Check if the event is a message or postback and
			// pass the event to the appropriate handler function
			if (webhook_event.message) {
				handleMessage(sender_psid, webhook_event.message);
			} else if (webhook_event.postback) {
				handlePostback(sender_psid, webhook_event.postback);
			}
		});

		// Return a '200 OK' response to all events
		res.status(200).send('EVENT_RECEIVED');
	} else {
		// Return a '404 Not Found' if event is not from a page subscription
		res.sendStatus(404);
	}
});

function handleMessage(sender_psid, received_message) {

	let response;

	// Check if the message contains text
	if (received_message.text) {

		// Create the payload for a basic text message
		response = {
			"text": `You sent the message: "${received_message.text}". Now send me an image!`
		};
	}

	// Sends the response message
	callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
	// Construct the message body
	let request_body = {
		"recipient": {
			"id": sender_psid
		},
		"message": response

		// Send the HTTP request to the Messenger Platform
	};request({
		"uri": "https://graph.facebook.com/v2.6/me/messages",
		"qs": {
			"access_token": PAGE_ACCESS_TOKEN
		},
		"method": "POST",
		"json": request_body
	}, (err, res, body) => {
		if (!err) {
			console.log('message sent!');
		} else {
			console.error("Unable to send message:" + err);
		}
	});
}

// Accepts GET requests at the /webhook endpoint
router.get('/webhook', (req, res) => {

	/** UPDATE YOUR VERIFY TOKEN **/
	const VERIFY_TOKEN = "testbot_verify_token";

	// Parse params from the webhook verification request
	let mode = req.query['hub.mode'];
	let token = req.query['hub.verify_token'];
	let challenge = req.query['hub.challenge'];

	// Check if a token and mode were sent
	if (mode && token) {

		// Check the mode and token sent are correct
		if (mode === 'subscribe' && token === VERIFY_TOKEN) {

			// Respond with 200 OK and challenge token from the request
			console.log('WEBHOOK_VERIFIED');
			res.status(200).send(challenge);
		} else {
			// Responds with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403);
		}
	}
});

module.exports = router;