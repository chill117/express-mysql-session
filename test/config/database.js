module.exports = {
	host: process.env.TRAVIS ? '127.0.0.1' : 'localhost',
	port: 3306,
	user: process.env.TRAVIS ? 'root' : 'session_test',
	password: process.env.TRAVIS ? '' : 'password',
	database: 'session_test'
}