const fs = require('fs');
const path = require('path');

module.exports = {
	sessions: require('./sessions'),
	junkData: {
		'200KB': fs.readFileSync(
			path.join(__dirname, 'junk-data', '200KB'),
			'utf8'
		),
	},
};
