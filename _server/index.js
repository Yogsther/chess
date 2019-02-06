var io = require('socket.io')(25565);

var users = [];
var games = [];

class User {
    constructor(socketid) {
        this.socketid = socketid;
        this.friend_code = this.get_friend_code();
    }
    get_friend_code() {
        var alpha = "ABCDEFGHIKLMNOPQRSTVXYZ";
        var code = "";
        do {
            for (var i = 0; i < 6; i++) {
                if (Math.random() > .75) {
                    code += Math.floor(Math.random() * 10);
                } else {
                    code += alpha[Math.floor(Math.random() * alpha.length)];
                }
            }
        } while (this.code_taken(code))
        return code;
    }

    code_taken(code) {
        for (var user of users) {
            if (user.friend_code == code) return true;
        }
        return false;
    }
}

class Game {
    constructor(user1, user2) {
        // User 1 is primary, the friend-code owner.
        this.friend_code = user1.friend_code;
        this.id_cycle = 0;
        this.game = {
            pieces: [],
            light_up_spots: [],
            round: 0,
            light_turn: true
        }

        user1.light = true;
        user2.light = false;

        this.players = [user1, user2];

        this.add_piece(4, 7, true, King);
        this.add_piece(3, 7, true, Queen)
        this.add_piece(1, 7, true, Knight)
        this.add_piece(6, 7, true, Knight)
        this.add_piece(0, 7, true, Rook)
        this.add_piece(7, 7, true, Rook)
        this.add_piece(5, 7, true, Bishop)
        this.add_piece(2, 7, true, Bishop)

        for (var i = 0; i < 8; i++) {
            this.add_piece(i, 6, true, Pawn);
        }

        this.emit_game();
    }

    emit_game() {
        for (var player of this.players) {
            io.to(player.socketid).emit("game", {
                game: this.game,
                pieces: this.game.pieces,
                light: player.light
            });
        }
    }

    add_piece(x, y, light, type) {

        function create(x, y, l, id) {
            var piece = new type(x, y, l);
            piece.id = id;
            return piece;
        }

        this.game.pieces.push(create(x, y, light, this.id_cycle++));
        this.game.pieces.push(create(x, 7 - y, !light, this.id_cycle++))
    }
}


io.on("connection", socket => {

    var user = new User(socket.id);
    socket.emit("friendcode", user.friend_code);
    users.push(user);

    socket.on("join", friend_code => {
        for (user of users) {
            if (user.friend_code == friend_code) {
                games.push(new Game(users[get_user(user.socketid)], users[get_user(socket.id)]));
            }
        }
    })

    socket.on("move", move => {
        for (game of games) { // Find game
            for (player of game.players) { // Find player
                if (player.socketid == socket.id) {
                    if (game.game.light_turn == player.light) { // Make sure it's the players turn
                        for (piece of game.game.pieces) {
                            if (piece.id == move.id) {
                                if (piece.check_move(move.x, move.y, game.game)) {
                                    if (get_piece_at(move.x, move.y, game.game)) {
                                        game.game.pieces.splice(get_piece_index_at(move.x, move.y, game.game), 1)
                                    }
                                    piece.move(move.x, move.y, game.game);
                                    game.light_turn = !game.light_turn;
                                    game.emit_game();
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    // End of socket
});

/**
 * @param {String} socket id of the user you want
 * @returns {int} index of user in users
 */
function get_user(socketid) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].socketid == socketid) return i;
    }
}

function get_color(x, y) {
    // True == Light
    // False == Dark
    if (x % 2 == y % 2) return true;
    return false;
}

function get_distance(x1, x2, y1, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}


function get_piece_at(x, y, game) {
    for (var piece of game.pieces) {
        if (piece.position.x === x && piece.position.y === y) return piece;
    }
    return false;
}

function get_piece_index_at(x, y, game) {
    for (var i = 0; i < game.pieces.length; i++) {
        var piece = game.pieces[i];
        if (piece.position.x === x && piece.position.y === y) return i;
    }
    return -1;
}


class ChessPiece {
    constructor(x, y, light, name /* Not in the extened classes constructor args! */ ) {
        this.name = name;
        this.light = light; // Color of the piece
        this.dark = !light;
        this.amount_of_moves = 0;
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

        /* this.image = new Image();
        this.image.classList.add("icon"); */
        this.image = "img/pieces/Chess_" + this.name[0] + this.sign + "t60.png";
    }

    get_image() {
        return this.image;
    }

    move(x, y, game) {

        this.position.x = x;
        this.position.y = y;
        this.active = false;
        this.amount_of_moves++;
        game.light_up_spots = []; // Clear light-up-spots
        game.round++; // Up the round count
        game.light_turn = !game.light_turn; // Switch turn

    }

    check_move(x, y, game) {
        console.warn("Not yet implemented for this piece.")
    }

    check_paths(x, y, paths, game) {
        var total = [];
        for (var path of paths) {
            var pos = {
                x: this.position.x,
                y: this.position.y
            };
            var cache = [];
            while ((pos.x >= 0 && pos.x < 8) && (pos.y >= 0 && pos.y < 8)) {
                cache.push({
                    x: pos.x,
                    y: pos.y
                });
                // While pos is inside the board
                pos.x += path.x;
                pos.y += path.y;
                if (get_piece_at(pos.x, pos.y, game)) {
                    if (get_piece_at(pos.x, pos.y, game).light !== this.light) cache.push({
                        x: pos.x,
                        y: pos.y
                    }); // Make sure to display kills as possible moves.
                    break;
                }
            }
            total = total.concat(cache);
        }
        for (var answ of total) {
            if (answ.x == x && answ.y == y) return true;
        }
        return false;
    }
}


class King extends ChessPiece {
    constructor(x, y, light) {
        super(x, y, light, "king");
    }

    check_move(x, y, game) {
        if (get_distance(this.position.x, x, this.position.y, y) < 2) return true;
        return false;
    }
}

class Knight extends ChessPiece {
    constructor(x, y, light) {
        super(x, y, light, "n");
    }

    check_move(x, y, game) {
        var distance = get_distance(this.position.x, x, this.position.y, y);
        if (distance >= 2 && distance < 3 && get_color(this.position.x, this.position.y) != get_color(x, y)) return true;
        return false;
    }
}


class Queen extends ChessPiece {
    constructor(x, y, light) {
        super(x, y, light, "queen");
    }

    check_move(x, y, game) {
        return this.check_paths(x, y, [{
            x: 0,
            y: 1
        }, {
            x: 1,
            y: 1
        }, {
            x: 1,
            y: 0
        }, {
            x: -1,
            y: 1
        }, {
            x: -1,
            y: 0
        }, {
            x: -1,
            y: -1
        }, {
            x: 1,
            y: -1
        }, {
            x: 0,
            y: -1
        }]);
    }
}

class Rook extends ChessPiece {
    constructor(x, y, light) {
        super(x, y, light, "rook");
    }

    check_move(x, y, game) {
        return this.check_paths(x, y, [{
            x: 0,
            y: 1
        }, {
            x: 0,
            y: -1
        }, {
            x: 1,
            y: 0
        }, {
            x: -1,
            y: 0
        }]);
    }
}

class Bishop extends ChessPiece {
    constructor(x, y, light) {
        super(x, y, light, "bishop");
    }

    check_move(x, y, game) {
        return this.check_paths(x, y, [{
            x: 1,
            y: 1
        }, {
            x: -1,
            y: -1
        }, {
            x: 1,
            y: -1
        }, {
            x: -1,
            y: 1
        }]);
    }
}

class Pawn extends ChessPiece {
    constructor(x, y, light) {
        super(x, y, light, "pawn");
    }

    check_move(x, y, game) {

        if (Math.abs(this.start_position.y - this.position.y) < Math.abs(this.start_position.y - y)) {
            var distance = get_distance(this.position.x, x, this.position.y, y);

            if (distance < 2 && get_color(x, y) === get_color(this.position.x, this.position.y) && get_piece_at(x, y, game)) {
                return true;
            }
            if (this.position.x == x && !get_piece_at(x, y, game)) {
                if (this.amount_of_moves === 0) {
                    if (distance < 3 && !get_piece_at(x, y - y - this.position.y, game)) return true;
                } else {
                    if (distance == 1) {
                        return true;
                    }
                }
            }

        }
        return false;
    }
}