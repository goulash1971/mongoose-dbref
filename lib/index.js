/**
 * lib/index.js - extension loader
 *
 * Copyright 2011, Stuart Hudson <goulash1971@yahoo.com>
 * Released under the terms of the MIT License.
 * 
 * Version 0.0.2
 */


/**
 * Expose the utilities that are available from this module (these
 * are also accessed from the loadTypes function.
 */
exports.utils = utils = require("./utils");


/**
 * Loads either the named types or all available types in the 
 * {@code lib/types} source directory
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @param {Array} (optional) type filenames 
 * @return {Object} the types that were loaded for the module
 * @api public
 */
exports.loadTypes = loadTypes = function (mongoose) {
	if (!('JoinTypes') in mongoose)
		mongoose.JoinTypes = {};
	var types = Array.prototype.slice.call(arguments, 1);
	var loaded = {};
	if (types.length) {
		types.forEach(function (type) {
			var val = require("./types/" + type).loadType(mongoose);
			if (typeof val === 'function')
				loaded[val.name] = val;
		});
	} else {
		var files = require("fs").readdirSync(__dirname + "/types");
		files.forEach(function(filename) {
			var base = filename.slice(0, filename.length-3);
			var val = require("./types/" + base).loadType(mongoose);
			if (typeof val === 'function')
				loaded[val.name] = val;
		});
	}
	return loaded;
};


/**
 * Installs either the named plugins or all available plugins in the 
 * {@code lib/plugins} source directory
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @param {Array} (optional) plugin filenames 
 * @return {Object} the plugins that were loaded for this module
 * @api public
 */
exports.installPlugins = installPlugins = function (mongoose) {
	var plugins = Array.prototype.slice.call(arguments, 1);
	var loaded = {};
	if (plugins.length) {
		types.forEach(function (plugin) {
			var val = require("./plugins/" + plugin).install(mongoose);
			if (typeof val === 'function')
				loaded[val.name] = val;
		});
	} else {
		var files = require("fs").readdirSync(__dirname + "/plugins");
		files.forEach(function(filename) {
			var base = filename.slice(0, filename.length-3);
			var val = require("./plugins/" + base).install(mongoose);
			if (typeof val === 'function')
				loaded[val.name] = val;
		});
	}
	return loaded;
}

/**
 * Installs either the named patches or all available patches in the 
 * {@code lib/patches} source directory
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @param {Array} (optional) patch filenames 
 * @return the utilities of the extension (see './utils.js')
 * @api public
 */
exports.installPatches = installPatches = function (mongoose) {
	var patches = Array.prototype.slice.call(arguments, 1);
	if (patches.length) {
		types.forEach(function (patch) {
			require("./patches/" + patch).install(mongoose);
		});
	} else {
		var files = require("fs").readdirSync(__dirname + "/patches");
		files.forEach(function(filename) {
			var base = filename.slice(0, filename.length-3);
			require("./patches/" + base).install(mongoose);
		});
	}
}

/**
 * Installation function that will load all of the types and install
 * both the plugins and the patches that are defined for this mongoose 
 * extension.
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @return {Object} the types, plugins and patches loaded
 * @api public
 */
exports.install = function (mongoose) {
	var loaded = {};
	loaded.types = loadTypes (mongoose);
	loaded.plugins = installPlugins(mongoose);
	loaded.patches = installPatches(mongoose);
	return loaded;
}