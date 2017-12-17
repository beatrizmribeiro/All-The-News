var express = require("express");
var exphbs  = require('express-handlebars');
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");


var PORT = 3000;

// Scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Requiring the Comment and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// //Set mongoose to leverage built in JavaScript ES6 promises
mongoose.Promise = Promise;

//Initialize express
var app = express();

//Use Morgan and Body-parser
app.use(logger("dev"));
app.use(bodyParser.unlencoded({extended:false}));
app.use(express.static("public"));

// Database Configuration with Mongoose
mongoose.connect("");
var db = mongoose.connection;
db.on("error", function(error){
  console.log("Mongoose it's not working");
});

db.once("open", function(){
  console.log("Mongoose is working");
});
//Routes

//A GET route for scraping the news website
app.get("/scrape", function(req, res){
  //First, we grab the bosy of the html with request
  axios.get("https://www.billboard.com/").then(function(response){
    //Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    //We grab every h2 within an article tag, and do the following
    $("article.h2").each(function(i, element){
      //Save an empty result object
      var result = {};

      //Add the text and href of every link, and save them as properties of result object
      result.title = $(this)
        .children("a")
        .text();
      result.summary = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href")

        //Create a new Article using 'result' object built from Scraping
        db.Article
          .create(result)
          .then(function(dbArticle){
            //If we were able to successfully scrape and save an Article, send a message to the client
            res.send("Scrape Complete");
          })
          .catch(function(err){
            //If an error occurred, send it to the client
            res.json(err);
        });
    });
  });
});

//Route for getting all Articles from db
app.get("/articles", function(req, res){
  //Grab every document in the Articles collection
  db.Articles
    .find({})
    .then(function(dbArticle){
      //if we were able to successfully find Articles, send them back to the Client
      res.json(dbArticle);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article
    .findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

//Route for Delete an article saved
app.delete("/articles/:id", function (req, res){
  //find the article and delete an article on saved articles page
  db.Article
    .findOne({_id: req.params._id})
    .populate("notes")
    .then(function (dbArticle){
      dbArticle.notes.forEach(function (note){
        db.Note
          .remove({_id: note._id})
          .then(function(result){
            //deleted a note associated with article
          })
          .catch(function (err){
            res.json(err);
          });
      });
    });
    .catch(function (err){
      res.json(err);
    });
});

//Start the Server
app.listen(PORT, function(){
  console.log("App running on port" + PORT + "!")
});
