// quidco.com scraper #2
// eduard.dev

// usage:
// 1. just write the result to stdout:   casperjs retailers.js --input=data.json
// 2. save the result to file:   casperjs retailers.js --input=data.json --output=retailers.json
// 3. process just one retailer (for tests): casperjs retailers.js --input=data.json --url=http://www.quidco.com/marks-spencer/

// tested on:
// CasperJS version 1.1.0
// Phantomjs version 2.1.1


// XPATH config
var XPATH = {
	'cashback_rates': './/div[@class="rates"]/div[contains(@class, "rate")]',
	'expiring_rate': './/p[@class="expiring-rate"]/text()',
	'amount': './/p[contains(@class, "amount")]/a/text()[2]',
	'rate_text': './/p[@class="rate-text"]/text()',
	'related_retailers': './/div[contains(@class, "related-retailers")]//p/a/@href',
};


var casper = require('casper').create({
	logLevel: 'debug',
	verbose: true,
// the most popular screen size
	viewportSize: {
		width: 1366,
		height: 768
	},

	pageSettings: {
		javascriptEnabled: true,

// no images, no plugins
		loadImages: false,
		loadPlugins: false,

// we trust this resource
		XSSAuditingEnabled: false,

// the most popular User Agent HTTP header
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
	},

});

var utils = require('utils');

var fs = require('fs');


// --input file
var input_file = casper.cli.get('input');

if (!input_file) {

	casper.log('You must specify the "--input" file', 'error');
	casper.exit();

} else if (!fs.exists(input_file)) {

	input_file = input_file + '.json';

	if (!fs.exists(input_file)) {
		casper.log('Cannot find the "--input" file', 'error');
		casper.exit();
	};

};

// parse the JSON data from the input file
var input_data = require(input_file);

// get retailers object with URL-keys
var retailers = {};

for (i = 0; i < input_data.length; i++) {
	retailers[input_data[i].retailer_url] = input_data[i];
};


// --ouput file
var output_file = casper.cli.get('output');

if (output_file) {
	if (utils.fileExt(output_file) !== 'json') {
		output_file = output_file + '.json';
	};
};


// --url
var test_url = casper.cli.get('url');

if (test_url && !(test_url in retailers)) {
	casper.log('Unknown retailer: ' + test_url, 'error');
	casper.exit();
};


// parser
function parse_page(XPATH) {

	// parse cashback rates

	var cashback_rates = [];

	var cashback_rates_iterator = document.evaluate(
		XPATH.cashback_rates,
		document,
		null,
		XPathResult.ORDERED_NODE_ITERATOR_TYPE,
		null
	);

	var cashback_rate_node = cashback_rates_iterator.iterateNext();
	    
	while (cashback_rate_node) {

		var cashback_data = {};

		// find expiring_rate
		var expiring_rate = document.evaluate(
			XPATH.expiring_rate,
			cashback_rate_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		// expiring_rate node exists
		if (expiring_rate) {
			expiring_rate = expiring_rate.textContent.trim();
			// expiring_rate is non-empty
			if (expiring_rate) {
				cashback_data.expiring_rate = expiring_rate;
			};
		};

		// find amount
		var amount = document.evaluate(
			XPATH.amount,
			cashback_rate_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		// amount node exists
		if (amount) {
			amount = amount.textContent.trim();
			// amount is non-empty
			if (amount) {
				cashback_data.amount = amount;
			};
		};

		// find rate_text
		var rate_text = document.evaluate(
			XPATH.rate_text,
			cashback_rate_node,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;

		// rate_text node exists
		if (rate_text) {
			rate_text = rate_text.textContent.trim();
			// rate_text is non-empty
			if (rate_text) {
				cashback_data.rate_text = rate_text;
			};
		};

		if (Object.keys(cashback_data).length !== 0) {
			cashback_rates.push(cashback_data);	
			
		};

		// process the next node
		cashback_rate_node = cashback_rates_iterator.iterateNext();

	};


	// parse related retailers URLs

	var related_retailers_urls = [];

	var related_retailers_iterator = document.evaluate(
		XPATH.related_retailers,
		document,
		null,
		XPathResult.ORDERED_NODE_ITERATOR_TYPE,
		null
	);

	var related_retailer_href = related_retailers_iterator.iterateNext();
	    
	while (related_retailer_href) {

		related_retailers_urls.push('http://www.quidco.com' + related_retailer_href.value);

		// process the next node
		related_retailer_href = related_retailers_iterator.iterateNext();

	};


	// return the parsed data
	return {
		'cashback_rates': cashback_rates,
		'related_retailers_urls': related_retailers_urls
	};

};


// scraper the retailer's page
function scrape(retailer_url) {

	casper.log('Scraping ' + retailer_url, 'info');

	var retailer = {};
	var retailer_id = retailers[retailer_url].retailer_id;

	// open retailer's page
	casper.thenOpen(retailer_url, function() {

		// parse the page
		var parsed_data = this.evaluate(parse_page, XPATH);

		var retailer_data = {
			'cashback_rates': parsed_data.cashback_rates,
			'related_retailers': []
		};

		for (i = 0; i < parsed_data.related_retailers_urls.length; i++) {

			var related_retailer_url = parsed_data.related_retailers_urls[i];

			// check if we have such retailer (by URL)
			if (related_retailer_url in retailers) {
				retailer_data.related_retailers.push(
					retailers[related_retailer_url]
				);
			} else {
				casper.log('Unknown retailer: ' + related_retailer_url, 'error');
			};

		};

		retailer[retailer_id] = retailer_data;
			
	});

	return retailer;

};


// the data container
var data = [];


// start the driver
casper.start();


// scrape the test --url
if (test_url) {

	data.push(scrape(test_url));	

// scrape all retailers
} else {

	casper.each(Object.keys(retailers), function(self, retailer_url) {
		data.push(scrape(retailer_url));
	});

};


// process results
casper.then(function() {
	// write to file
	if (output_file) {
		casper.log('Writing the data into the file: ' + output_file, 'info');
		fs.write(output_file, utils.serialize(data), 'w');

	// write to stdout
	} else {
		utils.dump(data);
	};

});


casper.run();

