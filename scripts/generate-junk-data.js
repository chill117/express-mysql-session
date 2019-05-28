var generateJunkData = function(approximateSize) {
	var randomData = generateRandomData(Math.min(approximateSize, 4096));
	var buffer = Buffer.from('', 'utf8');
	while (buffer.byteLength < approximateSize) {
		buffer = Buffer.concat([
			buffer,
			Buffer.from(randomData, 'utf8')
		]);
	}
    return buffer.toString('utf8');
};

var generateRandomData = function(size) {
	var chars = (function() {
		var lower = 'abcdefghijklmnopqrstuvwxyz';
		var upper = lower.toUpperCase();
		var numbers = '1234567890';
		return lower.split('').concat(upper.split(''), numbers.split(''));
	})();
	var buffer = Buffer.from('', 'utf8');
	while (buffer.byteLength < size) {
		buffer = Buffer.concat([
			buffer,
			Buffer.from(chars[Math.floor(Math.random() * chars.length)], 'utf8')
		]);
	}
	return buffer.toString('utf8');
};

console.log(generateJunkData(200*1024));
