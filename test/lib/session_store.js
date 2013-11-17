var express = require('express')

var db_config = require(__dirname + '/../config/db.js')

var options = {}

options.db = {}
options.db.name = db_config.db_name
options.db.user = db_config.db_user
options.db.pass = db_config.db_pass
options.db.options = {}
options.db.options.host = db_config.db_host
options.db.options.port = db_config.db_port
options.db.options.logging = false
options.debug = false

module.exports = require(__dirname + '/../../lib/express-mysql-session')(options, express)