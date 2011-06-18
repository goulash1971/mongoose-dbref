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
 * @return the utilities of the extension (see './utils.js')
 * @api public
 */
exports.loadTypes = loadTypes = function (mongoose) {
	var types = Array.prototype.slice.call(arguments, 1);
	if (types.length) {
		types.forEach(function (type) {
			require("./types/" + type).loadType(mongoose);
		});
	} else {
		var files = require("fs").readdirSync(__dirname + "/types");
		files.forEach(function(filename) {
			var base = filename.slice(0, filename.length-3);
			require("./types/" + base).loadType(mongoose);
		});
	}
	return utils;
};


/**
 * Installs either the named plugins or all available plugins in the 
 * {@code lib/plugins} source directory
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @param {Array} (optional) plugin filenames 
 * @return the utilities of the extension (see './utils.js')
 * @api public
 */
exports.installPlugins = installPlugins = function (mongoose) {
	var plugins = Array.prototype.slice.call(arguments, 1);
	if (plugins.length) {
		types.forEach(function (plugin) {
			require("./plugins/" + plugin).install(mongoose);
		});
	} else {
		var files = require("fs").readdirSync(__dirname + "/plugins");
		files.forEach(function(filename) {
			var base = filename.slice(0, filename.length-3);
			require("./plugins/" + base).install(mongoose);
		});
	}
	return utils;
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
	return utils;
}

/**
 * Installation function that will load all of the types and install
 * both the plugins and the patches that are defined for this mongoose 
 * extension.
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @return the utilities of the extension (see './utils.js')
 * @api public
 */
exports.install = function (mongoose) {
	loadTypes (mongoose);
	installPlugins(mongoose);
	installPatches(mongoose);
	return utils;
}