/**
 * lib/plugins/dbrefHooks.js - DBRef Resolver
 *
 * Copyright 2011, Stuart Hudson <goulash1971@yahoo.com>
 * Released under the terms of the MIT License.
 * 
 * Version 0.0.2
 */
var mongoose = require("mongoose");


/**
 * Plugin that will install support (via the schema) that create hooks 
 * on model and schema from DBRefs.
 *
 * The '_dbref' virtual returns a DBRef object for the model instance
 * using the '_id', 'collection' and 'db' properties.
 *
 * The 'fetch(dbref,callback,strict)' static performs a dereference 
 * using a supplied DBRef (dbref), active database collection, and the
 * supplied callback funcion (callback).
 * 
 * If the optional 'strict' parameter is supplied and is {@code true}
 * then the namespace of the DBRef must be the same as the schema.
 * 
 * @param {Object} the schema the plugin is being used against
 * @param {Object} global options that apply to this plugin
 * @api public
 */
exports.dbrefHooks = dbrefHooks = function (schema, options) {
	if (!('mongoose' in options)) 
		throw new Error("'mongoose' option not defined");
	if (!('DBRef' in options.mongoose.Types)) 
		throw new Error("'DBRef' type not installed");	
	var dbref = options.mongoose.SchemaTypes.DBRef;
	// Virtual to return DBRef
	schema.virtual("_dbref").get(function () {
		return dbref.prototype.cast({"$ref": this.collection.name, 
									 "$id": this._id, "$db": this.db.db.databaseName});
	});
	// Static to perform database dereference
	schema.static("fetch", function (dbref, callback, strict) {
		if ((strict) && (dbref.namespace !== this.collection.name))
			throw new Error("wrong namespace for " + dbref);
		this.db.db.dereference(dbref, callback);
	});
}



/**
 * Installer that installs a plugin into the mongoose infrastructure
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @api public
 */
exports.install = function (mongoose) {
	return mongoose.plugin(dbrefHooks, {mongoose: mongoose});
}