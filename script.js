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
       * [function description]
       * @param  {[type]} src [description]
       * @return {[type]}     [description]
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

      progressDisplay.style = "width: " + percentage + "%; background-color: " + vibrantColor;
      var progress = requestAnimationFrame( drawProgress );
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
    function setAlbum( album ) {
      player.setPlaylist( album.songs.map( function(s) { s.album = album; return s; } ) ).next();
    }

    /**
     * [playAtPosition description]
     * @param  {[type]} event [description]
     * @return {[type]}       [description]
     */
    function playAtPosition( event ) {
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
    function resize() {
      analyserDisplay.width = analyserDisplay.getBoundingClientRect().width;
      analyserWidth = analyserDisplay.width;
      analyserHeight = analyserDisplay.height;
      player.analyser.fftSize = nextPowerOfTwo(analyserWidth * 2);

      analyserBufferLength = player.analyser.frequencyBinCount;
      analyserBuffer = new Uint8Array( analyserBufferLength );

      // upper part of the graph will be mostly empty
      analyserPixelPerfectWidth = Math.round( 1.0 / analyserBufferLength * analyserWidth );
      analyserSkip = 2;
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
    progressTrack.addEventListener( 'click', playAtPosition );
    actionPlayAlbum.addEventListener( 'click', playAlbum );

    var vibrantColor = '#000000';

    player.addListener( 'jigglypuff:prepare', function( detail ) {
      console.log( arguments );
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

          } );
          image.src = album.thumb;
        }

        fetchId3( song );
      }
    });

    player.addListener( 'jigglypuff:play', function() {
      actionPlay.style = "display: none;";
      actionPause.style = "display: inline-block;";
    });

    player.addListener( 'jigglypuff:pause', function() {
      actionPause.style = "display: none;";
      actionPlay.style = "display: inline-block;";
    });

    // Setup
    actionPlay.style = "display: none;";
    actionPause.style = "display: inline-block;";

    function showCurrentAlbum() {
      var album = Album( albumDisplay.getAttribute( 'data-album' ) );
      window.MediaLibrary.hide();
      window.AlbumListing.show( album, player, skipToSongAndPlayAlbum );
    }

    function skipToSongAndPlayAlbum() {
      var song = this.getAttribute( 'data-song' );
      var album = Album( this.getAttribute( 'data-album' ) );

      playAlbum.bind( this )();
      while( player.nextSong && player.currentSong.track != +song ) {
        player.next();
      }
    }

    function playAlbum() {
      var album = this.getAttribute( 'data-album' );
      player.clearHistory();
      setAlbum( Album( album ) );
    }
    window.addEventListener( 'resize', resize );

    setTimeout( function() {
      // Start
      player.setVolume( 0.8 );
      resize();
      drawProgress();
      drawVisualiser();

      setAlbum( Album( 'era' ) );

      window.MediaLibrary.glue( function( e ) {
        window.MediaLibrary.hide();
        window.AlbumListing.show( Album( e.currentTarget.getAttribute( 'data-album' ) ), player, skipToSongAndPlayAlbum );
      } )
    }, 0 );

    window.Player = player;
    return;
  });
}();
