function join() {
    var code = document.getElementById("friend-code-input").value;
    socket.emit("join", code);
}

socket.on("game", pack => {
    game = pack.game;
    game.pieces = [];
    for (var piece of pack.pieces) {
        var c = get_class(piece.name);
        var p;
            playing_light = pack.light;
        if(!pack.light){
            // Player is playing black, reverse board
            p = new c(7 - piece.position.x, 7 - piece.position.y, piece.light);
        } else {
            p = new c(piece.position.x, piece.position.y, piece.light);
        }

        for (item in piece) {
            if(item == "image" || item == "position" || item == "start_position" || item == "last_position") continue;
            p[item] = piece[item]; // Copy all other atributes
        }
        
        game.pieces.push(p);
    }
    if (!playing) {
        clearInterval(animation);
        document.body.innerHTML = "<div id='board'></div>"
        playing = true;
    }

    draw_board();
})

function get_class(name) {
    for (piece of pieces) {
        if (piece.name == name) return piece.class;
    }
    return false;
}

socket.on("friendcode", code => {
    document.getElementById("friend-code").innerHTML = code;
});