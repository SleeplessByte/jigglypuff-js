+function() {
  'use strict';

  function Album( source ) {
    for( var k in source ) {
      if ( source.hasOwnProperty(k))
      {
        var v = source[k]

        if ( k === 'artist' ) {
          var transfer = v
          v  = window.Artist( v.id )

          // transfer props
          for ( var o in transfer ) {
            if ( o != 'id' && transfer.hasOwnProperty( o ) )
              Object.defineProperty( this, "artist_" + o, { value: transfer[o], enumerable: true } )
          }
        }

        Object.defineProperty( this, k, { value: v, enumerable: true } )
      }
    }

    //function assignAlbum( song ) {
    //   song.album = this
    //}

    //if ( this.songs && this.songs.length && !this.songs[0].album )
    //  this.songs.forEach( assignAlbum.bind( this ) )
  }

  /**
   *  Makes sure that the index i is a valid song index for an album
   * @param  {Integer} i the song index
   * @return {Integer} the index if valid or 0
   */
  Album.prototype.normalizeSongIndex = function( i ) {
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
  Album.prototype.getSong = function( i ) {
    return this.songs[ this.normalizeSongIndex( i ) ];
  }

  /**
   * [getSongSrc description]
   * @param  {[type]} i     [description]
   * @return {[type]}       [description]
   */
  Album.prototype.getSongSrc = function( i ) {
    return this.getSong( i ).src;
  }

  /**
   * Get an album by index
   * @param  {Integer} i the index in the album
   * @return {Object} the album
   */
  var get = (function () {
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

  function AlbumListing( querySelector, heroSelector ) {
    TrackListing.call( this, querySelector, heroSelector )
    EventManager.eventify( this )
  }

  AlbumListing.prototype = Object.create( window.TrackListing.prototype )

  AlbumListing.prototype.DOMContentLoaded = function( event ) {
    TrackListing.prototype.DOMContentLoaded.call( this, event )

    this.actionPlayAlbum = document.querySelector( '.album-listing .fab-action' )
    this.actionGoToLibrary = document.querySelector( this._querySelector + ' [data-jigglypuff="show-media-library"]' )
    this.actionGoToLibrary.addEventListener( 'click', window.MediaLibrary.show.bind( window.MediaLibrary ) )
    this.backgroundCover = document.querySelector( '[data-jigglypuff="background-cover"]' )
  }

  AlbumListing.prototype.hide = function() {
    TrackListing.prototype.hide.call( this )
    this.trigger( 'hide' )
  }

  /**
   * [showAlbumListing description]
   * @param  {Album} album          [description]
   * @param  {Player} player         [description]
   * @param  {Function(Album, integer)} actionPlayThis [description]
   */
  AlbumListing.prototype.show = function( album, player ) {
    function assignAlbum( s ) {
      s.album = album
      return s
    }
    var songs = album.songs.map( assignAlbum )
    TrackListing.prototype.show.call( this, songs, player )
    this.updateHero( {
        color: album.color,
        cover: album.cover,
        thumb: album.thumb,
        title: album.name,
        artist: album.artist.name,
        datetime: ''
      }
    )

    this.backgroundCover.style = ""
    this.backgroundCover.classList.remove( 'loaded' )

    var bg = new Image(),
        bgCover = this.backgroundCover

    bg.addEventListener( 'load', function() {
      bgCover.style = "background-image: url(" + bg.src + ");"
      bgCover.classList.add( 'loaded' )
    } )
    if ( window.innerWidth > 599 )
      bg.src = album.artist_srcset.high

    this.listingTracks.setAttribute( 'data-album', album.id )
    this.actionPlayAlbum.setAttribute( 'data-album', album.id )

    window.Toolbar.transparent = true;
    window.Toolbar.setTitle( album.name ).hide()

    this.trigger( 'show', [{ album: album }] )
  }

  AlbumListing.prototype.setup = function( player ) {
    function update( detail ) {
      if ( detail.currentSong ) {
        var song = detail.currentSong
        if ( song.album  ) {
          this.update.call( this, song.album, song )
        }
      }
    }

    player.on( 'jigglypuff:prepare', update.bind( this ) )
  }

  AlbumListing.prototype.update = function( album, song ) {
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

  AlbumListing.prototype.constructor = AlbumListing

  window.Album = get
  window.AlbumListing = new AlbumListing( '.album-listing', '.album' )

  document.addEventListener( 'DOMContentLoaded', function( event )  {
    window.AlbumListing.DOMContentLoaded( event )

    window.MediaLibrary.on( 'show', window.AlbumListing.hide.bind( window.AlbumListing ) )
    window.NowListing.on( 'show', window.AlbumListing.hide.bind( window.AlbumListing ) )
  } )
}()
