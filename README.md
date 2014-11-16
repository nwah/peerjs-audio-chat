WebRTC / PeerJS Audio Chat Demo
=================

This is a barebones proof-of-concept WebRTC audio chat app built using [PeerJS](http://peerjs.com). It uses a simple Node backend that keeps track of peer IDs for each call.

[Live demo](http://audiochat.noahburney.com/)

-------------------------------
## How it works
This app uses the new [WebRTC APIs](http://www.html5rocks.com/en/tutorials/webrtc/basics/) to connect directly to other users' browsers. Here's how it all works.

#### 1. Access your Microphone with getUserMedia()
When you land on the call page, your browser will prompt you to allow the page to access your microphone. This is done by calling [`navigator.getUserMedia()`](https://developer.mozilla.org/en-US/docs/NavigatorUserMedia.getUserMedia).

After allowing microphone access, you have access to a [`LocalMediaStream`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API#LocalMediaStream). There lots of other things you can do with this stream using the [Web Audio API](http://www.html5rocks.com/en/tutorials/webaudio/intro/), but we are't doing anything fancy here.

Here's what we're doing:
```javascript
// handle browser prefixes
navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
  
// Get access to microphone
navigator.getUserMedia (
  // Only request audio
  {video: false, audio: true},
    
  // Success callback
  function success(localAudioStream) {
    // Do something with audio stream
  },
  // Failure callback
  function error(err) {
    // handle error
  }
);
```

#### 2. Connect to PeerJS
[PeerJS](http://peerjs.com) takes care of the hairier parts of using WebRTC for us (STUN, TURN, signaling). To connect, you need to include the PeerJS javascript, then make a new instance of [`Peer`](http://peerjs.com/docs/#api):

```javascript
var me = new Peer({key: API_KEY});
me.on('open', function() {
  console.log('My PeerJS ID is:', me.id);
});
```

The `open` event will fire once you're connected.

For this demo, we're sending this ID to the server, where it's associated with this call ID. When someone else opens the call we then pass them everyone else's PeerJS IDs.

#### 3. Call peers
When other people open the call page, they'll have your PeerJS ID (and maybe other people's). These IDs are then used to connect to each other.

Each `Peer` instance has a `.call()` method that takes a peer's ID, your `LocalMediaStream` as arguments and returns a PeerJS `MediaConnection` object.

```javascript
var outgoing = me.call(peerId, myAudioStream);
```

This `MediaConnection` object will fire a `stream` event when the other person answers your call with their own audio stream.

```javascript
outgoing.on('stream', function(stream) {
  // Do something with this audio stream
});
```

When receiving a `.call()`, your `Peer` instance will fire a `call` event, which gets passes an instance of a PeerJS `MediaConnection`. You then listen for the `stream` event on this object to get incoming audio stream:

```javascript
me.on('call', function(incoming) {
  incoming.on('stream', function(stream) {
    // Do something with this audio stream
  });
});
```

Once all this happens, both parties should have an audio stream from the other person.

#### 4. Play audio
There are two ways to play an audio stream: the Web Audio API, and the HTML5 `<audio>` element. Firefox supports both, but Chrome currently [doesn't support](https://code.google.com/p/chromium/issues/detail?can=2&q=121673&colspec=ID%20Pri%20M%20Iteration%20ReleaseBlock%20Cr%20Status%20Owner%20Summary%20OS%20Modified&id=121673) playing a WebRTC stream using the Web Audio API, so we're using the `<audio>` element here:

```javascript
function playStream(stream) {
  var audio = $('<audio autoplay />').appendTo('body');
  audio[0].src = (URL || webkitURL || mozURL).createObjectURL(stream);
}
```

We use the new `URL.createObjectURL()` method to get a URL that the `<audio>` element can stream.

Also note the `autoplay` attribute. You don't have to have this, but if you don't use it you'll need to manually call the `.play()` on the `<audio>` element.

*That's it. You can read more about using PeerJS in their [documentation](http://peerjs.com/docs/).*

-------------------------------
## Running demo locally
To run this demo on your computer, first you'll need to [get a PeerJS API key](http://peerjs.com/peerserver) (it's free).

Once you have an API key, copy (or rename) `config.js.example` to `config.js`, then open it and add your API key there.

Now just install dependencies and run the server:

```
$ npm install
$ node .
```

Open `http://localhost:6767` in your browser and you should be able to make calls.
