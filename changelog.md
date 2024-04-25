# Changelog

* v3.0.2:
  * Updated dependencies
* v3.0.1:
  * Updated dependencies
* v3.0.0:
  * Added "disableTouch" option.
  * Switched MySQL client dependency from mysql to mysql2 module.
  * General clean-up, including removal of several dependencies.
  * express-session module no longer included as a direct dependency.
  * Upgraded remaining dependencies to latest versions.
  * _Breaking API changes_:
    * Old constructor usage from "0.x" version no longer supported - e.g. must now pass session module - `require('express-mysql-session')(session)`
    * Constructor no longer takes a callback. Use `sessionStore.onReady()` to get a promise which will resolve when the store is ready or reject on error.
    * See readme for latest usage details.
* v2.1.8:
  * Updated dependencies
* v2.1.7:
  * Updated dependencies
* v2.1.6:
  * Updated dependencies
* v2.1.5:
  * Updated dependencies
* v2.1.4:
  * Updated dependencies
* v2.1.3:
  * Update mysql module to "fix Amazon RDS profile for yaSSL MySQL servers with 2019 CA"; see [here](https://github.com/mysqljs/mysql/pull/2292) for more information.
* v2.1.2:
  * Fix for [issue #97](https://github.com/chill117/express-mysql-session/issues/97). The new default type for the session data field is now `mediumtext`. This will allow up to 16MB of data to be stored per session. Existing session database tables will keep the old behavior which was limited to 64KB of data per session.
* v2.1.0:
  * `get`, `all`, and `length` will now exclude expired sessions. See [#89](https://github.com/chill117/express-mysql-session/issues/89) for more details.
  * Removed grunt; now using npm run tasks.
  * Updated dependencies
* v2.0.1:
  * Updated dependencies
* v2.0.0:
  * Added new flag `clearExpired` which when set to `false` will prevent expired sessions from being deleted automatically. The default value is `true` so the default behavior remains unchanged.
  * Fix for MySQL warning regarding unnecessary `LIMIT 1` clauses. See [#82](https://github.com/chill117/express-mysql-session/issues/82) for more details.
  * Throw error when defining an unknown column in the `schema` option. See [#83](https://github.com/chill117/express-mysql-session/issues/83) for more details.
  * Removed deprecated methods (`clone`, `closeStore`, `defaults`, `isObject`, `setDefaultOptions`, `sync`)
* v1.3.0:
  * Updated dependencies
  * Fix for [issue #78](https://github.com/chill117/express-mysql-session/issues/78)
  * Added support for promises in mysql query function; now works with [node-mysql2](https://github.com/sidorares/node-mysql2)'s promise-only connections
* v1.2.3:
  * Updated dependencies
  * `MySQLStore.close()` will no longer end the database connection (if provided via constructor). See [issue #70](https://github.com/chill117/express-mysql-session/issues/70) for more information. A new option has been added (`endConnectionOnClose`) to control this behavior.
* v1.2.1-2:
  * Updated dependencies
* v1.2.0:
  * Removed dependency on [mysql-connection-manager](https://github.com/chill117/mysql-connection-manager); now using connection pooling from [node-mysql](https://github.com/mysqljs/mysql) module.
  * Fix for issue [#49](https://github.com/chill117/express-mysql-session/issues/49)
* v1.1.1:
  * Fix for express-session integration when "cookie.maxAge" is set to NULL.
* v1.1.0:
  * Added [touch](https://github.com/expressjs/session#storetouchsid-session-callback) method.
  * Deprecated `MySQLStore.closeStore` - should use `MySQLStore.close` instead.
  * Fixes for issues: [#46](https://github.com/chill117/express-mysql-session/issues/46)
* v1.0.0:
  * Changed constructor interface. Must now pass session module to get `MySQLStore` constructor object. See [How to Use](https://github.com/chill117/express-mysql-session#how-to-use) for more information.
  * Fixes for issues: [#28](https://github.com/chill117/express-mysql-session/issues/28), [#33](https://github.com/chill117/express-mysql-session/issues/33).
