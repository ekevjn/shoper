'use strict';

// Imports dependencies and set up http server
const
	mongoose = require('mongoose'),
	request = require('request'),
	Product = mongoose.model('Product'),
	sysConfig = require('../../config'),
	router = require('express').Router();

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

function firstEntity(nlp, name) {
	return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
}

function confidence(entity, score) {
	return entity && entity.confidence > (score ? score : 0.5);
}

async function handleMessage(sender_psid, received_message) {

	let response;

	// Check if the message contains text
	if (received_message.text) {
		const greeting = firstEntity(received_message.nlp, 'greeting');
		const askingForHelp = firstEntity(received_message.nlp, 'ask_for_search');
		if (confidence(greeting, 0.8)) {
			response = {
				"text": `Chào bạn, mình có thể giúp gì cho bạn?`
			}
		} else if (confidence(askingForHelp)) {
			response = {
				"text": `Bạn cần mình tìm sản phẩm nào?`
			}
		} else {
			// Create the payload for a basic text message
			const _query = new RegExp(received_message.text, "i")
			try {
				response = await searchProduct(_query);
			} catch (err) {
				response = {
					text: err
				}
			}
		}
		// Sends the response message
		if(Array.isArray(response)){
			response.forEach(res => callSendAPI(sender_psid, res));
		} else {
			callSendAPI(sender_psid, response);
		}
		console.info('Response: ', response);
	}
}

function searchProduct(query) {
	return new Promise((resolve, reject) => {
		let response;
		Product.find({
				$or: [{
					'name': query
				}, {
					'brand': query
				}]
			})
			.limit(10)
			.sort('price')
			.select('name brand price imageSrc url')
			.exec((err, doc) => {
				response = {
					"text": `Rất tiếc cửa hàng chúng tôi không có sản phần mà bạn cần tìm! `
				}
				if (err) {
					console.error(err);
					reject("Xin lỗi máy chủ đang gặp sự cố, vui lòng thử lại sau!");
				} else if (doc && doc.length > 0) {
					const response = {
						attachment: {
							type: 'template',
							payload: {
								template_type: 'generic',
								elements: []
							}
						}
					}
					doc.forEach(val => {
						const responseElement = {
							title: val.name,
							image_url: 'https:'.concat(val.imageSrc),
							subtitle: val.brand.concat('\n',val.price),
							default_action: {
								type: 'web_url',
								url: val.url,
								webview_height_ratio: 'tall'
							},
							buttons: [
								{
									type: 'web_url',
									url: val.url,
									title: 'Chi Tiết'
								},
								{
									type: 'web_url',
									url: 'https://www.kidsplaza.vn/',
									title: 'Xem thêm'
								}
							]
						}
						response.attachment.payload.elements.push(responseElement);
					});
					resolve(response);
				} else {
					resolve(response);
				}
			});
	})
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
		"qs": {
			"access_token": sysConfig.PAGE_ACCESS_TOKEN
		},
		"method": "POST",
		"json": request_body
	}, (err, res, body) => {
		if (!err) {
			console.log('message sent!')
			console.info(res)
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