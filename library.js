+function() {
  'use strict';

  var mediaLibrary, mediaLibraryList, mediaLibraryNodes;

  function MediaLibrary() {
    EventManager.eventify( this );
  }

  /**
   * Hides the media library
   */
  MediaLibrary.prototype.hide = function() {
    mediaLibrary.classList.add( 'hide' );
    this.trigger( 'hide' );
  }

  /**
   * Show the media library
   */
  MediaLibrary.prototype.show = function() {
    mediaLibrary.classList.remove( 'hide' );
    window.Toolbar.transparent = false;
    window.Toolbar.setTitle( "Media Library" ).show();

    this.trigger( 'show' );
  }

  /**
   * Glues an action to library nodes
   * @param  {Function(Album)} action function that takes an album
   */
  MediaLibrary.prototype.glue = function( action ) {
    for( var i = 0; i < mediaLibraryNodes.length; i++ ) {
      mediaLibraryNodes[i].addEventListener( 'click',
        function( e ) {
          action( Album( e.currentTarget.getAttribute( 'data-album' ) ) );
        }
      );
    }
  }

  function setup() {

    function addAlbum( id, album ) {
      var li = document.createElement( 'li' );

      var figure = document.createElement( 'figure' );
      figure.setAttribute( 'data-album', id );
      figure.setAttribute( 'data-jigglypuff', 'play-album' );
      figure.classList.add( 'media' );
      figure.classList.add( 'album' );

      var img = document.createElement( 'img' );
      img.setAttribute( 'src', album.cover )
      img.classList.add( 'album' );
      img.classList.add( 'cover' );

      var figcaption = document.createElement( 'figcaption' );
      figcaption.classList.add( 'meta' );

      var title = document.createElement( 'h2' );
      title.classList.add( 'album' );
      title.classList.add( 'title' );
      title.innerHTML = album.name;

      var artist = document.createElement( 'h2' );
      artist.classList.add( 'album' );
      artist.classList.add( 'artist' );
      artist.innerHTML = album.artist.name;

      figcaption.appendChild( title );
      figcaption.appendChild( artist );
      figure.appendChild( img );
      figure.appendChild( figcaption );
      li.appendChild( figure );
      mediaLibraryList.appendChild( li );
    }

    for( var id in window.Manifest.albums )
      if ( window.Manifest.albums.hasOwnProperty( id ) )
        addAlbum( id, window.Manifest.albums[id] );
  }

  window.MediaLibrary = new MediaLibrary();

  document.addEventListener( 'DOMContentLoaded', function( event )  {
    mediaLibrary = document.querySelector( '.media-library' );
    mediaLibraryList = document.querySelector( '.media-library ul' );

    setup();

    mediaLibraryNodes = document.querySelectorAll( '.media-library .media' );

    var style = function( c ) {
      try {
        var swatches = vibrant( c );
        console.log( swatches );
        if ( swatches[ "DarkMuted" ] )
          c.parentElement.style = "background-color: " + swatches[ "DarkMuted" ].getHex();
      } catch ( ignore ) {
      };
    }

    for( var i = 0; i < mediaLibraryNodes.length; i++ ) {
      var img = mediaLibraryNodes[i].childNodes[0];
      img.addEventListener( 'load', function() {
        style( img );
      });
      if( img.complete )
        style( img );
    }

    window.AlbumListing.on( 'show', window.MediaLibrary.hide.bind( window.MediaLibrary ) );
  } );


}();
