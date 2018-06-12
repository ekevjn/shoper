'use strict';

// Imports dependencies and set up http server

const mongoose = require('mongoose'),
    osmosis = require('osmosis'),
    randomUseragent = require('random-useragent'),
    router = require('express').Router();
const KID_PLAZA_URL = 'www.kidsplaza.vn';

router.get('/kidsplaza', (req, res) => {

    crawl(res);
    // getKidsPlazaDepartments().then(data => {
    //     res.status(200).send(data);
    // }, err => {
    //     res.status(500).send(err);
    // })
});

async function crawl(callback) {
    const departments = await getKidsPlazaDepartments();
    callback.status(200).send(departments);
    if (departments && Array.isArray(departments) && departments.length > 0) {
        for (let i = 1; i < departments.length; i++) {
            cronJob(departments[i].link);
        }
    }
}

async function cronJob(departmentUrl) {
    let _currentPage = departmentUrl;
    let products = [];
    try {
        products.push(await getKidsPlazaProducts(_currentPage));
        while (true) {
            let _nextPage = await getKidsPlazaNextPage(_currentPage);
            if (_nextPage[0].link) {
                _currentPage = _nextPage[0].link;
                products.push(await getKidsPlazaProducts(_currentPage));
            } else {
                return false;
            }
        }
    } catch (err) {
        console.error(err.message);
        if(err.message.includes('ETIMEDOUT')){
            console.info('Retrying: '.concat(err.link));
            cronJob(err.link);
        }
    }
    if(products.length > 0){
        getProductsDetail(products[0]);
    }
}

async function getProductsDetail(URLs){
    let product = {};
    try{
        for (let i = 0; i < URLs.length; i++) {
            product = await getProductDetail(URLs[i].link);
        }
    } catch (err) {
        console.error(err);
        if(err.message.includes('retrying')){
            console.info('Retrying: '.concat(err.link));
            product = await getProductDetail(URLs[i].link);
        }
    }
}

function getProductDetail(URL) {
    return new Promise((resolve, reject) => {
        osmosis.get(URL)
            // .config('user_agent', randomUseragent.getRandom())
            .find('.page-title')
            .set({
                'name': 'h1',
                'brand': 'a'
            })
            .find('.review:limit(1)')
            .set({
                'sku': '#product-sku'
            })
            .find('.labelstatus')
            .set({
                'availability': '.availability'
            })
            .find('.regular-price')
            .set({
                'price': '.price'
            })
            .find('#product-description')
            .set({
                'description': '.desc'
            })
            .find('.img-main')
            .set({
                'imageSrc': '@src'
            })
            .data(function (product) {
                product.sku = product.sku.split(':')[1].trim();
                resolve(product);
            })
            .log(console.log)
            .error(err => {
                reject({message: err, link: URL})
            })
            .debug(console.log)
    });
}

function getKidsPlazaDepartments() {
    return new Promise((resolve, reject) => {
        let rs = [];
        osmosis.get(KID_PLAZA_URL)
            // .config('user_agent', randomUseragent.getRandom())
            .find('#mt_megamenu > .root + .level-0 > .megamenu-title')
            .set({
                // 'title': 'span',
                'link': '@href'
            })
            .data(function (listing) {
                rs.push(listing);
            })
            .done(() => {
                resolve(rs);
            })
            .log(console.info)
            .error(err => {
                reject(err)
            })
            .debug(console.debug)
    });
}

function getKidsPlazaProducts(departmentURL) {
    return new Promise((resolve, reject) => {
        let rs = [];
        console.info('Loading: '.concat(departmentURL));
        osmosis.get(departmentURL)
            // .config('user_agent', randomUseragent.getRandom())
            .find('.product-image')
            .set({
                // 'title': 'span',
                'link': '@href'
            })
            .data(function (listing) {
                rs.push(listing);
            })
            .done(() => {
                resolve(rs);
            })
            .log(console.log)
            .error(err => {
                reject({message: err, link: departmentURL})
            })
            .debug(console.log)
    });
}

function getKidsPlazaNextPage(departmentURL) {
    return new Promise((resolve, reject) => {
        let rs = [];
        osmosis.get(departmentURL)
            .config('tries', 9)
            // .config('user_agent', randomUseragent.getRandom())
            .find('a + .next')
            .set({
                'link': '@href'
            })
            .data(function (listing) {
                rs.push(listing);
            })
            .done(() => {
                resolve(rs);
            })
            .log(console.log)
            .error(err => {
                reject({message: err, link: departmentURL})
            })
            .debug(console.log)
    });
}

module.exports = router;