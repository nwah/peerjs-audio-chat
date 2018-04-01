// Handle prefixed versions
navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

// State
var me = {};
var myStream;
var peers = {};
var muted = false;
const worker = new Worker('worker/resampler-worker.js');
//init();

// Start everything up
function init() {
  console.log('Init');
  if (!navigator.getUserMedia) return unsupported();

  getLocalAudioStream(function(err, stream) {
    if (err || !stream) return;

    connectToPeerJS(function(err) {
      if (err) return;

      registerIdWithServer(me.id);
      if (call.peers.length) callPeers();
      else displayShareMessage();
    });
  });
}

// Connect to PeerJS and get an ID
function connectToPeerJS(cb) {
  display('Connecting to PeerJS...');
  me = new Peer({ key: API_KEY, 
                  port: 9000,
                  debug: 3, 
                  host: location.hostname, 
                  secure: true,
                  config:  {'iceServers': [ 
                    {url:'stun:stun01.sipphone.com'},
                    {url:'stun:stun.ekiga.net'},
                    {url:'stun:stun.fwdnet.net'},
                    {url:'stun:stun.ideasip.com'},
                    {url:'stun:stun.iptel.org'},
                    {url:'stun:stun.rixtelecom.se'},
                    {url:'stun:stun.schlund.de'},
                    {url:'stun:stun.l.google.com:19302'},
                    {url:'stun:stun1.l.google.com:19302'},
                    {url:'stun:stun2.l.google.com:19302'},
                    {url:'stun:stun3.l.google.com:19302'},
                    {url:'stun:stun4.l.google.com:19302'},
                    {url:'stun:stunserver.org'},
                    {url:'stun:stun.softjoys.com'},
                    {url:'stun:stun.voiparound.com'},
                    {url:'stun:stun.voipbuster.com'},
                    {url:'stun:stun.voipstunt.com'},
                    {url:'stun:stun.voxgratia.org'},
                    {url:'stun:stun.xten.com'},
                    {
                      url: 'turn:numb.viagenie.ca',
                      credential: 'muazkh',
                      username: 'webrtc@live.com'
                    },
                    {
                      url: 'turn:192.158.29.39:3478?transport=udp',
                      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                      username: '28224511:1379330808'
                    },
                    {
                      url: 'turn:192.158.29.39:3478?transport=tcp',
                      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                      username: '28224511:1379330808'
                    }
                  ]}
                });

  me.on('call', handleIncomingCall);
  
  me.on('open', function() {
    display('Connected.');
    display('ID: ' + me.id);
    cb && cb(null, me);
  });
  
  me.on('error', function(err) {
    display(err);
    cb && cb(err);
  });
}

// Add our ID to the list of PeerJS IDs for this call
function registerIdWithServer() {
  display('Registering ID with server...');
  $.post('/' + call.id + '/addpeer/' + me.id);
} 

// Remove our ID from the call's list of IDs
function unregisterIdWithServer() {
  $.post('/' + call.id + '/removepeer/' + me.id);
}

// Call each of the peer IDs using PeerJS
function callPeers() {
  call.peers.forEach(callPeer);
}

function callPeer(peerId) {
  display('Calling ' + peerId + '...');
  var peer = getPeer(peerId);
  peer.outgoing = me.call(peerId, myStream);
  
  peer.outgoing.on('error', function(err) {
    display(err);
  });

  peer.outgoing.on('stream', function(stream) {
    display('Connected to ' + peerId + '.');
    addIncomingStream(peer, stream);
  });
}

// When someone initiates a call via PeerJS
function handleIncomingCall(incoming) {
  display('Answering incoming call from ' + incoming.peer);
  var peer = getPeer(incoming.peer);
  peer.incoming = incoming;
  incoming.answer(myStream);
  peer.incoming.on('stream', function(stream) {
    addIncomingStream(peer, stream);
  });
}

// Add the new audio stream. Either from an incoming call, or
// from the response to one of our outgoing calls
function addIncomingStream(peer, stream) {
  display('Adding incoming stream from ' + peer.id);
  peer.incomingStream = stream;
  playStream(stream);
}

// Create an <audio> element to play the audio stream
function playStream(stream) {
  var audio = $('<audio autoplay />').appendTo('body');
  audio[0].src = (URL || webkitURL || mozURL).createObjectURL(stream);
}

// Get access to the microphone
function getLocalAudioStream(cb) {
  display('Trying to access your microphone. Please click "Allow".');

  navigator.getUserMedia (
    {video: false, audio: true},

    function success(audioStream) {
      display('Microphone is open.');
      
      myStream = audioStream;

      context = new AudioContext();
            
      var source = context.createMediaStreamSource(myStream);
      var bufferSize = 0; // let implementation decide
      recorder = context.createScriptProcessor(bufferSize, 1, 1);
      recorder.onaudioprocess = onAudio;
      source.connect(recorder);
      recorder.connect(context.destination);

      if (cb) cb(null, myStream);
    },

    function error(err) {
      display('Couldn\'t connect to microphone. Reload the page to try again.');
      if (cb) cb(err);
    }
  );
}

function onAudio(e) {
  var left = e.inputBuffer.getChannelData(0);

  worker.postMessage({cmd: "resample", buffer: left});

  drawBuffer(left);
}

function convertFloat32ToInt16(buffer) {
  var l = buffer.length;
  var buf = new Int16Array(l);
  while (l--) {
      buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
  }
  return buf.buffer;
}

//https://github.com/cwilso/Audio-Buffer-Draw/blob/master/js/audiodisplay.js
function drawBuffer(data) {
  var canvas = document.getElementById("canvas"),
      width = canvas.width,
      height = canvas.height,
      context = canvas.getContext('2d');

  context.clearRect (0, 0, width, height);
  var step = Math.ceil(data.length / width);
  var amp = height / 2;
  for (var i = 0; i < width; i++) {
      var min = 1.0;
      var max = -1.0;
      for (var j = 0; j < step; j++) {
          var datum = data[(i * step) + j];
          if (datum < min)
              min = datum;
          if (datum > max)
              max = datum;
      }
      context.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
  }
}


////////////////////////////////////
// Helper functions
function getPeer(peerId) {
  return peers[peerId] || (peers[peerId] = {id: peerId});
}

function displayShareMessage() {
  display('Give someone this URL to chat.');
  display('<input type="text" value="' + location.href + '" readonly>');
  
  $('#display input').click(function() {
    this.select();
  });
}

function unsupported() {
  display("Your browser doesn't support getUserMedia.");
}

function display(message) {
  $('<div/>').html(message).appendTo('#display');
}

$(document).ready(function() {
  console.log( "ready!" );

  const contextSampleRate = (new AudioContext()).sampleRate;
  const resampleRate = contextSampleRate;
  
  var bStream;
  var recorder;

  worker.postMessage({ cmd:"init", from:contextSampleRate, to: resampleRate });

  worker.addEventListener('message', function (e) {
    if (bStream && bStream.writable)
        bStream.write(convertFloat32ToInt16(e.data.buffer));
  }, false);


  $('#mute').click(function(){
    console.log('mute');

    if(!muted){
      myStream.getAudioTracks()[0].enabled = true;
      muted = true;
    } else{
      myStream.getAudioTracks()[0].enabled = false;
      muted = false;
    }
  })

  $('#start').click(function(){
    client = new BinaryClient(`wss://${location.hostname}:8080`);
    client.on('open', function () {
        bStream = client.createStream({sampleRate: resampleRate, userName: "admin" });
    });

    init();
  });
});

