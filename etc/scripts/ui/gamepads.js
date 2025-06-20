SPLODER.Gamepads = function() {

    var scope = this;
    
    var _supportsGamepads = navigator.getGamepads || navigator.webkitGetGamepads;
    var _controllers = {};
    
    Object.defineProperty(scope, 'hasGamepad', {
        
        get: function () {
            for (var i in _controllers) {
                if (_controllers[i] && _controllers[i].index !== undefined) {
                    return true;
                }
            }
            return false;
        }
        
    });
    
    Object.defineProperty(scope, 'gamepads', {
        
        get: function () {
            return _controllers;
        }
        
    });

    scope.gamepadConnected = function (e) {
        
        console.log("Gamepad connected", e);
        _controllers[e.gamepad.index] = e.gamepad;

    }
 
    scope.gamepadDisconnected = function (e) {

        console.log("Gamepad disconnected", e);
        _controllers[e.gamepad.index] = null;
        
    }

    scope.gamepadScan = function () {

        var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        
        for (var i = 0; i < gamepads.length; i++) {
            
            if (gamepads[i]) {
                _controllers[gamepads[i].index] = gamepads[i];
            }
            
        }
        
    }


    window.addEventListener("gamepadconnected", scope.gamepadConnected);
    window.addEventListener("gamepaddisconnected", scope.gamepadDisconnected);

    if (_supportsGamepads) {
        setInterval(scope.gamepadScan, 50);
    }


}