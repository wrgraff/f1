var needle = require('needle'),
	jsdom = require('jsdom').JSDOM;

const RACE = {
	start: 149,
	end: 240,
	year: 2015
};
const PLAYER = {
	wrgraff: 'wrgraff',
	aiaks: 'aiaks_h'
};
let racesLinks = [];

getRaces(RACE.start, RACE.year, getLinkHandler);

function getRaces(raceId, currentYear, successHandler) {
	needle.get('https://www.f1news.ru/forecast/race/' + raceId + '/rating/?q=' + PLAYER.wrgraff, function(error, response) {
		if (!error && response.statusCode == 200) {
			let dom = new jsdom(response.body);
			let name = dom.window.document.querySelector('.post_title').textContent.replace('Рейтинг участников ', '');
			let link = dom.window.document.querySelector('.f1Table tbody tr td:nth-child(2) a');

			if (name === 'Гран При Австралии') {
				currentYear++;
			};

			successHandler({
				id: raceId,
				name: name,
				year: currentYear,
				link: link ? link.href : 'Null forecast'
			}, raceId, currentYear);
		} else {
			successHandler({
				id: raceId,
				name: 'Null race'
			}, raceId, currentYear);
		};
	});
};

function getLinkHandler(link, raceId, currentYear) {
	racesLinks.push(link);
	raceId++;

	if (raceId <= RACE.end) {
		getRaces(raceId, currentYear, getLinkHandler);
	} else {
		getRacesHandler(racesLinks);
	};
};

function getRacesHandler(links) {
	console.log(links);
};