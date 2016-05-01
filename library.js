+function() {
  'use strict'

  var mediaLibrary, mediaLibraryList, mediaLibraryNodes

  function MediaLibrary() {
    EventManager.eventify( this )
  }

  /**
   * Hides the media library
   */
  MediaLibrary.prototype.hide = function() {
    mediaLibrary.classList.add( 'hide' )
    this.trigger( 'hide' )
  }

  /**
   * Show the media library
   */
  MediaLibrary.prototype.show = function() {
    mediaLibrary.classList.remove( 'hide' )
    window.Toolbar.transparent = false
    window.Toolbar.setTitle( "Media Library" ).show()

    this.trigger( 'show' )
  }

  function setup() {

    function addAlbum( id, album ) {
      var li = document.createElement( 'li' )

      var figure = document.createElement( 'figure' )
      figure.setAttribute( 'data-album', id )
      figure.setAttribute( 'data-jigglypuff', 'play-album' )
      figure.classList.add( 'media' )
      figure.classList.add( 'album' )

      var img = document.createElement( 'img' )
      img.setAttribute( 'src', album.cover )
      img.classList.add( 'album' )
      img.classList.add( 'cover' )

      var figcaption = document.createElement( 'figcaption' )
      figcaption.classList.add( 'meta' )

      var title = document.createElement( 'h2' )
      title.classList.add( 'album' )
      title.classList.add( 'title' )
      title.innerHTML = album.name

      var artist = document.createElement( 'h2' )
      artist.classList.add( 'album' )
      artist.classList.add( 'artist' )
      artist.innerHTML = album.artist.name

      figcaption.appendChild( title )
      figcaption.appendChild( artist )
      figure.appendChild( img )
      figure.appendChild( figcaption )
      li.appendChild( figure )
      mediaLibraryList.appendChild( li )
    }

    for( var id in window.Manifest.albums )
      if ( window.Manifest.albums.hasOwnProperty( id ) )
        addAlbum( id, Album( id ) )
  }

  window.MediaLibrary = new MediaLibrary()

  document.addEventListener( 'DOMContentLoaded', function( event )  {
    mediaLibrary = document.querySelector( '.media-library' )
    mediaLibraryList = document.querySelector( '.media-library ul' )

    setup()

    mediaLibraryNodes = document.querySelectorAll( '.media-library .media' )

    var style = function( c ) {
      try {
        var swatches = vibrant( c )
        if ( swatches[ "DarkMuted" ] )
          c.parentElement.style = "background-color: " + swatches[ "DarkMuted" ].getHex()
      } catch ( ignore ) {
      }
    }

    var styleNodeFn = function( node ) {
      var _node = node
      return function() {
        style( _node )
      }
    }

    function onNodeClick( e ) {
      window.MediaLibrary.trigger( 'library:album', [Album( e.currentTarget.getAttribute( 'data-album' ) )] )
    }

    for( var i = 0; i < mediaLibraryNodes.length; i++ ) {
      var node = mediaLibraryNodes[i]
      var img = node.childNodes[0]
      img.addEventListener( 'load', styleNodeFn( img ) )

      if( img.complete )
        style( img )

      node.addEventListener( 'click', onNodeClick )
    }

    window.AlbumListing.on( 'show', window.MediaLibrary.hide.bind( window.MediaLibrary ) )
    window.NowListing.on( 'show', window.MediaLibrary.hide.bind( window.MediaLibrary ) )
  } )


}()
