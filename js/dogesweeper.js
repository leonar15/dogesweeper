/*
    Minesweeper engine v0.1
*/
$(function(){

    $.fn.dogesweeper = function(options){
        var $board_box = $(this),
            $board = $('<div class="board" />')
            default_options = {
                num_mines: 20,
                width: 20,
                height: 20,
                square_width: 25
            },
            options = options ? options : {},
            //hold the mines
            mines = [],
            mines_added = 0,
            //holds the mine warnings
            mine_warnings = [];
            var this_mine,
            //for generating mines
            rand_x, rand_y, rand_key,
            //for generating the board
            row_x, row_y, $board_square, board_square_value,
            // for generating warning numbers
            this_mine_pos, i, j, this_warning_key;
            
        $.extend(default_options, options);
        
        //generate mines
        while (mines_added < default_options.num_mines) {
            
            //generate a random mine location within bounds
            rand_x = Math.floor(Math.random() * (default_options.width));
            rand_y = Math.floor(Math.random() * (default_options.height));
            
            rand_key = get_square_key(rand_x, rand_y);
            
            // does this row exist yet?
            if (typeof mines[rand_key] == 'undefined') {
                // and add this mine to the row
                mines[rand_key] = [rand_x, rand_y];
                
                mines_added++;
            }
        }
        
        //generate mine warnings for each mine
        for (this_mine_key in mines) {
            this_mine_pos = parse_square_key(this_mine_key);

            //for each col
            for (i = this_mine_pos.x - 1; i <= this_mine_pos.x + 1 ; i++) {
                //for each row
                for (j = this_mine_pos.y - 1; j <= this_mine_pos.y + 1 ; j++) {
                    this_warning_key = get_square_key(i, j);
                    if (typeof mine_warnings[this_warning_key] == 'undefined') {
                        // and add this mine to the row
                        mine_warnings[this_warning_key] = 1;
                    } else {
                        mine_warnings[this_warning_key] += 1;
                    }
                }
            }
        }
        
        // render the playing field
        for (row_y = 0; row_y < default_options.height; row_y++) {
            for (row_x = 0; row_x < default_options.width; row_x++) {
            
                //build the DOM of the square
                $board_square = $('<div id="'+ get_square_key(row_x, row_y) +'" class="board-square fresh" />')
                                    .appendTo($board);
            }
        }
     
        function get_square_value(x, y) {
            var mine_key = get_square_key(x, y);
            
            if (typeof mines[mine_key] != 'undefined') {
                return 'm';
            }
            
            if (typeof mine_warnings[mine_key] != 'undefined') {
                return mine_warnings[mine_key];
            }
            
            return '';
        }
        
        //handle click events
        $board
            .css({
              'width': default_options.width * (default_options.square_width  + 2),
              'height': default_options.height * (default_options.square_width + 2)
            })
            .on('click contextmenu', '.board-square.fresh', function(event){
                var $square = $(this),
                    this_pos = parse_square_key($square.attr('id'))
                    this_val = get_square_value(this_pos.x, this_pos.y),
                    is_right_click = event.which == 3;
                
                //right-click?
                if (is_right_click) {
                    event.preventDefault();
                    event.stopPropagation();
                    $square
                        .removeClass('fresh')
                        .html('&#10004;') // checkmark
                        .html('&#9873;') // flag
                        .addClass('tagged');
                    return;
                
                }
                
                //uncover the square
                uncover_square($square, this_val);
                
                //hit a mine?
                if (this_val == 'm') {
                    // show an x!
                    $square
                        .html('&#215;');
                    //go boom!
                    handle_game_end(true);
                    return;
                } else if (this_val == ''){
                    uncover_empty_squares(this_pos.x, this_pos.y);
                } else {
                    //just open the square
                } 
                
            })
            .appendTo($board_box);
        
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
        
        function uncover_square($square, this_val) {
            $square
                .removeClass('fresh')
                .addClass('square' + this_val)
                .text(this_val == 'm' ? '' : this_val);

        }
        
        function handle_game_end(loss) {
            var doges;
            
            if (loss) {
                //show all doges!
                for (doges in mines) {
                    
                }
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
                        if (this_val != 'm') {
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