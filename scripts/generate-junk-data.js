const generateJunkData = function(approximateSize) {
	const randomData = generateRandomData(Math.min(approximateSize, 4096));
	let buffer = Buffer.from('', 'utf8');
	while (buffer.byteLength < approximateSize) {
		buffer = Buffer.concat([
			buffer,
			Buffer.from(randomData, 'utf8')
		]);
	}
	return buffer.toString('utf8');
};

const generateRandomData = function(size) {
	const chars = (function() {
		const lower = 'abcdefghijklmnopqrstuvwxyz';
		const upper = lower.toUpperCase();
		const numbers = '1234567890';
		return lower.split('').concat(upper.split(''), numbers.split(''));
	})();
	let buffer = Buffer.from('', 'utf8');
	while (buffer.byteLength < size) {
		buffer = Buffer.concat([
			buffer,
			Buffer.from(chars[Math.floor(Math.random() * chars.length)], 'utf8')
		]);
	}
	return buffer.toString('utf8');
};

console.log(generateJunkData(200*1024));
