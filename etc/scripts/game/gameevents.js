


SPLODER.GameEvent = function () {

    var _type = null;
    var _sourceItem = null;
    var _targetItem = null;
    var _frame = null;
    var _eventData = null;

    Object.defineProperty(this, 'type', { get: function () { return _type; } });
    Object.defineProperty(this, 'sourceItem', { get: function () { return _sourceItem; } });
    Object.defineProperty(this, 'targetItem', { get: function () { return _targetItem; } });
    Object.defineProperty(this, 'eventData', { get: function () { return _eventData; } });

    var scope = this;

    this.init = function (type, sourceItem, targetItem, frame, eventData) {

        _type = type;
        _sourceItem = sourceItem;
        _targetItem = targetItem;
        _frame = frame;
        _eventData = eventData;

        return this;

    };

    this.isReady = function (frame) {
        return _frame <= frame;
    }

};


SPLODER.GameEvents = function () {

    var _eventQueue = null;
    var _frame = 0;

    this.dispatcher = new signals.Signal();

    this.init = function () {

        this.reset();
        return this;

    };

    this.reset = function () {

        _eventQueue = [];
        _frame = 0;

    }

    this.addEvent = function (type, sourceItem, targetItem, delay, eventData) {

        if (isNaN(delay)) delay = 0;

        _eventQueue.push(
            new SPLODER.GameEvent().init(
                type,
                sourceItem, targetItem,
                _frame + 1 + delay,
                eventData
                )
        );
    }

    this.step = function () {

        _frame++;

        var i = _eventQueue.length;
        var event;

        while (i--) {

            event = _eventQueue[i];

            if (event.isReady(_frame)) {

                _eventQueue.splice(i, 1);
                this.processEvent(event);

            }

        }

    }

    this.processEvent = function (event) {

        if (SPLODER.GameRules.allowEvent(event)) {

            this.dispatcher.dispatch(event);

        }

    }

};

SPLODER.GameEvent.TYPE_ATTACK = 301;
SPLODER.GameEvent.TYPE_PLAYER_SCORED = 302;
SPLODER.GameEvent.TYPE_PLAYER_CONTACT = 303;
SPLODER.GameEvent.TYPE_PLAYER_SELECT = 304;
SPLODER.GameEvent.TYPE_PLAYER_HEALTH_CHANGED = 305;
SPLODER.GameEvent.TYPE_PLAYER_DAMAGED = 306;
SPLODER.GameEvent.TYPE_PLAYER_HEALED = 307;
SPLODER.GameEvent.TYPE_ITEM_PICKED_UP = 308;
SPLODER.GameEvent.TYPE_DEATH_COMPLETE = 309;
SPLODER.GameEvent.TYPE_ITEM_DESTROYED = 310;