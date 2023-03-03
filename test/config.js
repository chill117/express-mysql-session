module.exports = {
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 3306,
	user: process.env.DB_USER || 'session_test',
	password: typeof process.env.DB_PASS !== 'undefined' ? process.env.DB_PASS : 'password',
	database: process.env.DB_NAME || 'session_test',
};
