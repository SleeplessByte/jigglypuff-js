+function() {
  function TrackListing( querySelector, heroSelector ) {
    var _listing, _listingHero, _listingNodes, _listingTracks

    Object.defineProperty( this, '_listing', { get: function() { return _listing }, set: function( v ) { _listing = v } } )
    Object.defineProperty( this, '_listingHero', { get: function() { return _listingHero }, set: function( v ) { _listingHero = v } } )
    Object.defineProperty( this, '_listingNodes', { get: function() { return _listingNodes }, set: function( v ) { _listingNodes = v } } )
    Object.defineProperty( this, '_listingTracks', { get: function() { return _listingTracks }, set: function( v ) { _listingTracks = v } } )
    Object.defineProperty( this, '_querySelector', { get: function() { return querySelector } } )
    Object.defineProperty( this, '_heroSelector', { get: function() { return heroSelector } } )


    Object.defineProperty( this, 'listing', { get: function() { return this._listing }, enumerable: true } )
    Object.defineProperty( this, 'listingHero', { get: function() { return this._listingHero }, enumerable: true } )
    Object.defineProperty( this, 'listingNodes', { get: function() { return this._listingNodes }, enumerable: true } )
    Object.defineProperty( this, 'listingTracks', { get: function() { return this._listingTracks }, enumerable: true } )
  }

  TrackListing.prototype.DOMContentLoaded = function() {
    this._listing = document.querySelector( this._querySelector )
    this._listingHero = document.querySelector( this._querySelector + ' .hero' )
    this._listingNodes = document.querySelectorAll( this._querySelector + ' ' + this._heroSelector )
    this._listingTracks = document.querySelector( this._querySelector + ' .tracks tbody' )
  }

  TrackListing.prototype.updateHero = function( options ) {
    console.log( "update hero", this, options )

    var _this = this
    for (var i = 0; i < this.listingNodes.length; ++i) {
      var field = this.listingNodes[i]
      if( field.classList.contains( 'cover' ) ) {
        field.style = "background-color: " + options.color
        var image = new Image()
        image.addEventListener( 'load', (function( _local ) {
          var _field = _local
          return function() {
            _field.src = options.cover
            var swatches = vibrant( image )
            _this.styleListing( swatches )
          }
        })( field ) )

        image.src = options.thumb
        continue
      }

      if( field.classList.contains( 'title' ) ) {
        field.innerHTML = options.title
        continue
      }

      if( field.classList.contains( 'artist' ) ) {
        field.innerHTML = options.artist
        continue
      }

      if( field.classList.contains( 'datetime' ) ) {
        continue
      }
    }
  }

  TrackListing.prototype.hide = function() {
    this.listing.classList.add( 'hide' )
  }

  TrackListing.prototype.show = function( songs, player ) {
    this.listing.classList.remove( 'hide' )
    this.build( songs, player )
  }

  TrackListing.prototype.build = function( songs, player ) {
    var tracks = this.listingTracks
    tracks.innerHTML = ""

    var currentAlbum = player.currentSong.album
    var currentSong = player.currentSong

    var row, track, name, artist, duration
    var _self = this,
        foundActive = false

    function onSongClick( e ) {
      var song = this.getAttribute( 'data-song' )
      var album = Album( this.getAttribute( 'data-album' ) )
      _self.trigger( 'listing:song', [ album, song ] )
    }

    function appendSong( song, i ) {
      row = document.createElement( 'tr' )
      row.setAttribute( 'data-album', song.album.id )
      row.setAttribute( 'data-song', song.track )

      if ( currentAlbum.id === song.album.id && +currentSong.track === +song.track && !foundActive ) {
        row.classList.add( 'active' )
        foundActive = true
      }

      track = document.createElement( 'td' )
      track.innerHTML = song.track

      name = document.createElement( 'td' )
      name.innerHTML = song.name

      artist = document.createElement( 'td' )
      artist.setAttribute( 'class', 'hide-mobile')
      artist.innerHTML = (song.artist || song.album.artist).name

      duration = document.createElement( 'td' )
      duration.setAttribute( 'class', 'hide-mobile')
      duration.innerHTML = Math.floor( song.duration / 60 ) + ":" + ("00" + song.duration % 60 ).slice( -2 )

      row.appendChild( track )
      row.appendChild( name )
      row.appendChild( artist )
      row.appendChild( duration )
      tracks.appendChild( row )

      row.addEventListener( 'click', onSongClick )
    }

    songs.forEach( appendSong )
  }

  TrackListing.prototype.styleListing = function( swatches ) {
    var node,
    styling = document.querySelector( this._querySelector + ' .styling' )
    while (styling.lastChild) {
      styling.removeChild(styling.lastChild)
    }

    function addSwatch( styling, color, name ) {
      node = document.createElement( 'div' )
      node.classList.add( 'swatch' )
      node.classList.add( name )
      node.style = "background-color: " + color
      styling.appendChild( node )
    }

    var setHero = false,
        hero = this.listingHero,
        swatchKeys = [ 'LightVibrant', 'Vibrant', 'DarkVibrant', 'DarkMuted', 'Muted', 'LightMuted' ]

    swatchKeys.forEach( function( e, i ) {
      if (swatches.hasOwnProperty( e) && swatches[e]) {
        addSwatch( styling, swatches[e].getHex(), e )

        if ( !setHero ) {
          var rgb = swatches[e].getRgb()
          hero.style = "background-color: rgb( " + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ");"
          setHero = true
        }
      }
    });
  }

  window.TrackListing = TrackListing
}()
