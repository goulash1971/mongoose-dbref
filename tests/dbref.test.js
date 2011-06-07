require('should');
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , db = mongoose.createConnection('mongodb://localhost/mongoose_dbref_tests');

require("../").loadTypes(mongoose, 'dbref');

var JournalSchema = new Schema({
  related: mongoose.SchemaTypes.DBRef
});

mongoose.model('Journal', JournalSchema);
var Journal;

module.exports = {
  before: function(){
    Journal = db.model('Journal', JournalSchema);
    Journal.remove({}, function (err) {});
  },
  'test invalid dbref validation': function () {
    var journal = new Journal({related: 'literal'});
    journal.save(function (err) {
      err.message.should.equal('Validator "dbref is invalid" failed for path related');
      journal.isNew.should.be.true;
    });
  },
  'test valid dbref validation': function () {
    var journal = new Journal({ related: {'$ref': 'entry', '$id': '100000021210'} });
    webpage.save(function (err) {
      err.should.eql(null);
      webpage.isNew.should.be.false;
    });
  },
  teardown: function(){
    db.close();
  }
};
