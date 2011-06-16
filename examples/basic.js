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

	// Save the order and attach the line item to it
	order.save(function (err) {
		if (err) throw err;
		
		// Create line item with reference to order
		var lineItem = new LineItem({description: 'Jewel', cost: 5000.00});
		lineItem.order = {"$ref": order.collection.name, "$id": order._id};
		
		// Save the line item and attach it to the order
		lineItem.save(function (err) {
			if (err) throw err;
			order.lineItems.push({"$ref" : lineItem.collection.name, "$id": lineItem._id});
			
			// Save the updated order
			order.save(function (err) {
				if (err) throw err;
				
				// All saved so lets show the tree (bottom-up fetch is easier)
				LineItem.findOne(function (err, doc) {
					if (err) throw err;
					utils.fetch(db, doc.order, function (err, doc1) {
						if (err) throw err;
						console.log("ORDER:", doc1);
						console.log("LINE ITEM:", doc);
						db.close();
					});
				});
			});
		});
	});
});
		 

