module.exports = {
  user: process.env.NODE_ORACLEDB_USER || 'c##security',

  // Instead of hard coding the password, consider prompting for it,
  // passing it in an environment variable via process.env, or using
  // External Authentication.
  password: process.env.NODE_ORACLEDB_PASSWORD || 'irisSecurity01',

  // For information on connection strings see:
  // https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
  connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || '10.26.7.20:1521/tinaba',

  // Setting externalAuth is optional.  It defaults to false.  See:
  // https://github.com/oracle/node-oracledb/blob/master/doc/api.md#extauth
  externalAuth: process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
};
