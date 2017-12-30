var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new ArticleSchema object
// This is similar to a Sequelize model
var ArticleSchema = new Schema({
    // headline is required and of type String
    headline: {
        type: String,
        required: true
    },
    // `link` is required and of type String
    url: {
        type: String,
        required: true
    },
    // short summary of article
    summary: {
        type: String,
        required: true
    },
    saved: {
        type: Boolean,
        default: false
    },
    // `note` is an object that stores a Note id
    // The ref property links the ObjectId to the Note model
    // This allows us to populate the Article with an associated Note
    notes: [
        {
            // Store ObjectIds in the array
            type: Schema.Types.ObjectId,
            ref: "Note"
        }
    ]
});

// This creates our model from the schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;
