/*
    dogesweeper engine v0.1
*/
$(function(){

    $.fn.dogesweeper = function(options){
        var $board_box = $(this),
            $board = $('<div class="board" />')
            $control_box = $('<div class="controls"/>')
            default_options = {
                doges: 20,
                width: 15,
                height: 15,
                square_width: 25
            },
            options = options ? options : {},
            //hold the doges
            doges = [],
            doges_added = 0,
            tiles_found = 0,
            doges_found = 0,
            //holds the doge warnings
            doge_warnings = [];
            var this_doge,
            //for generating doges
            rand_x, rand_y, rand_key,
            //for generating the board
            row_x, row_y, $board_square, board_square_value,
            // for generating warning numbers
            this_doge_pos, i, j, this_warning_key;
            
        $.extend(default_options, options);

        generate_controls();
        start_game();
        
        function start_game() {
            //rest the counters
            tiles_found = 0;
            doges_found = 0;
            generate_board();
        }

        function generate_controls() {
            $control_box
                .html('<div class="score"></div><div class="doge"></div><div class="time"></div>')
                .on('click', '.doge', function() {
                    
                })
                .appendTo($board_box);
        }
        
        function generate_board() {
            // clear the board
            $board
                .html();
            //generate doges
            while (doges_added < default_options.doges) {
                
                //generate a random doge location within bounds
                rand_x = Math.floor(Math.random() * (default_options.width));
                rand_y = Math.floor(Math.random() * (default_options.height));
                
                rand_key = get_square_key(rand_x, rand_y);
                
                // does this row exist yet?
                if (typeof doges[rand_key] == 'undefined') {
                    // and add this doge to the row
                    doges[rand_key] = [rand_x, rand_y];
                    
                    doges_added++;
                }
            }
            
            default_options.num_tiles = default_options.width * default_options.height - default_options.doges;
            
            //generate doge warnings for each doge
            for (this_doge_key in doges) {
                this_doge_pos = parse_square_key(this_doge_key);
                
                //for each col
                for (i = this_doge_pos.x - 1; i <= this_doge_pos.x + 1 ; i++) {
                    //for each row
                    for (j = this_doge_pos.y - 1; j <= this_doge_pos.y + 1 ; j++) {
                        this_warning_key = get_square_key(i, j);
                        if (typeof doge_warnings[this_warning_key] == 'undefined') {
                            // and add this doge to the row
                            doge_warnings[this_warning_key] = 1;
                        } else {
                            doge_warnings[this_warning_key] += 1;
                        }
                    }
                }
            }
            
            // render the playing field
            for (row_y = 0; row_y < default_options.height; row_y++) {
                for (row_x = 0; row_x < default_options.width; row_x++) {
                
                    //build each square
                    $board_square = $('<div id="'+ get_square_key(row_x, row_y) +'" class="board-square fresh" />')
                                        .appendTo($board);
                }
            }

            var board_width = default_options.width * (default_options.square_width  + 2),
                board_height = default_options.height * (default_options.square_width + 2);

            $board_box
                .css({
                  'width': board_width + 10
                })
                
            $control_box
                .find('.time').html('0').end()
                .find('.score').html(default_options.doges).end();
                
            $board
                .removeClass('gameover')
                .css({
                  'width': board_width,
                  'height': board_height
                })
                .on('click contextmenu', '.board-square.fresh, .board-square.flagged', function(event){
                    var $square = $(this),
                        this_pos = parse_square_key($square.attr('id'))
                        this_val = get_square_value(this_pos.x, this_pos.y),
                        is_right_click = event.which == 3,
                        is_flagged = $square.hasClass('flagged');
                    
                    if ($board.hasClass('gameover')) {
                        return;
                    }
                    
                    //right-click?
                    if (is_right_click) {
                        event.preventDefault();
                        event.stopPropagation();
                        if (this_val == 'd') {
                            doges_found += (!is_flagged) ? 1 : -1;
                        }
                        $square
                            .toggleClass('fresh', is_flagged)
                            .html(!is_flagged ? '&#9873;' : '') // flag
                            .toggleClass('flagged', !is_flagged);

                        //let's see if we've won the game
                        check_game_status();
                        return;
                    
                    }
                    
                    if (is_flagged) {
                        // don't respond to normal clicks when it's been flagged
                        return;
                    }
                    
                    //uncover the square
                    uncover_square($square, this_val);
                    
                    //hit a doge?
                    if (this_val == 'd') {
                        //go boom!
                        game_end(false);
                        // show an x!
                        $square
                            .html('&#215;');
                        return;
                    } else if (this_val == ''){
                        uncover_empty_squares(this_pos.x, this_pos.y);
                    } else {
                        //just open the square
                    } 
                    
                })
                .appendTo($board_box);
        }
        
        function get_square_key(x, y) {
            return x.toString() + "_" + y.toString();
        }
        
        function parse_square_key(key) {
            key = key.split('_');
            return {
                x: parseInt(key[0]),
                y: parseInt(key[1])
            }
        }
        
        function get_square_value(x, y) {
            var doge_key = get_square_key(x, y);
            
            if (typeof doges[doge_key] != 'undefined') {
                return 'd';
            }
            
            if (typeof doge_warnings[doge_key] != 'undefined') {
                return doge_warnings[doge_key];
            }
            
            return '';
        }
        
        function uncover_square($square, this_val) {
            $square
                .removeClass('fresh')
                .addClass('square' + this_val)
                .text(this_val == 'd' ? '' : this_val);
            
            tiles_found++;
            check_game_status();
        }
        
        function game_end(is_win) {
            var this_doge,
                doge_pos,
                $square;
            
            if (is_win) {  
                alert('wow');
            } else {
                //show all doges!
                for (this_doge in doges) {
                    $square = $('#' + this_doge);
                    
                    if ($square.hasClass('fresh')) {
                        uncover_square($square, 'd');
                    }
                }
            }
            $board.addClass('gameover');
        }
        function check_game_status() {
            $control_box
                .find('.score').html(default_options.doges - doges_found).end();

            if (default_options.num_tiles == tiles_found
                && default_options.doges == doges_found) {
                
                game_end(true);
            }
        }
        
        function uncover_empty_squares(x, y) {
            // look at all the surrounding squares 
            // if you encounter an empty square, also look all around it
            var i, j, $square, id;
            
            for (i = x - 1; i <= x + 1; i++) {
                for (j = y - 1; j <= y + 1; j++) {
                    id = get_square_key(i, j);
                    
                    // find this element, which is also untouched
                    $square = $('#' + id + '.fresh');
                    
                    // no such element, good!
                    if ($square.length) {
                        // is it an empty box?
                        this_val = get_square_value(i, j);
                        if (this_val != 'd') {
                            uncover_square($square, this_val);
                        }
                        if (this_val == '') {
                            uncover_empty_squares(i, j);
                        } 
                    }
                    
                }
            }
        }
    }

});