WebRTC / PeerJS Audio Chat Demo
=================

This is a simple audio chat app built using WebRTC (via PeerJS). It uses a Node server to keep track peer IDs for each call.

[Live demo](http://audiochat.noahburney.com/)

-------------------------------

To run locally, first you'll need to [get a PeerJS API key](http://peerjs.com/peerserver).

Then, copy `config.js.example` to `config.js`, and add your API key there.

Now install dependencies and run the server:

    $ npm install
    $ node .

Open `http://localhost:6767` in your browser and you should be able to make calls.
