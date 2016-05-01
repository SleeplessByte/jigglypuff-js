+function() {
  'use strict';

  function Artist( source ) {
    for( var k in source ) {
      if ( source.hasOwnProperty(k))
        Object.defineProperty( this, k, { value: source[k], enumerable: true } );
    };

    var artistAlbums = [];
    Object.defineProperty( this, 'albums', { get: this.getAlbumsFn( artistAlbums ), enumerable: true } );

    var artistSongs = [];
    Object.defineProperty( this, 'songs', { get: this.getSongsFn( artistSongs ), enumerable: true } );
  }

  Artist.prototype.getAlbumsFn = function( cache ) {
    return function() {
      if ( cache.length )
        return cache;

      for ( var albumId in Manifest.albums ) {
        if( Manifest.albums.hasOwnProperty( albumId ) &&
          Manifest.albums[ albumId ].artist.id === this.id )
          cache.push( albumId );
      }

      return cache;
    }
  };

  Artist.prototype.getSongsFn = function( cache ) {
    return function() {
      if ( cache.length )
        return cache;

      cache.concat(
        this.albums.reduce( function( acc, id ) {
          return acc.concat( window.Album[ id ].songs );
        }, [] )
      );

      return cache;
    }
  };

  /**
   * Get an album by index
   * @param  {Integer} i the index in the album
   * @return {Object} the album
   */
  var get = (function () {
    var artistsCache = {};

    /**
     * [description]
     * @param  {[type]} i [description]
     * @return {[type]}   [description]
     */
    return function( id ) {
      if ( !artistsCache[ id ] )
        artistsCache[ id ] = new Artist( Manifest.artists[ id ] );
      return artistsCache[ id ];
    }
  })();

  window.Artist = get;
}();
