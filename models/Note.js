var mongoose = require("mongoose");

//save a reference to the schema constructor
var Schema = mongoose.Schema;

//Using the Schema constructor, create a new NoteSchema Object
var NoteSchema = new Schema({
    title: String
    body:String
});

//This creates our model from the above schema, using mongoose's model method
var Note = mongoose.model("Note", NoteSchema);

//Export the Note model
module.exports = Note;
