var mongoose = require("mongoose");
	   
// Create a connection 
var db = mongoose.createConnection();

// Access the mongoose-dbref module and install everything
var dbref = require("mongoose-dbref");
var utils = dbref.install(mongoose);

// Create the schemas
var Schema = mongoose.Schema;
var DBRef = mongoose.SchemaTypes.DBRef;
	
var LineItemSchema = new Schema({
	order: DBRef,
	description: String,
	cost: Number
});

var OrderSchema = new Schema({
	poNumber: String,
	lineItems: [DBRef]
});

// Create models in the sampledb
var LineItem = db.model('LineItem', LineItemSchema);
var Order = db.model('Order', OrderSchema);

// Open a connection to the database and do stuff
db.open("mongodb://localhost/sampledb", function(err) {
	if (err) throw err;

	// Create an order 
	var order = new Order({poNumber: 'NMH1975'});

	// Save the order and look at the virtual
	order.save(function (err) {
		if (err) throw err;
		console.log("DBREF:", order._dbref);

		// Now use the static method to fetch
		Order.fetch(order._dbref, function (err, doc) {
			if (err) throw err;
			console.log("FETCHED:", doc);
			db.close();
		});
	});
});