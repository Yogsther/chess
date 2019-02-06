
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

        this.image = new Image();
        this.image.classList.add("icon");
        this.image.src = "img/pieces/Chess_" + this.name[0] + this.sign + "t60.png";
    }

    get_image() {
        return this.image;
    }

    move(x, y) {
        if (this.check_move(x, y)) {
            if (get_piece_at(x, y)) {
                if (get_piece_at(x, y).light !== this.light) {
                    console.log("Delted", game.pieces[get_piece_index_at(x, y)])
                    game.pieces.splice(get_piece_index_at(x, y), 1) // Delete piece.
                }
            }

            if(!playing_light){
                x = 7 - x;
                y = 7 - y;
            }
            socket.emit("move", {
                id: this.id,
                x: x,
                y: y
            })

            this.position.x = x;
            this.position.y = y;
            this.active = false;
            this.amount_of_moves++;
            game.light_up_spots = []; // Clear light-up-spots
            game.round++; // Up the round count
            game.light_turn = !game.light_turn; // Switch turn
        }
    }

    check_move(x, y, round) {
        console.warn("Not yet implemented for this piece.")
    }

    check_paths(x, y, paths) {
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
                if (get_piece_at(pos.x, pos.y)) {
                    if (get_piece_at(pos.x, pos.y).light !== this.light) cache.push({
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

    check_move(x, y, round) {
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

    check_move(x, y, round) {
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

            if (distance < 2 && get_color(x, y) === get_color(this.position.x, this.position.y) && get_piece_at(x, y)) {
                return true;
            }
            if (this.position.x == x && !get_piece_at(x, y)) {
                if (this.amount_of_moves === 0) {
                    if (distance < 3 && !get_piece_at(x, y - y - this.position.y)) return true;
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