/* jshint devel:true */

// TODO: these are debug vars, mug
var perimSegments, holeSegments;

var game = new SPLODER.Game();

document.body.onload = function () {

    console.log("DOCUMENT LOADED");

    var gamepads;

    if ('getGamepads' in navigator) {
        gamepads = navigator.getGamepads();
    }

    console.log(gamepads);

    var pixelRatio = window.screen.width >= 1280 ? 1.0 : 0.25;

    game.initWithSize(16, pixelRatio);
    game.build('game_container');

    game.dispatcher.addOnce(function (e) {

        if (e == "loadComplete") {

            console.log("GAMEMAIN: ASSETS LOAD COMPLETED!");

            game.history.restoreFromStorage();

            //game.history.importProject({ data: "^^^3,0,-6,-13,22,59,[[@,72,72]]|4,0,4,-10,10,52,[[@,64,80]]|2,0,-4,1,8,13,[[@,64,80]]|6,0,4,14,10,8,[[@,46,80]]|7,0,-4,-10,8,8,[[@,64,80]]|10,0,-4,34,8,8,[[@,64,80]]|9,0,4,1,10,2,[[@,66,80]]|8,5,0,-6,0,0,[[@,65,@,@,@,@,@,@,@,@,@,@,@,6]]|11,5,1,4,0,0,[[0,65,@,@,@,1]]~11^^^^^^_#_0,0,405^^^||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||^^^5,1,-18,3,12,4,11,1,7,0,15,1,0,0|7,3,8,6,12,4,11,0,17,1,4,Oi0/IGkgYW0gYnVzeQ~" })
            game.start();

        }

    });



};
