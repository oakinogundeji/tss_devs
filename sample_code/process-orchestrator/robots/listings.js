// thomsonlocal.com scraper #3
// eduard.dev

// usage:
// 1. just write the result to stdout:   casperjs listings.js --url=PAGE_URL
// 2. save the result to file:   casperjs listings.js --url=PAGE_URL --output=filename

// tested on:
// CasperJS version 1.1.0
// Phantomjs version 2.1.1


var XPATH = {
	'listings': './/ol[@class="resultsBlock"]/li[@itemtype]',
	'name': './/h2[@itemprop="name"]/text()',
	'phone': './/a[@itemprop="telephone"]/@href',
	'street': './/span[@itemprop="streetAddress"]/text()',
	'street_display': './/div[@itemprop="address"]//span[@data-yext="address.displayAddress"]/text()',
	'city': './/span[@itemprop="addressLocality"]/text()',
	'postcode': './/span[@itemprop="postalCode"]/text()',
	'reviews': './/a[@class="reviews"]/div/@class',
	'urls': {
		'profile': './/ul[@class="listingHeader"]/li[contains(@class, "infoLink")]//a/@href',
		'website': './/ul[@class="listingHeader"]/li[contains(@class, "website")]//a/@href',
		'email': './/ul[@class="listingHeader"]/li[contains(@class, "emailLink")]//a/@href',
	},
};


var casper = require('casper').create({
// the most popular screen size
	viewportSize: {
		width: 1366,
		height: 768
	},

	pageSettings: {
		javascriptEnabled: true,

// we trust this resource
		XSSAuditingEnabled: false,

// the most popular User Agent HTTP header
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
	},

});

var utils = require('utils');

var fs = require('fs');


// --url :: CLI argument that specifies the URL of the page
var page_url = casper.cli.get('url');

if (!page_url) {
	casper.log('The page --url has to be specified!', 'error');
	casper.exit();
};


// -- output :: CLI argument that specifies the output file name
var filename = casper.cli.get('output');

if (filename) {
	if (utils.fileExt(filename) !== 'json') {
		filename = filename + '.json';
	};
};



// parser
function parseListings(XPATH) {

	var listings = [];

	var listings_iterator = document.evaluate(
		XPATH.listings,
		document,
		null,
		XPathResult.ORDERED_NODE_ITERATOR_TYPE,
		null
	);

	var listing_node = listings_iterator.iterateNext();

	while (listing_node) {


		var listing = {
			urls: {},
		};

		// name

		var name = document.evaluate(
			XPATH.name,
			listing_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		if (name) {
			listing.name = name.textContent.trim();
		} else {
			__utils__.log('No name', 'error');
			continue;
		};

		// phone

		var phone = document.evaluate(
			XPATH.phone,
			listing_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		if (phone) {
			listing.telephone = phone.value.substr(4);
		};

		// address

		var address = {};

		var street = document.evaluate(
			XPATH.street,
			listing_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		if (street) {
			address.street = street.textContent.trim();
		};

		var street_display = document.evaluate(
			XPATH.street_display,
			listing_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		if (street_display) {
			address.street = address.street + ', ' + street_display.textContent.trim();
		};

		var city = document.evaluate(
			XPATH.city,
			listing_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		if (city) {
			address.city = city.textContent.trim();
		};

		var postcode = document.evaluate(
			XPATH.postcode,
			listing_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		if (postcode) {
			address.postcode = postcode.textContent.trim();
		};

		if (Object.keys(address).length !== 0) {
			listing.address = address;
		};

		// reviews

		var reviews = document.evaluate(
			XPATH.reviews,
			listing_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		if (reviews) {
			listing.reviews = Number(reviews.value.slice(-1));
		};

		// profile url

		var profile_url = document.evaluate(
			XPATH.urls.profile,
			listing_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		if (profile_url) {
			listing.urls.profile = 'http://www.thomsonlocal.com' + profile_url.value;
		} else {
			__utils__.log('No profile URL', 'error');
			continue;
		};

		// reviews url

		listing.urls.reviews = listing.urls.profile + '#readreviews';

		// website

		var website = document.evaluate(
			XPATH.urls.website,
			listing_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		if (website) {
			listing.urls.website = website.value;
		};

		// email url

		var email_url = document.evaluate(
			XPATH.urls.email,
			listing_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		if (email_url) {
			listing.urls.email = 'http://www.thomsonlocal.com' + email_url.value;
		};

		listings.push(listing);

		// process the next node
		listing_node = listings_iterator.iterateNext();

	};

	return listings;

};


// scraper
function scrape(url) {

	casper.log('Scraping: ' + url, 'info');

	casper.thenOpen(url, function() {
		Array.prototype.push.apply(
			data,
			this.evaluate(parseListings, XPATH)
		);
	});

};



// the data container
var data = [];


// start the driver
casper.start();


// scrape the data
scrape(page_url);


// process results
casper.then(function() {
	utils.dump(data);
	// write to file
	if (filename) {
		casper.log('Writing the data into the file: ' + filename, 'info');
		fs.write(filename, utils.serialize(data), 'w');
	}
});


// run
casper.run();
