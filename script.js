document.addEventListener("DOMContentLoaded", function( event ) {
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
  var artistDisplay = document.querySelector( '[data-jigglypuff="meta-artist"]' );
  var trackDisplay = document.querySelector( '[data-jigglypuff="meta-track"]' );

  var analyserDisplay = document.querySelector( '[data-jigglypuff="analyser"]' );
  var canvasContext = analyserDisplay.getContext( '2d' );

  ANALYSER_WIDTH = analyserDisplay.width;
  ANALYSER_HEIGHT = analyserDisplay.height;

  var albumIndex = 0;
  var songIndex = 0;
  var lastSetSong = undefined;
  var lastVolume = 1;

  var id3Cache = {};

  analyser.fftSize = 256;
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;

  var analyserBufferLength = analyser.frequencyBinCount;
  var analyserBuffer = new Uint8Array( analyserBufferLength );

  function setVolume( volume ) {
    gainNode.gain.value = volume;
    audioElement.volume = volume;
  }

  function getAlbum( i ) {
    return Manifest.albums[ normalizeAlbumIndex(i) ];
  }

  function normalizeAlbumIndex( i ) {
    if (i >= Manifest.albums.length || i < 0)
      i = 0;
    return i;
  }

  function setAlbum( i ) {
    albumIndex = normalizeAlbumIndex( i );
    setSong( getAlbum(i), songIndex );
  }

  function normalizeSongIndex( album, i ) {
    if (i >= album.songs.length || i < 0)
      i = 0;
    return i;
  }

  function getSong( album, i ) {
    return album.songs[ normalizeSongIndex( album, i ) ];
  }

  function getSongSrc( album, i ) {
    return album.src + getSong( album, i );
  }

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

  function setSong( album, i ) {
    setSongSrc( getSongSrc( album, i ) );
    updateSongDisplay( album, i );
  }

  function next() {
    var album = getCurrentAlbum();
    songIndex = normalizeSongIndex( album, songIndex + 1 );
    setSong( album, songIndex );
  }

  function prev() {
    var album = getCurrentAlbum();
    songIndex = normalizeSongIndex( album, songIndex - 1 );
    setSong( album, songIndex );
  }

  function nextAlbum() {
    albumIndex = normalizeAlbumIndex( albumIndex + 1 );
    songIndex = 0;

    var album = getCurrentAlbum();
    setSong( album, songIndex );
  }

  function play() {
    audioElement.play();

    actionPlay.style = "display: none;";
    actionPause.style = "display: inline-block;";
  }

  function pause() {
    audioElement.pause();

    actionPause.style = "display: none;";
    actionPlay.style = "display: inline-block;";
  }

  function getCurrentAlbum() {
    return getAlbum( albumIndex );
  }

  function updateMetaDisplay() {
    var album = getCurrentAlbum();
    var src = getSongSrc( album, songIndex );

    if ( id3Cache[ src ] ) {
      updateSongDisplayFromTags( album, songIndex );
      return;
    }

      console.log( "Try to fetch tags for " + src );

    id3( src, function( err, tags ) {
      id3Cache[ src ] = tags;

      if ( !err )
        updateMetaDisplay();
    } );
  }

  function updateSongDisplay( album, i ) {
    var src = getSongSrc( album, i );
    if ( id3Cache[ src ] ) {
      return updateSongDisplayFromTags( album, i );
    }

    console.log( "Updating song display for " + src );

    trackDisplay.innerHTML = getSong( album, i);
    albumDisplay.innerHTML = album.name;
    artistDisplay.innerHTML = album.artist;
  }

  function updateSongDisplayFromTags( album, i ) {
    var src = getSongSrc( album, i );
    var tags = id3Cache[ src ];

    if ( !tags ) {
      return updateSongDisplay( album, i );
    }

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

  function mute() {
    if ( audioElement.volume != 0 )
      lastVolume = audioElement.volume;

    setVolume( 0 );

    actionMute.removeEventListener( 'click', mute );
    actionMute.addEventListener( 'click', unmute );
  }

  function unmute() {
    setVolume( lastVolume );

    actionMute.removeEventListener( 'click', unmute );
    actionMute.addEventListener( 'click', mute );
  }

  function analyseMoment() {
    analyser.getByteTimeDomainData( analyserBuffer );

    canvasContext.clearRect(0, 0, ANALYSER_WIDTH, ANALYSER_HEIGHT);

    var barWidth = (ANALYSER_WIDTH / analyserBufferLength) * 2.5;
    var barHeight;
    var x = 0;

    for(var i = 0; i < analyserBufferLength; i++) {
      barHeight = analyserBuffer[i];

      canvasContext.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
      canvasContext.fillRect(x,ANALYSER_HEIGHT-barHeight/2,barWidth,barHeight/2);

      x += barWidth + 1;
    }

    analyse = requestAnimationFrame( analyseMoment );
  }

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

  audioElement.addEventListener( 'loadedmetadata', updateMetaDisplay );
  audioElement.addEventListener( 'ended', next );

  // Start
  setSong( getCurrentAlbum(), songIndex );
  analyseMoment();

  Jigglypuff = {
    next: next,
    prev: prev,
    play: play,
    pause: pause,
    setVolume: setVolume,
    setAlbum: setAlbum,

    getCurrentAlbum: getCurrentAlbum,
    setSong, setSong
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Jigglypuff;
  else
    window.Jigglypuff = Jigglypuff;
});
