// thomsonlocal.com scraper #1
// eduard.dev

// usage:
// 1. just write the result to stdout:   casperjs categories.js
// 2. save the result to file:   casperjs categories.js --output=filename

// tested on:
// CasperJS version 1.1.0
// Phantomjs version 2.1.1


var base_url = 'http://www.thomsonlocal.com/popularsearches/';

var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

var XPATH = {
	'category': './/ul[@class="popTermsUL"]/li/a[@href]',
	'none': 'none', // [bug] see https://github.com/casperjs/casperjs/issues/1692
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


// --output :: CLI argument that specifies the output file name
var filename = casper.cli.get('output');

if (filename) {
	if (utils.fileExt(filename) !== 'json') {
		filename = filename + '.json';
	};
};


// parser
function parseCategories(XPATH) {

	var categories = [];

	var category_iterator = document.evaluate(
		XPATH.category,
		document,
		null,
		XPathResult.ORDERED_NODE_ITERATOR_TYPE,
		null
	);

	var category_node = category_iterator.iterateNext();

	while (category_node) {

		var category = {};

		category[category_node.textContent.trim()] = {
			'URL': category_node.href,
		};

		categories.push(category);

		// process the next node
		category_node = category_iterator.iterateNext();

	};

	// return the parsed data
	return categories;

};


// scraper
function scrape(url) {

	casper.log('Scraping categories from URL: ' + url, 'info');

	casper.thenOpen(url, function() {
		Array.prototype.push.apply(
			data,
			this.evaluate(parseCategories, XPATH)
		);
	});


};


// the data container
var data = [];

// start the driver
casper.start();


// scrape all categories (from A to Z)
casper.each(letters.split(''), function(self, letter) {

	scrape(base_url + letter);

});


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
