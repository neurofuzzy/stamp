/**
 * Created by ggaudrea on 9/2/15.
 */

SPLODER.GameConsole = function () {

    this.model = null;
    this.health = null;
    this.healthMeter= null
    this.score = null;
    this.armor = null;
    this.strength = null;
    this.captions = null;
    this.damagemask = null;
    this.damagemaskTimeout = null;
    this.damagering = null;
    this.damageringTimeout = null;

    this.changed = null;

    var scope = this;

    var _queue;
    var _currentText;
    var _displayedText;
    var _completedTime;
    var _steps;

    this.initWithModel = function (model) {

        this.model = model;

        connect();

        this.changed = new signals.Signal();

        _queue = [];
        _currentText = { sourceId: 0, nodeId: 0, text: '' };
        _displayedText = '';
        _completedTime = 0;
        _steps = 0;

        model.changed.add(this.onModelChanged, this);

        var player = model.getItemById(-1);
        console.log("HEALTH", player);

        return this;

    };

    var connect = function () {

        scope.health = document.getElementById('health');

        var healthElems = $$$('#health span');

        scope.healthMeter = healthElems[0];

        scope.score = document.getElementById('score');
        scope.armor = document.getElementById('armor');
        scope.strength = document.getElementById('strength');
        scope.captions = document.getElementById('captions');
        scope.damagemask = document.getElementById('damagemask');
        scope.damagering = document.getElementById('damagering');

        var C = SPLODER.Item;

        var startHealth = C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_HEALTH];
        var startStrength = C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_STRENGTH];
        var startArmor = C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_ARMOR];

        updateHealth(startHealth);
        updateStrength(startStrength);
        updateArmor(startArmor);

    };

    this.registerWithDispatcher = function (dispatcher) {

        if (dispatcher) {
            dispatcher.add(onAction, this);
        }

    };

    var updateHealth = function (health) {

        console.log("HEALTH CHANGED", health);
        scope.healthMeter.style.width = Math.floor(health) + "%";

    };

    var showDamage = function (angle) {

        if (!isNaN(angle)) {

            clearTimeout(scope.damageringTimeout);
            scope.damagering.style.transform = 'rotate(' + angle + 'deg)';
            scope.damagering.className = "hit";
            scope.damageringTimeout = setTimeout(function () {
                scope.damagering.className = "";
            }, 100);

        } else {

            clearTimeout(scope.damagemaskTimeout);
            scope.damagemask.classList.remove("active");
            setTimeout(function () {
                scope.damagemask.classList.add("active");
            }, 1);
            scope.damagemaskTimeout = setTimeout(function () {
                scope.damagemask.classList.remove("active");
            }, 1500);

        }

    }


    var updateScore = function (score) {

        scope.score.innerText = SPLODER.util.zeroPad(score, 4);

    };

    var updateStrength = function (strength) {

        scope.strength.innerText = strength;

    };

    var updateArmor = function (armor) {

        scope.armor.innerText = armor;

    };

    var removeTextBetweenBrackets = function (text) {
        if (!text) return '';
        var parts = text.split('[');
        for (var i = 0; i < parts.length; i++) {
            var idx = parts[i].indexOf(']');
            if (idx != -1) {
                parts[i] = parts[i].split(']')[1];
                while (idx--) {
                    parts[i] = ' ' + parts[i];
                }
            }
        }
        return parts.join('');
    }

    var showText = function (sourceId, nodeId, text) {

        if (text && text != _currentText.text) {

            var sourceItem = scope.model.getItemById(sourceId);
            var sourceType = sourceItem ? sourceItem.type : SPLODER.Item.TYPE_ITEM;

            if (_queue.length < 3) {
                _queue.unshift({
                    sourceId: sourceId || 0,
                    nodeId: nodeId || 0,
                    text: text || '',
                    type: sourceType,
                });
            } else {
                scope.changed.dispatch(SPLODER.FlowNode.ACTION_SHOW_TEXT, SPLODER.ACTION_RETURNED_ERROR, sourceId, nodeId);
            }

        }

    };

    var clearText = function () {

        _currentText.text = _displayedText = '';
        _currentText.nodeId = 0;
        _completedTime = Date.now();

    };

    this.step = function () {

        _steps++;

        if (_steps % 4 == 0) {

            if (_currentText.text == _displayedText && Date.now() - _completedTime > 1000 && _queue.length > 0) {

                if (_currentText.nodeId) {
                    this.changed.dispatch(SPLODER.FlowNode.ACTION_SHOW_TEXT, SPLODER.EVENT_STATE_CHANGE_COMPLETE, _currentText.sourceId, _currentText.nodeId);
                }

                _currentText = _queue.pop();
                _displayedText = '';
                scope.captions.className = '';
                this.changed.dispatch(SPLODER.FlowNode.ACTION_SHOW_TEXT, SPLODER.EVENT_STATE_CHANGE_START, _currentText.sourceId, _currentText.nodeId, _currentText.text);
                _currentText.text = SPLODER.BipedFace.removeEmoticons(_currentText.text);
                _currentText.text = removeTextBetweenBrackets(_currentText.text);

                scope.captions.className = 'captions' + _currentText.type;

                if (_currentText.type < SPLODER.Item.TYPE_ITEM) {
                    _displayedText = _currentText.text;
                    _completedTime = Date.now() + 2000;
                }

            }

            if (typeof _displayedText != 'string') _displayedText = '';

            var clen = _currentText.text.length;
            var dlen = _displayedText.length;

            if (dlen < clen) {

                _displayedText += _currentText.text.charAt(dlen);

                if (dlen + 1 == clen) {
                    _completedTime = Date.now();
                    if (_queue.length == 0) showText(0, '');
                } else {
                    this.changed.dispatch(SPLODER.FlowNode.ACTION_SHOW_TEXT, SPLODER.EVENT_STATE_CHANGE_STEP, _currentText.sourceId, _currentText.nodeId, _displayedText.length);
                }

            }

            scope.captions.innerText = _displayedText;

        }

        _steps %= 10000;


    };

    this.onModelChanged = function () {

        var action = arguments[0];
        var prop = arguments[1];
        var itemId = arguments[2];
        var valueA = arguments[3];

        // console.warn("GAMECONSOLE SAYS model changed")

        if (action == SPLODER.ACTION_CHANGE_GAMEPROPS) {

            switch (prop) {

                case SPLODER.GameProps.PROPERTY_HEALTH:

                    if (itemId == -1) {
                        updateHealth(valueA);
                    }
                    break;

                case SPLODER.GameProps.PROPERTY_SCORE:

                    if (itemId == -1 && !isNaN(valueA)) {
                        updateScore(parseInt(valueA) + 0);
                    }
                    break;

                case SPLODER.GameProps.PROPERTY_STRENGTH:

                    if (itemId == -1 && !isNaN(valueA)) {
                        updateStrength(parseInt(valueA) + 0);
                    }
                    break;

                case SPLODER.GameProps.PROPERTY_ARMOR:

                    if (itemId == -1 && !isNaN(valueA)) {
                        updateArmor(parseInt(valueA) + 0);
                    }
                    break;


            }

        }


    }

    var onAction = function () {

        var action = arguments[0];
        var sourceId = arguments[1];
        var nodeId = arguments[2];
        var valueA = arguments[3];

        switch (action) {

            case SPLODER.FlowNode.ACTION_SHOW_TEXT:

                showText(sourceId, nodeId, window.atob(valueA));
                break;

            case SPLODER.GameEvent.TYPE_PLAYER_DAMAGED:

                showDamage(arguments[2]);
                break;


            case SPLODER.EVENT_ABORT:

                if (_currentText.nodeId == nodeId) {
                    clearText();
                }


        }

    }

};
