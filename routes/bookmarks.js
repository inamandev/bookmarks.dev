var express = require('express');
var router = express.Router();
var Bookmark = require('../models/bookmark');

/* GET bookmark by id. */
router.get('/:id', function(req, res, next) {
  Bookmark.findById(req.params.id, function(err, bookmark){
    if(err){
      console.log(err);
      return res.status(500).send(err);
    }
    if(!bookmark){
      return res.status(404).send("Bookmark not found");
    }
    res.send(bookmark);
  });

});

/* GET bookmarks listing. */
router.get('/', function(req, res, next) {
  if(req.query.term){
    var regExpTerm = new RegExp(req.query.term, 'i');
    var regExpSearch=[{name:{$regex:regExpTerm}}, {description:{$regex: regExpTerm }}, {category:{$regex:regExpTerm }}, {tags:{$regex:regExpTerm}}];
    Bookmark.find({'$or':regExpSearch}, function(err, bookmarks){
      if(err){
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  } else {//no filter - all bookmarks
    Bookmark.find({}, function(err, bookmarks){
      if(err){
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  }

});

/**
 * CREATE bookmark
 */
router.post('/', function(req, res, next){
  console.log(req.body);
  var bookmark = new Bookmark(req.body); //expect the model structure in the body directly

  bookmark.save(function (err, updatedBookmark) {
    if (err){

      if(err.name == 'ValidationError'){
        var errorMessage = 'Following validations failed';
        for (var i in err.errors) {
          validationError = err.errors[i];
          console.log("validation ererooooooooor " + validationError.message);
          //errorMessage.concat('\n');
          errorMessage += '\n' + validationError.message;
          errorMessage.concat(validationError.message.toString());
        }

        console.log(" Final error message " + errorMessage);
        return res.status(400).send({"title":"validation error", "message" : errorMessage});
      }

      console.log(err);
      res.status(500).send(err);
    } else {
      res.set('Location', 'http://localhost:3000/bookmarks/' + updatedBookmark.id);
      res.status(201).send('Bookmark created');
    }
    // saved!
  });

});

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 */
router.put('/:id', function(req, res, next) {
  Bookmark.findByIdAndUpdate(req.params.id, req.body, {new: true}, function(err, bookmark){
    if(err){
      if(err.name == 'ValidationError'){
        var errorMessage = '';
        return res.status(400).send({"title":"validation error", "message" : errorMessage});
      }
      console.log("SOooooooooome : " + err);
      return res.status(500).send(err);
    }
    if(!bookmark){
      return res.status(404).send('Bookmark not found');
    }
    res.status(200).send(bookmark);
  });

});


/**
 * DELETE
 */
router.delete('/:id', function(req, res, next) {
  Bookmark.findByIdAndRemove(req.params.id, function(err, bookmark){
    if(err){
      return res.status(500).send(err);
    }
    if(!bookmark){
      return res.status(404).send('Bookmark not found');
    }
    res.status(204).send('Bookmark successfully deleted');
  });

});

/* TODO - maybe implement later advancedSearch */
router.get('/advanced-search', function(req, res, next) {
  var regexSearch=[];
  if(req.query.name){
    var regExpName = new RegExp(req.query.category, 'i');
    regexSearch.push({ 'name': { $regex: regExpName }});
    regexSearch.push({ 'description': { $regex: regExpName }});
  }
  if(req.query.category){
    var regExpCategory = new RegExp(req.query.category, 'i');
    regexSearch.push({ 'category': { $regex: regExpCategory }});
  }
  if(req.query.tag){
    var regExpTag = new RegExp(req.query.tag, 'i');
    regexSearch.push({ 'tags': { $regex: regExpTag }});
  }
  if(regexSearch.length > 0){
    Bookmark.find().or(regexSearch, function(err, bookmarks){
      if(err){
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  } else {//no filter - all bookmarks
    Bookmark.find({}, function(err, bookmarks){
      if(err){
        return res.status(500).send(err);
      }
      res.send(bookmarks);
    });
  }

});

module.exports = router;