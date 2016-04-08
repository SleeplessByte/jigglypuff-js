document.addEventListener("DOMContentLoaded", function( event ) {
  'use strict';

  var audioContext = new (window.AudioContext || window.webkitAudioContext)();

  var audioElement = document.querySelector( 'audio' );
  var source = audioContext.createMediaElementSource( audioElement );
  var gainNode = audioContext.createGain();
  var analyser = audioContext.createAnalyser();
  var destination = audioContext.destination;

  var actionPlay = document.querySelector( '[data-jigglypuff="play"]');
  var actionPause = document.querySelector( '[data-jigglypuff="pause"]');
  var actionMute = document.querySelector( '[data-jigglypuff="mute"]');
  var actionNext = document.querySelector( '[data-jigglypuff="next"]');
  var actionPrev = document.querySelector( '[data-jigglypuff="prev"]');
  var actionNextAlbum = document.querySelector( '[data-jigglypuff="next-album"]' );

  var albumDisplay = document.querySelector( '[data-jigglypuff="meta-album"]' );
  var albumCoverDisplay = document.querySelector( '[data-jigglypuff="meta-album-cover"]');
  var artistDisplay = document.querySelector( '[data-jigglypuff="meta-artist"]' );
  var trackDisplay = document.querySelector( '[data-jigglypuff="meta-track"]' );
  var progressDisplay = document.querySelector( '[data-jigglypuff="song-progress"]');
  var progressTrack = document.querySelector( '[data-jigglypuff="song-progress-track"]');
  var analyserDisplay = document.querySelector( '[data-jigglypuff="analyser"]' );
  var canvasContext = analyserDisplay.getContext( '2d' );

  var vibrantColor = '#000000';

  var analyserBufferLength, analyserBuffer, analyserWidth, analyserHeight,
      analyserPixelPerfectWidth, analyserSkip;

  var albumIndex = 0;
  var songIndex = 0;
  var lastSetSong = undefined;
  var lastVolume = 1;
  var isPlaying = false;

  var id3Cache = {};
  var albumsCache = [];

  analyser.minDecibels = -90;
  //analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;

  function resize() {
    analyserDisplay.width = analyserDisplay.getBoundingClientRect().width;

    analyserWidth = analyserDisplay.width;
    analyserHeight = analyserDisplay.height;

    // find next power of two
    var size = analyserWidth * 2 - 1;
    size |= size >> 1;
    size |= size >> 2;
    size |= size >> 4;
    size |= size >> 8;
    size |= size >> 16;
    analyser.fftSize = size + 1;

    analyserBufferLength = analyser.frequencyBinCount;
    analyserBuffer = new Uint8Array( analyserBufferLength );

    // upper part of the graph will be mostly empty
    analyserPixelPerfectWidth = Math.round( 1.0 / analyserBufferLength * analyserWidth );
    analyserSkip = 2;
  }

  function Player( source, destination ) {

  }

  function Album( source ) {
    var r = {};
    for( var k in source ) {
      if ( source.hasOwnProperty(k))
        r[k] = source[k];
    };

    /**
     *  Makes sure that the index i is a valid song index for an album
     * @param  {Integer} i the song index
     * @return {Integer} the index if valid or 0
     */
    r.normalizeSongIndex = function( i ) {
      i = +i;
      if (i >= this.songs.length || i < 0)
        i = 0;
      return i;
    }

    /**
     * Gets a song in an album
     * @param  {[type]} i     [description]
     * @return {[type]}       [description]
     */
    r.getSong = function( i ) {
      return this.songs[ this.normalizeSongIndex( i ) ];
    }

    /**
     * [getSongSrc description]
     * @param  {[type]} i     [description]
     * @return {[type]}       [description]
     */
    r.getSongSrc = function( i ) {
      return this.src + this.getSong( i ).src;
    }

    return r;
  }

  /**
   * Sets the volume of the gain node and the audio element
   * @param {Float} volume level between 0 and 1
   */
  function setVolume( volume ) {
    gainNode.gain.value = volume;
    audioElement.volume = volume;
  }

  /**
   * Get an album by index
   * @param  {Integer} i the index in the album
   * @return {Object} the album
   */
  function getAlbum( i ) {
    i = normalizeAlbumIndex(i);
    if ( !albumsCache[ i ] )
      albumsCache[ i ] = new Album( Manifest.albums[ i ] );
    return albumsCache[ i ];
  }

  /**
   * Makes sure that the index i is a valid index for an album
   * @param  {Integer} i the index
   * @return {Integer} i if valid or 0
   */
  function normalizeAlbumIndex( i ) {
    i = +i;
    if (i >= Manifest.albums.length || i < 0)
      i = 0;
    return i;
  }

  /**
   * Sets the current album to the index i
   * @param {Integer} i the album index
   */
  function setAlbum( i ) {
    albumIndex = normalizeAlbumIndex( i );
    songIndex = 0;
    setSong( getAlbum( albumIndex ), songIndex );
  }

  /**
   * [setSongSrc description]
   * @param {[type]} src [description]
   */
  function setSongSrc( src ) {
    if ( lastSetSong != src ) {

      // Force garbage collection
      //audioElement.src = "";
      //audioElement.load();

      // Load song
      console.log( "Loading song " + src );
      audioElement.src = src;
      audioElement.load();

      lastSetSong = src;
    }

    play();
  }

  /**
   * [setSong description]
   * @param {[type]} album [description]
   * @param {[type]} i     [description]
   */
  function setSong( album, i ) {
    setSongSrc( album.getSongSrc( i ) );
    //updateSongDisplay( album, i );
  }

  /**
   * [next description]
   * @return {Function} [description]
   */
  function next() {
    var album = getCurrentAlbum();
    songIndex = album.normalizeSongIndex( songIndex + 1 );
    setSong( album, songIndex );
  }

  /**
   * [prev description]
   * @return {[type]} [description]
   */
  function prev() {
    var album = getCurrentAlbum();
    songIndex = album.normalizeSongIndex( songIndex - 1 );
    setSong( album, songIndex );
  }

  /**
   * [nextAlbum description]
   * @return {[type]} [description]
   */
  function nextAlbum() {
    albumIndex = normalizeAlbumIndex( albumIndex + 1 );
    songIndex = 0;

    var album = getCurrentAlbum();
    setSong( album, songIndex );
  }

  /**
   * [play description]
   * @return {[type]} [description]
   */
  function play() {
    var wasPaused = audioElement.paused;
    audioElement.play();

    if ( wasPaused )
      updateProgress();

    actionPlay.style = "display: none;";
    actionPause.style = "display: inline-block;";
  }

  function playAtPosition( event ) {
    var pos = event.offsetX / progressTrack.getBoundingClientRect().width;
    playAtDuration( audioElement.duration * pos );
  }

  function playAtDuration( duration ) {
    audioElement.currentTime = duration;

    if ( audioElement.paused )
      updateProgress();
  }

  /**
   * [pause description]
   * @return {[type]} [description]
   */
  function pause() {
    audioElement.pause();

    actionPause.style = "display: none;";
    actionPlay.style = "display: inline-block;";
  }

  /**
   * [getCurrentAlbum description]
   * @return {[type]} [description]
   */
  function getCurrentAlbum() {
    return getAlbum( albumIndex );
  }

  /**
   * Update the playing now display
   */
  function updateMetaDisplay() {
    var album = getCurrentAlbum();
    var song = album.getSong( songIndex );
    var src = album.getSongSrc( songIndex );

    albumCoverDisplay.style = "background-color: " + album.color;
    albumCoverDisplay.src = album.thumb;

    if ( id3Cache[ src ] ) {
      updateSongDisplayFromTags( album, songIndex );
      return;
    }
    updateSongDisplay( album, songIndex );

    console.warn( "Try to fetch tags for " + src );
    id3( src, function( err, tags ) {
      id3Cache[ src ] = tags;

      if ( !err )
        updateMetaDisplay();
    } );
  }

  /**
   * [updateSongDisplay description]
   * @param  {[type]} album [description]
   * @param  {[type]} i     [description]
   */
  function updateSongDisplay( album, i ) {
    var song = album.getSong( songIndex );
    var src = album.getSongSrc( i );

    console.log( "Updating song display for " + src );

    trackDisplay.innerHTML = song.track + ". " + song.name;
    albumDisplay.innerHTML = album.name;
    artistDisplay.innerHTML = song.artist;
  }

  /**
   * [updateSongDisplayFromTags description]
   * @param  {[type]} album [description]
   * @param  {[type]} i     [description]
   */
  function updateSongDisplayFromTags( album, i ) {
    var song = album.getSong( songIndex );
    var src = album.getSongSrc( i );
    var tags = id3Cache[ src ];

    if ( !tags )
      return;

    console.log( "Updating song display with tags for " + src );
    console.log( tags );

    var track = i;
    if ( tags.v2 )
      track = tags.v2.track;
    else if ( tags.v1 )
      track = tags.v1.track;

    trackDisplay.innerHTML = track + ". " + tags.title;
    albumDisplay.innerHTML = tags.album;
    artistDisplay.innerHTML = tags.artist;
  }

  /**
   * [mute description]
   * @return {[type]} [description]
   */
  function mute() {
    if ( audioElement.volume != 0 )
      lastVolume = audioElement.volume;

    setVolume( 0 );

    actionMute.removeEventListener( 'click', mute );
    actionMute.addEventListener( 'click', unmute );
  }

  /**
   * [unmute description]
   * @return {[type]} [description]
   */
  function unmute() {
    setVolume( lastVolume );

    actionMute.removeEventListener( 'click', unmute );
    actionMute.addEventListener( 'click', mute );
  }

  function vibrant() {
    var vibrant = new Vibrant( albumCoverDisplay );
    var swatches = vibrant.swatches()
    if (swatches.hasOwnProperty( 'Vibrant' ) && swatches['Vibrant'])
      vibrantColor = swatches['Vibrant'].getHex()

    /*
     * Results into:
     * Vibrant #7a4426
     * Muted #7b9eae
     * DarkVibrant #348945
     * DarkMuted #141414
     * LightVibrant #f3ccb4
     */
  }

  /**
   * [analyseMoment description]
   * @return {[type]} [description]
   */
  function analyseMoment() {
    analyser.getByteFrequencyData( analyserBuffer );

    canvasContext.clearRect(0, 0, analyserWidth, analyserHeight);
    //analyserBufferLength is at least the width -> next power of 2
    for( var i = 0; i < analyserBufferLength; i++ ) {
      var o = analyserBuffer[i];
      var barHeight = (o / 255) * analyserHeight + 2;
      if (i % analyserSkip === 0) {
        canvasContext.beginPath();
        canvasContext.rect( analyserPixelPerfectWidth * i, analyserHeight - barHeight, analyserPixelPerfectWidth, barHeight);

        var grad = canvasContext.createLinearGradient(0, analyserHeight,0,0);
        grad.addColorStop(0, vibrantColor );
        grad.addColorStop(1, vibrantColor);

        canvasContext.fillStyle = grad;
        canvasContext.fill();

      }
    }
    var analyse = requestAnimationFrame( analyseMoment );
  }

  function updateProgress( stop ) {
    var percentage = audioElement.currentTime / audioElement.duration * 100
    if ( isNaN( percentage ) )
      percentage = 0;

    progressDisplay.style = "width: " + percentage + "%; background-color: " + vibrantColor;

    if ( !audioElement.paused )
      var progress = requestAnimationFrame( updateProgress );
  }

  function _playSong() {
    var song = this.getAttribute( 'data-song' );
    var album = this.getAttribute( 'data-album' );

    albumIndex = normalizeAlbumIndex( album );
    var album = getCurrentAlbum();
    songIndex = album.normalizeSongIndex( song );
    setSong( album, songIndex );
  }

  function _playAlbum() {
    var album = this.getAttribute( 'data-album' );
    setAlbum( album );
  }

  function parse() {
    var songActions = document.querySelectorAll( '[data-jigglypuff="play-song"]' );
    for( var i = 0; i < songActions.length; i++ )
      songActions[i].addEventListener( 'click', _playSong );

    var albumActions = document.querySelectorAll( '[data-jigglypuff="play-album"]' );
      for( var i = 0; i < albumActions.length; i++ )
        albumActions[i].addEventListener( 'click', _playAlbum );
  }

  parse();

  // Connect nodes
  source.connect( analyser );
  analyser.connect( gainNode );
  gainNode.connect( destination );

  // Set some initial volume
  setVolume( lastVolume );

  // Some Debug information
  console.log( source );
  console.log( destination );
  console.log( gainNode );
  console.log( audioElement.src );

  // Bind events
  actionPlay.addEventListener( 'click', play );
  actionPause.addEventListener( 'click', pause );
  actionNext.addEventListener( 'click', next );
  actionPrev.addEventListener( 'click', prev );
  actionMute.addEventListener( 'click', mute );
  actionNextAlbum.addEventListener( 'click', nextAlbum );
  progressTrack.addEventListener( 'click', playAtPosition );

  audioElement.addEventListener( 'loadedmetadata', updateMetaDisplay );
  audioElement.addEventListener( 'ended', next );

  albumCoverDisplay.addEventListener( 'load', vibrant );

  window.addEventListener( 'resize', resize );

  // Start
  resize();
  setSong( getCurrentAlbum(), songIndex );
  analyseMoment();

  var Jigglypuff = {
    next: next,
    prev: prev,
    play: play,
    pause: pause,
    setVolume: setVolume,
    setAlbum: setAlbum,
    parse: parse,

    getCurrentAlbum: getCurrentAlbum,
    setSong, setSong
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Jigglypuff;
  else
    window.Jigglypuff = Jigglypuff;
});
