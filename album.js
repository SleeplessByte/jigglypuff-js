+function() {
  'use strict';

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

  window.Album = get;
}();
