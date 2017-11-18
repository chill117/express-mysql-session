# Changelog

* v1.2.3:
  * Updated dependencies
  * `MySQLStore.close()` will no longer end the database connection (if provided via constructor). See [https://github.com/chill117/express-mysql-session/issues/70] for more information. A new option has been added (`endConnectionOnClose`) to control this behavior.
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
