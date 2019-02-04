class ChessPiece {
    constructor(x, y, light, name /* Not in the extened classes constructor args! */ ) {
        this.name = name;
        this.light = light; // Color of the piece
        this.dark = !light;
        this.times_moves = 0;
        this.active = false;
        if (this.light) this.sign = "l";
        else this.sign = "d";
        this.position = { // Position on the board
            x: x,
            y: y
        }
        this.start_position = {
            x: x,
            y: y
        }
        this.last_position = {
            x: x,
            y: y
        }

        this.image = new Image();
        this.image.classList.add("icon");
        this.image.src = "img/peices/Chess_" + this.name[0] + this.sign + "t60.png";
    }

    get_image() {
        return this.image;
    }

    move(x, y) {
        if (this.check_move(x, y)) {
            this.position.x = x;
            this.position.y = y;
            this.active = false;
            game.light_up_spots = []; // Clear light-up-spots
            game.round++; // Up the round count
            game.light_turn = !game.light_turn; // Switch turn
        }
    }

    check_move(x, y, round) {
        console.warn("Not yet implemented for this peice.")
    }
}


class King extends ChessPiece {
    constructor(x, y, light) {
        super(x, y, light, "king");
    }

    check_move(x, y, round) {
        if (get_distance(this.position.x, x, this.position.y, y) < 2) return true;
        return false;
    }
}

class Knight extends ChessPiece {
    constructor(x, y, light) {
        super(x, y, light, "n");
    }

    check_move(x, y, round) {
        var distance = get_distance(this.position.x, x, this.position.y, y);
        if (distance >= 2 && distance < 3 && get_color(this.position.x, this.position.y) != get_color(x, y)) return true;
        return false;
    }
}


class Queen extends ChessPiece {
    constructor(x, y, light) {
        super(x, y, light, "queen");
    }

    check_move(x, y, round) {
        var checks = [{x: 0,y: 1},{x: 1,y: 1},{x: 1,y: 0},{x: -1,y: 1},{x: -1,y: 0},{x: -1,y: -1},{x: 1,y: -1},{x: 0,y: -1}]
        var total = [];
        for(var check of checks){
            total = total.concat(this.check(check.x, check.y));
        }
       
        for(var answ of total){
            if(answ.x == x && answ.y == y) return true;
        }
        
        return false;
    }

    check(x, y){
        var pos = {x: this.position.x, y: this.position.y};
        var cache = [];
        while((pos.x > 0 && pos.x < 8) && (pos.y > 0 && pos.y < 8)){
            // While pos is inside the board
            pos.x+=x;
            pos.y+=y;
            if(get_peice_at(pos.x, pos.y)) return cache;
            cache.push({x: pos.x, y: pos.y});
        }
        return cache;
    }
}


var game;
var mouse_down = false;

reset();

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

    add_peice(2, 3, true, King);
    add_peice(4, 4, false, King);
    add_peice(5, 5, true, Knight)
    add_peice(7, 6, true, Queen)
    draw_board();
}

function get_distance(x1, x2, y1, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}


function add_peice(x, y, light, type) {
    game.peices.push(new type(x, y, light));
}

function get_peice_at(x, y) {
    for (peice of game.peices) {
        if (peice.position.x === x && peice.position.y == y) return peice;
    }
    return false;
}

function inspect(x, y) {
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
    inspect(x, y);
    x = Math.floor(x / 100);
    y = Math.floor(y / 100);

    var peice = get_peice_at(x, y);
    if (peice) {
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
    var rect = document.getElementById("board").getBoundingClientRect();
    inspect(e.clientX - rect.left, e.clientY - rect.top);
})


document.addEventListener("mousedown", e => {
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