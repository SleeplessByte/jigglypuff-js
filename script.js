+function() {
  'use strict'

  document.addEventListener("DOMContentLoaded", function( event ) {

    var audioElement = document.querySelector( 'audio' )
    var player = Jigglypuff.createPlayer( audioElement )

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
      skipToSongAndPlay( album, song )
    }

    function skipToSongAndPlay( album, song ) {
      console.log( arguments )
      if ( player.currentSong.track == +song )
        return

      player.skipPrepare = true
      while( player.nextSong && player.nextSong.track != +song ) {
        player.next()
      }

      if ( player.nextSong ) {
        player.skipPrepare = false
        player.next()
      }
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

    var actionPlayAlbum = document.querySelector( '.album-listing .fab-action' )

    setTimeout( function() {
      // Start
      player.setVolume( 0.8 )

      window.PlayingNowWidget.setup( player )
      window.AlbumListing.setup( player )
      window.NowListing.setup( player )

      window.PlayingNowWidget.postResize()
      window.PlayingNowWidget.drawProgress()
      window.PlayingNowWidget.drawVisualiser()

      window.PlayingNowWidget.on( 'now', function() { window.NowListing.show( player ) } )
      window.NowListing.on( 'listing:song', skipToSongAndPlay )
      window.AlbumListing.on( 'listing:song', skipToSongAndPlayAlbum )
      window.MediaLibrary.on( 'library:album', function( album ) { window.AlbumListing.show( album, player ) } )

      actionPlayAlbum.addEventListener( 'click', onActionPlayAlbum )

      playAlbum( Album( 'era' ) )
      window.MediaLibrary.show()
    }, 0 )

    window.Player = player
    return
  })
}()
