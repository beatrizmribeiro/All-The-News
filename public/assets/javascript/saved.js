$(document).ready(function () {
    // Getting a reference to the article container div we will be rendering all saved articles inside of
    var articleContainer = $(".article-container");
    $(document).on("click", ".btn.delete", handleArticleDelete);
    $(document).on("click", ".btn.notes", handleArticleNotes);
    $(document).on("click", ".btn.save", handleNoteSave);
    $(document).on("click", ".btn.note-delete", handleNoteDelete);

    // initPage kicks everything off when the page is loaded
    initPage();

    function initPage() {
        // Empty the article container, run an AJAX request for any saved headlines
        articleContainer.empty();
        $.get("/api/headlines?saved=true").then(function (data) {
            if (data && data.length) {
                renderArticles(data);
            }
            else {
                // Otherwise render a message explaing we have no articles
                renderEmpty();
            }
        });
    }

    function renderArticles(articles) {
        var articlePanels = [];
        for (var i = 0; i < articles.length; i++) {
            articlePanels.push(createPanel(articles[i]));
        }
        articleContainer.append(articlePanels);
    }

    function createPanel(article) {
        // This functiont takes in a single JSON object for an article/headline
        var panel = $(
                [
                    "<div class='panel panel-default'>",
                    "<div class='panel-heading'>",
                    "<h3>",
                    "<a class='article-link' target='_blank' href='" + article.url + "'>",
                    article.headline,
                    "</a>",
                    "<a class='btn btn-danger delete'>",
                    "Delete From Saved",
                    "</a>",
                    "<a class='btn btn-info notes'>Article Notes</a>",
                    "</h3>",
                    "</div>",
                    "<div class='panel-body'>",
                    article.summary,
                    "</div>",
                    "</div>"
                ].join("")
        );
        // We attach the article's id to the jQuery element
        panel.data("_id", article._id);
        // We return the constructed panel jQuery element
        return panel;
    }

    function renderEmpty() {
        var emptyAlert = $(
                [
                    "<div class='alert alert-warning text-center'>",
                    "<h4>Uh Oh. Looks like we don't have any saved articles.</h4>",
                    "</div>",
                    "<div class='panel panel-default'>",
                    "<div class='panel-heading text-center'>",
                    "<h3>Would You Like to Browse Available Articles?</h3>",
                    "</div>",
                    "<div class='panel-body text-center'>",
                    "<h4><a href='/'>Browse Articles</a></h4>",
                    "</div>",
                    "</div>"
                ].join("")
        );
        // Appending this data to the page
        articleContainer.append(emptyAlert);
    }

    function handleArticleDelete() {
        // Delete the article
        var articleToDelete = $(this).parents(".panel").data();
        // Using a delete method here just to be semantic since we are deleting an article/headline
        $.ajax({
            method: "DELETE",
            url: "/api/headlines/" + articleToDelete._id
        }).then(function (data) {
            if (data.ok) {
                initPage();
            }
        });
    }

    function handleArticleNotes() {
        // opening the notes modal and displaying our notes
        var currentArticle = $(this).parents(".panel").data();
        // Grab any notes with this headline/article id
        $.get("/api/notes/" + currentArticle._id).then(function (data) {
            // Constructing our initial HTML to add to the notes modal
            var modalText = [
                "<div class='container-fluid text-center'>",
                "<h4>Notes For Article: ",
                currentArticle._id,
                "</h4>",
                "<hr />",
                "<ul class='list-group note-container'>",
                "</ul>",
                "<textarea placeholder='New Note' rows='4' cols='60'></textarea>",
                "<button class='btn btn-success save'>Save Note</button>",
                "</div>"
            ].join("");
            // Adding the formatted HTML to the note modal
            bootbox.dialog({
                message: modalText,
                closeButton: true
            });
            var noteData = {
                _id: currentArticle._id,
                notes: data || []         // empty array if no notes exist for the article
            };
            $(".btn.save").data("article", noteData);
            renderNotesList(noteData);
        });
    }

    function renderNotesList(data) {
        var notesToRender = [];
        var currentNote;
        if (!data.notes.length) {
            // If we have no notes, just display a message explaing this
            currentNote = ["<li class='list-group-item'>", "No notes for this article yet.", "</li>"].join("");
            notesToRender.push(currentNote);
        }
        else {
            // If we do have notes, go through each one
            for (var i = 0; i < data.notes.length; i++) {
                // Constructs an li element to contain our noteText and a delete button
                currentNote = $(
                        [
                            "<li class='list-group-item note'>",
                            data.notes[i].noteText,
                            "<button class='btn btn-danger note-delete'>x</button>",
                            "</li>"
                        ].join("")
                );
                // Store the note id on the delete button for easy access when trying to delete
                currentNote.children("button").data("_id", data.notes[i]._id);
                // Adding our currentNote to the notesToRender array
                notesToRender.push(currentNote);
            }
        }
        // Now append the notesToRender to the note-container inside the note modal
        $(".note-container").append(notesToRender);
    }

    function handleNoteSave() {
        // save a new note for an article
        var noteData;
        var newNote = $(".bootbox-body textarea").val().trim();
        if (newNote) {
            noteData = {
                _id: $(this).data("article")._id,
                noteText: newNote
            };
            $.post("/api/notes", noteData).then(function () {
                // When complete, close the modal
                bootbox.hideAll();
            });
        }
    }

    function handleNoteDelete() {
        // Delete the notes
        var noteToDelete = $(this).data("_id");
        $.ajax({
            url: "/api/notes/" + noteToDelete,
            method: "DELETE"
        }).then(function () {
            bootbox.hideAll();
        });
    }
});
