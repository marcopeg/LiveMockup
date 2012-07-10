;(function($){
	
	
	
	/**
	 * Plugin's Info and Defaults
	 */
	$.liveMockup = {
		version: 		'1.0',
		author:			'Marco Pegoraro',
		authorMail:		'marco(dot)pegoraro(at)gmail(dot)com',
		git:			'',
		doc:			'',
		
		defaults: {
			ratio: 			1,
			autoNext: 		true
		}
	
	};
	
	
	

	/**
	 * jQuery Extension - The Plugin
	 */
	$.fn.liveMockup = function( cfg ) {
		
		// Creates CSS stylesheets for the plugin.
		if ( !styleCreated ) appendStyle(style);
		
		var args = arguments;
		
		
		// Set slide API
		if ( cfg === 'slide' ) {
			
			$(this).each(function(){
				
				var obj = $(this).data('livemockup');
				
				__displayCard.apply( obj, [ args[1] ] );
				
			});
			
			return this;
			
		}
		
		
		
		// Build a local configuration:
		cfg = $.extend({},$.liveMockup.defaults,cfg);
		
		
		
		
		// Initialization loop:
		// If ImageReady plugin exists it is used to wait all images are ready!
		if ( $.imageReady ) {
			
			$(this).each(function(){
				
				$(this).find('img').imageReady({
					mode: 'ALL',
					onComplete: $.proxy(function(){
						__loop.call( this, cfg );	
					},this)
				});
				
			});
			
		// No "ImageReady" plugin available!
		} else {	
			$(this).each(__loop,[cfg]);	
			
		}
		
		
		
		return this;
		
	}; // EndOf: "$.fn.liveMockup()" ###
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	


/**
 * ---------------------------------------
 * Main Loop Logic
 * ---------------------------------------
 *
 * Creates an object with all useful references and informations about the live mockup.
 * Stores this object into the mockup's DOM via data() API.
 *
 * Mockup Object is used as context when calling sub-logic methods:
 * method.apply( obj, [ p1, p2, ... ] )
 *
 * Each sub-logic methods refers to mockup's parts via "this" variable.
 */
	var __loop = function( cfg ) {
		
		var $this 	= $(this);
		
		// Prevent multiple initializations
		if ( $this.data('livemockupStart') ) return;
		$this.data( 'livemockupStart', true );
		
		
		var $img 	= $this.find('img:first');
		
		var obj = {
			_:		this,
			$:		$this,
			cfg:	$.extend({},{},cfg),
			o: {
				w:	$img.width(),
				h:	$img.height()
			},
			r: {
				w: 	null,
				h:	null
			},
			$menu:			$('<div>'),
			cards:			[],
			activeCard: 	null,
			isHover:		false		// to know when mouse is over the object to display sensible areas.
		};
		
		// -- Save data to the DOM --
		$this.data( 'livemockup', obj );
		
		// Fetch data from DOM and fill obj property
		__initMockup.apply( obj );
		
		// Create the "all slides" panel
		__initMenu.apply( obj );
		
		
	}
	
	
	var __initMockup = function( obj ) {
		
		// Init mockup items:
		var _cards = this.$.find('li');
		for ( var i=0; i<_cards.length; i++ ) __initCard.call( this, _cards[i], i+1 );
		
		// Calculates objects size relative to the ratio:
		__fixSize.call( this );
		
		// Show the first card:
		__displayCard.call( this, 1 );
		
		this.$.bind('mouseenter',$.proxy(function(){		this.isHover=true; },this));
		this.$.bind('mouseleave',$.proxy(function(){		this.isHover=false; },this));
		
		$('body').bind('keydown keyup',$.proxy( __documentKeyUp, this ));
		
	}
	
	
	var __initCard = function( _card, idx ) {
		
		var $card = $(_card);
		
		var card = {
			_: 		_card,
			$: 		$card,
			pins: 	[]
		};
		
		this.cards.push( card );
		
		
		
		// Init card's pins:
		var _pins = $card.find('a');
		
		// Auto generation of the "next" full link.
		if ( this.cfg.autoNext && !_pins.length ) {
			$card.append('<a href="#next"></a>');
			_pins = $card.find('a');
		}
		
		for ( var i=0; i<_pins.length; i++ ) __initPin.call( this, card, _pins[i] );
		
		
		
	}
	
	var __initPin = function( card, _pin ) {
		
		var $pin = $(_pin);
		
		var pin = {
			_:		_pin,
			$:		$pin,
			o: {
				x:	$pin.attr('data-x'),
				y:	$pin.attr('data-y'),
				w:	$pin.attr('data-w'),
				h:	$pin.attr('data-h')
			},
			r: { x:null,y:null,w:null,h:null }
		};
		
		card.pins.push( pin );
		
		
		$pin.html(" "); // --tmp
		
		// Pin onClick action:
		$pin.bind( 'click', $.proxy(__clickOnPin,this) );
		
	}
	
	
	var __initMenu = function() {
		
		this.$menu.addClass('livemockup-menu').css({
			width: 	this.r.w,
			height: this.r.h
		});
		
		var $wrap = $('<div>').addClass('livemockup-menu-wrapper');
		
		// Create slides menu
		for ( var i=0; i<this.cards.length; i++ ) {
			
			var $img = $('<img>')
				.attr( 'src', this.cards[i].$.find('img').attr('src') )
				.css({
					width: 	this.r.w / 3 - 50,
					height: 'auto'
				});
			
			var $lnk = $('<a>')
				.addClass('livemockup-menu-link')
				.attr( 'href', '#'+(i+1) )
				.css({
					width: 	$img.outerWidth()+2,
					height: 'auto'
				});
			
			$wrap.append( $lnk.append( $img ) );
			
		}
		
		// Add actions to the menu items.
		$wrap.find('a').bind('click',$.proxy(function(e){
			
			e.preventDefault();
			
			__routeCard.call( this, $(e.currentTarget).attr('href').substring(1,100) );
			
			this.$menu.slideUp();
			
		},this));
		
		// Add the menu to the document.
		this.$menu.append($wrap);
		this.$.append( this.$menu );
		
		return this;
		
	}
	
	
	var __fixSize = function() {
		
		this.r.w = this.o.w * this.cfg.ratio;
		this.r.h = this.o.h * this.cfg.ratio;
		
		this.$.css({
			width: 	this.r.w,
			height: this.r.h
		});
		
		this.$.find('li').css({
			width: 	this.r.w,
			height: this.r.h
		});
		
		this.$.find('li img').css({
			width: 	this.r.w,
			height: this.r.h
		});
		
		var mockup = this;
		$.each( this.cards, function( cardIdx, card ){
			
			$.each( card.pins, function( pinIdx, pin ){
				
				if ( !pin.o.x ) pin.o.x = 0;
				if ( !pin.o.y ) pin.o.y = 0;
				if ( !pin.o.w ) pin.o.w = mockup.o.w;
				if ( !pin.o.h ) pin.o.h = mockup.o.h;
				
				pin.r.x = pin.o.x * mockup.cfg.ratio;
				pin.r.y = pin.o.y * mockup.cfg.ratio;
				pin.r.w = pin.o.w * mockup.cfg.ratio - 4; // remove margins
				pin.r.h = pin.o.h * mockup.cfg.ratio - 4; // remove margins
				
				pin.$.css({
					top: 		pin.r.y,
					left: 		pin.r.x,
					width: 		pin.r.w,
					height: 	pin.r.h
				});
				
			});
			
		});
		
	}
	
	
	
	
	
	
	
	
	
	
	
	
/***************************************************************************************************
 * Events Handlers
 ***************************************************************************************************/


/**
 * Drive mockup to the target slide or required action
 */
	var __clickOnPin = function( e ) {
		
		e.preventDefault();
		
		__routeCard.call( this, $(e.target).attr('href').substring(1,100) );
		
	}
	
	
	
	var __documentKeyUp = function( e ) {
		
		console.log(e);
		
		if ( !this.isHover ) {
			this.$.find('a').removeClass('show');
			return false;
		}
		
		if ( e.altKey ) {
			this.$.find('a').addClass('show');
			
		} else {
			this.$.find('a').removeClass('show');
			
		}
		
		if ( e.shiftKey ) {
			
			if ( this.$menu.is(':hidden') ) {
				this.$menu.slideDown();
				
			} else {
				this.$menu.slideUp();	
				
			}
			
		}
		
		if ( e.keyCode == 27 && this.$menu.is(':visible') ) {
			this.$menu.slideUp();
			
		}
		
		
	}
	
	
	
	
	
	
	
/***************************************************************************************************
 * LOGICAL METHODS
 ***************************************************************************************************/
	




/**
 * Handle an human readable card request like "1,2,3", "next", "prev", "first", "last".
 */	
	var __routeCard = function( route ) {
		
		// first, last
		if ( route == "first" ) route = 1;
		if ( route == "last" ) 	route = this.cards.length;
		
		// next, fallback to first
		if ( route == "next" ) {
			route = this.activeCard + 1;
			if ( route > this.cards.length ) return __routeCard.call( this, 'first' );
		}
		
		// prev, fallback to last
		if ( route == "prev" ) {
			route = this.activeCard - 1;
			if ( route < 1 ) return __routeCard.call( this, "last" );
		}
		
		// numeric routing request
		if ( route == parseInt(route) ) return __displayCard.call( this, route );
		
		
		// Link card by it's container ID
		if ( this.$.find('#'+route) )
			for ( var i=0; i<this.cards.length; i++ )
				if ( this.cards[i].$.attr('id') == route ) return __displayCard.call( this, i+1 );
		
		// Link card by it's container CLASS
		if ( this.$.find('.'+route) )
			for ( var i=0; i<this.cards.length; i++ )
				if ( this.cards[i].$.attr('class') == route ) return __displayCard.call( this, i+1 );
		
	}
	
	
	var __displayCard = function( idx ) {
		
		if ( this.activeCard != null ) __hideCard.apply( this, [ this.activeCard ] );
		
		try {
			
			this.cards[idx-1].$.show();
			
			this.activeCard = idx;
			
		} catch( e ) {
			
			console.log( e );
			
		}
		
	}
	
	var __hideCard = function( idx ) {
		
		try {
			
			this.cards[idx-1].$.hide();
			
			this.activeCard = null;
			
		} catch( e ) {
			
			console.log( e );
			
		}
		
	}
	
	
	
	
	
	
	
	
	
	
/***************************************************************************************************
 * EMBED STYLESHEET
 ***************************************************************************************************/
 	
 	var styleCreated = false;
 	
	function appendStyle(styles) {
		
		if ( styleCreated ) return;
		
		var css = document.createElement('style');
		css.type = 'text/css';
	
		if (css.styleSheet) css.styleSheet.cssText = styles;
		else css.appendChild(document.createTextNode(styles));
	
		document.getElementsByTagName("head")[0].appendChild(css);
		
		styleCreated = true;
		
	}
	
	
	
	var style = '';
	style += '.livemockup {position:relative;display:block;list-style:none;margin:0;padding:0}';
	style += '.livemockup li {position:absolute;display:none}';
	style += '.livemockup li img {display:block}';
	style += '.livemockup li a {position:absolute;top:0;left:0;overflow:hidden}';
	style += '.livemockup li a.show {background: rgba( 255, 255, 51, .6 );border:2px dashed #CCCC00}';
	style += '.livemockup-menu {display:none;position:absolute;top:0;left:0;overflow:auto;background:rgba(100,100,100,.4)}';
	style += '.livemockup-menu-wrapper {padding:1em}';
	style += '.livemockup-menu a {display:block;width:80px;height:80px;overflow:hidden;float:left;margin: 15px 10px 10px 15px}';
	style += '.livemockup-menu a img {display:block;width:98%;height:auto;border:1px solid black;}';
	
	
})(jQuery);