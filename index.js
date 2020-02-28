var needle = require('needle'),
	jsdom = require('jsdom').JSDOM,
	fs = require('fs');

const RACE = {
	start: 149,
	end: 240,
	year: 2015
};
const PLAYERS = [
	{
		name: 'wrGraff',
		login: 'wrgraff'
	},{
		name: 'Aiaks',
		login: 'aiaks_h'
	}
];

getRaces(RACE.start, RACE.year, []);

function getRaces(raceId, currentYear, result) {
	let race = {
		id: raceId
	};
	needle.get('https://www.f1news.ru/forecast/race/' + raceId + '/rating/', function(error, response) {
		if (!error && response.statusCode == 200) {
			let dom = new jsdom(response.body);
			let name = dom.window.document.querySelector('.post_title').textContent.replace('Рейтинг участников ', '');

			if (name === 'Гран При Австралии') {
				currentYear++;
			};

			race.name = name;
			race.year = currentYear;

			getUserLink(0, raceId, {}, getUserLinkHandler);
			function getUserLinkHandler(forecasts) {
				race.forecasts = forecasts;
				getRacesHandler(raceId, currentYear, result, race);
			};
		} else {
			getRacesHandler(raceId, currentYear, result, race);
		};
	});
};

function getRacesHandler(raceId, currentYear, result, race) {
	if (raceId <= RACE.end) {
		console.log(race);
		result.push(race);
		getRaces(++raceId, currentYear, result);
	} else {
		console.log(result);
		fs.writeFileSync('./races.json', JSON.stringify(result));
	};
};

function getUserLink(playerIndex, raceId, forecasts, successHandler) {
	needle.get('https://www.f1news.ru/forecast/race/' + raceId + '/rating/?q=' + PLAYERS[playerIndex].login, function(error, response) {
		if (!error && response.statusCode == 200) {
			let dom = new jsdom(response.body);
			let link = dom.window.document.querySelector('.f1Table tbody tr td:nth-child(2) a');

			if (link) {
				getResult(link.href, getResultHandler);
			} else {
				getResultHandler('Null forecast');
			};
		};

		function getResultHandler(result) {
			forecasts[PLAYERS[playerIndex].name] = result;

			if (playerIndex == PLAYERS.length - 1) {
				successHandler(forecasts);
			} else {
				getUserLink(++playerIndex, raceId, forecasts, successHandler);
			};
		};
	});
};

function getResult(link, successHandler) {
	let result = {
		link: link,
	};
	needle.get('https://www.f1news.ru' + link, function(error, response) {
		if (!error && response.statusCode == 200) {
			let dom = new jsdom(response.body);
			let total = dom.window.document.querySelector('#content p');
			let points = total.textContent.replace(/\n/g, '').replace(/([aA-zZ])\w+ набрал /g, '').replace(/ .* и занял ([0-9])\w+ место./g, '');
			let place = total.textContent.replace(/\n/g, '').replace(/([aA-zZ])\w+ набрал ([0-9])\w+ .* и занял /g, '').replace(/место./g, '');
			
			result.points = points ? parseInt(points) : 'Points not found';
			result.place = place ? parseInt(place) : 'Place not found';
			successHandler(result);
		} else {
			result.error = 'Page not loaded';
			successHandler(result);
		};
	});
};