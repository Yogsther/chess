var socket = io.connect("10.80.45.44:25565");

var game;
var playing = false;
var playing_light = undefined;
var mouse_down = false;

var pieces = [
    {
        name: "n",
        class: Knight
    },{
        name: "queen",
        class: Queen
    },{
        name: "king",
        class: King
    }, {
        name: "pawn",
        class: Pawn
    },{
        name: "rook",
        class: Rook
    },{
        name: "bishop",
        class: Bishop
    }
]

var animation_cycle = 0;
var animation = setInterval(() => {
    document.getElementById("menu-img").src = "img/menu_" + animation_cycle%5 + ".png";
    animation_cycle++;
}, 150);

function reset() {
    const game_boilerplate = {
        pieces: [],
        light_up_spots: [],
        round: 0,
        light_turn: true
    }

    game = new Object();
    for (e in game_boilerplate) {
        game[e] = game_boilerplate[e];
    }

    add_piece(4, 7, true, King);
    add_piece(3, 7, true, Queen)
    add_piece(1, 7, true, Knight)
    add_piece(6, 7, true, Knight)
    add_piece(0, 7, true, Rook)
    add_piece(7, 7, true, Rook)
    add_piece(5, 7, true, Bishop)
    add_piece(2, 7, true, Bishop)

    for (i = 0; i < 8; i++) {
        add_piece(i, 6, true, Pawn);
    }

    draw_board();
}

function get_distance(x1, x2, y1, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}


function get_piece_at(x, y) {
    for (piece of game.pieces) {
        if (piece.position.x === x && piece.position.y === y) return piece;
    }
    return false;
}

function get_piece_index_at(x, y) {
    for (var i = 0; i < game.pieces.length; i++) {
        var piece = game.pieces[i];
        if (piece.position.x === x && piece.position.y === y) return i;
    }
    return -1;
}

function inspect(x, y) {
    if(!playing) return;
    x = Math.floor(x / 100);
    y = Math.floor(y / 100);
    var all_deactive = true;
    for (p of game.pieces)
        if (p.active) all_deactive = false;
    if (all_deactive) game.light_up_spots = []
    else return; // Don't inspect other pieces if one is active.

    var piece = get_piece_at(x, y);
    if (piece) {
        if(piece.light != playing_light) return;
        for (i = 0; i < 64; i++) {
            var x = i % 8;
            var y = Math.floor(i / 8);
            if (piece.check_move(x, y, game.round)) {
                if (x == piece.position.x && y == piece.position.y) continue;
                var piece_in_way = get_piece_at(x, y);
                if (piece_in_way) {
                    if (piece_in_way.light == piece.light) continue;
                    else game.light_up_spots.push({
                        x: x,
                        y: y,
                        color: "rgb(244, 66, 66)"
                    });
                } else game.light_up_spots.push({
                    x: x,
                    y: y,
                    color: "rgb(89, 223, 85)"
                });
            }
        }
    }
    draw_board();
}

function click(x, y) {
    if(!playing) return;
    inspect(x, y);
    x = Math.floor(x / 100);
    y = Math.floor(y / 100);

    var piece = get_piece_at(x, y);
    if (piece.light === game.light_turn) {
        if(piece.light != playing_light) return;
        piece.active = !piece.active;
        for (p of game.pieces)
            if (p != piece) p.active = false; // Deactivate all other pieces - two can't be active at the same time.
    } else {
        for (p of game.pieces) {
            if (p.active) {

                p.move(x, y);
            }
            p.active = false;
        }
    }
    draw_board();
}


function get_color(x, y) {
    // True == Light
    // False == Dark
    if (x % 2 == y % 2) return true;
    return false;
}

document.addEventListener("mousemove", e => {
    if(!playing) return;
    var rect = document.getElementById("board").getBoundingClientRect();
    inspect(e.clientX - rect.left, e.clientY - rect.top);
})


document.addEventListener("mousedown", e => {
    if(!playing) return;
    mouse_down = true;
    var rect = document.getElementById("board").getBoundingClientRect();
    click(e.clientX - rect.left, e.clientY - rect.top);
})

document.addEventListener("mouseup", e => {
    mouse_down = false;
})


// Draw the board
function draw_board() {
    var board = document.getElementById("board");
    board.innerHTML = ""; // Clear board

    for (var i = 0; i < 64; i++) {
        var x = i % 8;
        var y = Math.floor(i / 8);

        var bp = document.createElement("div");
        bp.classList.add("bp");

        var alpha = "ABCDEFGH";

        if (y == 7) {
            index = document.createElement("div");
            index.classList.add("index-bottom");
            index.innerText = alpha[x];
            bp.appendChild(index);
        }
        if (x == 0) {
            index = document.createElement("div");
            index.classList.add("index-side");
            index.innerText = 8 - y;
            bp.appendChild(index);
        }

        if (get_color(x, y)) bp.classList.add("light");

        var active_piece = false;
        for (piece of game.pieces) {
            if (piece.active) {
                active_piece = true;
                if (piece.position.x == x && piece.position.y == y) {
                    bp.classList.add("active");
                }
            }
        }

        for (spot of game.light_up_spots) {
            if (spot.x == x && spot.y == y) {
                s = document.createElement("div");
                s.classList.add("light-up");
                s.setAttribute("style", "background:" + spot.color + "!important;")
                bp.appendChild(s);
                if (active_piece) bp.classList.add("occupied")
            }
        }

        var piece = get_piece_at(x, y);
        if (piece) {
            if (piece.last_position.x != piece.position.x && piece.last_position.y != piece.position.y) {
                // Moved last move

            }

            bp.appendChild(piece.get_image());
            bp.classList.add("occupied")
        }
        board.appendChild(bp);
    }

}

