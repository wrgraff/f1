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
	result = {};
	needle.get('https://www.f1news.ru/forecast/race/' + raceId + '/rating/?q=' + PLAYERS[playerIndex].login, function(error, response) {
		if (!error && response.statusCode == 200) {
			let dom = new jsdom(response.body);
			let link = dom.window.document.querySelector('.f1Table tbody tr td:nth-child(2) a');

			result.link = link ? link.href : 'Null forecast';
		};

		forecasts[PLAYERS[playerIndex].name] = result;

		if (playerIndex == PLAYERS.length - 1) {
			successHandler(forecasts);
		} else {
			getUserLink(++playerIndex, raceId, forecasts, successHandler);
		};
	});
};