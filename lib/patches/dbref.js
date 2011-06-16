/**
 * lib/patches/dbref.js - monkey patches to DBRef type
 *
 * Copyright 2011, Stuart Hudson <goulash1971@yahoo.com>
 * Released under the terms of the MIT License.
 * 
 * Version 0.0.2
 */
var mongoose = require("mongoose");


/**
 * Function that will resolve the DBRef instance using a supplied
 * database connection
 *
 * @param {Connection} a database connection
 * @param {Function} standard callback '(err, doc)'
 */
var dbrefFetch = function (conn, callback) {
	conn.db.dereference(this, callback);
};


/**
 * Installer that installs a plugin into the mongoose infrastructure
 *
 * @param {Mongoose} the active Mongoose instance for installation
 */
exports.install = function (mongoose) {
	mongoose.Types.DBRef.prototype.fetch = dbrefFetch;
}