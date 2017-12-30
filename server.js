var express = require("express");
// var exphbs  = require('express-handlebars');
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

// Scraping tools
var cheerio = require("cheerio");
var request = require("request");

// Requiring the Comment and Article models
var db = require("./models");

var PORT = process.env.PORT || 8080;
//Initialize express
var app = express();

//Use Morgan and Body-parser
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static("public"));

// Database Configuration with Mongoose
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

//Routes

// GET route for scraping the News website
app.get("/api/scrape", function (req, res) {
    var addedCount = 0;

    // default message to send back at the end of scraping if no new articles
    var message = "No new articles today!";

    // Make a request call to grab the HTML body from News site
    request("http://www.bbc.com/", function(error, response, html) {
        // Load the HTML into cheerio and save it to a variable
        var $ = cheerio.load(html);

        // Select each article in the HTML body from which we want information.
        $("div.media__content").each(function (i, element) {
            var result = {};
            var $title = $(element).find("h3.media__title a");

            var url = $title.attr("href");
            if (url.indexOf("http") !== -1) {
                result.url = url;
                console.log(url)
            }
            else {
                result.url = "http://www.bbc.com/" + url;
                console.log("here")
            }
            // find the headline
            result.headline = $title.text().replace(/^\s+|\s+$/g, '');

            // next, find the summary text for the article
            var $summary = $(element).find("p.media__summary");
            result.summary = $summary.text().replace(/^\s+|\s+$/g, '');

            if (result.url !== "" && result.headline !== "" && result.summary !== "") {
                db.Article
                .findOne({headline: result.headline})
                .then(function (dbArticle) {
                    // if it doesn't exist in the database, then we can add it
                    if (dbArticle === null) {
                        // article doesn't exist in the db create a new Article
                        db.Article
                        .create(result)
                        .then(function (dbArticle) {
                            addedCount++;
                        })
                        .catch(function (err) {
                            res.json(err);
                        });
                    }
                })
                .catch(function (err) {
                    res.json(err);
                });

            }
        });

    });
});

// GET route for getting all saved or not-saved Articles from the db
app.get("/api/headlines", function (req, res) {
    db.Article
    .find({saved: req.query.saved})
    .then(function (dbArticle) {
        res.json(dbArticle);
    })
    .catch(function (err) {
        res.json(err);
    });
});


// PUT route for saving an article
app.put("/api/headlines/", function (req, res) {
    db.Article
    .update({_id: req.body._id}, {$set: {saved: true}})
    .then(function (result) {
        res.json(result);
    })
    .catch(function (err) {
        res.json(err);
    });

});


// DELETE route for deleting an article on saved articles page
app.delete("/api/headlines/:_id", function (req, res) {
    // find the article and delete all its associated notes first
    db.Article
    .findOne({_id: req.params._id})
    .populate("notes")
    .then(function (dbArticle) {
        dbArticle.notes.forEach(function (note) {
            db.Note
            .remove({_id: note._id})
            .then(function (result) {
                // deleted a note associated with article
            })
            .catch(function (err) {
                res.json(err);
            });
        });
    })
    .catch(function (err) {
        res.json(err);
    });
  });


// GET route for getting a specific Article's notes given the Article's id
app.get("/api/notes/:_id", function (req, res) {
    // find one article by id
    db.Article
    .findOne({_id: req.params._id})
    .populate("notes")
    .then(function (dbArticle) {
        res.json(dbArticle.notes);
    })
    .catch(function (err) {
        // If an error occurs, send it back to the client
        res.json(err);
    });
});

// POST route for saving a new Note to the db and associating it with an Article
app.post("/api/notes", function (req, res) {
    // Create a new Note in the db
    db.Note
    .create({noteText: req.body.noteText})
    .then(function (dbNote) {
        // If a Note was created successfully, find the associated article
        return db.Article.findOneAndUpdate({_id: req.body._id}, {$push: {notes: dbNote._id}}, {new: true});
    })
    .then(function (dbArticle) {
        res.json(dbArticle);
    })
    .catch(function (err) {
        res.json(err);
    });
});

// DELETE route for deleting a note given its id
app.delete("/api/notes/:_id", function (req, res) {
    db.Note
    .remove({_id: req.params._id})
    .then(function (result) {
        res.json(result);
    })
    .catch(function (err) {
        res.json(err);
    });
});


// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
