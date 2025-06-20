/**
 * Created by ggaudrea on 6/11/15.
 */

SPLODER.EVENT_RESTORED = 204;

SPLODER.ModelHistory = function () {

    this.restored = null;

    var _sceneAssets = null;
    var _models = null;

    var _undos = null;
    var _redos = null;
    var _undoModelIds = null;
    var _redoModelIds = null;

    var _readOnly = false;
    var _importing = false;

    var _projectId = '';

    var scope = this;

    Object.defineProperty(this, "projectId", {
        get: function () {
            return _projectId;
        },
        set: function (val) {
            console.log("SETTING PROJECT ID", val)
            if (_projectId != val) {
                _projectId = val;
                this.storeHistory();
            }
        }
    });

    var _clipboard = {
        data: "",
        modelId: 0
    };

    this.changed = new signals.Signal();

    Object.defineProperty(this, "clipboardModelId", {
        get: function () {
            return _clipboard.modelId;
        }
    });

    Object.defineProperty(this, "hasUndos", {
        get: function () {
            return _undos && _undos.length > 0;
        }
    });

    Object.defineProperty(this, "hasRedos", {
        get: function () {
            return _redos && _redos.length > 0;
        }
    });

    this.initWithSceneAssets = function (assets, readOnly) {

        this.restored = new signals.Signal();

        _sceneAssets = assets;

        _models = [];

        _readOnly = readOnly;

        this.reset(true);

        return this;

    };

    this.restoreFromStorage = function () {

        var data;

        if (localStorage) data = localStorage.getItem('com.sploder.3deditor.history');

        if (data) {

            if (data) {
                this.importHistory(data.split("_$#$_")[1], true);
                _projectId = data.split("_$#$_")[0];
                console.log("RESTORED", _projectId)
            }

        }

        var textureData;

        if (localStorage) textureData = localStorage.getItem('com.sploder.3deditor.textures');
console.log("--- restoring textures")
        if (textureData) {

            _sceneAssets.importProjectAssets({ textures: textureData.split('|') });

        }

        this.restore();

    }

    this.reset = function (quiet) {

        console.log("RESETTING HISTORY");

        _undos = [];
        _undoModelIds = [];
        _redos = [];
        _redoModelIds = [];
        _projectId = '';

        if (!quiet) {
            for (modelId in _models) {
                var model = _models[modelId];
                if (model) {
                    model.reset();
                    this.changed.dispatch(modelId);
                }
            }
        }

        _sceneAssets.resetTextures();

        this.changed.dispatch(SPLODER.ACTION_RESET);

    };

    this.registerModel = function (model) {

        if (model && model.bookmarked) model.bookmarked.add(this.handleBookmark, this);
        _models[model.id] = model;

    };

    this.getModelById = function (modelId) {
        return _models[modelId];
    };

    this.copyToClipboard = function () {

        if (_readOnly) return;

        var i = _models.length;
        var model;

        while (i--) {

            model = _models[i];

            if (model) {

                if ("hasSelection" in model && model.hasSelection()) {

                    _clipboard = model.copySelectionAsClipboard();
                    this.changed.dispatch(_clipboard.modelId);

                    return true;

                }

            }

        }

        return false;

    };


    this.pasteFromClipboard = function (viewBounds) {

        if (_readOnly) return;

        if (_clipboard.modelId && _clipboard.data) {

            var model = this.getModelById(_clipboard.modelId);

            if (model) {
                var items = model.pasteSelectionFromClipboard(_clipboard);

                if (items && viewBounds) {

                    var centerX = _clipboard.bounds.x + _clipboard.bounds.width * 0.5;
                    var centerY = _clipboard.bounds.y + _clipboard.bounds.height * 0.5;

                    var deltaX = Math.floor(viewBounds.x - centerX);
                    var deltaY = Math.floor(viewBounds.y - centerY);

                    items.forEach(function (item) {
                        item.x += deltaX;
                        item.y += deltaY;
                    });

                }

                return true;
            }

        }

        return false;
    };

    this.handleBookmark = function (data) {

        this.saveUndo(data);

    };

    this.storeHistory = function () {

        if (_readOnly) return;

        if (localStorage) {
            localStorage.setItem('com.sploder.3deditor.history', _projectId + "_$#$_" + this.exportHistory());
        }

    };

    this.clearStoredHistory = function () {

        if (_readOnly) return;

        localStorage.removeItem('com.sploder.3deditor.history');
        localStorage.removeItem('com.sploder.3deditor.textures');

    }

    this.storeTextures = function () {

        if (_readOnly) return;
console.log("storing textures!")
        if (localStorage) {
            localStorage.setItem('com.sploder.3deditor.textures', _sceneAssets.getAllTextureData().join('|'));
        }

    };

    this.saveUndo = function (modelId, noStore) {

        if (_readOnly || this.isLoading) return;

        var model = _models[modelId];

        if (model) {

            var data = model.serialize();

            if (_undos.length && _undos[0] == data) {
                return;
            }

            _undos.unshift(data);
            _undoModelIds.unshift(modelId);

            if (_undos.length > 24) {
                var lastModelId = _undoModelIds.lastIndexOf(modelId);
                if (lastModelId > 0) {
                    _undos.splice(lastModelId, 1);
                    _undoModelIds.splice(lastModelId, 1);
                }
            }

            //console.log(_undoModelIds);

            _redos = [];
            _redoModelIds = [];

            this.changed.dispatch(modelId);
            if (!noStore) this.storeHistory();

        }

    };

    this.storeProject = function () {

        if (_readOnly) return;

        _undos = [];
        _undoModelIds = [];
        _redos = [];
        _redoModelIds = [];

        for (var i = 0; i < _models.length; i++) {

            var model = _models[i];

            if (model) {
                console.log("storing model", i);
                var data = model.serialize();

                _undos.unshift(data);
                _undoModelIds.unshift(i);

            }

        }

        this.storeHistory();

        console.log("STORED PROJECT");
    };


    this.restoreUndo = function () {

        if (_readOnly) return;

        if (_undos.length && _undoModelIds.length) {

            var modelId = _undoModelIds[0];
            var model = _models[modelId];
            var data;

            if (model) {

                var currentData = model.serialize();

                if (_undos[0] == currentData) {
                    _undos.shift();
                    _undoModelIds.shift();
                }

                if (_undos.length && _undoModelIds.length) {

                    _redos.unshift(currentData);
                    _redoModelIds.unshift(modelId);

                    data = _undos.shift();
                    modelId = _undoModelIds.shift();
                    model = _models[modelId];

                    if (model) {
                        model.restoreUndo(data);
                        this.changed.dispatch(modelId);
                    }

                }

                this.storeHistory();

            }

        }

    };


    this.redo = function () {

        if (_readOnly) return;

        if (_redos.length) {

            var data = _redos.shift();
            var modelId = _redoModelIds.shift();

            var model = _models[modelId];

            if (model) {

                var currentData = model.serialize();
                _undos.unshift(currentData);
                _undoModelIds.unshift(modelId);

                model.redo(data);

                this.changed.dispatch(modelId);
                this.storeHistory();

            }

        }

    };

    this.restoreModelFromString = function (data, modelId) {

        var model = _models[modelId];
        if (model) model.redo(data);

    };

    this.exportProject = function () {

        var data = '';
        for (var i = 0; i < _models.length; i++) {

            if (_models[i]) {

                data += _models[i].serialize();
                console.log("Exporting model", _models[i], _models[i].serialize());
            }

            if (i != _models.length - 1) data += "^^^";

        }

        data = data.split('NaN,').join(',');

        return data;

    };

    this.importProject = function (project, projectId) {

        _importing = true;

        _projectId = projectId || '';

        var modelData = project.data.split("^^^");

        for (var i = 0; i < _models.length; i++) {

            if (_models[i] && modelData[i]) {
                try {
                    _models[i].unserialize(modelData[i]);
                    console.log("Importing model", _models[i], _models[i].serialize());
                } catch (err) {
                    console.log(_models[i], "unable to unserialize", err);
                }
            }

        }

        //console.log(project);

        this.storeProject();

        _sceneAssets.importProjectAssets(project);
        
        setTimeout(function () {
            scope.storeTextures();
        }, 100);

        _importing = false;

        this.changed.dispatch(SPLODER.ACTION_PROJECT_LOAD);

    };

    this.exportHistory = function () {

        return (_undos.join("###") + "```" +
            _undoModelIds.join("###") + "```" +
            _redos.join("###") + "```" +
            _redoModelIds.join("###")).split('NaN,').join(',');

    };

    this.importHistory = function (str, noStore) {

        _importing = true;

        this.reset(true)

        if (!str) {
            this.reset();
            return;
        }

        var data = str.split("```");

        _undos = data[0].split("###");
        _undoModelIds = data[1].split("###");
        SPLODER.parseFloatArray(_undoModelIds);
        _redos = data[2].split("###");
        _redoModelIds = data[3].split("###");
        SPLODER.parseFloatArray(_redoModelIds);

        if (!noStore) this.storeHistory();

        _importing = false;

        this.changed.dispatch(SPLODER.ACTION_PROJECT_LOAD);

    };

    this.restore = function () {

        var restoredModelIds = [];

        for (var i = 0; i < _undos.length; i++) {

            var modelId = _undoModelIds[i];

            if (restoredModelIds.indexOf(modelId) == -1) {

                restoredModelIds.push(modelId);
                this.restoreModelFromString(_undos[i], _undoModelIds[i]);

            }


        }

        this.restored.dispatch(SPLODER.EVENT_RESTORED);

    }

};
