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
 * @api private
 */
var namesForPath = function (path) {
	var root = path.replace(/^[_]+/g,"");
	var names = {cache: "$" + root};
    var partsByUnderscore = root.split('_'),
        parts = [];
    partsByUnderscore.forEach(function(part)  {
        var sParts = part.split('.');
        if(sParts.length > 1)  {
            parts = parts.concat(sParts);
        }  else {
            parts.push(sParts[0]);
        }
    });
    root = '';
    parts.forEach(function(part)  {
        root += part[0].toUpperCase() + part.slice(1);
    });	
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
 * @api public
 */
exports.resolveDBRefs = resolveDBRefs = function resolveDBRefs (schema, options) {
	if (!('mongoose' in options)) 
		throw new Error("'mongoose' option not defined");
	if (!('DBRef' in options.mongoose.Types)) 
		throw new Error("'DBRef' type not installed");	
	var dbref = options.mongoose.SchemaTypes.DBRef;
	schema.eachPath(
		function (path, defn) {
		    var type = defn.options['type'],
		        isArrayType =  Array.isArray(type),
		        options = isArrayType ? type[0] : defn.options;
		    type = isArrayType ? defn.casterConstructor : type;
			if (type !== dbref) 
			    return;
			if (options['resolve'] === true) {
				var names = namesForPath(path);
				if (options['cached'] === true) {
					var cache = names['cache'];
					schema.method(names['getter'], function(callback, force) {
						var val = this.get(path);
						if ((typeof val === 'undefined') || (val === null)) {
							callback(null, null);
						} else {
							force = (force === true) || 
								typeof this[cache] === 'undefined' ||
								this[cache] === val;
							if (!force) {
								callback(null, this[cache]);
							} else { 
								var self = this
								    complete = function(err, doc) {
	                                    self[cache] = doc; callback(err, doc) 
	                                };
								fetchValues.apply(this, [isArrayType, val, complete]);													
							}
						}
					});
					schema.method(names['setter'], function(value) {
						this[cache] = value;
						setValues.apply(this, [path, value, dbref, isArrayType]);
					});
				} else {
					schema.method(names['getter'], function(callback) {
						var values = this.get(path);
						if ((typeof values === 'undefined') || (values === null))
							callback(null, null);
						else {
						    fetchValues.apply(this, [isArrayType, values, callback]);
						}
					});
					schema.method(names['setter'], function(value) {
						setValues.apply(this, [path, value, dbref, isArrayType]);
					});
				}
			}
		});
}

var fetchValues = function(isArrayType, values, callback)  {
    var con = this.db.db;
    if ((typeof con === 'undefined') || (con === null))
        return callback(new Error('mongoose connection not open'));
    if(isArrayType)  {
        var total = values.length,
            docs = [];
        values.forEach(function(value)  {
            con.dereference(value, function(err, doc)  {
                if(err)  {
                    return callback(err);
                }
                docs.push(doc);
                total--;
                if(!total)  {
                    return callback(null, docs);
                }
            });
        });
    }  else  {
        con.dereference(values, callback);   
    }
};

var setValues = function(path, value, dbref, isArrayType)  {
    if (value !== null)  {
        if(isArrayType)  {
            if(!Array.isArray(value))  {
                return callback(new Error('Value passed is not an array'));
            }
            var curValues = this.get(path);
            if(curValues && curValues.length > 0)  {
                curValues.remove();
            }
            value.forEach(function(element)  {
                curValues.push(dbref.prototype.cast(
                        {"$ref": element.collection.name, 
                         "$id": element._id, "$db": element.db.name}));
            });
        }  else  {
            this.set(path, dbref.prototype.cast(
                    {"$ref": value.collection.name, 
                     "$id": value._id, "$db": value.db.name}));
        }
    } 
    else {
        this[path] = null;    
    }
}

/**
 * Installer that installs a plugin into the mongoose infrastructure
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @result {Object} the plugin that was installed
 * @api public
 */
exports.install = function (mongoose) {
	mongoose.plugin(resolveDBRefs, {mongoose: mongoose});
	return resolveDBRefs;
}