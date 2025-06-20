/**
 * Created by ggaudrea on 7/24/15.
 */

SPLODER.GameLevels = function () {

    this.id = null;
    this.changed = null;

    var _levelData = null;
    var scope = this;

    this.library = null;
    this.model = null;
    this.envModel = null;

    var _currentLevelNum = 0;

    Object.defineProperty(this, "currentLevel", {
        get: function () {
            return _currentLevelNum;
        },
        set: function (val) {
            changeLevel(val);
        }
    });

    this.initWithModels = function (library, model, envModel) {

        this.id = SPLODER.Store._nextId;
        SPLODER.Store._nextId++;

        this.reset(true);

        this.library = library;
        this.model = model;
        this.envModel = envModel;

        this.changed = new signals.Signal();

        return this;

    };


    this.initWithModelsAndData = function (model, envModel, data) {

        this.initWithModels(model, envModel);
        unserialize(data);

        return this;

    };


    this.start = function () {
        _levelData[0] = this.model.items;
    }

    this.reset = function (quiet) {

        _levelData = [];

        if (!quiet) {
            this.changed.dispatch(SPLODER.ACTION_RESET);
        }

    };

    this.registerWithDispatcher = function (dispatcher) {

        if (dispatcher) {
            dispatcher.add(this.onAction, this);
        }

    };

    this.getLevelNums = function () {

        return _levelData.reduce(function (prev, curr, idx) {

            if (curr && curr instanceof Array) prev.push(idx);

            return prev;

        }, []);

    };

    this.getItemById = function (id) {

        var item = this.model.getItemById(id);
        if (item) return item;

        var i, j, items;

        for (j = 0; j < _levelData.length; j++) {

            items = _levelData[j];

            if (items) {

                i = items.length;

                while (i--) {

                    item = items[i];
                    if (item && item.id == id) return item;

                }

            }

        }

    };

    this.getAllItems = function () {

        var allItems = [];

        for (j = 0; j < _levelData.length; j++) {

            allItems = allItems.concat(_levelData[j]);

        }

        return allItems;

    }


    this.getLevelItems = function (levelNum) {

        levelNum = levelNum || 0;

        return _levelData[levelNum];

    }


    this.getItemLevelNumById = function (id) {

        var item = this.model.getItemById(id);
        if (item) return _currentLevelNum;

        var i, j, items;

        for (j = 0; j < _levelData.length; j++) {

            items = _levelData[j];

            if (items) {

                i = items.length;

                while (i--) {

                    item = items[i];
                    if (item && item.id == id) return j;

                }

            }

        }

        return _currentLevelNum;

    };

    this.createItemByTag = function (tagNum) {

        var currentLevelAffected = false;

        if (!this.library.tagCreated(tagNum)) {

            var items = scope.library.getItemsByTag(tagNum);

            console.log("CREATE ITEMS!", tagNum, items);

            if (items) {

                for (var i = 0; i < items.length; i++) {

                    var item = items[i];


                    if (item && !item.getAttrib(SPLODER.GameProps.PROPERTY_SPAWNABLE)) {
                        scope.library.markTagAsCreated(tagNum);
                    }

                    if (item && item.deactivated) {

                        item.deactivated = false;

                        if (item.levelNum == _currentLevelNum) {

                            console.log("POOP GOTTA TELL SOMEONE");
                            currentLevelAffected = true;
                            scope.model.changed.dispatch(SPLODER.ACTION_CREATE, item);

                        }

                    }

                }

            }

        }

        if (currentLevelAffected) {
           // scope.model.dispatcher.dispatch()
        }

    };


    this.redo = function (data) {

        unserialize(data, SPLODER.ACTION_REDO);
        this.changed.dispatch(SPLODER.ACTION_REDO);

    };

    this.populateLibraryItems = function (tags) {

        for (var i = 0; i < _levelData.length; i++) {

            var level = _levelData[i];

            if (level && level.length) {

                var j = level.length;

                while (j--) {

                    var item = level[j];

                    if (item) {

                        if (item.getAttrib(SPLODER.GameProps.PROPERTY_AUTOCREATE) === 0) {

                            item.deactivated = true;

                            var tagNums = tags.getTagsByItemId(item.id);

                            for (var k = 0; k < tagNums.length; k++) {

                                var tagNum = tagNums[k];

                                console.log("NOT AUTOCREATE", item.id, "TAGNUM", tagNum)

                                if (tagNum > 0) {
                                   scope.library.saveItemByTag(item, tagNum, item.levelNum);
                                }

                            }

                        }
                    }

                }

            }

        }

    }


    var unserialize = function (data) {

        var levels = data.split('_#_');

        _levelData = [];

        console.log("UNSERIALIZING LEVELS")

        for (var i = 0; i < levels.length - 1; i++) {

            if (levels[i] && levels[i].length) {

                var lv = _levelData[i] = scope.model.unserialize(levels[i], true);
                var j = lv.length;
                while (j--) {
                    var item = lv[j];
                    if (item) {
                        item.levelNum = i;
                    }
                }

            } else if (i < levels.length - 1) {

                _levelData[i] = null;

            } else {

                _levelData[i] = [];

            }

        }

        var metadata = SPLODER.parseFloatArray(levels[levels.length - 1].split(','));

        changeLevel(metadata[1]);

        console.log(_levelData)

    };

    var changeLevel = function (levelNum, suppressModelChangeDispatch) {

        if (_currentLevelNum != levelNum && !isNaN(levelNum) && levelNum >= 0) {

            console.warn("SWITCHING LEVEL FROM", _currentLevelNum, "NUM ITEMS:", scope.model.items.length);

            if (!_levelData[levelNum]) {
                if (levelNum == _levelData.length) _levelData[levelNum] = [];
                else return;
            }

            //if (!noSave) _levelData[_currentLevel] = scope.model.items;

            scope.model.selection = [];
            _levelData[_currentLevelNum] = scope.model.items;
            scope.model.items = _levelData[levelNum];
            console.warn("SWITCHING LEVEL TO", levelNum, ". NUM ITEMS IN LEVEL:", scope.model.items.length);

            _currentLevelNum = scope.envModel.currentLevel = levelNum;

            scope.changed.dispatch(SPLODER.ACTION_CONTEXT_CHANGE);
            //if (!suppressModelChangeDispatch) {
                scope.model.changed.dispatch(SPLODER.ACTION_CONTEXT_CHANGE);
            //}
            //setTimeout(function () {
                if (scope.model.player) {
                    scope.model.player.levelNum = levelNum;
                }
            //}, 500);

        }

    };


    this.onAction = function (action, valueA, valueB) {

        switch (action) {

            case SPLODER.ACTION_SELECT_ITEM:

                changeLevel(valueA);
                break;

            case SPLODER.ACTION_TELEPORT:

                var levelNum = this.getItemLevelNumById(valueA);
                console.log(valueA, _currentLevelNum, levelNum);
                if (levelNum != _currentLevelNum) changeLevel(levelNum, true);

                break;

        }

    }

};
