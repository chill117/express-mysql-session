var express, config

module.exports.init = function(app) {

	express = require('express')
	config = require(__dirname + '/../config/config.js')

	return module.exports

}

module.exports.parse = function(cookies) {

	var parsed = {}

	for (var i in cookies)
	{
		var attributes = {}
		var parts = cookies[i].split(';')

		for (var n = 0; n < parts.length; n++)
		{
			parts[n] = parts[n].split('=')
			parts[n][0] = unescape(parts[n][0].trim().toLowerCase())
			parts[n][1] = typeof parts[n][1] != 'undefined' ? unescape(parts[n][1].trim()) : ''
		}

		var name = parts[0][0]

		attributes.value = parts[0][1]

		for (var n = 1; n < parts.length; n++)
			attributes[parts[n][0]] = unescape(parts[n][1])

		parsed[name] = attributes
	}

	return parsed

}

module.exports.getSessionCookie = function(cookies) {

	var sessionCookie = false

	for (var i in cookies)
	{
		var parts = cookies[i].split(';')

		for (var n = 0; n < parts.length; n++)
		{
			parts[n] = parts[n].split('=')
			parts[n][0] = unescape(parts[n][0].trim().toLowerCase())
		}

		var name = parts[0][0]

		if (name == config.session_cookie_name)
			return cookies[i]
	}

	return sessionCookie

}

module.exports.getSessionId = function(cookieHeader) {

	var cookieParser = express.cookieParser(config.session_cookie_secret)

	var req = {
		headers: {
			cookie: cookieHeader
		}
	}

	var result

	cookieParser(req, {}, function(err) {

		if (err) throw err;

		result = req.signedCookies;

	})

	return result[config.session_cookie_name]

}