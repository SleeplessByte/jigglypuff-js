+function() {
  'use strict';

  function nextPowerOfTwo( v ) {
    v = v - 1;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    return v + 1;
  }

  document.addEventListener("DOMContentLoaded", function( event ) {

    var audioElement = document.querySelector( 'audio' );
    var player = Jigglypuff.createPlayer( audioElement );

    var fetchId3 = (function () {
      var id3Cache = {};

      /**
       * Fetches the ID3 tags for a song
       * @param  {url} src the song
       */
      return function( song ) {

        if ( id3Cache[ song.src ] ) {
          updatePlayingNowFromTags( id3Cache );
          return;
        }

        id3( song.src, function( err, tags ) {
          id3Cache[ song.src ] = tags;
          if ( !err )
            updatePlayingNowFromTags( id3Cache );
        });
      };
    })();

    function updatePlayingNowFromTags( id3Cache ) {
      var song = player.currentSong;
      if ( !id3Cache[ song.src ] )
        return;

      var tags = id3Cache[ song.src ];
      if ( !tags )
        return;

      console.log( "Updating song display with tags for " + song.name, tags );

      var track = song.track;
      if ( tags.v2 )
        track = tags.v2.track;
      else if ( tags.v1 )
        track = tags.v1.track;

      trackDisplay.innerHTML = tags.title;
      albumDisplay.innerHTML = tags.album;
      artistDisplay.innerHTML = tags.artist;
    }

    /**
     * [drawProgress description]
     * @return {[type]} [description]
     */
    function drawProgress() {
      var percentage = audioElement.currentTime / audioElement.duration * 100
      if ( isNaN( percentage ) )
        percentage = 0;

      progressDisplay.style = "transform: translateX( -" + ( 100 - percentage ) + "% ); background-color: " + vibrantColor;
      var progress = setTimeout( drawProgress, 100 );
    }


    /**
     * [analyseMoment description]
     * @return {[type]} [description]
     */
    function drawVisualiser() {
      player.analyser.getByteFrequencyData( analyserBuffer );

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
      var analyse = requestAnimationFrame( drawVisualiser );
    }

    /**
     * Sets the current album to the index i
     * @param {Integer} i the album index
     */
    function playAlbum( album ) {
      player.setPlaylist( album.songs.map( function(s) { s.album = album; return s; } ) ).next();
    }

    /**
     * Play
     * @param  {[type]} event [description]
     * @return {[type]}       [description]
     */
    function onProgressTrackClicked( event ) {
      var pos = event.offsetX / progressTrack.getBoundingClientRect().width;
      player.setPosition( player.duration * pos );
    }

    /**
     * [vibrant description]
     * @param  {[type]} source [description]
     * @return {[type]}        [description]
     */
    function vibrant( source ) {
      var vibrant = new Vibrant( source );
      return vibrant.swatches();
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
     * [resize description]
     * @return {[type]} [description]
     */
    var resizeQueued = false;
    function onResize() {
      if ( resizeQueued )
        return;
      resizeQueued = true;
      setTimeout( postResize, 0 );
    }

    function postResize() {
      analyserDisplay.width = analyserDisplay.getBoundingClientRect().width;
      analyserWidth = analyserDisplay.width;
      analyserHeight = analyserDisplay.height;
      player.analyser.fftSize = nextPowerOfTwo(analyserWidth * 2);

      analyserBufferLength = player.analyser.frequencyBinCount;
      analyserBuffer = new Uint8Array( analyserBufferLength );

      // upper part of the graph will be mostly empty
      analyserPixelPerfectWidth = Math.round( 1.0 / analyserBufferLength * analyserWidth );
      analyserSkip = 2;

      resizeQueued = false;
    }

    var analyserBufferLength, analyserBuffer, analyserWidth, analyserHeight,
        analyserPixelPerfectWidth, analyserSkip;

    player.analyser.minDecibels = -90;
    player.analyser.maxDecibels = -10;
    player.analyser.smoothingTimeConstant = 0.85;

    var actionPlay = document.querySelector( '[data-jigglypuff="play"]');
    var actionPause = document.querySelector( '[data-jigglypuff="pause"]');
    var actionMute = document.querySelector( '[data-jigglypuff="mute"]');
    var actionNext = document.querySelector( '[data-jigglypuff="next"]');
    var actionPrev = document.querySelector( '[data-jigglypuff="prev"]');
    var actionPlayAlbum = document.querySelector( '.album-listing .fab-action' );

    var albumCoverDisplay = document.querySelector( '[data-jigglypuff="meta-album-cover"]');
    var albumDisplay = document.querySelector( '[data-jigglypuff="meta-album"]' );
    var artistDisplay = document.querySelector( '[data-jigglypuff="meta-artist"]' );
    var trackDisplay = document.querySelector( '[data-jigglypuff="meta-track"]' );
    var progressDisplay = document.querySelector( '[data-jigglypuff="song-progress"]');
    var progressTrack = document.querySelector( '[data-jigglypuff="song-progress-track"]');
    var analyserDisplay = document.querySelector( '[data-jigglypuff="analyser"]' );
    var canvasContext = analyserDisplay.getContext( '2d' );

    actionPlay.addEventListener( 'click', player.play.bind( player ) );
    actionPause.addEventListener( 'click', player.pause.bind( player ) );
    actionNext.addEventListener( 'click', player.next.bind( player ) );
    actionPrev.addEventListener( 'click', player.previous.bind( player ) );
    actionMute.addEventListener( 'click', player.toggleMute.bind( player ) );
    albumCoverDisplay.addEventListener( 'click', showCurrentAlbum );
    progressTrack.addEventListener( 'click', onProgressTrackClicked );
    actionPlayAlbum.addEventListener( 'click', onActionPlayAlbum );

    var vibrantColor = '#000000';
    var fftColor = 'rgba( 0, 0, 0, .87 )';

    player.on( 'jigglypuff:prepare', function( detail, e ) {

      console.info( detail, e );

      if ( detail.currentSong ) {
        var song = detail.currentSong;

        trackDisplay.innerHTML = song.name;
        trackDisplay.setAttribute( 'data-song', song.track );
        artistDisplay.innerHTML = song.artist;

        if ( song.album  ) {
          var album = detail.currentSong.album;
          albumCoverDisplay.style = "background-color: " + album.color;
          albumDisplay.setAttribute( 'data-album', album.id );
          albumDisplay.innerHTML = album.name;

          window.AlbumListing.update( album, song );

          var image = new Image();
          image.addEventListener( 'load', function() {
            albumCoverDisplay.src = album.thumb;
            var swatches = vibrant( image );
            if (swatches.hasOwnProperty( 'Vibrant' ) && swatches['Vibrant'])
              vibrantColor = swatches['Vibrant'].getHex()
              var rgb = swatches['Vibrant'].getRgb();
              fftColor = 'rgba( ' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', 0.87 )';

          } );
          image.src = album.thumb;
        }

        fetchId3( song );
      }
    });

    /**
     * When the player starts playing
     */
    function onPlayerPlay() {
      console.log( "player is playing" );
      actionPlay.style = "display: none;";
      actionPause.style = "display: inline-block;";
    }

    /**
     * When the player is paused
     */
    function onPlayerPause() {
      console.log( "player is paused" );
      actionPause.style = "display: none;";
      actionPlay.style = "display: inline-block;";
    }

    /**
     * Show the album that's in the current play
     */
    function showCurrentAlbum() {
      var album = player.currentSong.album;
      window.MediaLibrary.hide();
      window.AlbumListing.show( album, player, skipToSongAndPlayAlbum );
    }

    /**
     * [skipToSongAndPlayAlbum description]
     * @param  {[type]} album [description]
     * @param  {[type]} song  [description]
     * @return {[type]}       [description]
     */
    function skipToSongAndPlayAlbum( album, song ) {
      clearAndPlayAlbum( album );
      while( player.nextSong && player.currentSong.track != +song ) {
        player.next();
      }
    }

    /**
     * [onActionPlayAlbum description]
     * @return {[type]} [description]
     */
    function onActionPlayAlbum() {
      var album = this.getAttribute( 'data-album' );
      clearAndPlayAlbum( Album( album ) );
    }

    /**
     * [clearAndPlayAlbum description]
     * @param  {[type]} album [description]
     * @return {[type]}       [description]
     */
    function clearAndPlayAlbum( album ) {
      player.clearHistory();
      playAlbum( album );
    }

    player.on( 'jigglypuff:play', onPlayerPlay );
    player.on( 'jigglypuff:pause', onPlayerPause );
    window.addEventListener( 'resize', onResize );

    // Setup
    actionPlay.style = "display: inline-block;";
    actionPause.style = "display: none";

    setTimeout( function() {
      // Start
      player.setVolume( 0.8 );
      postResize();

      drawProgress();
      drawVisualiser();

      playAlbum( Album( 'era' ) );

      window.MediaLibrary.glue( function( album ) {
        window.AlbumListing.show( album, player, skipToSongAndPlayAlbum );
      } )
      window.MediaLibrary.show();
    }, 0 );

    window.Player = player;
    return;
  });
}();
