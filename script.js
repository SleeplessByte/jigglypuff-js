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

    /**
     * Get an album by index
     * @param  {Integer} i the index in the album
     * @return {Object} the album
     */
    var getAlbum = (function () {
      var albumsCache = {};

      /**
       * [description]
       * @param  {[type]} i [description]
       * @return {[type]}   [description]
       */
      return function( name ) {
        if ( !albumsCache[ name ] )
          albumsCache[ name ] = new Album( Manifest.albums[ name ] );
        return albumsCache[ name ];
      }
    })();


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

    var albumListingHero = document.querySelector( '.album-listing .hero' );
    var albumListingNodes = document.querySelectorAll( '.album-listing .album' );
    var albumListingTracks =document.querySelector( '.album-listing .album.tracks tbody' );

    actionPlay.addEventListener( 'click', player.play.bind( player ) );
    actionPause.addEventListener( 'click', player.pause.bind( player ) );
    actionNext.addEventListener( 'click', player.next.bind( player ) );
    actionPrev.addEventListener( 'click', player.previous.bind( player ) );
    actionMute.addEventListener( 'click', player.toggleMute.bind( player ) );
    albumCoverDisplay.addEventListener( 'click', showCurrentAlbum );
    progressTrack.addEventListener( 'click', playAtPosition );
    actionPlayAlbum.addEventListener( 'click', playAlbum );

    var vibrantColor = '#000000';

    audioElement.addEventListener( 'jigglypuff:prepare', function( e ) {
      console.log( e );
      if ( e.detail && e.detail.currentSong ) {
        var song = e.detail.currentSong;

        trackDisplay.innerHTML = song.name;
        trackDisplay.setAttribute( 'data-song', song.track );
        artistDisplay.innerHTML = song.artist;

        if ( song.album  ) {
          var album = e.detail.currentSong.album;
          albumCoverDisplay.style = "background-color: " + album.color;
          albumDisplay.setAttribute( 'data-album', album.id );
          albumDisplay.innerHTML = album.name;

          updateCurrentListing( album, song );

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

    audioElement.addEventListener( 'jigglypuff:play', function() {
      actionPlay.style = "display: none;";
      actionPause.style = "display: inline-block;";
    });

    audioElement.addEventListener( 'jigglypuff:pause', function() {
      actionPause.style = "display: none;";
      actionPlay.style = "display: inline-block;";
    });

    // Setup
    actionPlay.style = "display: none;";
    actionPause.style = "display: inline-block;";

    function updateCurrentListing( album, song ) {
      if ( album === undefined )
        album = getAlbum( )

      for (var i = 0; i < albumListingTracks.childNodes.length; i++) {
        var node = albumListingTracks.childNodes[i];
        if ( node.getAttribute( 'data-album' ) === album.id ) {
          if ( +node.getAttribute( 'data-song' ) === +song.track ) {
            node.classList.add( 'active' );
            continue;
          }
        }

        node.classList.remove( 'active' );
      }
    }

    /**
     * [styleAlbumListing description]
     * @param  {[type]} swatches [description]
     * @return {[type]}          [description]
     */
    function styleAlbumListing( swatches ) {
      var node;
      var styling = document.querySelector( '.album-listing .styling' );
      while (styling.lastChild) {
        styling.removeChild(styling.lastChild);
      }

      function addSwatch( color, name ) {
        node = document.createElement( 'div' );
        node.classList.add( 'swatch' );
        node.classList.add( name );
        node.style = "background-color: " + color;
        styling.appendChild( node );
      }

      var setHero = false;
      [ 'LightVibrant', 'Vibrant', 'DarkVibrant', 'DarkMuted', 'Muted', 'LightMuted' ].forEach( function( e, i ) {
        if (swatches.hasOwnProperty( e) && swatches[e]) {
          addSwatch( swatches[e].getHex(), e );

          if ( !setHero ) {
            var rgb = swatches[e].getRgb();
            albumListingHero.style = "background-color: rgb( " + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ");";
            setHero = true;
          }
        }
      });

    }

    function showCurrentAlbum() {
      var album = getAlbum( albumDisplay.getAttribute( 'data-album' ) );
      showAlbumListing( album );
    }

    /**
     * [showAlbumListing description]
     * @param  {[type]} album [description]
     * @return {[type]}       [description]
     */
    function showAlbumListing( album ) {
      document.body.parentElement.style = "";
      albumListingTracks.setAttribute( 'data-album', album.id );

      var bg = new Image();
      bg.addEventListener( 'load', function() {
        document.body.parentElement.style = "background-image: url(" + bg.src + ");";
      } );
      if ( window.innerWidth > 599 )
        bg.src = album.artist.srcset.high;

      for (var i = 0; i < albumListingNodes.length; ++i) {
        var field = albumListingNodes[i];

        if( field.classList.contains( 'cover' ) ) {
          field.style = "background-color: " + album.color;
          var image = new Image();
          image.addEventListener( 'load', (function( _local ) {
            var _field = _local;
            return function() {
              _field.src = album.cover;
              var swatches = vibrant( image );
              styleAlbumListing( swatches );
            };
          })( field ) );

          image.src = album.thumb;
          continue;
        }

        if( field.classList.contains( 'title' ) ) {
          field.innerHTML = album.name;
          continue;
        }

        if( field.classList.contains( 'artist' ) ) {
          field.innerHTML = album.artist.name;
          continue;
        }

        if( field.classList.contains( 'datetime' ) ) {
          continue;
        }
      }

      actionPlayAlbum.setAttribute( 'data-album', album.id );

      var tracks = albumListingTracks;
      tracks.innerHTML = "";

      var currentAlbum = player.currentSong.album;
      var currentSong = player.currentSong;

      var row, track, name, artist, duration;
      var _self = this;

      album.songs.forEach( function( song, i ) {
        row = document.createElement( 'tr' );
        row.setAttribute( 'data-album', album.id );
        row.setAttribute( 'data-song', song.track );

        if ( currentAlbum.id === album.id && +currentSong.track === +song.track )
          row.classList.add( 'active' );

        track = document.createElement( 'td' );
        track.innerHTML = song.track;

        name = document.createElement( 'td' );
        name.innerHTML = song.name;

        artist = document.createElement( 'td' );
        artist.setAttribute( 'class', 'hide-mobile');
        artist.innerHTML = song.artist;

        duration = document.createElement( 'td' );
        duration.setAttribute( 'class', 'hide-mobile');
        duration.innerHTML = Math.floor( song.duration / 60 ) + ":" + ("00" + song.duration % 60 ).slice( -2 );

        row.appendChild( track );
        row.appendChild( name );
        row.appendChild( artist );
        row.appendChild( duration );
        tracks.appendChild( row );

        row.addEventListener( 'click', skipToSongAndPlayAlbum );
      } );
    }

    function skipToSongAndPlayAlbum() {
      var song = this.getAttribute( 'data-song' );
      var album = getAlbum( this.getAttribute( 'data-album' ) );

      playAlbum.bind( this )();
      while( player.nextSong && player.currentSong.track != +song ) {
        player.next();
      }
    }

    function playAlbum() {
      var album = this.getAttribute( 'data-album' );
      player.clearHistory();
      setAlbum( getAlbum( album ) );
    }

    // Start
    player.setVolume( 0.8 );
    resize();
    drawProgress();
    drawVisualiser();
    setAlbum( getAlbum( 'era' ) );

    showAlbumListing( getAlbum( 'era2' ) );

    window.addEventListener( 'resize', resize );

    window.Player = player;
    return;
  });
}();
