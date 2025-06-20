/* jshint devel:true */

// TODO: these are debug vars, mug
var perimSegments, holeSegments;

var editor = new SPLODER.Editor();
var assetsPanel = new SPLODER.AssetsPanel();

var viewport = document.querySelector("meta[name=viewport]");
var vpWidth = "device-width";

if (window.innerWidth > 1024) {
    vpWidth = (window.innerWidth < window.innerHeight) ? 768 : 1024;
}

viewport.setAttribute('content', 'width=' + vpWidth + ', user-scalable=no');

document.body.onload = function () {

    console.log("DOCUMENT LOADED");

    var pixelRatio = window.screen.width >= 1280 ? 1.0 : 0.5;

    editor.initWithSize(16, pixelRatio);
    editor.build('editor_container');
    editor.start();

    editor.dispatcher.add(function (e) {

        if (e == "loadComplete") {

            console.log("MAIN: ASSETS LOAD COMPLETED!");

            assetsPanel.init();
            assetsPanel.registerModel(editor.levels);
            assetsPanel.build();

            editor.history.restore();

        }

    });



};

window.onunload = function () {
    if (window._previewWindow) {
        window._previewWindow.close();
    }
}