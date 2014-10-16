/*
	dogesweeper engine v0.1
*/
$(function(){

	$.fn.memesweeper = function(custom_options){
		var $game_box = $(this),
			options = $.extend({
				theme: 'doge',
				meme_ratio: .15,
				width: 15,
				height: 15,
				square_width: 25
			}, custom_options),
			Game = {
				_game: null,
				init: function ($game_box, options) {
					// save pointer to game box
					this.$game_box = $game_box.addClass('memesweeper');
					this.$control_box = $('<div class="controls"/>');
					this.$board = $('<div class="board" />');
					this.options = options;

					this.load_theme(options.theme);
					this.generate_controls();
					this.restart();
				},
				get_empty_game: function() {
					return {
						memes: [],
						warnings: [],
						num_tiles: 0,
						tiles_found: 0,
						num_memes: 0,
						memes_found: 0,
						start_time: null
					};
				},
				load_theme: function (theme) {
					//add custom stylesheet
					$('<link />')
						.attr({
							type: 'text/css',
							href: 'themes/' + theme + '/theme.css',
							rel: 'stylesheet'
						})
						.appendTo('head');
				},
				generate_controls: function () {

					this.$control_box
						.html('<div class="score"></div><div class="button"></div><div class="time"></div>')
						.on('click.meme', '.button', function() {
							Game.restart();
						})
						.appendTo(this.$game_box);

				},
				restart: function () {
					// reset the counters
					this._game = this.get_empty_game();
					this.Clock.stop();
					this.generate_board(this._game);
					this.$game_box.removeClass('winner loser');
				},
				generate_board: function () {
					var board_width = this.options.width * (this.options.square_width + 2),
						board_height = this.options.height * (this.options.square_width + 2),
						// for generating doges
						rand_x, rand_y, rand_key,
						// for generating the board
						row_x, row_y,
						this_meme_pos, this_meme_key, i, j, this_warning_key,
						num_memes = Math.round(this.options.width * this.options.height * this.options.meme_ratio),
						memes_added = 0;

					// clear the board
					this.$board.html('');

					// render the playing field
					for (row_y = 0; row_y < this.options.height; row_y++) {
						for (row_x = 0; row_x < this.options.width; row_x++) {

							//build each square
							$('<div id="'+ this.Square.get_key(row_x, row_y) +'" class="board-square fresh" />')
								.appendTo(this.$board);
						}
					}

					// generate memes
					while (memes_added < num_memes) {

						//generate a random doge location within bounds
						rand_x = Math.floor(Math.random() * (this.options.width));
						rand_y = Math.floor(Math.random() * (this.options.height));

						rand_key = this.Square.get_key(rand_x, rand_y);

						// does this row exist yet?
						if (typeof this._game.memes[rand_key] == 'undefined') {
							// and add this doge to the row
							this._game.memes[rand_key] = [rand_x, rand_y];

							memes_added++;
						}
					}

					// save game info
					this._game.num_memes = num_memes;
					this._game.num_tiles = this.options.width * this.options.height - memes_added;

					// generate meme warnings for each meme
					for (this_meme_key in this._game.memes) {
						this_meme_pos = this.Square.parse_key(this_meme_key);

						// for each col
						for (i = this_meme_pos.x - 1; i <= this_meme_pos.x + 1 ; i++) {
							// for each row
							for (j = this_meme_pos.y - 1; j <= this_meme_pos.y + 1 ; j++) {
								this_warning_key = this.Square.get_key(i, j);

								// does this warning box already have a number?
								if (typeof this._game.warnings[this_warning_key] == 'undefined') {
									// create new warning
									this._game.warnings[this_warning_key] = 1;
								} else {
									// increment warning
									this._game.warnings[this_warning_key] += 1;
								}
							}
						}
					}

					this.$game_box
						.css({
						  'width': board_width + 10
						})

					this.$control_box
						.find('.time').html('0').end()
						.find('.score').html(this._game.num_memes).end();

					this.$board
						.off('.meme')
						.removeClass('gameover')
						.css({
							'width': board_width,
							'height': board_height
						})
						.on('click.meme contextmenu.meme', '.board-square.fresh, .board-square.flagged', function(event){
							var $square = $(this),
								this_pos = Game.Square.parse_key($square.attr('id'))
								this_val = Game.Square.get_value(this_pos.x, this_pos.y),
								is_right_click = event.which == 3,
								is_flagged = $square.hasClass('flagged');

							if (Game.$board.hasClass('gameover')) {
								return;
							}

							//right-click?
							if (is_right_click) {
								event.preventDefault();
								event.stopPropagation();

								Game._game.memes_found += (!is_flagged) ? 1 : -1;

								$square
									.toggleClass('fresh', is_flagged)
									.html(!is_flagged ? '&#9873;' : '') // flag
									.toggleClass('flagged', !is_flagged);

								//let's see if we've won the game
								Game.check_status();
								return;
							}

							if (is_flagged) {
								// don't respond to normal clicks when it's been flagged
								return;
							}

							//uncover the square
							Game.Square.uncover($square, this_val);

							//hit a doge?
							switch (this_val) {
								case 'd': // meme square
									//go boom!
									Game.end(false);

									// show an x!
									$square.html('&#215;');

									return;
								break;
								case '': // empty square
									// uncover adjacent empty squares
									Game.Square.uncover_empty(this_pos.x, this_pos.y);

								break;
								default:
							}

							// is the game over now?
							Game.check_status();

						})
						.appendTo(this.$game_box);
				},
				check_status: function () {
					this.$control_box
						.find('.score')
							.html(this._game.num_memes - this._game.memes_found);

					if (!this.Clock.is_started()) {
						this.Clock.start();
					}

					// if the player has opened all non bomb tiles, then we have a winner!
					if (this._game.num_tiles === this._game.tiles_found) {
						this.end(true);
					}
				},
				end: function (is_win) {
					var this_meme,
						$square;

					this.Clock.stop();

					if (is_win) {
						this.$game_box.addClass('winner');
					} else {
						//show all memes!
						for (this_meme in this._game.memes) {
							$square = $('#' + this_meme);

							if ($square.hasClass('fresh')) {
								this.Square.uncover($square, 'd');
							}
						}
						this.$game_box.addClass('loser');
					}
					this.$board.addClass('gameover');
				},
				Square: {
					get_key: function (x, y) {
						return x.toString() + "_" + y.toString();
					},
					parse_key: function (key) {
						key = key.split('_');
						return {
							x: parseInt(key[0]),
							y: parseInt(key[1])
						}
					},
					get_value: function (x, y) {
						var key = this.get_key(x, y);

						// is this a meme?
						if (typeof Game._game.memes[key] != 'undefined') {
							return 'd';
						}

						// is this a proximity warning?
						if (typeof Game._game.warnings[key] != 'undefined') {
							return Game._game.warnings[key];
						}

						return '';
					},
					uncover: function ($square, this_val) {
						$square
							.removeClass('fresh')
							.addClass('square' + this_val)
							.text(this_val == 'd' ? '' : this_val);

						// track opened tiles
						if (this_val !== 'd') {
							Game._game.tiles_found++;
						}
					},
					uncover_empty: function (x, y) {
						// look at all the surrounding squares
						// if you encounter an empty square, also look all around it
						var i, j, $square, id, this_val;

						for (i = x - 1; i <= x + 1; i++) {
							for (j = y - 1; j <= y + 1; j++) {
								id = this.get_key(i, j);

								// find this element, which must also be untouched
								$square = $('#' + id + '.fresh');

								// no such element, good!
								if ($square.length) {
									// is it an empty box?
									this_val = this.get_value(i, j);
									if (this_val != 'd') {
										this.uncover($square, this_val);
									}
									if (this_val == '') {
										this.uncover_empty(i, j);
									}
								}

							}
						}
					}
				},
				Clock: {
					is_started: function() {
						return Game._game.start_time !== null;
					},
					start: function() {
						// tag the current time
						Game._game.start_time = new Date().getTime();

						// start ticking
						this.tick();
					},
					tick: function() {
						var elapsed = Math.round((new Date().getTime() - Game._game.start_time) / 1000);
						Game.$control_box.find('.time').html(elapsed);
						this.timeout = setTimeout(function(){Game.Clock.tick();}, 200);
					},
					stop: function() {
						if (!this.timeout) {
							return;
						}
						clearTimeout(this.timeout);
					}
				}
			};

		Game.init($game_box, options);
	}

});