'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const PAGE_ACCESS_TOKEN = process.env.VERIFY_TOKEN	;

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send('236611865')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
	    let event = req.body.entry[0].messaging[i]
	    let sender = event.sender.id
	    if (event.message && event.message.text) {
		    let text = event.message.text
		    sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
	    }
    }
    res.sendStatus(200)
})

app.post('/webhook', (req, res) => {  

	// Parse the request body from the POST
	let body = req.body;
	console.log(req);
  
	// Check the webhook event is from a Page subscription
	if (body.object === 'page') {
  
	  // Iterate over each entry - there may be multiple if batched
	  body.entry.forEach(function(entry) {

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

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
		json: {
		    recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
		    console.log('Error sending messages: ', error)
		} else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}

function handleMessage(sender_psid, received_message) {

	let response;
  
	// Check if the message contains text
	if (received_message.text) {    
  
	  // Create the payload for a basic text message
	  response = {
		"text": `You sent the message: "${received_message.text}". Now send me an image!`
	  }
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
	}
  
	// Send the HTTP request to the Messenger Platform
	request({
	  "uri": "https://graph.facebook.com/v2.6/me/messages",
	  "qs": { "access_token": PAGE_ACCESS_TOKEN },
	  "method": "POST",
	  "json": request_body
	}, (err, res, body) => {
	  if (!err) {
		console.log('message sent!')
	  } else {
		console.error("Unable to send message:" + err);
	  }
	}); 
  }
  

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})