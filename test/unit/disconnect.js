var chai = require('chai')
var expect = chai.expect

var SessionStore = require('../session-store.js')
var TestManager = require('../test-manager.js')

describe('SessionStore#Disconnects', function() {

	it('after the MySQL connection is terminated, the SessionStore should attempt to re-establish the connection', function(done) {

		SessionStore.connection.destroy()
		SessionStore.connection.emit('error', {code: 'PROTOCOL_CONNECTION_LOST'})

		var elapsedTime = 0, intervalTime = 50

		var interval = setInterval(function() {

			elapsedTime += intervalTime

			if (elapsedTime > 1500)
			{
				clearInterval(interval)
				return done(new Error('Failed to re-establish connection after disconnect'))
			}

			if (SessionStore.connection.state == 'authenticated')
			{
				clearInterval(interval)
				done()
			}

		}, intervalTime)

	})


})