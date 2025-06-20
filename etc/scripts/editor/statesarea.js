/**
 * Created by ggaudrea on 7/13/15.
 */

SPLODER.StatesArea = function () {

    this.model = null;
    this.changed = null;

    var scope = this;
    var _itemId = 0;

    var _clickTime = 0;
    var _clickVal = 0;

    Object.defineProperty(this, "itemId", {
        get: function () {
            return _itemId;
        },
        set: function (val) {
            _itemId = val;
            update();
        }
    });

    this.initWithModel = function (model) {

        this.model = model;
        this.model.changed.add(onModelChanged, this);
        this.changed = new signals.Signal();

        return this;

    };

    this.build = function () {

        var container = document.getElementById('states');

        var html = '<ul>';

        for (var i = 0; i < 16; i++) {
            html += '<a><li data-value="' + i + '">' + (i + 1) + '</li></a>';
        }

        html += '</ul>';

        container.innerHTML = html;

        SPLODER.connectButtons(this, container, onButtonPress);

    };

    var update = function () {

        var i;
        var list = document.getElementById('states').getElementsByTagName('li');
        var s = scope.model.selection;
        var currentState = 0;
        var states = [];
        var item;

        if (!s.length) s = scope.model.items;

        if (s.length) {

            item = s[0];

            currentState = item.currentState;
            i = s.length;

            while (i--) {

                if (s[i].currentState != currentState) {
                    currentState = -1;
                    break;
                }

            }

        }

        if (s.length == 1) {

            for (i = 0; i < 16; i++) {

                states[i] = item.states.hasState(i) ? 2 : 0;

            }

        } else if (s.length > 0) {

            for (i = 0; i < 16; i++) {

                var states_total = 0;

                var j = s.length;

                while (j--) {

                    item = s[j];

                    if (item.states.hasState(i)) states_total++;

                }

                states[i] = states_total ? states_total == s.length ? 2 : 1 : 0;

            }

        }

        i = list.length;

        while (i--) {
            var elem = list[i];
            var val = parseInt(elem.dataset.value);

            if (val != currentState) elem.classList.remove('selected');
            else elem.classList.add('selected');

            if (states[val] == 2) elem.classList.add('notempty');
            else elem.classList.remove('notempty');

            if (states[val] == 1) elem.classList.add('mixed');
            else elem.classList.remove('mixed');
        }

    };

    var onModelChanged = function () {

        update();

    };

    var onButtonPress = function (id, button, value) {

        var clickDelta = Date.now() - _clickTime;
        var oldClickVal = _clickVal;

        _clickVal = parseInt(value);
        _clickTime = Date.now();

        var s = scope.model.selection;

        if (oldClickVal == _clickVal && clickDelta < 500) {
            scope.changed.dispatch([SPLODER.ACTION_CLEAR_STATE, -1, _clickVal]);
            _clickTime = 0;
        } else {
            scope.changed.dispatch([SPLODER.ACTION_SET_CURRENTSTATE, -1, _clickVal]);
        }

    };

};
