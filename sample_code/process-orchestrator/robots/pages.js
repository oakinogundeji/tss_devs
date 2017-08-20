// thomsonlocal.com scraper #2
// eduard.dev

// usage:
// 1. just write the result to stdout:   casperjs pages.js --url=CATEGORY_URL
// 2. save the result to file:   casperjs pages.js --url=CATEGORY_URL --output=filename

// tested on:
// CasperJS version 1.1.0
// Phantomjs version 2.1.1


var XPATH = {
	'results_num': './/span[@class="pageCount"]',
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


// --url :: CLI argument that specifies the URL of the category
var category_url = casper.cli.get('url');

if (!category_url) {
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
function parseResultsNum(XPATH) {

	var results_num = document.evaluate(
		XPATH.results_num,
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
		null
	).singleNodeValue;

	if (results_num) {
		var regexp = /of\s+(\d+)/i;
		match = regexp.exec(results_num.textContent);
		if (match !== null) {
			return match[1];
		};
	};

	// no pageCount elem on the page?
	return null;

};


// scraper
function scrape(url) {

	casper.log('Scraping: ' + url, 'info');

	casper.thenOpen(url, function() {

		var results_num = this.evaluate(parseResultsNum, XPATH);

		if (results_num === null) {
			casper.log('Unable to extract the #pageCount: ' + url, 'error');
			casper.exit();

		} else {
			var pages_num = Math.ceil(Number(results_num) / 15);

			for (i = 1; i <= pages_num; i++) {
				data.push(category_url + '?Page=' + i.toString());
			};
		};

	});

};


// the data container
var data = [];


// start the driver
casper.start();


// scrape the data
scrape(category_url);


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
