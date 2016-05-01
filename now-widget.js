+function() {
  'use strict'

  var actionPlay, actionPause, actionMute, actionNext, actionPrev,
      albumCoverDisplay, albumDisplay, artistDisplay, trackDisplay,
      progressDisplay, bufferedDisplay, progressTrack,
      analyserDisplay, canvasContext

  var vibrantColor = '#000000'
  var fftColor = 'rgba( 0, 0, 0, .87 )'

  function PlayingNowWidget() {
    var _player = undefined

    var _analyserBufferLength, _analyserBuffer, _analyserWidth, _analyserHeight,
        _analyserPixelPerfectWidth, _analyserSkip

    Object.defineProperty( this, '_player', { get: function() { return _player }, set: function(v) { _player = v } } )
    Object.defineProperty( this, '_analyserBufferLength', { get: function() { return _analyserBufferLength }, set: function(v) { _analyserBufferLength = v } } )
    Object.defineProperty( this, '_analyserBuffer', { get: function() { return _analyserBuffer }, set: function(v) { _analyserBuffer = v } } )
    Object.defineProperty( this, '_analyserWidth', { get: function() { return _analyserWidth }, set: function(v) { _analyserWidth = v } } )
    Object.defineProperty( this, '_analyserHeight', { get: function() { return _analyserHeight }, set: function(v) { _analyserHeight = v } } )
    Object.defineProperty( this, '_analyserPixelPerfectWidth', { get: function() { return _analyserPixelPerfectWidth }, set: function(v) { _analyserPixelPerfectWidth = v } } )
    Object.defineProperty( this, '_analyserSkip', { get: function() { return _analyserSkip }, set: function(v) { _analyserSkip = v } } )

    Object.defineProperty( this, 'player', { get: function() { return this._player }, enumerable: true } )
    Object.defineProperty( this, 'analyser', { get: function() { return this.player.analyser } } )
    Object.defineProperty( this, 'duration', { get: function() { return this.player.duration } } )
    Object.defineProperty( this, 'currentTime', { get: function() { return this.player.currentTime } } )
    Object.defineProperty( this, 'buffered', { get: function() { return this.player.buffered } } )

    EventManager.eventify( this )
  }

  PlayingNowWidget.prototype.resize = function() {
    setTimeout( this.postResize.bind( this ), 0 )
  }

  PlayingNowWidget.prototype.postResize = function() {
    analyserDisplay.width = analyserDisplay.getBoundingClientRect().width
    this._analyserWidth = analyserDisplay.width
    this._analyserHeight = analyserDisplay.height

    this.analyser.fftSize = Math.max( 32, nextPowerOfTwo( this._analyserWidth * 2) )

    this._analyserBufferLength = this.analyser.frequencyBinCount
    this._analyserBuffer = new Uint8Array( this._analyserBufferLength )

    // upper part of the graph will be mostly empty
    this._analyserPixelPerfectWidth = Math.round( 1.0 / this._analyserBufferLength * this._analyserWidth )
    this._analyserSkip = 2
  }


  /**
   * Fetch ID3 tag information for a song
   * @param  {Song} song the song
   */
  PlayingNowWidget.prototype.fetchTags = (function () {
    var id3Cache = {}

    /**
     * Fetches the ID3 tags for a song
     * @param  {url} src the song
     */
    return function( song ) {

      if ( id3Cache[ song.src ] ) {
        this.showTags( id3Cache )
        return
      }

      var _this = this
      id3( song.src, function( err, tags ) {
        id3Cache[ song.src ] = tags
        if ( !err )
          _this.showTags( id3Cache )
      })
    }
  })()

  /**
   * Update the playing now
   * @param  {Object} id3Cache the cache
   */
  PlayingNowWidget.prototype.showTags = function( id3Cache ) {
    var song = this.player.currentSong
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
  PlayingNowWidget.prototype.drawProgress = function() {
    var percentage = this.currentTime / this.duration * 100
    if ( isNaN( percentage ) )
      percentage = 0
    progressDisplay.style = "transform: translateX( -" + ( 100 - percentage ) + "% ); background-color: " + vibrantColor

    if ( this.buffered.length == 0 )
      percentage = 0
    else {
      var end = this.buffered[0].end == -1 ? this.duration : this.buffered[0].end
      percentage = end / this.duration * 100
      if ( isNaN( percentage ) )
        percentage = 0
    }
    bufferedDisplay.style = "transform: translateX( -" + ( 100 - percentage ) + "% ); background-color: " + vibrantColor

    setTimeout( this.drawProgress.bind( this ), 100 )
  }

  /**
   * [analyseMoment description]
   * @return {[type]} [description]
   */
  PlayingNowWidget.prototype.drawVisualiser = function() {
    this.analyser.getByteFrequencyData( this._analyserBuffer )

    canvasContext.clearRect(0, 0, this._analyserWidth, this._analyserHeight)
    //analyserBufferLength is at least the width -> next power of 2
    for( var i = 0; i < this._analyserBufferLength; i++ ) {
      var o = this._analyserBuffer[i]
      var barHeight = (o / 255) * this._analyserHeight + 2
      if (i % this._analyserSkip === 0) {
        canvasContext.beginPath()
        canvasContext.rect( this._analyserPixelPerfectWidth * i, this._analyserHeight - barHeight, this._analyserPixelPerfectWidth, barHeight)

        var grad = canvasContext.createLinearGradient(0, this._analyserHeight,0,0)
        grad.addColorStop(0, vibrantColor )
        grad.addColorStop(1, vibrantColor)

        canvasContext.fillStyle = grad
        canvasContext.fill()

      }
    }
    requestAnimationFrame( this.drawVisualiser.bind( this ) )
  }

  /**
   * Handle clicking on the progress track
   * @param  {Event} event The click event
   */
  PlayingNowWidget.prototype.onProgressTrackClicked = function( e ) {
    var pos = e.offsetX / progressTrack.getBoundingClientRect().width
    this.player.setPosition( this.duration * pos )
  }

  PlayingNowWidget.prototype.setup = function( player ) {

    this._player = player

    this.analyser.minDecibels = -90
    this.analyser.maxDecibels = -10
    this.analyser.smoothingTimeConstant = 0.85

    actionPlay.addEventListener( 'click', this.player.play.bind( player ) )
    actionPause.addEventListener( 'click', this.player.pause.bind( player ) )
    actionNext.addEventListener( 'click', this.player.next.bind( player ) )
    actionPrev.addEventListener( 'click', this.player.previous.bind( player ) )
    actionMute.addEventListener( 'click', this.player.toggleMute.bind( player ) )

    this.player.on( 'jigglypuff:prepare', this.onPrepare.bind( this ) )
    this.player.on( 'jigglypuff:play', this.onPlayerPlay.bind( this ) )
    this.player.on( 'jigglypuff:pause', this.onPlayerPause.bind( this ) )
    window.addEventListener( 'resize', this.resize.bind( this ) )
  }

  PlayingNowWidget.prototype.onPrepare = function( detail, e ) {

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

      this.fetchTags( song )
    }
  }

  /**
   * When the player starts playing
   */
  PlayingNowWidget.prototype.onPlayerPlay = function() {
    console.debug( "player is playing" )
    actionPlay.style = "display: none;"
    actionPause.style = "display: inline-block;"
  }

  /**
   * When the player is paused
   */
  PlayingNowWidget.prototype.onPlayerPause = function() {
    console.debug( "player is paused" )
    actionPause.style = "display: none;"
    actionPlay.style = "display: inline-block;"
  }

  window.PlayingNowWidget = new PlayingNowWidget()

  document.addEventListener( 'DOMContentLoaded', function() {

    actionPlay = document.querySelector( '[data-jigglypuff="play"]'),
    actionPause = document.querySelector( '[data-jigglypuff="pause"]'),
    actionMute = document.querySelector( '[data-jigglypuff="mute"]'),
    actionNext = document.querySelector( '[data-jigglypuff="next"]'),
    actionPrev = document.querySelector( '[data-jigglypuff="prev"]')

    albumCoverDisplay = document.querySelector( '[data-jigglypuff="meta-album-cover"]'),
    albumDisplay = document.querySelector( '[data-jigglypuff="meta-album"]' ),
    artistDisplay = document.querySelector( '[data-jigglypuff="meta-artist"]' ),
    trackDisplay = document.querySelector( '[data-jigglypuff="meta-track"]' ),
    progressDisplay = document.querySelector( '[data-jigglypuff="song-progress"]'),
    bufferedDisplay = document.querySelector( '[data-jigglypuff="song-buffered"]'),
    progressTrack = document.querySelector( '[data-jigglypuff="song-progress-track"]'),
    analyserDisplay = document.querySelector( '[data-jigglypuff="analyser"]' )

    albumCoverDisplay.addEventListener( 'click', function() { window.PlayingNowWidget.trigger( 'now', [] ) } )
    progressTrack.addEventListener( 'click', window.PlayingNowWidget.onProgressTrackClicked.bind( window.PlayingNowWidget ) )

    canvasContext = analyserDisplay.getContext( '2d' )

    // Setup
    actionPlay.style = "display: inline-block;"
    actionPause.style = "display: none"
  })
}()
