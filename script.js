+function() {
  'use strict'

  function nextPowerOfTwo( v ) {
    v = v - 1
    v |= v >> 1
    v |= v >> 2
    v |= v >> 4
    v |= v >> 8
    v |= v >> 16
    return v + 1
  }

  document.addEventListener("DOMContentLoaded", function( event ) {

    var audioElement = document.querySelector( 'audio' )
    var player = Jigglypuff.createPlayer( audioElement )

    /**
     * Fetch ID3 tag information for a song
     * @param  {Song} song the song
     */
    var fetchId3 = (function () {
      var id3Cache = {}

      /**
       * Fetches the ID3 tags for a song
       * @param  {url} src the song
       */
      return function( song ) {

        if ( id3Cache[ song.src ] ) {
          updatePlayingNowFromTags( id3Cache )
          return
        }

        id3( song.src, function( err, tags ) {
          id3Cache[ song.src ] = tags
          if ( !err )
            updatePlayingNowFromTags( id3Cache )
        })
      }
    })()

    /**
     * Update the playing now
     * @param  {Object} id3Cache the cache
     */
    function updatePlayingNowFromTags( id3Cache ) {
      var song = player.currentSong
      if ( !id3Cache[ song.src ] )
        return

      var tags = id3Cache[ song.src ]
      if ( !tags )
        return

      console.log( "Updating song display with tags for " + song.name, tags )

      var track = song.track
      if ( tags.v2 )
        track = tags.v2.track
      else if ( tags.v1 )
        track = tags.v1.track

      if ( tags.title )
        trackDisplay.innerHTML = tags.title
      if ( tags.album )
        albumDisplay.innerHTML = tags.album
      if ( tags.artist )
        artistDisplay.innerHTML = tags.artist
    }

    /**
     * Draw the current progress for playing
     */
    function drawProgress() {
      var percentage = player.currentTime / player.duration * 100
      if ( isNaN( percentage ) )
        percentage = 0
      progressDisplay.style = "transform: translateX( -" + ( 100 - percentage ) + "% ); background-color: " + vibrantColor

      if (player.buffered.length == 0 )
        percentage = 0
      else {
        percentage = player.buffered[0].end / player.duration * 100
        if ( isNaN( percentage ) )
          percentage = 0
      }
      bufferedDisplay.style = "transform: translateX( -" + ( 100 - percentage ) + "% ); background-color: " + vibrantColor

      setTimeout( drawProgress, 100 )
    }

    /**
     * [analyseMoment description]
     * @return {[type]} [description]
     */
    function drawVisualiser() {
      player.analyser.getByteFrequencyData( analyserBuffer )

      canvasContext.clearRect(0, 0, analyserWidth, analyserHeight)
      //analyserBufferLength is at least the width -> next power of 2
      for( var i = 0; i < analyserBufferLength; i++ ) {
        var o = analyserBuffer[i]
        var barHeight = (o / 255) * analyserHeight + 2
        if (i % analyserSkip === 0) {
          canvasContext.beginPath()
          canvasContext.rect( analyserPixelPerfectWidth * i, analyserHeight - barHeight, analyserPixelPerfectWidth, barHeight)

          var grad = canvasContext.createLinearGradient(0, analyserHeight,0,0)
          grad.addColorStop(0, vibrantColor )
          grad.addColorStop(1, vibrantColor)

          canvasContext.fillStyle = grad
          canvasContext.fill()

        }
      }
      requestAnimationFrame( drawVisualiser )
    }

    /**
     * Sets the current album to the index i
     * @param {Integer} i the album index
     */
    function playAlbum( album ) {
      function assignAlbum( s ) {
        s.album = album
        return s
      }
      player.setPlaylist( album.songs.map( assignAlbum ) ).next()
    }

    /**
     * Handle clicking on the progress track
     * @param  {Event} event The click event
     */
    function onProgressTrackClicked( event ) {
      var pos = event.offsetX / progressTrack.getBoundingClientRect().width
      player.setPosition( player.duration * pos )
    }

    /**
     * [resize description]
     * @return {[type]} [description]
     */
    var resizeQueued = false, oneMoreResize = false
    function onResize() {
      if ( resizeQueued ) {
        oneMoreResize = true
        return
      }
      //resizeQueued = true
      setTimeout( postResize, 0 )
    }

    function postResize() {
      analyserDisplay.width = analyserDisplay.getBoundingClientRect().width
      analyserWidth = analyserDisplay.width
      analyserHeight = analyserDisplay.height
      player.analyser.fftSize = nextPowerOfTwo(analyserWidth * 2)

      analyserBufferLength = player.analyser.frequencyBinCount
      analyserBuffer = new Uint8Array( analyserBufferLength )

      // upper part of the graph will be mostly empty
      analyserPixelPerfectWidth = Math.round( 1.0 / analyserBufferLength * analyserWidth )
      analyserSkip = 2

      if ( oneMoreResize ) {
        oneMoreResize = false
        setTimeout( postResize, 0 )
      } else {
        resizeQueued = false
      }
    }

    var analyserBufferLength, analyserBuffer, analyserWidth, analyserHeight,
        analyserPixelPerfectWidth, analyserSkip

    player.analyser.minDecibels = -90
    player.analyser.maxDecibels = -10
    player.analyser.smoothingTimeConstant = 0.85

    var actionPlay = document.querySelector( '[data-jigglypuff="play"]'),
        actionPause = document.querySelector( '[data-jigglypuff="pause"]'),
        actionMute = document.querySelector( '[data-jigglypuff="mute"]'),
        actionNext = document.querySelector( '[data-jigglypuff="next"]'),
        actionPrev = document.querySelector( '[data-jigglypuff="prev"]'),
        actionPlayAlbum = document.querySelector( '.album-listing .fab-action' )

    var albumCoverDisplay = document.querySelector( '[data-jigglypuff="meta-album-cover"]'),
        albumDisplay = document.querySelector( '[data-jigglypuff="meta-album"]' ),
        artistDisplay = document.querySelector( '[data-jigglypuff="meta-artist"]' ),
        trackDisplay = document.querySelector( '[data-jigglypuff="meta-track"]' ),
        progressDisplay = document.querySelector( '[data-jigglypuff="song-progress"]'),
        bufferedDisplay = document.querySelector( '[data-jigglypuff="song-buffered"]'),
        progressTrack = document.querySelector( '[data-jigglypuff="song-progress-track"]'),
        analyserDisplay = document.querySelector( '[data-jigglypuff="analyser"]' )

    var canvasContext = analyserDisplay.getContext( '2d' )

    actionPlay.addEventListener( 'click', player.play.bind( player ) )
    actionPause.addEventListener( 'click', player.pause.bind( player ) )
    actionNext.addEventListener( 'click', player.next.bind( player ) )
    actionPrev.addEventListener( 'click', player.previous.bind( player ) )
    actionMute.addEventListener( 'click', player.toggleMute.bind( player ) )
    albumCoverDisplay.addEventListener( 'click', showCurrentAlbum )
    progressTrack.addEventListener( 'click', onProgressTrackClicked )
    actionPlayAlbum.addEventListener( 'click', onActionPlayAlbum )

    var vibrantColor = '#000000'
    var fftColor = 'rgba( 0, 0, 0, .87 )'

    player.on( 'jigglypuff:prepare', function( detail, e ) {

      console.info( detail, e )

      if ( detail.currentSong ) {
        var song = detail.currentSong

        trackDisplay.innerHTML = song.name
        trackDisplay.setAttribute( 'data-song', song.track )
        artistDisplay.innerHTML = (song.artist || song.album.artist).name

        if ( song.album  ) {
          var album = detail.currentSong.album

          albumCoverDisplay.style = "background-color: " + album.color
          albumDisplay.setAttribute( 'data-album', album.id )
          albumDisplay.innerHTML = album.name

          window.AlbumListing.update( album, song )

          var image = new Image()
          image.addEventListener( 'load', function() {
            albumCoverDisplay.src = album.thumb
            var swatches = vibrant( image )
            if (swatches.hasOwnProperty( 'Vibrant' ) && swatches['Vibrant'])
              vibrantColor = swatches['Vibrant'].getHex()
              var rgb = swatches['Vibrant'].getRgb()
              fftColor = 'rgba( ' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', 0.87 )'

          } )
          image.src = album.thumb
        }

        fetchId3( song )
      }
    })

    /**
     * When the player starts playing
     */
    function onPlayerPlay() {
      console.debug( "player is playing" )
      actionPlay.style = "display: none;"
      actionPause.style = "display: inline-block;"
    }

    /**
     * When the player is paused
     */
    function onPlayerPause() {
      console.debug( "player is paused" )
      actionPause.style = "display: none;"
      actionPlay.style = "display: inline-block;"
    }

    /**
     * Show the album that's in the current play
     */
    function showCurrentAlbum() {
      var album = player.currentSong.album
      window.MediaLibrary.hide()
      window.AlbumListing.show( album, player, skipToSongAndPlayAlbum )
    }

    /**
     * [skipToSongAndPlayAlbum description]
     * @param  {[type]} album [description]
     * @param  {[type]} song  [description]
     * @return {[type]}       [description]
     */
    function skipToSongAndPlayAlbum( album, song ) {
      clearAndPlayAlbum( album )
      player.skipPrepare = true
      while( player.nextSong && player.currentSong.track != +song ) {
        player.next()
      }
      player.skipPrepare = false
      if ( player.currentSong )
        player.play()
    }

    /**
     * [onActionPlayAlbum description]
     * @return {[type]} [description]
     */
    function onActionPlayAlbum() {
      var album = this.getAttribute( 'data-album' )
      clearAndPlayAlbum( Album( album ) )
    }

    /**
     * [clearAndPlayAlbum description]
     * @param  {[type]} album [description]
     * @return {[type]}       [description]
     */
    function clearAndPlayAlbum( album ) {
      player.clearHistory()
      playAlbum( album )
    }

    player.on( 'jigglypuff:play', onPlayerPlay )
    player.on( 'jigglypuff:pause', onPlayerPause )
    window.addEventListener( 'resize', onResize )

    // Setup
    actionPlay.style = "display: inline-block;"
    actionPause.style = "display: none"

    setTimeout( function() {
      // Start
      player.setVolume( 0.8 )
      postResize()

      drawProgress()
      drawVisualiser()

      playAlbum( Album( 'era' ) )

      window.MediaLibrary.glue( function( album ) {
        window.AlbumListing.show( album, player, skipToSongAndPlayAlbum )
      } )
      window.MediaLibrary.show()
    }, 0 )

    window.Player = player
    return
  })
}()
