/**
 * Created by ggaudrea on 7/25/15.
 */
SPLODER.AssetsPanel = function () {

    this.container = null;

    var _models = [];
    var _dispatchers = [];

    this.init = function () {

        this.container = $$('#assets');
        _models = [];

    };

    this.registerModel = function (model) {

        model.changed.add(this.onChange, this);

        _models[model.id] = model;
        _dispatchers[model.id] = new signals.Signal();
        model.registerWithDispatcher(_dispatchers[model.id]);

    };

    this.build = function () {

        //console.log("ASSETS PANEL BUILD");
        this.update();

    };

    this.onChange = function () {
console.log("LEVELS CHANGED")
        this.update();

    };


    this.update = function () {

        console.log("ASSETS PANEL UPDATE");

        var html = '';

        var i, j;
        var ms = _models;
        console.log(_models)

        for (j = 0; j < ms.length; j++) {

            var model = ms[j];

            if (model instanceof SPLODER.Levels) {

                var levels = model.getLevelNums();
                var len = levels.length;
                var currentLevel = model.currentLevel;

                console.log(levels)

                //console.log("LEVELS currentLevel", levels.length, currentLevel)

                html += '<header>Levels</header><ul>';

                if (len) {

                    for (var i = 0; i < len; i++) {
                        html += '<a><li ' + (levels[i] == currentLevel ? 'class="current" ' : '') + 'data-id="assets-level" data-model="' + j + '" data-value="' + levels[i] + '">Level ' + (levels[i] + 1) + '</li></a>';
                    }

                } else {

                    html += '<a><li class="current" data-id="assets-level" data-model="' + j + '" data-value="0">Level 1</li></a>';


                }


                html += '</ul>';

            }

        }


        this.container.innerHTML = html;

        SPLODER.connectButtons(this, this.container, onButtonPress);

    };

    var onButtonPress = function (id, button) {

        if (button) {

            var modelId = parseInt(button.dataset.model);
            var itemId = parseInt(button.dataset.value);

            var d = _dispatchers[modelId];
console.log("dispatching value", itemId, "to model", modelId)
            if (d) d.dispatch([SPLODER.ACTION_SELECT_ITEM, itemId]);

        }

    }

};

SPLODER.AssetsPanel.TYPE_LEVEL = 1;
