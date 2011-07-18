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
 * Utility function for typeof array testing

 * @param {Object} the object to be tested as an array
 * @api private
 */
var isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
}

/**
 * Utility function that will convert an {Array} of arguments into a 
 * loading specification consiting of a filter {Function} and an 
 * {Array} of names. 
 *
 * @param {Array} arguments to be converted to a loading spec
 * @return {Object} loading spec of filter and names
 * @api private
 */
var figureLoadSpec = function (args) {
	var spec = {filter: function (name) { return true; }, names: []};
	if (!isArray(args)) args = [args];
	if (args.length == 1) {
		if (typeof args[0] === 'function')
			spec.filter = args[0];
		else spec.names = args;
	} else spec.names = args;
	return spec;
}

/**
 * Loads either the named types or all available types in the 
 * {@code lib/types} source directory
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @param {Array} (optional) type filenames 
 * @return {Object} the types that were loaded for the module
 * @api public
 */
exports.loadTypes = loadTypes = function (mongoose, types) {
	types = figureLoadSpec(types ? types : []);
	var loaded = {};
	if (types.names.length) {
		types.names.forEach(function (type) {
			if (types.filter(type)) {
				var val = require("./types/" + type).loadType(mongoose);
				if (typeof val === 'function')
					loaded[val.name] = val;
			}
		});
	} else {
		var files = require("fs").readdirSync(__dirname + "/types");
		files.forEach(function(filename) {
			if (filename.slice(filename.length-3) === '.js') {
				var base = filename.slice(0, filename.length-3);
				if (types.filter(base)) {
					var val = require("./types/" + base).loadType(mongoose);
					if (typeof val === 'function')
						loaded[val.name] = val;
				}
			}
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
exports.installPlugins = installPlugins = function (mongoose, plugins) {
	plugins = figureLoadSpec(plugins ? plugins : []);
	var loaded = {};
	if (plugins.names.length) {
		plugins.names.forEach(function (plugin) {
			if (plugins.filter(plugin)) {
				var val = require("./plugins/" + plugin).install(mongoose);
				if (typeof val === 'function')
					loaded[val.name] = val;
			}
		});
	} else {
		var files = require("fs").readdirSync(__dirname + "/plugins");
		files.forEach(function(filename) {
			if (filename.slice(filename.length-3) === '.js') {
				var base = filename.slice(0, filename.length-3);
				if (plugins.filter(base)) {
					var val = require("./plugins/" + base).install(mongoose);
					if (typeof val === 'function')
						loaded[val.name] = val;
				}
			}
		});
	}
	return loaded;
}

/**
 * Installs either the named patches or all available patches in the 
 * {@code lib/patches} source directory
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @param {Array} (optional) patch filenames or filter function
 * @return the utilities of the extension (see './utils.js')
 * @api public
 */
exports.installPatches = installPatches = function (mongoose, patches) {
	patches = figureLoadSpec(patches ? patches : []);
	if (patches.names.length) {
		patches.names.forEach(function (patch) {
			if (patches.filter(patch))
				require("./patches/" + patch).install(mongoose);
		});
	} else {
		var files = require("fs").readdirSync(__dirname + "/patches");
		files.forEach(function(filename) {
			if (filename.slice(filename.length-3) === '.js') {
				var base = filename.slice(0, filename.length-3);
				if (patches.filter(base))
					require("./patches/" + base).install(mongoose);
			}
		});
	}
}


/**
 * Installation function that will load all of the types and install
 * both the plugins and the patches that are defined for this mongoose 
 * extension.
 *
 * The {@param options} can either be a {Function} which is passed to
 * the types, plugins and patches installers for filtering, or an 
 * {Object} which identifies which types ({@param options#types}), 
 * plugins ({@param options#plugins}) or patches ({@param options#patches})
 * are to be installed.
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @param {Object} identifying what is to be installed
 * @return {Object} the types, plugins and patches loaded
 * @api public
 */
exports.install = function (mongoose, spec) {
	var loaded = {};
	if (typeof spec == 'function')
		spec = {types: spec, plugins: spec, patches: spec};
	else if (!(typeof spec == 'object'))
		spec = {types: [], plugins: [], patches: []};
	loaded.types = loadTypes (mongoose, spec.types);
	loaded.plugins = installPlugins(mongoose, spec.plugins);
	loaded.patches = installPatches(mongoose, spec.patches);
	return loaded;
}