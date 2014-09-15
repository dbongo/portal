'use strict';

var path = require('path');

// Send partial view or 404 if doesn't exist
exports.partials = function(req, res) {
  var stripped = req.url.split('.')[0];
  var reqView = path.join('./', stripped);
  res.render(reqView, function(err, html) {
    if(err) {
      console.log("Error rendering partial '" + reqView + "'\n", err);
      res.status(404).end();
    } else {
      res.send(html);
    }
  });
};


//Send our single page lib
exports.index = function(req, res) {
  res.render('index');
};
