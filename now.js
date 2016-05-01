+function() {

  function NowListing( querySelector, heroSelector ) {
    TrackListing.call( this, querySelector, heroSelector )
    EventManager.eventify( this )
  }

  NowListing.prototype = Object.create( window.TrackListing.prototype )

  NowListing.prototype.DOMContentLoaded = function( event ) {
    TrackListing.prototype.DOMContentLoaded.call( this, event )

    this.actionGoToLibrary = document.querySelector( this._querySelector + ' [data-jigglypuff="show-media-library"]' )
    this.actionGoToLibrary.addEventListener( 'click', window.MediaLibrary.show.bind( window.MediaLibrary ) )
    this.backgroundCover = document.querySelector( '[data-jigglypuff="background-cover"]' )
  }

  NowListing.prototype.hide = function() {
    TrackListing.prototype.hide.call( this )
    this.trigger( 'hide' )
  }

  /**
   * [showAlbumListing description]
   * @param  {Album} album          [description]
   * @param  {Player} player         [description]
   * @param  {Function(Album, integer)} actionPlayThis [description]
   */
  NowListing.prototype.show = function( player ) {
    var songs = player.playList
    TrackListing.prototype.show.call( this, songs, player )

    var song = player.currentSong
    var album = song.album
    this.updateHeroAndBg( album, song )
    window.Toolbar.transparent = true;
    window.Toolbar.setTitle( 'Now Playing' ).hide()

    this.trigger( 'show', [] )
  }

  NowListing.prototype.setup = function( player ) {
    function update( detail ) {
      if ( detail.currentSong ) {
        var song = detail.currentSong
        if ( song.album  ) {

          var songs = player.playList
          this.build.call( this, songs, player )
          this.updateHeroAndBg( song.album, song )

        }
      }
    }

    player.on( 'jigglypuff:prepare', update.bind( this ) )
  }

  NowListing.prototype.updateHeroAndBg = function( album, song ) {
    this.updateHero( {
        color: album.color,
        cover: album.cover,
        thumb: album.thumb,
        title: song.name,
        artist: album.artist.name,
        datetime: album.name
      }
    )

    var src = album.artist_srcset.high,
        newStyle = "background-image: url(" + src + ");",
        bg = new Image(),
        bgCover = this.backgroundCover

    if ( bgCover.getAttribute( 'data-src' ) != src ) {
      this.backgroundCover.style = ""
      this.backgroundCover.classList.remove( 'loaded' )

      bg.addEventListener( 'load', function() {
        bgCover.style = newStyle
        bgCover.classList.add( 'loaded' )
      } )
      if ( window.innerWidth > 599 ) {
        bg.src = album.artist_srcset.high
        bgCover.setAttribute( 'data-src', src )
      }
    }
  }

  NowListing.prototype.update = function( album, song ) {
    for (var i = 0; i < this.listingTracks.childNodes.length; i++) {
      var node =  this.listingTracks.childNodes[i]

      if ( !node.getAttribute )
        continue

      if ( node.getAttribute( 'data-album' ) === album.id ) {
        if ( +node.getAttribute( 'data-song' ) === +song.track ) {
          node.classList.add( 'active' )
          continue
        }
      }

      node.classList.remove( 'active' )
    }
  }

  NowListing.prototype.constructor = NowListing
  window.NowListing = new NowListing( '.up-next-list', '.song' )

  document.addEventListener( 'DOMContentLoaded', function( event )  {
    window.NowListing.DOMContentLoaded( event )

    window.MediaLibrary.on( 'show', window.NowListing.hide.bind( window.NowListing ) )
    window.AlbumListing.on( 'show', window.NowListing.hide.bind( window.NowListing ) )
  } )

}()
