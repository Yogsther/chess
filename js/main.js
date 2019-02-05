var socket = io.connect("localhost:2994");

var game;
var playing = false;
var mouse_down = false;


var animation_cycle = 0;
var animation = setInterval(() => {
    document.getElementById("menu-img").src = "img/menu_" + animation_cycle%5 + ".png";
    animation_cycle++;
}, 150);

function reset() {
    const game_boilerplate = {
        peices: [],
        light_up_spots: [],
        round: 0,
        light_turn: true
    }

    game = new Object();
    for (e in game_boilerplate) {
        game[e] = game_boilerplate[e];
    }

    add_peice(4, 7, true, King);
    add_peice(3, 7, true, Queen)
    add_peice(1, 7, true, Knight)
    add_peice(6, 7, true, Knight)
    add_peice(0, 7, true, Rook)
    add_peice(7, 7, true, Rook)
    add_peice(5, 7, true, Bishop)
    add_peice(2, 7, true, Bishop)

    for (i = 0; i < 8; i++) {
        add_peice(i, 6, true, Pawn);
    }

    draw_board();
}

function get_distance(x1, x2, y1, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}


function add_peice(x, y, light, type) {
    game.peices.push(new type(x, y, light));
    game.peices.push(new type(x, 7 - y, !light))
}

function get_peice_at(x, y) {
    for (peice of game.peices) {
        if (peice.position.x === x && peice.position.y === y) return peice;
    }
    return false;
}

function get_peice_index_at(x, y) {
    for (var i = 0; i < game.peices.length; i++) {
        var peice = game.peices[i];
        if (peice.position.x === x && peice.position.y === y) return i;
    }
    return -1;
}

function inspect(x, y) {
    if(!playing) return;
    x = Math.floor(x / 100);
    y = Math.floor(y / 100);
    var all_deactive = true;
    for (p of game.peices)
        if (p.active) all_deactive = false;
    if (all_deactive) game.light_up_spots = []
    else return; // Don't inspect other peices if one is active.

    var peice = get_peice_at(x, y);
    if (peice) {
        for (i = 0; i < 64; i++) {
            var x = i % 8;
            var y = Math.floor(i / 8);
            if (peice.check_move(x, y, game.round)) {

                if (x == peice.position.x && y == peice.position.y) continue;
                var peice_in_way = get_peice_at(x, y);
                if (peice_in_way) {
                    if (peice_in_way.light == peice.light) continue;
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

    var peice = get_peice_at(x, y);
    if (peice.light === game.light_turn) {
        peice.active = !peice.active;
        for (p of game.peices)
            if (p != peice) p.active = false; // Deactivate all other peices - two can't be active at the same time.
    } else {
        for (p of game.peices) {
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

        var active_peice = false;
        for (peice of game.peices) {
            if (peice.active) {
                active_peice = true;
                if (peice.position.x == x && peice.position.y == y) {
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
                if (active_peice) bp.classList.add("occupied")
            }
        }

        var peice = get_peice_at(x, y);
        if (peice) {
            if (peice.last_position.x != peice.position.x && peice.last_position.y != peice.position.y) {
                // Moved last move

            }
            bp.appendChild(peice.get_image());
            bp.classList.add("occupied")
        }
        board.appendChild(bp);
    }

}