(function ($) {
	('use strict');
	/**
	 * All of the code for your public-facing JavaScript source
	 * should reside in this file.
	 *
	 * Note: It has been assumed you will write jQuery code here, so the
	 * $ function reference has been prepared for usage within the scope
	 * of this function.
	 *
	 * This enables you to define handlers, for when the DOM is ready:
	 *
	 * $(function() {
	 *
	 * });
	 *
	 * When the window is loaded:
	 *
	 * $( window ).load(function() {
	 *
	 * });
	 *
	 * ...and/or other possibilities.
	 *
	 * Ideally, it is not considered best practise to attach more than a
	 * single DOM-ready or window-load handler for a particular page.
	 * Although scripts in the WordPress core, Plugins and Themes may be
	 * practising this, we should strive to set a better example in our own work.
	 */
	window.addEventListener('load', function () {
		var nextSelector = selector['nextSelector'];
		var navigationSelector = selector['navigationSelector'];
		var contentSelector = selector['contentSelector'];
		var itemSelector = selector['itemSelector'];
		var themeName = selector.theme;

		/** Support for TwentyTwenty theme */
		if( 'twentytwenty' === themeName ) {
			if ('' !== contentSelector) {
				itemSelector =
					selector['contentSelector'] + ' ' + selector['itemSelector'];
			} else {
				itemSelector = selector['itemSelector'];
			}
		} else {
			if (
				"." !== selector.contentSelector.charAt(0) &&
				"#" !== selector.contentSelector.charAt(0)
			) {
				if ($("." + selector.contentSelector).length) {
				contentSelector = "." + selector.contentSelector;
				} else if ($("#" + selector.contentSelector).length) {
				contentSelector = "#" + selector.contentSelector;
				}
			} else {
				contentSelector = selector.contentSelector;
			}
			itemSelector = contentSelector + " " + selector['itemSelector'];
		}

		var destUrl = $(nextSelector).attr('href');
		var finished = false;
		var flag = false;

		if (
			$(nextSelector).length &&
			$(navigationSelector).length &&
			// $(contentSelector).length &&
			$(itemSelector).length
		) {
			$(navigationSelector).css('display', 'none');
			$('body').addClass('infinite-scroll');

			var trigger = selector['event'];
			$(itemSelector)
				.last()
				.after(
					'<div id="ctis-loading" class="infinite-loader ctis-loader-elements"><span class="spinner"><img src="' +
						selector['image'] +
						'" alt="catch-infinite-scroll-loader"></span></div>'
				);
			if ('click' == trigger) {
				$(itemSelector)
					.last()
					.after(
						'<div id="infinite-handle" class="ctis-load-more-container ctis-loader-elements"><span class="ctis-load-more"><button>' +
							selector['load_more_text'] +
							'</button></span></div>'
					);
				load_on_click();
			} else {
				load_on_scroll();
			}

			$(window).on('scroll', function () {
				var t = $(this),
					elem = $(itemSelector).last();

				if (typeof elem == 'undefined') {
					return;
				}

				if (
					finished &&
					t.scrollTop() + t.height() >=
						elem.offset().top + elem.height()
				) {
					setTimeout(function () {
						$('.ctis-finished-notice').fadeOut('slow');
					}, 3000);
				}
			});
		}

		function ctis_load_more() {
			$.ajax({
				url: destUrl,
				beforeSend: show_loader(),
				success: function (results) {
					if (selector['jetpack_enabled']) {
						$('.infinite-loader').css('text-indent', '0');
						$('.infinite-loader').css('height', 'auto');
					}
					hide_loader();
					var obj = $(results);

					var elem = obj.find(itemSelector);
					// console.log(elem);
					var next = obj.find(nextSelector);

					if (next.length !== 0) {
						$(nextSelector).attr('href', next.attr('href'));
					}

					// var itemClass = selector['itemSelector'].split('.');

					elem = elem.each(function (index, value) {
						var el;
						if (
							$(value).find('img').hasClass('lazy') &&
							$(value).find('img').attr('data-src') !== undefined
						) {
							var src = $(value).find('img').attr('data-src');
							$(value)
								.find('img')
								.attr('src', src)
								.removeClass('lazy')
								.removeAttr('data-src');
						}

						/** Support: Logic for prepending separator in TwentyTwenty theme */
						var el;
						if ('twentytwenty' === themeName) {
							/* sepp = document.getElementsByClassName('post-separator');
                console.log(sepp[0].classList); */
							// Create a hr separator as in the theme as using existing element from the DOM didn't work in this theme for some reason
							var hr = document.createElement('HR');
							hr.classList.add(
								'post-separator',
								'styled-separator',
								'is-style-wide',
								'section-inner'
							);
							// console.log(hr);
							// hr.appendChild($(value));
							el = $(value).prepend(hr);
							//el = $(value);
						} else {
							el = $(value);
						}
						return el;
					});

					elem.each(function (i, v) {
						$(itemSelector).last().after($(this));
					});

					$(itemSelector).trigger('post-load');

					if (next.length !== 0 && next.attr('href') != '#') {
						destUrl = $(nextSelector).attr('href');
					} else {
						finished = true;
						$('body').addClass('infinity-end');
						$('.ctis-load-more-container').hide();
						$(itemSelector)
							.last()
							.after(
								'<div class="ctis-finished-notice infinite-loader ctis-loader-elements"><span class="finish-text spinner">' +
									selector['finish_text'] +
									'</span></div>'
							);
					}

					// Create the event
					let event = new CustomEvent('afterScroll', {
						detail: 'Hook some event after load completes',
					});

					// Dispatch/Trigger/Fire the event
					document.dispatchEvent(event);
				},
				error: function () {
					hide_loader();
					//$(".ctis-finished-notice").html('Error retrieving posts...');
				},
			});
		}

		function show_loader() {
			flag = true;
			$('#ctis-loading').show();
			// $('.infinite-loader').show();
			$('.ctis-load-more-container').hide();
		}

		function hide_loader() {
			$('#ctis-loading').hide();
			// $('.infinite-loader').hide();
			$('.ctis-load-more-container').show();
			setTimeout(function () {
				flag = false;
			}, 500);
		}

		function load_on_scroll() {
			$(window).on('scroll', function () {
				var t = $(this),
					elem = $(itemSelector).last();

				if (typeof elem == 'undefined') {
					return;
				}

				if (
					flag === false &&
					!finished &&
					t.scrollTop() + t.height() >=
						elem.offset().top + elem.height()
				) {
					ctis_load_more();
				}
			});
		}

		function load_on_click() {
			$('body').on('click', '.ctis-load-more', function () {
				ctis_load_more();
			});
		}
	});
})(jQuery);
