/**
 * lib/plugins/resolveDBRefs.js - DBRef Resolver
 *
 * Copyright 2011, Stuart Hudson <goulash1971@yahoo.com>
 * Released under the terms of the MIT License.
 * 
 * Version 0.0.2
 */
var mongoose = require("mongoose");

/**
 * Utility function that constructs a table of names for a given
 * path.
 *
 * @param {String} the path name
 * @return {Object} specifying the 'cache', 'getter' and 'setter'
 */
var namesForPath = function (path) {
	var root = path.replace(/^[_]+/g,"");
	var names = {cache: "$" + root};
	root = root[0].toUpperCase() + root.slice(1);
	names['getter'] = "get" + root;
	names['setter'] = "set" + root;
	return names;
}


/**
 * Plugin that will create a getter/setter method pair for each path in 
 * a schema where the schema type is 'DBRef' and the 'resolve' flag true.
 *
 * The setter method will convert any 'Object' (model) passed into a 
 * database reference, and the getter method will resolve the stored
 * database reference to an object using the connection of the owning
 * model instance.
 *
 * The getter & setter methods use the path name as the root of the 
 * method signature (i.e. 'name' gives 'getName' & 'setName') but where 
 * the path is private (i.e. '_' prefix) this is stripped when creating 
 * the getter & setter (i.e. '_age' gives 'getAge' and 'setAge').
 *
 * If the 'cache' flag is set to true then resolved value is cached
 * in a model property that has the path name prefixed with a '$'
 * sign (i.e. 'name' cached in '$name' and '_age' cached in '$age').
 *
 * Each setter has one argument, the object to be set via reference
 * or 'null' and the getter has 2 arguments, a callback function to be
 * invoked after the value has been resolved and an optional boolean 
 * argument, 'force', that will ignore any cached value. 
 * 
 * @param {Object} the schema the plugin is being used against
 * @param {Object} global options that apply to this plugin
 */
exports.resolveDBRefs = resolveDBRefs = function (schema, options) {
	if (!('mongoose' in options)) 
		throw new Error("'mongoose' option not defined");
	if (!('DBRef' in options.mongoose.Types)) 
		throw new Error("'DBRef' type not installed");	
	var dbref = options.mongoose.SchemaTypes.DBRef;
	schema.eachPath(
		function (path, defn) {
			if (defn.options['type'] !== dbref) return;
			if (defn.options['resolve'] === true) {
				var names = namesForPath(path);
				if (defn.options['cached'] === true) {
					var cache = names['cache'];
					schema.method(names['getter'], function(callback, force) {
						var val = this[path];
						if ((typeof val === 'undefined') || (val === null)) {
							callback(null, null);
						} else {
							force = (force === true) || 
								typeof this[cache] === 'undefined' ||
								this[cache] === val;
							if (!force) {
								callback(null, this[cache]);
							} else { 
								var self = this;
								this.db.db.dereference(val, function(err, doc) {
									self[cache] = doc; callback(err, doc) });
							}
						}
					});
					schema.method(names['setter'], function(value) {
						this[cache] = value;
						if (value !== null) 
							this[path] = dbref.prototype.cast(
								{"$ref": value.collection.name, 
								 "$id": value._id, "$db": value.db.db.databaseName});
						else this[path] = null;
					});
				} else {
					schema.method(names['getter'], function(callback) {
						var val = this[path];
						if ((typeof val === 'undefined') || (val === null))
							callback(null, null);
						else this.db.db.dereference(val, callback);
					});
					schema.method(names['setter'], function(value) {
						if (value !== null) 
							this[path] = dbref.prototype.cast(
								{"$ref": value.collection.name, 
								 "$id": value._id, "$db": value.db.db.databaseName});
						else this[path] = null;
					});
				}
			}
		});
}



/**
 * Installer that installs a plugin into the mongoose infrastructure
 *
 * @param {Mongoose} the active Mongoose instance for installation
 */
exports.install = function (mongoose) {
	return mongoose.plugin(resolveDBRefs, {mongoose: mongoose});
}