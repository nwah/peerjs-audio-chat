var express = require('express');
var router = express.Router();

var config = require('./config');
var Call = require('./call');

// Create a new Call instance, and redirect
router.get('/new', function(req, res) {
  var call = Call.create();
  res.redirect('/' + call.id);
});

// Add PeerJS ID to Call instance when someone opens the page
router.post('/:id/addpeer/:peerid', function(req, res) {
  var call = Call.get(req.param('id'));
  if (!call) return res.status(404).send('Call not found');
  call.addPeer(req.param('peerid'));
  res.json(call.toJSON());
});

// Remove PeerJS ID when someone leaves the page
router.post('/:id/removepeer/:peerid', function(req, res) {
  var call = Call.get(req.param('id'));
  if (!call) return res.status(404).send('Call not found');
  call.removePeer(req.param('peerid'));
  res.json(call.toJSON());
});

// Return JSON representation of a Call
router.get('/:id.json', function(req, res) {
  var call = Call.get(req.param('id'));
  if (!call) return res.status(404).send('Call not found');
  res.json(call.toJSON());
});

// Render call page
router.get('/:id', function(req, res) {
  var call = Call.get(req.param('id'));
  if (!call) return res.redirect('/new');

  res.render('call', {
    apiKey: config.peerjs.key,
    call: call.toJSON()
  });
});

// Landing page
router.get('/', function(req, res) {
  res.render('index');
});

module.exports = router;