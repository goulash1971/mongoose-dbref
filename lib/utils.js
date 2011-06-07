/**
 * lib/utils.js - module utilities loader
 *
 * Copyright 2011, Stuart Hudson <goulash1971@yahoo.com>
 * Released under the terms of the MIT License.
 * 
 * Version 0.0.1
 */

/**
 * Utility that will de-reference a DBRef using the database 
 * assciated with a given connection
 *
 * @param {Connection} a database connection
 * @param {DBRef} a valid database reference instance
 * @param {Function} standard callback '(err, doc)'
 */
exports.fetch = fetch = function (conn, dbref, callback) {
	return conn.db.dereference(dbref, callback);
}
