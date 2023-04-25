/*!
Deck JS - deck.print
Copyright (c) 2011-2014 Caleb Troughton
Dual licensed under the MIT license.
https://github.com/imakewebthings/deck.js/blob/master/MIT-license.txt
*/

/*
This module adds the methods and key binding to show and hide a print of all
slides in the deck. The deck print state is indicated by the presence of a class
on the deck container.
*/
(function($, undefined) {
  var $document = $(document);
  var $html = $('html');
  var rootSlides;

  var populateRootSlidesArray = function() {
    var options = $.deck('getOptions');
    var slideTest = $.map([
      options.classes.before,
      options.classes.previous,
      options.classes.current,
      options.classes.next,
      options.classes.after
    ], function(el, i) {
      return '.' + el;
    }).join(', ');

    rootSlides = [];
    $.each($.deck('getSlides'), function(i, $slide) {
      var $parentSlides = $slide.parentsUntil(
        options.selectors.container,
        slideTest
      );
      if (!$parentSlides.length) {
        rootSlides.push($slide);
      }
    });
  };

  var bindKeyEvents = function() {
    var options = $.deck('getOptions');
    $document.unbind('keydown.deckprint');
    $document.bind('keydown.deckprint', function(event) {
      var isPrintKey = event.which === options.keys.print;
      isPrintKey = isPrintKey || $.inArray(event.which, options.keys.print) > -1;
      if (isPrintKey && !event.ctrlKey) {
        $.deck('togglePrint');
        event.preventDefault();
      }
    });
  };

  var bindTouchEvents = function() {
    var $container = $.deck('getContainer');
    var options = $.deck('getOptions');
    var touchEndTime = 0;
    var currentSlide;

    $container.unbind('touchstart.deckprint');
    $container.bind('touchstart.deckprint', function() {
      currentSlide = $.deck('getSlide');
    });
    $container.unbind('touchend.deckprint');
    $container.bind('touchend.deckprint', function(event) {
      var now = Date.now();
      var isDoubletap = now - touchEndTime < options.touch.doubletapWindow;

      // Ignore this touch event if it caused a nav change (swipe)
      if (currentSlide !== $.deck('getSlide')) {
        return;
      }
      if (isDoubletap) {
        $.deck('togglePrint');
        event.preventDefault();
      }
      touchEndTime = now;
    });
  };

  var setupPrintSlideSelection = function() {
    var options = $.deck('getOptions');

    $.each($.deck('getSlides'), function(i, $slide) {
      $slide.unbind('click.deckprint');
      $slide.bind('click.deckprint', function(event) {
        if (!$.deck('getContainer').hasClass(options.classes.print)) {
          return;
        }
        $.deck('go', i);
        $.deck('hidePrint');
        event.stopPropagation();
        event.preventDefault();
      });
    });
  };

  /*
  Extends defaults/options.

  options.classes.print
    This class is added to the deck container when showing the slide print.

  options.keys.print
    The numeric keycode used to toggle between showing and hiding the slide
    print.

  options.touch.doubletapWindow
    Two consecutive touch events within this number of milliseconds will
    be considered a double tap, and will toggle the print on touch devices.
  */
  $.extend(true, $.deck.defaults, {
    classes: {
      print: 'deck-print show-all-slides'
    },

    keys: {
      print: 80 // p
    },

    touch: {
      doubletapWindow: 400
    }
  });

  /*
  jQuery.deck('showPrint')

  Shows the slide print by adding the class specified by the print class option
  to the deck container.
  */
  $.deck('extend', 'showPrint', function() {
    var $container = $.deck('getContainer');
    var options = $.deck('getOptions');

    if ($container.hasClass(options.classes.print)) {
      return;
    }

    // Hide through loading class to short-circuit transitions (perf)
    $container.addClass([
      options.classes.loading,
      options.classes.print
    ].join(' '));

    /* Forced to do this in JS until CSS learns second-grade math. Save old
    style value for restoration when print is hidden. */
    if (Modernizr.csstransforms) {
      $.each(rootSlides, function(i, $slide) {
        $slide.data('oldStyle', $slide.attr('style'));
        $slide.css({
          'position': 'absolute',
          'left': '0%',
          'top': (i * 100) + '%'
        });
      });
    }

    // Need to ensure the loading class renders first, then remove
    window.setTimeout(function() {
      $container.removeClass(options.classes.loading);
      $container.scrollTop($.deck('getSlide').position().top);
    }, 0);
  });

  /*
  jQuery.deck('hidePrint')

  Hides the slide print by removing the class specified by the print class
  option from the deck container.
  */
  $.deck('extend', 'hidePrint', function() {
    var $container = $.deck('getContainer');
    var options = $.deck('getOptions');

    if (!$container.hasClass(options.classes.print)) {
      return;
    }

    $container.removeClass(options.classes.print);
    $container.addClass(options.classes.loading);

    /* Restore old style value */
    if (Modernizr.csstransforms) {
      $.each(rootSlides, function(i, $slide) {
        var oldStyle = $slide.data('oldStyle');
        $slide.attr('style', oldStyle ? oldStyle : '');
      });
    }

    window.setTimeout(function() {
      $container.removeClass(options.classes.loading);
      $container.scrollTop(0);
    }, 0);
  });

  /*
  jQuery.deck('togglePrint')

  Toggles between showing and hiding the slide print.
  */
  $.deck('extend', 'togglePrint', function() {
    $.deck('getContainer').hasClass($.deck('getOptions').classes.print) ?
    $.deck('hidePrint') : $.deck('showPrint');
  });

  $document.bind('deck.init', function() {
    populateRootSlidesArray();
    bindKeyEvents();
    bindTouchEvents();
    setupPrintSlideSelection();
  });

  $document.bind('deck.change', function(event, from, to) {
    var $container = $.deck('getContainer');
    var containerScroll, slideTop;

    if ($container.hasClass($.deck('getOptions').classes.print)) {
      containerScroll = $container.scrollTop();
      slideTop = $.deck('getSlide', to).position().top;
      $container.scrollTop(containerScroll + slideTop);
    }
  });
})(jQuery);
