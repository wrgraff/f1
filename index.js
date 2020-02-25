var needle = require('needle'),
	jsdom = require('jsdom').JSDOM;

var raceId = 149;
var racesLinks = [];

while (raceId <= 240) {
	getRaceLink(raceId, getLinkHandler);
	raceId++;
};

function getRaceLink(raceId, successHanler, errorHandler) {
	needle.get('https://www.f1news.ru/forecast/race/' + raceId + '/rating/?q=wrgraff', function(error, response) {
		if (!error && response.statusCode == 200) {
			let dom = new jsdom(response.body);
			let link = dom.window.document.querySelector('.f1Table tbody tr td:nth-child(2) a');

			if (link) {
				successHanler(link.href);
			} else {
				successHanler('Null forecast');
				console.log('Forecast for race #' + raceId + ' does not exist!');
			};
		} else {
			successHanler('Null race');
			console.log('Error on race #' + raceId + ': race whith this id does not exist!');
		};
	});
};

function getLinkHandler(link,) {
	racesLinks.push(link);
};
