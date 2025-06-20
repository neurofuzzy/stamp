/**
 * Created by ggaudrea on 7/24/15.
 */

SPLODER.Levels = function () {

    this.id = null;
    this.changed = null;
    this.bookmarked = null;

    var _metadata = null;
    var _levelData = null;
    var scope = this;

    this.model = null;
    this.envModel = null;


    Object.defineProperty(this, "currentLevel", {
        get: function () {
            return getModelLevel();
        }
    });

    this.initWithModels = function (model, envModel) {

        this.id = SPLODER.Store._nextId;
        SPLODER.Store._nextId++;

        this.reset(true);

        this.model = model;
        this.envModel = envModel;

        this.changed = new signals.Signal();
        this.bookmarked = new signals.Signal();

        this.model.changed.add(this.onModelChanged, this);

        return this;

    };

    this.initWithModelsAndData = function (model, envModel, data) {

        this.initWithModels(model, envModel);
        this.unserialize(data);

        return this;

    };

    this.initMetadata = function () {

        _metadata = { maxItemId: 1, prevLevel: 0, currentLevel: 0, nextLevel: 1 };

    }

    this.reset = function (quiet) {

        _levelData = [];
        this.initMetadata();
        if (this.model) _levelData[getModelLevel()] = this.model.serialize();

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

        var levelNums = [];

        for (var i = 0; i < _levelData.length; i++) {
            if (_levelData[i] != null) levelNums.push(i);
        }

        return levelNums;

    };

    this.saveCurrentLevel = function () {

        saveCurrentLevel();

    }


    this.saveUndo = function () {

        this.bookmarked.dispatch(this.id);

    };

    this.restoreUndo = function (data) {

        this.unserialize(data, SPLODER.ACTION_UNDO);
        this.changed.dispatch(SPLODER.ACTION_UNDO);

    };

    this.redo = function (data) {

        this.unserialize(data, SPLODER.ACTION_REDO);
        this.changed.dispatch(SPLODER.ACTION_REDO);

    };

    this.addLibraryItemsByTag = function (tagNum, levelNum) {



    }

    this.serialize = function () {

        if (!_levelData) _levelData = [];

        var smeta = null;

        try {
            if (_metadata) {
                smeta = window.btoa(JSON.stringify(_metadata));
            }
        } catch (err) {
            smeta = "{}";
            console.error(err);
        }

        console.log("SERIALIZING LEVELS")

        return _levelData.join('_#_') + "_#_" + smeta;

    };

    this.unserialize = function (data, action) {

        this.reset();

        if (data.length) {
            _levelData = data.split('_#_');
        } else {
            _levelData = [];
        }

        console.log(_levelData.length);

        var smeta = _levelData.pop();

        if (smeta && smeta.length) {

            try {
                _metadata = JSON.parse(window.atob(smeta));
            } catch (err) {
                console.error("Levels unserialize error:", smeta, err);
                this.initMetadata();
            }

        } else {

            this.initMetadata();

        }

        scope.model.nextItemId = Math.max(scope.model.nextItemId, _metadata.maxItemId);

        console.log("METADATA", _metadata);

        this.changed.dispatch(SPLODER.ACTION_CHANGE);

    };

    var getModelLevel = function () {
        if (!scope.model || !_metadata) {
            return -1;
        }
        return scope.model.metadata.level;
    }

    var changeLevel = function (levelNum, noSave) {

        console.log("CHANGING LEVEL from ", getModelLevel(), "to", levelNum, noSave)

        if (getModelLevel() != levelNum && !isNaN(levelNum) && levelNum >= 0) {

            if (!_levelData[levelNum]) return;

            if (!noSave) {
                saveCurrentLevel();
            }

            _metadata.prevLevel = getModelLevel();

            restoreLevel(levelNum);

            _metadata.currentLevel = scope.envModel.currentLevel = getModelLevel();

            if (!noSave) scope.saveUndo();

            scope.changed.dispatch(SPLODER.ACTION_CONTEXT_CHANGE);

        }

    };

    var saveCurrentLevel = function () {

        if (getModelLevel() >= 0) {
            _levelData[getModelLevel()] = scope.model.serialize();
        }

    }

    var restoreLevel = function (levelNum) {

        if (_levelData && _levelData[levelNum]) {

            scope.model.unserialize(_levelData[levelNum]);

            if (isNaN(getModelLevel())) {
                scope.model.metadata.level = levelNum;
            }

        }

    }

    var createLevel = function (levelData) {

        saveCurrentLevel();

        if (!levelData) {
            scope.model.reset();
        } else {
            scope.model.unserialize(levelData);
        }

        scope.model.metadata.level = _metadata.nextLevel;
        _levelData[getModelLevel()] = scope.model.serialize();

        changeLevel(_metadata.nextLevel, true);

        _metadata.nextLevel++;

        scope.saveUndo();

        scope.changed.dispatch(SPLODER.ACTION_CHANGE);

    };

    var duplicateLevel = function () {

        if (_levelData[getModelLevel()]) {

            saveCurrentLevel();
            var newLevelData = _levelData[getModelLevel()];
            createLevel(newLevelData);

        }

    };

    var deleteLevel = function () {
        console.log("DELETING",  _levelData[getModelLevel()]);

        if (getModelLevel() > 0) {

            var levelToDelete = getModelLevel();

            changeLevel(0);

            _levelData[levelToDelete] = null;

            scope.saveUndo();

            scope.changed.dispatch(SPLODER.ACTION_CHANGE);
        }


    };

    this.onModelChanged = function (data) {

        var action = data;

        if (action == SPLODER.ACTION_CHANGE_COMPLETE) {

            _metadata.maxItemId = this.model.nextItemId;
            console.log("MAX ITEM ID:", _metadata.maxItemId);

        }

    }

    this.onAction = function (data) {

        var action = data[0];
        var valueA = data[1];

        console.log("LEVELS RECEIVED COMMAND", action, valueA)

        switch (action) {

            case SPLODER.ACTION_SELECT_ITEM:

                changeLevel(valueA);
                break;

            case SPLODER.ACTION_SELECTION_DUPLICATE:

                duplicateLevel();
                break;

            case SPLODER.ACTION_SELECTION_DELETE:

                deleteLevel();
                break;

            case SPLODER.ACTION_CREATE:

                createLevel();
                break;

        }

    }

};
