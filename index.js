;(function() {
// state controller - tells this app
// if scrolling is locked or not.
var scrolling = {
    locked: false,

    lock: function() {
        this.locked = true;
    },

    unlock: function () {
        this.locked = false;
    }
};

// Init.
$(document).ready(function() {

    // use jquery's event system
    (function(jQuery) {

    jQuery.eventEmitter = {
        _JQInit: function() {
          this._JQ = jQuery(this);
        },
        emit: function(evt, data) {
          !this._JQ && this._JQInit();
          this._JQ.trigger(evt, data);
        },
        once: function(evt, handler) {
          !this._JQ && this._JQInit();
          this._JQ.one(evt, handler);
        },
        on: function(evt, handler) {
          !this._JQ && this._JQInit();
          this._JQ.bind(evt, handler);
        },
        off: function(evt, handler) {
          !this._JQ && this._JQInit();
          this._JQ.unbind(evt, handler);
        }
    };

    }(jQuery));

    /*=============================
    =            TO DO            =
    -------------------------------

        .modal__scroller can be resized, all the
        functions calculate scroll limits on the fly
        so therefore it doesn't matter changing it.

        So...

        1.  Add a class toggle on the MODAL.open function so that
                a. A class can be added thus styling a modal differently
                b. classes then define what sort of modal just opened, including their size.

        2.  Add a UI - standard close button - currently design seems to just imply clicking overlay is close with no "X" to speak of.


        4.  Fancybox route? Resize the modal to fit the incoming content - I'm not sure
            we need this for The Garnered as our modals will be set kinds of content rather
            than random things, and personally I'd rather make them responsive with CSS anyhow.

        5.  Make the script a bit more portable by creating an initialiser function with settings,
            eg pick the class names of the created elements, maybe even some basic templating?

        6.  Add some sugar for fancybox style linking, and jQuery behaviour, and some event listeners.
            eg:
                <a href='#element' class='one_modal'>Open Modal</a>
                $('.one_modal').oneBox( options );

            would just be sugar for
                $('.one_modal').on('click', function(e) {
                    e.preventDefault();
                    MODAL.load( $( $(this).attr('href') ) );
                });

                ( we'd need to think about whether we clone, or detach the selected element, and whether we 'put it back' ).

                Such that maybe we just leave it up to apps to handle this.


    /*=====================================
    =            Example Usage            =
    ---------------------------------------

    1. Open with Text:
    MODAL.load("Hello World");

    2. Open with Element:

    // $component detaches from wherever it was, and goes inside the overlay.
    // Use clone() if you don't want to detach, or see option 3
    var $component = $('.shopOverlay');
    MODAL.load( $component );

    3. Closing:
        // find some content, move it into the modal
        var $modalContent = $('.my_hidden_container').children();
        MODAL.load( $modalContent );

        // children are returned on a close if you want to place them back
        // from whence they came:
        var children = MODAL.close();
        children.appendTo('.my_hidden_container');


    4. Events:

        Currently a bit primitive, just open and close.  Namespaced - something to do with matching the object methods?

        MODAL.on('modal.open', fn );
        MODAL.on('modal.close', fn );

        These are just simple events on the MODAL instance.  Perhaps we should develop a new system where MODAL is actually
        an object instance (eg var myModal = new Modal() ) which creates its own containers....so in other words watch out
        if you have bound an event listener to open and two different parts of the app are challenging each other for the
        open event.  In this case, you can use once, or make a single 'on' event that can watch for other app states.


    /*=====  End of Example Usage  ======*/



    /*=========================================================
    =            Create Elements and Attach to Dom            =
    =========================================================*/
    var $els = {

        modal: $('<div class="modal"></div>'),
        overlay: $('<div class="modal__overlay" tabindex="-1"></div>'),
        scroller: $('<div class="modal__scroller" tabindex="0"></div>'),
        content: $('<div class="modal__inner"></div>'),
        //close: $('<button class="modal__close" aria-label="Close Overlay"></button>')

    };

    $els.modal.append( $els.overlay );
    $els.modal.append( $els.scroller );
    $els.scroller.append( $els.content );
    //$els.close.appendTo( $els.scroller );
    $els.modal.appendTo( 'body' );
    /*=====  End of Create Elements =========================*/

    /*=================================
    =            Functions            =
    =================================*/

    window.MODAL = {

        // Can set to true to stop overlay from closing modal
        overlayLock: false,

        _detachContent: function() {
            // be responsible with whatever content was loaded in, give an option to put it back
            // by triggering an event on the children.  It's up to the loader to handle the
            // MODAL.detach event.
            var children = $els.content.children();
            children.detach();
            children.trigger('MODAL.detach');
        },

        _updateClass: function( modifier ) {

            if (typeof modifier === 'string' || typeof modifier === 'object') {
                // remove any modifier classes
                $els.modal.removeClass(function (index, css) {

                    return (css.match (/modal--[0-9a-z-_]+/gi) || []).join(' ');
                });

                if (typeof modifier === 'object') {
                    modifier.forEach(function( className ) {
                        $els.modal.addClass('modal--' + className );
                    });
                } else {
                    $els.modal.addClass('modal--' + modifier );
                }

            }
        },

        els: $els,

        _ignored: false,

        ignoreCallback: false,

        setIgnored: function( list ) {
            if (typeof list === 'object')
            this._ignored = list;
        },

        open: function( modifier, callback ) {

            scrolling.lock();
            $els.modal.css('display', 'block');



            MODAL._updateClass( modifier );


            setTimeout(function() {
                requestAnimationFrame(function() {
                    $els.scroller.focus();
                    $els.modal.css('opacity', 1);

                    if (typeof callback === 'function') {
                        callback();
                    }

                    MODAL.emit("MODAL.open");

                });
            }, 28);
        },

        close: function() {

            scrolling.unlock();
            requestAnimationFrame(function() {
                $els.modal.css('opacity', 0);
                setTimeout(function() {
                    $els.modal.css('display', 'none');
                }, 150);
            });
            var children = $els.content.children();
            if (children.length) {
                children.trigger('MODAL.close');
            }
            // have to namespace else face weird consequences
            MODAL.emit("MODAL.close", children);
            return children;

        },

        // To simplify the function, Append content
        // will take a dom element `el` and remove anything
        // that was there before.

        // If you need a system where the dom elements keep swapping
        // or have to swap back, then treat `el` as a fully featured
        // container with its own sets of events, and be careful that
        // the modal does not destroy it
        appendContent: function( el ) {

            $els.content.fadeOut(function() {

                MODAL._detachContent();

                // append the new element
                $els.content.append( el );

                // fade it back in
                $els.content.fadeIn();
            });

            // return the children, if the user
            // wants to save them for later.
            return children;
        },

        // straight content change.
        setContent: function (content) {

            MODAL._detachContent();

            $els.content.html( content );
        },

        swapContent: function( content, modifier ) {
            $els.content.fadeOut(200, function() {
                if (modifier) {
                    MODAL._updateClass( modifier );
                }
                MODAL._detachContent();
                $els.content.html( content ).fadeIn(200);
            });
        },

        loadClone: function( content, modifier ) {

            // be responsible with whatever content was loaded in, give an option to put it back
            MODAL._detachContent();

            var clone = $(content).clone();
            this.load( clone, modifier );
        },

        // load content and reveal the modal
        load: function( content, modifier, callback ) {

            // be responsible with whatever content was loaded in, give an option to put it back
            MODAL._detachContent();

            if ( content.hasOwnProperty( 'is' ) ) {
                // then it's a dom element.
                $els.content.append( content );
            } else {
                this.setContent( content );
            }

            this.open( modifier, callback );
        },

        // make use of jquery's event emitter:
        emit: function( evt, data ) {
            MODAL._JQ.trigger( evt, data );
        },

        one: function(evt, handler) {
            MODAL._JQ.one(evt, handler);
        },

        on: function(evt, handler) {
            MODAL._JQ.on(evt, handler);
        },

        off: function(evt, handler) {
            MODAL._JQ.off(evt, handler);
        }

    };

    // used for event binding above - create a prop with jq's prototype:
    MODAL._JQ = $( MODAL );

    var prevent = function(ev) {


        if (typeof MODAL.ignoreCallback === 'function') {
            return MODAL.ignoreCallback( ev );
        } else {
            ev.stopPropagation();
            ev.preventDefault();
            ev.returnValue = false;
            return false;
        }



    };

    // close button closes
    $els.modal.on('click', '.modal__close', MODAL.close );


    // if someone clicks on the modal, but only if they *didn't*
    // click on its contents (thus on a resulting overlay)
    // then close it.
    $els.scroller.on('click', function(e) {

        if ( $(e.target).is( $(this) ) ) {

           if (!MODAL.overlayLock) {
                MODAL.close();
            }
        }
    });


    $els.overlay.on('click', function() {

        if (!MODAL.overlayLock) {
            MODAL.close();
        }

    });
    // $els.close.on('click', MODAL.close );


    /*=====  End of Functions  ======*/




    /*========================================
    =            Scroll Disabling            =

    These events are always active, but the
    state of scrolling, and the visibility
    of the overlay will define whether they
    kick in or not.
    ========================================*/
        // Stop scrolling the window, if scrolling is locked
        $(window).on('scroll', function(e) {
            if ( scrolling.locked ) {
                // this doesn't really do anything as far as I can see,
                // but may for certain browsers, and can help on touch?
                prevent(e);
            }
        });

        /*----------  TOUCH SCROLLING DISABLE  ----------*/

        // Stop scrolling ANYTHING if scrolling is Locked
        // AND if the touchstart target is NOT the modal__content (i.e. the only thing we allow to scroll)
        $(document).on('touchstart', function(ev) {

            // create a boolean deciding if
            var notScrollingContent = (
                scrolling.locked && // our scrolling is locked AND
                !$(ev.target).is( $els.scroller ) && // our target is NOT the scroller AND
                !$.contains( $els.scroller[0], ev.target )  // our target is NOT a CHILD of the scroller
            );

            if (notScrollingContent) {
                prevent(ev);
            }
        });

        // When the scrolling container is scrolling,
        // never let it get to the top or the bottom, just a pixel down, so
        // that scrolling never bubbles up

        // Do we need some sort of listener on 'allowed' elemenets? eg has class click handler??
        $els.scroller.bind('touchmove', function (ev) {
            // .modal-inner-scroller

            var $this = $(this);
            var scroller = $els.scroller.get(0);

            // if it is at the top, then scroll it down by a pixel
            if ($this.scrollTop() === 0) {
                $this.scrollTop(1);
                prevent(ev);
            }


            var scrollTop = scroller.scrollTop;
            var scrollHeight = scroller.scrollHeight;
            var offsetHeight = scroller.offsetHeight;
            var contentHeight = scrollHeight - offsetHeight;
            // if it is at the end of the scroll, scroll it up by a pixel

            //  console.log( $this.scrollTop(), contentHeight );

            if (contentHeight == scrollTop) {
                $this.scrollTop( scrollTop-1 );
                prevent(ev);
            }


        });

        /*----------  DESKTOP SCROLLING DISABLE  ----------*/

        // stop keyboard scrolling...
        // Space(32) PgUp(33), PgDn(34), End(35), Home(36), Left(37), Up(38), Right(39), Down(40)

        var downKeys = [ 32, 34, 35, 40 ];
        var upKeys = [ 33, 36, 38 ];

        $(document).keydown(function(e) {

            if ( scrolling.locked && $(e.target).is( $els.scroller[0] ) ) {

                var key = e.which;

                if ($.inArray(key,upKeys) > -1) {

                    //console.log("Pushing Up");
                    if ($els.scroller.scrollTop() === 0) { e.preventDefault(); }

                } else if ($.inArray(key,downKeys) > -1) {

                    //console.log("Pushing Down");
                    var scroller = $els.scroller.get(0);
                    var scrollTop = scroller.scrollTop;
                    var scrollHeight = scroller.scrollHeight;
                    var offsetHeight = scroller.offsetHeight;
                    var contentHeight = scrollHeight - offsetHeight;
                    if (contentHeight == scrollTop) { e.preventDefault(); }
                } else {
                    return true;
                }
            }

        });

        // Bind to the mousewheel

        $els.overlay.on('DOMMouseScroll mousewheel', function(ev) {
            return prevent(ev);
        });

        $els.scroller.on('DOMMouseScroll mousewheel', function(ev) {

            var $this = $(this),
                scrollTop = this.scrollTop,
                scrollHeight = this.scrollHeight,
                height = $this.innerHeight(),
                delta = (ev.type == 'DOMMouseScroll' ?
                    ev.originalEvent.detail * -40 :
                    ev.originalEvent.wheelDelta),
                up = delta > 0;



            if (!up && -delta > scrollHeight - height - scrollTop) {
                // Scrolling down, but this will take us past the bottom.
                $this.scrollTop(scrollHeight);

                return prevent(ev);

            } else if (up && delta > scrollTop) {
                // Scrolling up, but this will take us past the top.
                $this.scrollTop(0);

                return prevent(ev);
            }

        });
        /*=====  End of Scroll Disabling  ======*/

    });



})();
