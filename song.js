+function() {
  function Song( source ) {
    for( var k in source ) {
      if ( source.hasOwnProperty(k))
      {
        var v = source[k]
        if ( k === 'artist' )
          v  = window.Artist( v.id )

        Object.defineProperty( this, k, { value: v  } )
      }
    }
  }

  window.Song = function( s ) { return new Song( s ) }
}()
