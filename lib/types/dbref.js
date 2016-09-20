/**
 * lib/types/dbref.js - the DBRef type
 *
 * Copyright 2011, Stuart Hudson <goulash1971@yahoo.com>
 * Released under the terms of the MIT License.
 * 
 * Version 0.0.2
 */
var mongoose = require("mongoose");


/**
 * Utility function that will cast a single object for a condition
 *
 * @param {Object} the single object to be handled
 * @api private
 */
function handleSingle (value) {
  return this.cast(value);
}

/**
 * Utility function that will cast an array for a condition
 *
 * @param {Array} the array of objects to be handled
 * @api private
 */
function handleArray (value) {
  var self = this;
  return value.map (function(m) {return self.cast(m);});
}

/**
 * Utility function for typeof array testing

 * @param {Object} the object to be tested as an array
 * @api private
 */
var isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
}


/**
 * Loader that loads the type into the mongoose infrastructure
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @result {Object} the type that is loaded
 * @api public
 */
exports.loadType = function (mongoose) {
  // The types that are used for schema and models
  var SchemaType = mongoose.SchemaType;
  var SchemaTypes = mongoose.SchemaTypes;
  var CastError = SchemaType.CastError;

  // The native type used for storage
  var versionSuperior = parseInt(mongoose.version.split('.')[0])
  var dbref = mongoose.mongo.BSONPure.DBRef;
  if(versionSuperior && versionSuperior>=4)
  	dbref = mongoose.mongo.DBRef;
  

  // Constructor for schema type
  function DBRef (value, options) {
    SchemaType.call(this, value, options);
  };

  // Direct inheritence from schema type
  DBRef.prototype.__proto__ = SchemaType.prototype;

  // Testing method to evaluate whether check needed
  DBRef.prototype.checkRequired = function (value) {
    return !!value && value instanceof dbref;
  };

  // Allows a namespace filter to be installed
  DBRef.prototype.ns = function (spec) {
      if (this.nsValidator) {
		  this.nsValidator = false;
		  this.validators = this.validators.filter(function(v) { return v[1] !== 'ns'; });		  
	  }
	  delete this.namespaces;
	  switch (typeof spec) {
	  case 'function':
		this.validators.push ([this.nsValidator = spec, 'ns']);
		break;
	  case 'string' :
		spec = [spec];
	  default:
		this.namespaces = spec;
		this.nsValidator = function (v) { return ~spec.indexOf(v.namespace); };
		this.validators.push ([this.nsValidator, 'ns']);
	  }
  };

  // Casting function using raw or processed refs
  DBRef.prototype.cast = function (value) {
    var oid = SchemaTypes.ObjectId;
    if (value === null) return value;
    if (value instanceof dbref) return value;
    if (typeof value !== 'object') throw new CastError('db reference', value);
    return new dbref(value["$ref"], oid.prototype.cast(value["$id"]), value["$db"]);
  };

  // Condition handlers - glues condition to casting
  DBRef.prototype.$conditionalHandlers = {
    '$ne': handleSingle,
	'$in': handleArray,
	'$nin': handleArray
  };

  // Casting function used in queries & conditions
  DBRef.prototype.castForQuery = function ($conditional, value) {
    var handler;
    if (arguments.length === 2) {
      handler = this.$conditionalHandlers[$conditional];
      if (!handler)
        throw new Error("Can't use " + $conditional + " with DBRef.");
      return handler.call(this, value);
    } else {
      value = $conditional;
      return this.cast(value);
    }
  };

  // Perform the installation
  mongoose.SchemaTypes.DBRef = DBRef;
  mongoose.Types.DBRef = dbref;

  // Return the type
  return DBRef;
}
