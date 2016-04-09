+function() {
  'use strict';

  function shuffle( array ) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  function splat( candidates ) {
    if ( candidates.length == 1 && Array.isArray( candidates[0] ) )
      return candidates[0];
    return candidates;
  }

  /*
  parse: parse,

  setAlbum: setAlbum,
  getCurrentAlbum: getCurrentAlbum,
  setSong, setSong*/

  function Player( audioElement ) {

    var _audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var _audioElement = audioElement;

    var gainNode, analyser, source, destination;
    var nodes = [];

    source = _audioContext.createMediaElementSource( audioElement );
    nodes.push( gainNode = _audioContext.createGain() );
    nodes.push( analyser = _audioContext.createAnalyser() );
    destination = _audioContext.destination;

    var _paused = audioElement.paused;
    var _playable = false;
    var _duration = audioElement.duration;
    var _volume = audioElement.volume;
    var _lastVolume = _volume === 0 ? 0.8 : _volume;
    var _shuffle = false
    var _repeat = 0;

    var _playList = [];
    var _playOrder = [];
    var _played = [];

    Object.defineProperty( this, '_audioContext', { get: function() { return _audioContext; } });
    Object.defineProperty( this, '_audioElement', { get: function() { return _audioElement; } });

    Object.defineProperty( this, '_paused', { get: function() { return _paused; }, set: function( v ) { _paused = v; } });
    Object.defineProperty( this, '_playable', { get: function() { return _playable; }, set: function( v ) { _playable = v; } } );
    Object.defineProperty( this, '_duration', { get: function() { return _duration; }, set: function( v ) { _duration = v; } } );
    Object.defineProperty( this, '_volume', { get: function() { return _volume; }, set: function( v ) { _volume = v; } } );
    Object.defineProperty( this, '_lastVolume', { get: function() { return _lastVolume; }, set: function( v ) { _lastVolume = v; } } );
    Object.defineProperty( this, '_shuffle', { get: function() { return _shuffle; }, set: function( v ) { _shuffle = v; } } );
    Object.defineProperty( this, '_repeat', { get: function() { return _repeat; }, set: function( v ) { _repeat = v; } } );

    Object.defineProperty( this, '_playList', { get: function() { return _playList; } } );
    Object.defineProperty( this, '_played', { get: function() { return _played; } } );
    Object.defineProperty( this, '_playOrder', { get: function() { return _playOrder; }, set: function( v ) { _playOrder = v; } } );

    Object.defineProperty( this, 'source', { get: function() { return source; }, enumerable: true } );
    Object.defineProperty( this, 'destination', { get: function() { return destination; }, enumerable: true } );
    Object.defineProperty( this, 'gainNode', { get: function() { return gainNode; }, enumerable: true } );
    Object.defineProperty( this, 'analyser', { get: function() { return analyser; }, enumerable: true } );
    Object.defineProperty( this, 'paused', { get: function() { return this._paused; }, enumerable: true } );
    Object.defineProperty( this, 'duration', { get: function() { return this._duration; }, enumerable: true } );

    Object.defineProperty( this, 'repeatAll', { get: function() { return this._repeat === -1; }, set: function( v ) { if ( v ) { this.setRepeatAll(); } }, enumerable: true } );
    Object.defineProperty( this, 'repeatOne', { get: function() { return this._repeat === 1; }, set: function( v ) { if ( v ) { this.setRepeatOne(); } }, enumerable: true } );
    Object.defineProperty( this, 'repeatNone', { get: function() { return this._repeat === 0; }, set: function( v ) { if ( v ) { this.setRepeatNone(); } }, enumerable: true } );

    Object.defineProperty( this, 'volume', { get: function() { return this._volume; }, set: function( v ) { this.setVolume( v ); }, enumerable: true } );
    Object.defineProperty( this, 'shuffle', { get: function() { return this._shuffle; }, set: function( v ) { this.setShuffled( v ); }, enumerable: true } );
    Object.defineProperty( this, 'nextSong', { get: function() { if ( this._playOrder.length === 0 ) { return null; }; return this._playList[ this._playOrder[0] ]; }, enumerable: true } );
    Object.defineProperty( this, 'currentSong', { get: function() { if ( this._played.length === 0 ) { return null; }; return this._played[ this._played.length - 1 ]; }, enumerable: true } );
    Object.defineProperty( this, 'previousSong', { get: function() { if ( this._played.length <= 1 ) { return null; }; return this._played[ this._played.length - 2 ]; }, enumerable: true } );

    this._listen( audioElement );
    this.connect( nodes );
  }

  Player.prototype._listen = function( audioElement ) {
    audioElement.addEventListener( 'pause', this._onPause.bind( this ) );
    audioElement.addEventListener( 'playing', this._onPlay.bind( this ) );
    audioElement.addEventListener( 'ended', this._onEnded.bind( this ) );
    audioElement.addEventListener( 'volumechange', this._onVolumeChange.bind( this ) );
    audioElement.addEventListener( 'loadstart', this._onLoadPrepare.bind( this ) );
    audioElement.addEventListener( 'progress', this._onLoadProgress.bind( this ) );
    audioElement.addEventListener( 'durationchange', this._onLoadLengthKnown.bind( this ) );
    audioElement.addEventListener( 'canplay', this._onPlayable.bind( this ) );
    audioElement.addEventListener( 'loadedmetadata', this._onLoadMetaKnown.bind( this ) );

    return this;
  }

  Player.prototype.connect = function( nodes ) {
    nodes.reduce( function( from, to ) {
      from.connect( to );
      return to;
    }, this.source ).connect( this.destination );

    return this;
  }

  Player.prototype._onPause = function() {
    console.log( "on:paused", arguments[0] );
    this._paused = true;
    this._audioElement.dispatchEvent( new CustomEvent( 'jigglypuff:pause', { detail: { currentSong: this.currentSong, player: this, paused: this.paused } } ) );
  }

  Player.prototype._onPlay = function() {
    console.log( "on:play", arguments[0] );
    this._paused = false;
    this._audioElement.dispatchEvent( new CustomEvent( 'jigglypuff:play', { detail: { currentSong: this.currentSong, player: this, paused: this.paused } } ) );
  }

  Player.prototype._onVolumeChange = function() {
    console.log( "on:volume", arguments[0] );
    this._volume = this._audioElement.volume;
    this._audioElement.dispatchEvent( new CustomEvent( 'jigglypuff:volume', { detail: { currentSong: this.currentSong, player: this, volume: this.volume } } ) );
  }

  Player.prototype._onLoadPrepare = function() {
    console.log( "on:prepare", arguments[0] );
    this._playable = false;
    this._progress = 0;
    this._audioElement.dispatchEvent( new CustomEvent( 'jigglypuff:prepare', { detail: { currentSong: this.currentSong, player: this, playable: this.playable } } ) );
  }

  Player.prototype._onLoadProgress = function( e ) {
    //console.log( "on:progress", arguments[0] );
  }

  Player.prototype._onLoadLengthKnown = function() {
    console.log( "on:length", arguments[0] );
    this._duration = this._audioElement.duration;
    this._audioElement.dispatchEvent( new CustomEvent( 'jigglypuff:prepare:duration', { detail: { currentSong: this.currentSong, player: this, playable: this.playable } } ) );
  }

  Player.prototype._onLoadMetaKnown = function() {
    console.log( "on:meta", arguments[0] );
    this._audioElement.dispatchEvent( new CustomEvent( 'jigglypuff:prepare:meta', { detail: { currentSong: this.currentSong, player: this, playable: this.playable } } ) );
  }

  Player.prototype._onPlayable = function() {
    console.log( "on:playable", arguments[0] );
    this._playable = true;
    this._audioElement.dispatchEvent( new CustomEvent( 'jigglypuff:playable', { detail: { currentSong: this.currentSong, player: this, playable: this.playable } } ) );
  }

  Player.prototype._onEnded = function() {
    console.log( "on:end", arguments[0] );
    this._audioElement.dispatchEvent( new CustomEvent( 'jigglypuff:end', { detail: { currentSong: this.currentSong, nextSong: this.nextSong, player: this } } ) );

    this._audioElement.loop = this.repeatOne;
    if ( !this.nextSong && this.repeatNone )
      return;

    if ( this.repeatOne ) {
      this.play();
      return;
    }

    this.next();
  }

  Player.prototype.setRepeatAll = function() {
    this._repeat = -1;
    return this;
  }

  Player.prototype.setRepeatOne = function() {
    this._repeat = 1;
    return this;
  }

  Player.prototype.setRepeatNone = function() {
    this._repeat = 0;
    return this;
  }

  Player.prototype.setPlaylist = function() {
    var candidates = [].splice.call( splat( arguments ), 0 );

    this._playList.length = 0;
    this._playOrder.length = 0;

    var actionPush = function( a ) {
      this._playList.push( a );
      this._playOrder.push( this._playOrder.length );
    };

    candidates.forEach( actionPush.bind( this ) );
    this.setShuffled( this.shuffle );
    return this;
  }

  Player.prototype.queue = function() {
    var candidates = [].splice.call( splat( arguments ), 0 );
    (this.shuffle ? shuffle( candidates ) : candidates).forEach( function( a ) {
      this._playList.push( a );
      this._playOrder.forEach( function( o, i ) { this._playOrder[i] = o + 1; } );
      this._playOrder.unshift( this._playList.length - 1 );
    });

    return this;
  }

  Player.prototype.setShuffled = function( v ) {
    this._shuffle = v;
    this._playOrder = v ? shuffle( this._playOrder ) : this._playOrder.sort();

    return this;
  }

  Player.prototype.clearHistory = function () {
    while( this._played.length )
      this._played.pop();
  }

  Player.prototype.next = function() {

    if ( !this.nextSong ) {
      this.setPlaylist( this._playList );
    }

    var song = this.nextSong;
    if ( !song || !song.src )
      return this;

    this._playOrder.shift();
    this._audioElement.src = song.src;
    this._audioElement.load();
    this._played.push( song );

    this.play();

    return this;
  };

  Player.prototype.previous = function() {
    if ( !this.previousSong ) {
      this._audioElement.load();
      this.play();
      return;
    }

    var song = this.previousSong;
    var next = this._played.pop();
    this._audioElement.src = song.src;
    this._audioElement.load();

    var indexOf = this._playList.indexOf( next );
    if ( indexOf >= 0 )
      this._playOrder.unshift( indexOf );

    this.play();
    return this;
  };

  Player.prototype.play = function() {
    if ( this._audioElement.src === "" )
      return this.next();

    this._audioElement.play();
    return this;
  };

  Player.prototype.pause = function() {
    this._audioElement.pause();

    return this;
  };

  Player.prototype.toggleMute = function() {
    if ( this.volume === 0 )
      return this.setVolume( this._lastVolume );
    return this.setVolume( 0 );
  };

  Player.prototype.setVolume = function( volume ) {
    this.gainNode.gain.value = volume;
    this._audioElement.volume = volume;

    if ( volume !== 0 )
      this._lastVolume = volume;

    return this;
  };

  Player.prototype.setPosition = function( time ) {
    if ( this._duration === 0 || isNaN( time ) )
      return;
    this._audioElement.currentTime = Math.min( this._duration, Math.max( 0, time ) );
  }

  function Jigglypuff() {
    return {
      createPlayer: function( source ) { return new Player( source ).setVolume( 1 ); }
    }
  }

  window.Jigglypuff = Jigglypuff();
}();