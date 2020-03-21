var needle = require('needle'),
	jsdom = require('jsdom').JSDOM,
	fs = require('fs');

const RACE_SETTINGS = {
	startId: 149,
	startYear: 2015,
	breakPoint: 1
};
var breaks = 0;
const PLAYERS = [
	{
		name: 'wrGraff',
		login: 'wrgraff'
	},{
		name: 'Aiaks',
		login: 'aiaks_h'
	}
];

getRaces(RACE_SETTINGS.startId, RACE_SETTINGS.startYear, []);

function getRaces(raceId, currentYear, result) {
	let race = {
		id: raceId
	};
	needle.get('https://www.f1news.ru/forecast/race/' + raceId + '/rating/', function(error, response) {
		if (!error && response.statusCode == 200) {
			breaks = 0;
			let dom = new jsdom(response.body);
			let name = dom.window.document.querySelector('.post_title').textContent.replace('Рейтинг участников ', '');

			if (name === 'Гран При Австралии') {
				currentYear++;
			};

			race.name = name;
			race.year = currentYear;

			getRaceResult(dom.window.document.querySelector('.f1Table tbody tr td:nth-child(2) a'), getRaceLinkHandler);
			function getRaceLinkHandler(raceResult) {
				race.result = raceResult;
			};

			getUserLink(0, raceId, {}, getUserLinkHandler);
			function getUserLinkHandler(forecasts) {
				race.forecasts = forecasts;
				getRacesHandler(raceId, currentYear, result, race);
			};
		} else {
			breaks++;
			getRacesHandler(raceId, currentYear, result, race);
		};
	});
};

function getRacesHandler(raceId, currentYear, result, race) {
	if (breaks <= RACE_SETTINGS.breakPoint) {
		console.log(race);
		result.push(race);
		getRaces(++raceId, currentYear, result);
	} else {
		fs.writeFileSync('./races.json', JSON.stringify(result));
	};
};

function getUserLink(playerIndex, raceId, forecasts, successHandler) {
	needle.get('https://www.f1news.ru/forecast/race/' + raceId + '/rating/?q=' + PLAYERS[playerIndex].login, function(error, response) {
		if (!error && response.statusCode == 200) {
			let dom = new jsdom(response.body);
			let link = dom.window.document.querySelector('.f1Table tbody tr td:nth-child(2) a');

			if (link) {
				getUserResult(link.href, getUserResultHandler);
			} else {
				getUserResultHandler('Null forecast');
			};
		};

		function getUserResultHandler(result) {
			forecasts[PLAYERS[playerIndex].name] = result;

			if (playerIndex == PLAYERS.length - 1) {
				successHandler(forecasts);
			} else {
				getUserLink(++playerIndex, raceId, forecasts, successHandler);
			};
		};
	});
};

function getRaceResult(link, successHandler) {
	let result = [];
	needle.get('https://www.f1news.ru' + link, function(error, response) {
		if (!error && response.statusCode == 200) {
			let dom = new jsdom(response.body);
			
			let table = dom.window.document.querySelector('#content .f1Table');
			let resultColumn = table.querySelectorAll('tr:not(.firstLine) td:nth-child(3)');
			for (let cell of resultColumn) {
				result.push(cell.textContent);
			};
			successHandler(result);
		} else {
			result.error = 'Page not loaded';
			successHandler(result);
		};
	});
};

function getUserResult(link, successHandler) {
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
			
			let table = dom.window.document.querySelector('#content .f1Table');
			let forecastColumn = table.querySelectorAll('tr:not(.firstLine) td:nth-child(2)');
			let pointColumn = table.querySelectorAll('tr:not(.firstLine) td:last-child');
			let forecast = [];
			forecastColumn.forEach((cell, i) => {
				let place = {};
				place[cell.textContent] = pointColumn[i].textContent;
				forecast.push(place);
			});
			result.forecast = forecast ? forecast : 'Forecast not found';

			successHandler(result);
		} else {
			result.error = 'Page not loaded';
			successHandler(result);
		};
	});
};