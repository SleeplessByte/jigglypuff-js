+function() {

  var toolbar, toolbarTitle

  function Toolbar() {

    Object.defineProperty( this, 'transparent', {
      set: function( v ) {
        toolbar.classList.toggle( 'transparent', v )
      }
    })
  }

  Toolbar.prototype.setTitle = function( title ) {
    toolbarTitle.innerHTML = title
    return this
  }

  Toolbar.prototype.hide = function() {
    toolbar.classList.add( 'hide' )
    return this
  }

  Toolbar.prototype.show = function() {
    toolbar.classList.remove( 'hide' )
    return this
  }




  window.Toolbar = new Toolbar()

  document.addEventListener( 'DOMContentLoaded', function( event )  {
    toolbar = document.querySelector( '.toolbar' )
    toolbarTitle = document.querySelector( '.toolbar .title' )
  })

}()
