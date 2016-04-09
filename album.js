+function() {
  'use strict';

  var albumListingHero, albumListingNodes, albumListingTracks;
  var actionPlayAlbum;

  function Album( source ) {
    for( var k in source ) {
      if ( source.hasOwnProperty(k))
        Object.defineProperty( this, k, { value: source[k] } );
    };
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
   * [showAlbumListing description]
   * @param  {[type]} album                  [description]
   * @param  {[type]} skipToSongAndPlayAlbum [description]
   * @return {[type]}                        [description]
   */
  function showAlbumListing( album, player, actionPlayThis ) {
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

      row.addEventListener( 'click', actionPlayThis );
    } );
  }

  function updateCurrentListing( album, song ) {
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

  window.Album = get;
  window.AlbumListing = {
    show: showAlbumListing,
    update: updateCurrentListing
  }

  document.addEventListener( 'DOMContentLoaded', function( event )  {
    albumListingHero = document.querySelector( '.album-listing .hero' );
    albumListingNodes = document.querySelectorAll( '.album-listing .album' );
    albumListingTracks = document.querySelector( '.album-listing .album.tracks tbody' );

    actionPlayAlbum = document.querySelector( '.album-listing .fab-action' );
  } );
}();
