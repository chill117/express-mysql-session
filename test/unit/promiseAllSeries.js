const assert = require('assert');
const manager = require('../manager');
const { MySQLStore } = manager;
const { promiseAllSeries } = MySQLStore;

describe('promiseAllSeries(promiseFactories)', function() {

	it('executes all promises in series', function() {
		const values = ['one', 'two', 'three'];
		let run = [];
		return promiseAllSeries(values.map((value, index) => {
			return () => {
				return Promise.resolve().then(() => {
					run.push(value);
					assert.strictEqual(run.length, index + 1);
					assert.strictEqual(value, values[index]);
					return new Promise((resolve, reject) => {
						setTimeout(() => resolve(value), 5);
					});
				});
			};
		})).then(result => {
			assert.deepStrictEqual(result, values[values.length - 1]);
			assert.deepStrictEqual(run, values);
		});
	});

	it('does not run promises after a thrown error', function() {
		const values = ['one', 'two', 'three'];
		let run = [];
		return promiseAllSeries(values.map((value, index) => {
			return () => {
				return Promise.resolve().then(() => {
					if (value === 'two') {
						throw new Error('Thrown inside "two"');
					}
					run.push(value);
				});
			};
		})).then(() => {
			throw new Error('Expected an error');
		}).catch(error => {
			assert.strictEqual(error.message, 'Thrown inside "two"');
		}).finally(() => {
			assert.deepStrictEqual(run, ['one']);
		});
	});
});
