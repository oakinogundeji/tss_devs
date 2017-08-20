// quidco.com scraper
// eduard.dev

// usage:
// 1. just write the result to stdout:   casperjs getall.js
// 2. save the result to file:   casperjs getall.js --output=filename

// tested on:
// CasperJS version 1.1.0
// Phantomjs version 2.1.1


// we start from this url to get cookies and look like a real user
var start_url = 'http://www.quidco.com/browse/';

// this API endpoint returns a list of merchants
var ajax_url = 'http://www.quidco.com/ajax/merchants_list_json/getAll';


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


// CLI argument that specifies the output file name
var filename = casper.cli.get('output');

if (filename) {
	if (utils.fileExt(filename) !== 'json') {
		filename = filename + '.json';
	};
	// inject PhantomJS module for working with the file system
	var fs = require('fs');
};


// the data container
var data;


casper.start();


casper.thenOpen(start_url, function() {

	data = this.evaluate(function(ajax_url) {

		var payload = __utils__.sendAJAX(ajax_url, 'GET');

		// parse JSON payload and rename object keys according project requriments
		return JSON.parse(payload, function(prop, value) {
			switch(prop) {
				case 'merchant_id':
					this.retailer_id = value;
					return;
				case 'name':
					this.retailer_name = value;
					return;
				case 'url_name':
					// construct the full URL
					this.retailer_url = 'http://www.quidco.com/' + value + '/';
					return;
				default:
					return value;
			};
		});

    }, {ajax_url: ajax_url});

});


// process results
casper.then(function() {
	// write to file
	if (filename) {
		casper.log('Writing the data into the file: ' + filename, 'info');
		fs.write(filename, utils.serialize(data), 'w');

	// write to stdout
	} else {
		utils.dump(data);
	};

});



casper.run();


