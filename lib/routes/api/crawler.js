'use strict';

// Imports dependencies and set up http server

const mongoose = require('mongoose'),
      osmosis = require('osmosis');
      router = require('express').Router();

router.get('/kidsplaza', (req, res) => {

    crawlKidsPlaza().then(data => {
        res.status(200).send(data);
    }, err => {
        res.status(500).send(err);
    })
});

function crawlKidsPlaza() {
    return new Promise((resolve, reject) => {
        osmosis.get('https://www.kidsplaza.vn/')
            .find('#mt_megamenu')
            .data(function (listing) {
                resolve(listing);
            })
            .log(console.log)
            .error(err => {
                reject(err)
            })
            .debug(console.log)
    });
}

module.exports = router;