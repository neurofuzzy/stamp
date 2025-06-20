SPLODER.Editor = function () {

    SPLODER.Broadcaster.call(this);

    this.sceneAssets = null;
    this.projectService = null;

    this.levels = null;
    this.levelsDispatcher = null;

    this.model = null;
    this.dispatcher = null;
    this.width = 0;
    this.height = 0;

    this.container = null;

    this.stage = null;
    this.renderer = null;

    this.stage2 = null;
    this.renderer2 = null;

    this.stage3d = null;
    this.renderer3d = null;
    this.pixelRatio = null;
    this.stats = null;
    this.clock = null;

    this.projectMenu = null;

    this.drawingArea = null;
    this.pixelEditor = null;
    this.previewArea = null;

    this.texturesArea = null;
    this.envDispatcher = null;
    this.envModel = null;

    this.tagArea = null;
    this.tagModel = null;
    this.tagDispatcher = null;

    this.statesArea = null;

    this.flowArea = null;
    this.flowModel = null;
    this.flowDispatcher = null;

    this.itemPropsArea = null;
    this.modal = null;

    this.minimizeTimeout = null;
    this.bottomPanelMinimized = true;
    this.previewReduced = false;
    this.pixelEditorShowing = false;

    var scope = this;
    var _bottomPanelTab;

    Object.defineProperty(this, "bottomPanelTab", {
        get: function () {
            return _bottomPanelTab;
        },
        set: function (val) {
            _bottomPanelTab = val;
            SPLODER.clearClassListById('editor_container');
            SPLODER.setClass('editor_container', val || "none");
            scope.onResize();
        }
    });

    this.history = null;

    this.paused = false;
    this.destroyed = false;


};


SPLODER.Editor.prototype.initWithSize = function (tilesize, pixelRatio) {

    this.tilesize = tilesize;
    this.pixelRatio = pixelRatio || 1.0;

    var scope = this;

    window.onblur = function (e) {
        scope.paused = true;
    }

    window.onfocus = function (e) {
        scope.paused = false;
    }

    this.sceneAssets = new SPLODER.SceneAssets().init(tilesize, pixelRatio);
    this.sceneAssets.prepared.addOnce(this.onAssetsPrepared, this);

    var endpoint = window.location.protocol + '//' + window.location.hostname + ':8080';
    var collection = 'item';

    this.projectService = new SPLODER.ProjectService().init(endpoint, collection, this.sceneAssets);

    this.projectService.screenshotService = function (callback) {
        return scope.getScreenshot(callback);
    }

    this.model = new SPLODER.ItemStore().init();
    this.envModel = new SPLODER.EnvModel().init();
    this.levels = new SPLODER.Levels().initWithModels(this.model, this.envModel);

    var width = this.width = window.innerWidth;
    var height = this.height = window.innerHeight;
    var panelWidth = Math.floor(width * 0.5);
    var panelHeight = Math.floor(height) - 96;

    if (height >= 768 && this.bottomPanelTab) {
        panelHeight -= 270;
    }

    this.dispatcher = new signals.Signal();
    this.model.registerWithDispatcher(this.dispatcher);
    this.dispatcher.add(this.onModelChanged, this);
    this.model.changed.add(this.onModelChanged, this);

    this.levelsDispatcher = new signals.Signal();
    this.levels.registerWithDispatcher(this.levelsDispatcher);
    this.levels.changed.add(this.onLevelsChanged, this);

    this.envDispatcher = new signals.Signal();
    this.envModel.registerWithDispatcher(this.envDispatcher);
    this.envModel.changed.add(this.onEnvModelChanged, this);

    this.drawingArea = new SPLODER.DrawingArea().initWithModelAndSize(this.model, panelWidth, panelHeight, tilesize);
    this.drawingArea.changed.add(this.onDrawingChanged, this);

    // TEMP
    //this.showPixelEditor();

    this.previewArea = new SPLODER.PreviewArea().initWithModelsAndSize(this.model, this.envModel, this.sceneAssets, panelWidth, panelHeight, 32.0, this.pixelRatio);
    this.previewArea.selected.add(this.onGameViewSelect, this);
    this.previewArea.changed.add(this.onPreviewChanged, this);

    this.texturesArea = new SPLODER.TexturesArea().initWithModelsAndAssets(this.model, this.envModel, this.sceneAssets);
    this.texturesArea.changed.add(this.onTexturesAreaChanged, this);
    this.texturesArea.registerWithDispatcher(this.dispatcher);

    this.tagModel = new SPLODER.TagStore().init();

    this.tagDispatcher = new signals.Signal();
    this.tagModel.registerWithDispatcher(this.tagDispatcher);
    this.tagModel.changed.add(this.onTagModelChanged, this);

    this.tagArea = new SPLODER.TagArea().initWithModels(this.model, this.tagModel);
    this.tagArea.changed.add(this.onTagAreaChanged, this);

    this.statesArea = new SPLODER.StatesArea().initWithModel(this.model);
    this.statesArea.changed.add(this.onStatesAreaChanged, this);

    this.flowModel = new SPLODER.FlowStore().init();

    this.flowDispatcher = new signals.Signal();
    this.flowModel.registerWithDispatcher(this.flowDispatcher);
    this.flowDispatcher.add(this.onFlowModelChanged, this);
    this.flowModel.changed.add(this.onFlowModelChanged, this);

    this.flowArea = new SPLODER.FlowArea().initWithModelAndSize(this.flowModel, Math.floor(width), Math.floor(height * 0.5), 12.0);
    this.flowArea.changed.add(this.onFlowDiagramChanged, this);

    this.itemPropsArea = new SPLODER.ItemPropsArea().initWithModels(this.model, this.tagModel);
    this.itemPropsArea.changed.add(this.onItemPropsAreaChanged, this);

    this.modal = new SPLODER.Modal().init();

    this.history = new SPLODER.ModelHistory().initWithSceneAssets(this.sceneAssets);
    this.history.registerModel(this.model);
    this.history.registerModel(this.levels);
    this.history.registerModel(this.flowModel);
    this.history.registerModel(this.tagModel);
    this.history.registerModel(this.envModel);
    this.history.changed.add(this.onHistoryChanged, this);

    this.projectMenu = new SPLODER.ProjectMenu().initWithHistoryAndService(this.history, this.projectService);
    this.projectMenu.setModal(this.modal);

    window.addEventListener('mouseup', SPLODER.bind( this, this.onMouseUp ), false );
    window.addEventListener('keyup', SPLODER.bind( this, this.onMouseUp ), false );
    window.addEventListener('touchend', SPLODER.bind(this, this.onMouseUp ), false );

};


SPLODER.Editor.prototype.build = function (elementId) {

    this.container = document.getElementById(elementId);

    var width = this.width = window.innerWidth;
    var height = this.height = window.innerHeight;
    var panelWidth = Math.floor(width * 0.5);
    var panelHeight = Math.floor(height) - 96;

    if (height >= 768 && this.bottomPanelTab) {
        panelHeight -= 270;
    }

    document.addEventListener("dragenter", function(e) {
        e.preventDefault();
    });

    document.addEventListener("dragover", function(e) {
        e.preventDefault();
    });

    document.addEventListener("drop", function(e) {
        e.preventDefault();
    });

    // add PIXI to DOM

    if (this.container)
    {
        var d = document.getElementById('drawingarea');

        this.stage = new PIXI.Container();

        var r;

        if (false && SPLODER.util.isIE())
        {
            r = this.renderer = new PIXI.CanvasRenderer(panelWidth, panelHeight);

            if (r.view && "getContext" in r.view)
            {
                var ctx = r.view.getContext("2d");
                if (ctx &&  "msImageSmoothingEnabled" in ctx)
                {
                    ctx.msImageSmoothingEnabled = false;
                }
            }
        } else {

            var rendererOptions = {
                antialias:true,
                transparent:false,
                resolution:1
            };

            r = this.renderer = PIXI.autoDetectRenderer(panelWidth, panelHeight, rendererOptions);
            //r = this.renderer = new PIXI.CanvasRenderer(this.width, this.height, rendererOptions);
        }

        r.backgroundColor = 0x334455;

        d.appendChild(r.view);

        //r.view.style.position = "relative";

        //r.view.onselectstart = function () { return false; };


        // set up mouse wheel listener

        var scope = this;

        var mw = function (e) {

            e = window.event || e; // old IE support
            var deltaX = null;
            var deltaY = null;

            if ('wheelDeltaX' in e) {
                deltaX = e.wheelDeltaX * 0.25;
                deltaY = e.wheelDeltaY * 0.25;
            } else if ('deltaX' in e) {
                deltaX = 0 - e.deltaX * 0.25;
                deltaY = 0 - e.deltaY * 0.25;
            }

            scope.scroll(deltaX, deltaY, e);

        };

        var v = this.container;

        if ('addEventListener' in v) {
            v.addEventListener('mousewheel', mw, false);
            v.addEventListener('wheel', mw, false);
        } else {
            v.attachEvent('onmousewheel', mw);
        }

        // build editor components

        this.drawingArea.build(r);
        this.stage.addChild(this.drawingArea.clip);

        //this.selection.build();
        //this.drawingArea.overlay.addChild(this.selection.clip);

        // 3d preview

        d = document.getElementById('previewarea');

        this.clock = new THREE.Clock();

        var renderer = this.renderer3d = new THREE.WebGLRenderer({
            premultipliedAlpha: false,
            antialias: false,
            alpha: false,
            overdraw: 1.0
        });

        d.style.cursor = "cell";

        renderer.premultipliedAlpha = true;
        renderer.sortObjects = false;

        renderer.setPixelRatio(this.pixelRatio);//window.devicePixelRatio );
        renderer.setSize(panelWidth, panelHeight);//window.innerWidth * 0.5, window.innerHeight );
        renderer.setClearColor( 0x000000, 1 );


        this.stage3d = renderer.domElement;
        d.appendChild(this.stage3d);
        this.previewArea.loadComplete.addOnce(this.onLoadComplete, this);
        this.previewArea.build(this.stage3d, renderer);

        this.drawingArea.camera.initWithModelAndPreviewCamera(this.model, this.previewArea.camera, 0.5);


        if ('addEventListener' in v) {
            d.addEventListener('mousewheel', mw, false);
            d.addEventListener('wheel', mw, false);
        } else {
            d.attachEvent('onmousewheel', mw);
        }


        var keyFn = function (e) {
            scope.drawingArea.shiftKey =
                scope.previewArea.shiftKey =
                    scope.previewArea.camControls.shiftKey =
                        scope.flowArea.shiftKey = e.shiftKey;
            if (e.shiftKey) {
                scope.previewArea.camera.flyMode = true;
            }
        };

        var winFn = function () {
            scope.drawingArea.shiftKey =
                scope.previewArea.shiftKey =
                        scope.previewArea.camera.flyMode =
                            scope.flowArea.shiftKey = false;

            if (scope.previewArea.camControls) scope.previewArea.camControls.shiftKey = false
        };

        Mousetrap.bind('shift', keyFn, 'keydown');
        Mousetrap.bind('shift', keyFn, 'keyup');
        window.addEventListener('blur', winFn);


        // flow area

        d = document.getElementById('flowarea');

        this.stage2 = new PIXI.Container();

        r = this.renderer2 = new PIXI.CanvasRenderer(Math.floor(this.width), this.height * 0.35, { stage: this.stage2 });
        r.backgroundColor = 0x445566;

        if (r.view && "getContext" in r.view)
        {
            var ctx = r.view.getContext("2d");
            if (ctx &&  "msImageSmoothingEnabled" in ctx)
            {
                ctx.msImageSmoothingEnabled = false;
            }
        }


        d.appendChild(r.view);

        // textures area

        this.texturesArea.build();

        // tag area

        this.tagArea.build();

        // states area

        this.statesArea.build();

        // flow area

        this.flowArea.build(r);
        this.stage2.addChild(this.flowArea.clip);

        // gameprops area

        this.itemPropsArea.build();

        /*
        var stats = this.stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms

        // align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '50%';
        stats.domElement.style.top = '49px';

        document.body.appendChild( stats.domElement );
        */


        SPLODER.connectButtons(this, null, this.onButtonPress, this.onFormChange, this.onButtonRelease);

        this.onResize(true);

        this.sceneAssets.load();

    }

};


SPLODER.Editor.prototype.onAssetsPrepared = function () {

    this.history.restoreFromStorage();

};


SPLODER.Editor.prototype.getScreenshot = function (callback) {

    this.previewArea.render(this.renderer3d);
    var fullScreenshot = this.stage3d.toDataURL();
    var img = document.createElement('img');
    img.src = fullScreenshot;

    img.onload = function () {

        var canvas = document.createElement('canvas');
        canvas.height = canvas.width = 200;
        var ctx = canvas.getContext('2d');
        var aspect = img.width / img.height;
        var dWidth, dHeight;

        if (aspect > 1) {
            dWidth = Math.ceil(200 * aspect);
            dHeight = 200;
        } else {
            dWidth = 200;
            dHeight = Math.ceil(200 / aspect);
        }

        ctx.drawImage(img, Math.ceil(200 - dWidth) * 0.5, Math.ceil(200 - dHeight) * 0.5, dWidth, dHeight);

        if (callback) {
            callback(canvas.toDataURL());
        }

    }

}



SPLODER.Editor.prototype.onResize = function (e) {

    console.log("RESIZE CALLED", window.orientation, e);

    var r = this.previewReduced;

    var width = this.width = window.innerWidth;
    var height = this.height = window.innerHeight;
    var panelWidth = Math.floor(width * 0.5);
    var panelHeight = Math.floor(height) - 96;

    if (height >= 768 && this.bottomPanelTab) {
        panelHeight -= 270;
    }

    var sw = Math.min(520, Math.floor(Math.max(width, height, 800) * 0.333));
    var sh = Math.floor(sw * 0.667);

    if (r) this.renderer3d.setPixelRatio(1);
    else this.renderer3d.setPixelRatio(this.pixelRatio);

    this.renderer.resize(r ? width : panelWidth, panelHeight);
    this.renderer2.resize(width, this.flowArea.height);
    this.renderer3d.setSize(r ? sw : panelWidth, r ? sh : panelHeight);
    this.drawingArea.setSize(r ? width : panelWidth, panelHeight);
    this.flowArea.setSize(width, this.flowArea.height);
    this.previewArea.setSize(r ? sw : panelWidth, r ? sh : panelHeight);

    if (this.pixelEditor) {
        this.pixelEditor.editor.onResize();
    }

    var scope = this;

    if (e) {
        setTimeout(function () {
            scope.onResize();
        }, 1000);
    }

};


SPLODER.Editor.prototype.maximizePanel = function () {

    clearTimeout(this.minimizeTimeout);
    SPLODER.setClass('bottompanel', 'closed', true);
    SPLODER.setClass('bottompanel', 'maximized');
    SPLODER.disableButtons('bottompanel-expand');
    SPLODER.enableButtons('bottompanel-close');
    this.renderer2.resize(this.width, this.height - 49);
    this.flowArea.setSize(this.width, this.height - 49);

    this.bottomPanelMinimized = false;
};


SPLODER.Editor.prototype.minimizePanel = function () {

    document.getElementById('extensions_none').checked = true;
    SPLODER.clearClassListById('extensions_content');
    SPLODER.clearClassListById('editor_container');
    SPLODER.setClass('bottompanel', 'maximized', true);
    SPLODER.setClass('bottompanel', 'closed');
    SPLODER.disableButtons('bottompanel-expand', 'bottompanel-close');

    var scope = this;
    this.minimizeTimeout = setTimeout(function () {
        scope.renderer2.resize(this.width, 270);
        scope.flowArea.setSize(this.width, 270);
    }, 500);

    this.bottomPanelTab = null;
    this.bottomPanelMinimized = true;
    this.updateButtonStates();

};


SPLODER.Editor.prototype.openPanel = function () {

    clearTimeout(this.minimizeTimeout);
    SPLODER.setClass('bottompanel', 'maximized', true);
    SPLODER.setClass('bottompanel', 'closed', true);
    SPLODER.enableButtons('bottompanel-expand', 'bottompanel-close');
    this.renderer2.resize(this.width, 270);
    this.flowArea.setSize(this.width, 270);

    this.bottomPanelMinimized = false;
    this.updateHistoryButtonStates();

};


SPLODER.Editor.prototype.start = function ()
{
    if (!this.started)
    {
        // start anim loop

        var scope = this;

        var anim = function ()
        {
            if (!scope.destroyed)
            {

                requestAnimationFrame(anim);

                if (scope.paused) return;

                if (scope.stats) scope.stats.begin();

                if (scope.drawingArea)
                {
                    scope.drawingArea.dragger.onframe();
                    scope.drawingArea.tapper.onframe();

                    scope.drawingArea.update();
                }

                if (scope.flowArea)
                {
                    scope.flowArea.dragger.onframe();
                    scope.flowArea.tapper.onframe();

                    if (scope.flowArea.isDirty) {
                        scope.flowArea.update();
                    }

                }


                //if (scope.selection && scope.selection.isDirty) scope.selection.drawSelectedTiles();

                try {
                    scope.renderer.render(scope.stage);
                    scope.renderer2.render(scope.stage2);
                } catch (err) {

                }

                var p = scope.previewArea;

                if (p && p.ready) {

                   // if (scope.bottomPanelMinimized || scope.bottomPanelTab == 'states' || p.isDirty) {
                        p.update(scope.clock.getDelta());
                        p.render(scope.renderer3d);
                 //   }

                    if (scope.stats) scope.stats.end();

                }
            }
        };

        //this.connect();

        this.bindKeys();
        this.updateButtonStates();

        window.addEventListener('resize', SPLODER.bind(this, this.onResize), false);
        window.addEventListener('orientationchange', SPLODER.bind(this, this.onResize), false);
        window.scrollTo(0, 1);

        this.started = true;

        requestAnimationFrame(anim);
    }
};


SPLODER.Editor.prototype.scroll = function (deltaX, deltaY, event) {

    if (event && event.target && event.target.parentNode) {

        var id = event.target.parentNode.id;

        switch (id) {

            case 'drawingarea':

                this.drawingArea.dragger.scroll(deltaX, deltaY);
                event.preventDefault();
                break;

            case 'previewarea':

                this.previewArea.scroll(deltaX, deltaY);
                event.preventDefault();
                break;

            case 'flowarea':

                this.flowArea.dragger.scroll(deltaX, deltaY);
                event.preventDefault();
                break;

        }

    }

};



/* Model/View event handlers */

SPLODER.Editor.prototype.resetAll = function () {

    this.selectNone();
    this.hidePixelEditor();

    this.drawingArea.setDirty();
    this.previewArea.setDirty();
    this.previewArea.resetCamera();

    if (this.previewArea.sceneModel) this.previewArea.sceneModel.setDirty();

    this._resetLevelsMenu();

    this.drawingArea.showPlayerStart = (this.levels.currentLevel == 0);

};


SPLODER.Editor.prototype.onDrawingChanged = function (data) {

    var elem = document.getElementById('drawingarea');

    if (data && data[0] < 0 && elem) {

        var toolMode = data[1];

        switch (toolMode) {

            case SPLODER.DrawingArea.TOOLMODE_CREATE:

                elem.style.cursor = "pointer";
                break;

            case SPLODER.DrawingArea.TOOLMODE_SELECT:

                elem.style.cursor = "crosshair";
                break;

            case SPLODER.DrawingArea.TOOLMODE_FINGER:

                elem.style.cursor = "move";
                break;


        }

    } else {

        this.dispatcher.dispatch(data);

    }

};


SPLODER.Editor.prototype.onTexturesAreaChanged = function (data) {

    if (data && data[1] == SPLODER.EnvModel.ENVIRONMENT) {

        this.envDispatcher.dispatch(data);

    } else {

        if (data[0] == SPLODER.ACTION_EDIT_SPRITE) {

            this.hidePixelEditor();

            var spriteIdx = data[2];
            var spriteType = data[3];
            var spriteProp = data[4];
            var assetType = data[5];
            var showGhost = data[6];
            var ghostSpriteIdx = data[7];
            var imageData = this.texturesArea.assets.getSpriteImageData(assetType, spriteIdx);

            if (imageData) {

                var bmodel = SPLODER2D.createPixelEditorModel(imageData, 16);
                var gmodel = null;

                if (showGhost && !isNaN(ghostSpriteIdx) && ghostSpriteIdx >= 0) {
                    var ghostImageData = this.texturesArea.assets.getSpriteImageData(assetType, ghostSpriteIdx);
                    gmodel = SPLODER2D.createPixelEditorModel(ghostImageData, 16);
                }

                var bwidth = bmodel.bounds ? bmodel.bounds.width : 32;

                this.showPixelEditor(bmodel, gmodel, 16, bwidth < 24 ? 1.0 : 0.5);

                var p = this.pixelEditor;

                p.spriteIdx = spriteIdx;
                p.spriteType = spriteType;
                p.spriteProp = spriteProp;
                p.assetType = assetType;

            }

        } else if (data[0] == SPLODER.ACTION_IMAGE_DROP) {

            console.log("STORING TEXTURES AFTER FILE DROP")
            this.history.storeTextures();

        } else {

            this.dispatcher.dispatch(data);

        }

    }

};

SPLODER.Editor.prototype.onPixelEditorChange = function (data) {

    var p = this.pixelEditor;
    this.texturesArea.updateSpritesheet(p.model.toImageData(), p.assetType, p.spriteIdx, p.spriteType, p.spriteProp)

}


SPLODER.Editor.prototype.onTagAreaChanged = function (data) {

    this.tagDispatcher.dispatch(data);

};


SPLODER.Editor.prototype.onStatesAreaChanged = function (data) {

    this.dispatcher.dispatch(data);

};


SPLODER.Editor.prototype.onFlowDiagramChanged = function (data) {

    var elem = document.getElementById('flowarea');

    if (data && data[0] < 0 && elem) {

        var toolMode = data[1];

        switch (toolMode) {

            case SPLODER.FlowArea.TOOLMODE_CREATE:

                SPLODER.setClass('flowselect', 'selected', true);
                elem.style.cursor = "pointer";
                break;

            case SPLODER.FlowArea.TOOLMODE_SELECT:

                SPLODER.setClass('flowselect', 'selected');
                elem.style.cursor = "crosshair";
                break;

        }

    } else {

        this.flowDispatcher.dispatch(data);

    }

};

SPLODER.Editor.prototype.onItemPropsAreaChanged = function (data) {

    var action = data[0];

    switch (action) {

        case SPLODER.ACTION_TWEAK_START:
        case SPLODER.ACTION_TWEAK:
        case SPLODER.ACTION_TWEAK_COMPLETE:

            this.drawingArea.onTweak(data);
            break;

    }

    this.dispatcher.dispatch(data);

}


SPLODER.Editor.prototype.onLoadComplete = function (e) {

    console.log("ASSETS LOAD COMPLETE")
    this.dispatcher.dispatch("loadComplete");

};


SPLODER.Editor.prototype.onModelChanged = function (data) {

    SPLODER.hide('#submenus ul');

    var mslen = this.model.selection.length;
    var mstype = this.model.selectionType();

    if (mslen == 1) {

        this.flowModel.flowId = this.tagArea.itemId = this.statesArea.itemId = this.texturesArea.itemId = this.itemPropsArea.itemId = this.model.selection[0].id;
        this.flowModel.flowScope = SPLODER.FlowNode.rectTypeToScope(mstype);

    } else {

        this.flowModel.flowId = this.tagArea.itemId = this.statesArea.itemId = this.itemPropsArea.itemId = 0;
        this.flowModel.flowScope = 0;

        if (mstype < 0 || mslen == 0) this.texturesArea.itemId = 0;
        else this.texturesArea.itemId = this.model.selection[0].id;

    }


    if (data) {

        if (data[0] == SPLODER.ACTION_SELECT_ITEM && this.model.selection.length == 1) {

            this.drawingArea.centerOnSelection();

        }

        if (data[0] == SPLODER.ACTION_SELECTION_DELETE) {



        }

    }


    this.updateButtonStates(data);


};

SPLODER.Editor.prototype._resetLevelsMenu = function () {

    var level_indicators = $$$('li[data-id="mainmenu-levels"] span, ul[data-id="levels"] span');

    i = level_indicators.length;
    while (i--) {
        level_indicators.item(i).innerText = this.model.metadata.level + 1;
    }

    var level_menuitems = $$$('ul[data-id="levels"] li');

     i = level_menuitems.length;
    while (i--) {
        level_menuitems.item(i).dataset.value = this.model.metadata.level + 1;
    }

}

SPLODER.Editor.prototype.onLevelsChanged = function (data) {

    if (data == SPLODER.ACTION_CONTEXT_CHANGE || data == SPLODER.ACTION_CHANGE) {

        this.resetAll();

    } else if (data == SPLODER.ACTION_RESET || data == SPLODER.ACTION_PROJECT_NEW || data == SPLODER.ACTION_PROJECT_LOAD) {

        this._resetLevelsMenu();

    }


};

SPLODER.Editor.prototype.onEnvModelChanged = function (data) {

    if (data) {

        this.envDispatcher.dispatch(data);

    }

};

SPLODER.Editor.prototype.onFlowModelChanged = function (data) {

    if (data && data[0] == SPLODER.ACTION_SELECT_ITEM && this.flowModel.selection.length == 1) {

        this.flowArea.centerOnSelection();

    }

    this.updateButtonStates(data);

};

SPLODER.Editor.prototype.onTagModelChanged = function (data) {


};

SPLODER.Editor.prototype.onHistoryChanged = function (data) {

    if (data == SPLODER.ACTION_RESET) {
        this.resetAll();
    }

    this.updateHistoryButtonStates();

};

SPLODER.Editor.prototype.onGameViewSelect = function (data) {

    this.dispatcher.dispatch(data);

};

SPLODER.Editor.prototype.onPreviewChanged = function (data) {

    this.dispatcher.dispatch(data);

};

/* UI Commands */


SPLODER.Editor.prototype.selectAll = function () {

    if (this.pixelEditorShowing) {
        this.pixelEditor.editor.doAction('selectAll');
    } else {
        this.drawingArea.changed.dispatch([SPLODER.ACTION_SELECT_ALL]);
    }

};


SPLODER.Editor.prototype.selectNone = function () {

    if (this.pixelEditorShowing) {
        this.pixelEditor.editor.doAction('selectNone');
    } else {
        this.drawingArea.changed.dispatch([SPLODER.ACTION_DESELECT]);
    }

};


SPLODER.Editor.prototype.deleteSelection = function () {

    var scope = this;

    if (this.pixelEditorShowing) {
        this.pixelEditor.editor.doAction('delete');
    } else if (this.flowModel.selection.length > 0 && !this.bottomPanelMinimized) {
        this.flowArea.changed.dispatch([SPLODER.ACTION_SELECTION_DELETE]);
    } else {
        if (this.model.selection) {
            this.model.selection.forEach(function (item) {
                scope.flowModel.deleteItemsMatchingFlowID(item.id);
                scope.flowArea.setDirty();
            })
        }
        this.drawingArea.changed.dispatch([SPLODER.ACTION_SELECTION_DELETE]);
    }

};


SPLODER.Editor.prototype.copy = function () {

    if (this.pixelEditorShowing) {
        this.pixelEditor.editor.doAction('copy');
    } else {
        this.history.copyToClipboard();
        SPLODER.setButtonsState(['paste'], true);
    }

};


SPLODER.Editor.prototype.paste = function () {

    if (this.pixelEditorShowing) {
        this.pixelEditor.editor.doAction('paste');
    } else {
        var viewBounds;
        var id = this.history.clipboardModelId;

        if (this.bottomPanelMinimized && id != this.model.id) {
            return;
        }

        if (id == this.model.id) {
            viewBounds = this.drawingArea.getViewBounds();
        } else if (id == this.flowModel.id) {
            viewBounds = this.flowArea.getViewBounds();
        }

        this.history.pasteFromClipboard(viewBounds);
    }

};



/* Input Handlers */


SPLODER.Editor.prototype.onMouseUp = function (e) {

    //this.previewArea.sceneModel.updateLightMap(true);

};


SPLODER.Editor.prototype.updateButtonStates = function (data) {

    var actionType;

    if (data instanceof Array) actionType = data[0];

    var shouldResize = false;

    if (this.previewReduced && !SPLODER.hasClass('editor_container', 'smallpreview')) {
        SPLODER.setClass('editor_container', 'smallpreview')
        shouldResize = true;
    } else if (!this.previewReduced && SPLODER.hasClass('editor_container', 'smallpreview')) {
        SPLODER.setClass('editor_container', 'smallpreview', true)
        shouldResize = true;
    }

    if (this.pixelEditorShowing && !SPLODER.hasClass('editor_container', 'pixeledmode')) {
        SPLODER.setClass('editor_container', 'pixeledmode')
        shouldResize = true;
    } else if (!this.pixelEditorShowing && SPLODER.hasClass('editor_container', 'pixeledmode')) {
        SPLODER.setClass('editor_container', 'pixeledmode', true)
        shouldResize = true;
    }

    if (shouldResize) {
        this.onResize();
    }

    var bottomPanel = document.getElementById('bottompanel');

    var mslen = this.model.selection.length;
    var mstype = this.model.selectionType();
    var elem = document.getElementById("selection");

    if (elem) {

        var text = "No selection";

        if (mslen) {

            text = mslen + " ";

            if (mstype < 0) text += "objects selected (mixed types)";
            else {

                text += SPLODER.Item.typeStrings[mstype];
                text += (mslen > 1) ? "s selected" : " selected";

            }

        }

        elem.innerText = text;

    }

    if (mstype < 0) {
        SPLODER.disableButtons('extensions-tags');
        SPLODER.setButtonsState(['extensions-flows'], mstype == -1);
    } else if (mslen == 1 && mstype < SPLODER.Item.TYPE_LIGHT) {
        SPLODER.enableButtons('extensions-tags', 'extensions-flows');
    } else if (mstype == SPLODER.Item.TYPE_PARTICLE) {
        SPLODER.enableButtons('extensions-tags');
        SPLODER.disableButtons('extensions-flows');
    } else {
        SPLODER.disableButtons('extensions-tags', 'extensions-flows');
    }

    if (mstype > -2 && (mstype < SPLODER.Item.TYPE_LIGHT || mstype == SPLODER.Item.TYPE_PARTICLE)) {
        SPLODER.enableButtons('extensions-states');
    } else {
        SPLODER.disableButtons('extensions-states');
    }

    if (mslen == 1 && mstype != SPLODER.Item.TYPE_LIQUID && (mstype < SPLODER.Item.TYPE_LIGHT || mstype == SPLODER.Item.TYPE_PARTICLE)) {
        SPLODER.enableButtons('extensions-gameprops');
    } else {
        SPLODER.disableButtons('extensions-gameprops');
    }

    if (actionType >= SPLODER.ACTION_SELECT_POINT && actionType <= SPLODER.ACTION_SELECTION_DELETE) {

        SPLODER.setClass("previewtools", "more", true);

    }

    if (mstype == SPLODER.Item.TYPE_LIGHT || mstype == SPLODER.Item.TYPE_PARTICLE) {
        SPLODER.disableButtons('extensions-textures');
    } else {
        SPLODER.enableButtons('extensions-textures');
    }

    var tags_elem = document.getElementById('tags');

    if (mstype < SPLODER.Item.TYPE_LIGHT && mslen == 1) {
       // tags_elem.classList.remove('covered');
    } else {
       // tags_elem.classList.add('covered');
    }



    if (this.bottomPanelTab && !SPLODER.buttonIsEnabled('extensions-' + this.bottomPanelTab)) {

        //this.minimizePanel();
        bottomPanel.classList.add('covered');

    } else {

        bottomPanel.classList.remove('covered');

    }

    SPLODER.clearClassListById('selectiontype');
    var selectionClasses = SPLODER.getClassListById('selectiontype');

    if (mstype == -2) {
        selectionClasses.add("mixed");
    } else if (mstype == -1) {
        selectionClasses.add("none");
    } else if (mstype >= 0) {
        selectionClasses.add(SPLODER.Item.typeStrings[mstype]);
        if (mslen == 1 && mstype == SPLODER.Item.TYPE_ITEM && this.model.selection[0].getAttrib(SPLODER.GameProps.PROPERTY_GRAVITY) == 0) {
            selectionClasses.add('nogravity');
        }
    }

    if (mslen == 1 && mstype == 0 && !this.model.selection[0].getAttrib(SPLODER.Item.PROPERTY_CEIL)) {
        selectionClasses.add('noceiling');
    } else {
        selectionClasses.remove('noceiling');
    }

    if (mslen == 1 && mstype == SPLODER.Item.TYPE_LIQUID && !this.model.selection[0].getAttrib(SPLODER.Item.PROPERTY_LIQUID_HASFLOOR)) {
        selectionClasses.add('nofloor');
    } else {
        selectionClasses.remove('nofloor');
    }

    if (mstype == SPLODER.Item.TYPE_LIGHT) {
        SPLODER.setClass("previewtools", "more");
        SPLODER.setClass("geometrytools", "hidden");
    } else {
        SPLODER.setClass("geometrytools", "hidden", true);
    }

    SPLODER.setButtonsState(['draw-fliph', 'draw-flipv'], mslen > 1);
    SPLODER.setButtonsState(['draw-rotate'], mslen > 1 || (mslen == 1 && mstype != SPLODER.Item.TYPE_LIGHT && mstype != SPLODER.Item.TYPE_ITEM));

    if (this.drawingArea.playerStartHelper.selected) {
        SPLODER.setButtonsState(['draw-rotate'], true);
    }

    this.updateHistoryButtonStates();

};

SPLODER.Editor.prototype.updateHistoryButtonStates = function () {

    var mslen = this.model.selection.length;
    var fslen = this.flowModel.selection.length;

    SPLODER.setButtonsState(['undo'], this.history.hasUndos);
    SPLODER.setButtonsState(['redo'], this.history.hasRedos);
    SPLODER.setButtonsState(['delete'], mslen > 0 || (fslen > 0 && !this.bottomPanelMinimized));
    SPLODER.setButtonsState(['copy'], mslen > 0 || fslen > 0);
    SPLODER.setButtonsState(['paste'], this.history.clipboardModelId == 1 || (this.history.clipboardModelId > 1 && !this.bottomPanelMinimized));

};

SPLODER.Editor.prototype.showPixelEditor = function (model, ghostModel, tilesize, canvasScale) {

    SPLODER.setClass('editor_container', 'pixeledmode');

    if (!this.pixelEditor) {
        this.pixelEditor = SPLODER2D.createPixelEditor('pixeleditor', model, ghostModel, tilesize, canvasScale);
        this.pixelEditor.editor.addListener("change_complete", SPLODER.bind(this, this.onPixelEditorChange));
    }

    this.pixelEditorShowing = true;

};

SPLODER.Editor.prototype.hidePixelEditor = function () {

    SPLODER.setClass('editor_container', 'pixeledmode', true);
    this.pixelEditorShowing = false;

    if (this.pixelEditor) {
        this.history.storeTextures();
        this.pixelEditor.editor.destroy();
        this.pixelEditor = null;
    }

};

SPLODER.Editor.prototype.showDrawingTypes = function () {

    SPLODER.setClass('drawingtypes', 'hidden', true);

};

SPLODER.Editor.prototype.hideDrawingTypes = function () {

    SPLODER.setClass('drawingtypes', 'hidden');

};

SPLODER.Editor.prototype.setDrawingType = function (type) {

    SPLODER.clearClassListById('createtool');
    SPLODER.setClass('createtool', "icon-" + type);

    this.hideDrawingTypes();

    var type_singular = type.substr(0, type.length - 1);

    var type_idx = SPLODER.Item.typeStrings.indexOf(type_singular);

    this.drawingArea.changeCreateToolType(type_idx);

};



SPLODER.Editor.prototype.onButtonPress = function (id, button) {

    if (id == undefined) return;
    if (button && button.classList.contains('disabled')) return;

    var module = id.split('-')[0];
    var command = id.split('-')[1];

    if (command == undefined) {
        command = module;
        module = '';
    }

    console.log(module, command);

    var d = this.drawingArea;
    var p = this.previewArea;
    var f = this.flowArea;

    var bpp = button ? button.parentNode.parentNode : null;

    this.hideDrawingTypes();
    //$$('#assets').classList.remove('open');

    switch (module) {

        case "modal":

            this.modal.onCommand(command);
            break;

        case "mainmenu":

            SPLODER.hide('#submenus ul');

            switch (command) {

                case "toggle_sidebar":
                    $$('#assets').classList.toggle('open');
                    break;

                default:
                    $$('#submenus ul[data-id="' + command + '"]').classList.toggle('hidden');
                    $$('#assets').classList.remove('open');
                    break;

            }

            break;

        case "assets":

            switch (command) {

                case "level":
                    var level = button.dataset.value;
                    console.log("Going to level", level)
                    this.levelsDispatcher.dispatch([SPLODER.ACTION_SELECT_ITEM, level]);

            }

            $$('#assets').classList.toggle('open');
            break;

        case "project":

            return;

        case "levels":

            switch (command) {

                case "show":
                    $$('#assets').classList.add('open');
                    break;

                case "new":
                    this.levelsDispatcher.dispatch([SPLODER.ACTION_CREATE]);
                    break;

                case "duplicate":
                    this.levelsDispatcher.dispatch([SPLODER.ACTION_SELECTION_DUPLICATE]);
                    break;

                case "delete":
                    this.levelsDispatcher.dispatch([SPLODER.ACTION_SELECTION_DELETE]);
                    break;

            }

            $$('#submenus ul[data-id="levels"]').classList.add('hidden');

            break;


        case "draw":

            switch (command) {

                case "zoomin":
                    d.zoomIn();
                    break;

                case "zoomout":
                    d.zoomOut();
                    break;

                case "center":
                    d.dragger.reset();
                    break;

                case "create":
                    if (SPLODER.hasClass('drawingtypes', 'hidden') || d.toolMode != SPLODER.DrawingArea.TOOLMODE_CREATE || SPLODER.hasClass('createtool', 'icon-edit')) {
                        d.changeTool(SPLODER.DrawingArea.TOOLMODE_CREATE);
                        this.showDrawingTypes();
                    } else {
                        this.hideDrawingTypes();
                    }
                    break;

                case "create_walls":
                case "create_platforms":
                case "create_liquids":
                case "create_panels":
                case "create_items":
                case "create_bipeds":
                case "create_lights":
                case "create_particles":

                    var type = command.split("_")[1];
                    this.setDrawingType(type);
                    break;

                case "select":
                    this.hideDrawingTypes();
                    d.changeTool(SPLODER.DrawingArea.TOOLMODE_SELECT);
                    break;

                case "pan":
                    this.hideDrawingTypes();
                    d.changeTool(SPLODER.DrawingArea.TOOLMODE_FINGER);
                    break;

                case "flipv":
                    d.changed.dispatch([SPLODER.ACTION_SELECTION_MIRROR_V, -1]);
                    break;

                case "fliph":
                    d.changed.dispatch([SPLODER.ACTION_SELECTION_MIRROR_H, -1]);
                    break;

                case "rotate":
                    if (this.drawingArea.playerStartHelper.selected) {
                        this.model.setPlayerRotation((this.model.getPlayerStart().r + 45) % 360);
                    } else {
                        d.changed.dispatch([SPLODER.ACTION_SELECTION_ROTATE, -1]);
                    }
                    break;

            }

            break;

        case "pixel":

            switch (command) {

                case 'prev':

                    break;

                case 'next':

                    break;

                case 'close':
                    this.hidePixelEditor();
                    break;
            }

        case "3d":

            switch (command) {

                case "ceildepth_up":
                    d.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_CEILDEPTH, 1]);
                    break;

                case "ceildepth_down":
                    d.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_CEILDEPTH, -1]);
                    break;

                case "floordepth_up":
                    d.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_FLOORDEPTH, 1]);
                    break;

                case "floordepth_down":
                    d.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_FLOORDEPTH, -1]);
                    break;

                case "ceiling":
                    this.drawingArea.changeSelection(SPLODER.Item.PROPERTY_CEIL);
                    break;

                case "floor":
                    this.drawingArea.changeSelection(SPLODER.Item.PROPERTY_LIQUID_HASFLOOR);
                    break;

                case "ceiling_sky":
                    this.drawingArea.changeSelection(SPLODER.Item.PROPERTY_CEIL_SKY);
                    break;

                case "lightlevel_up":
                    this.drawingArea.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_LIGHTLEVEL, 10]);
                    break;

                case "lightlevel_down":
                    this.drawingArea.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_LIGHTLEVEL, -10]);
                    break;

                case "lighteffect_up":
                    this.drawingArea.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_LIGHTEFFECT, 1]);
                    break;

                case "lighteffect_down":
                    this.drawingArea.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_LIGHTEFFECT, -1]);
                    break;

                case "light_hue":
                    this.drawingArea.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_COLOR, 1]);
                    break;

                case "particle_hue":
                    this.drawingArea.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_COLOR, 1]);
                    break;

                case "previewsize":

                    this.previewReduced = !this.previewReduced;
                    this.updateButtonStates();
                    break;

                case "camera_manual":
                    bpp.classList.remove('camera_auto');
                    bpp.classList.add('camera_manual');
                    p.autoCamera = false;
                    break;

                case "camera_auto":
                    bpp.classList.remove('camera_manual');
                    bpp.classList.add('camera_auto');
                    p.autoCamera = true;
                    break;

                case "lightmap_off":
                    bpp.classList.remove('lightmap_on');
                    bpp.classList.add('lightmap_off');
                    this.sceneAssets.forcedUpdateOnly = true;
                    break;

                case "lightmap_on":
                    bpp.classList.remove('lightmap_off');
                    bpp.classList.add('lightmap_on');
                    p.autoCamera = false;
                    this.sceneAssets.forcedUpdateOnly = false;
                    break;

                case "lightmap_sync":
                    p.sceneModel.updateLightMap(true);
                    break;

                case "show_more":
                    SPLODER.setClass("previewtools", "more");
                    break;

                case "show_less":
                    SPLODER.setClass("previewtools", "more", true);
                    break;


            }

            break;

        case "extensions":

            SPLODER.clearClassListById('extensions_content');
            SPLODER.setClass('extensions_content', command);
            this.bottomPanelTab = command;
            this.openPanel();
            this.updateButtonStates();

            break;


        case "bottompanel":

            switch (command) {

                case "close":
                    this.minimizePanel();
                    break;

                case "expand":
                    this.maximizePanel();
                    break;

            }

            break;

        case "flows":

            switch (command) {

                case "zoomin":
                    f.zoomIn();
                    break;

                case "zoomout":
                    f.zoomOut();
                    break;

                case "center":
                    f.centerOnSelection();
                    break;

                case "select":
                    if (f.toolMode != SPLODER.FlowArea.TOOLMODE_CREATE) {
                        f.changeTool(SPLODER.FlowArea.TOOLMODE_CREATE);
                        SPLODER.setClass('flowselect', 'selected', true);
                    } else {
                        f.changeTool(SPLODER.FlowArea.TOOLMODE_SELECT);
                        SPLODER.setClass('flowselect', 'selected');
                    }

            }

            break;

        default:

            switch (command) {

                case "undo":
                    this.history.restoreUndo();
                    break;

                case "redo":
                    this.history.redo();
                    break;

                case "copy":
                    this.copy();
                    break;

                case "paste":
                    this.paste();
                    break;

                case "delete":
                    this.deleteSelection();
                    break;

                case "fullscreen":

                    var elem = document.body;
                    if (elem.requestFullscreen) {
                        elem.requestFullscreen();
                    } else if (elem.msRequestFullscreen) {
                        elem.msRequestFullscreen();
                    } else if (elem.mozRequestFullScreen) {
                        elem.mozRequestFullScreen();
                    } else if (elem.webkitRequestFullscreen) {
                        elem.webkitRequestFullscreen();
                    }
                    document.body.classList.add('fullscreen');
                    break;

                case "exitfullscreen":

                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }

                    document.body.classList.remove('fullscreen');
                    break;


            }

    }

};

SPLODER.Editor.prototype.onButtonRelease = function (id, button) {

    if (id == undefined) return;
    if (button && button.classList.contains('disabled')) return;

    var module = id.split('-')[0];
    var command = id.split('-')[1];

    if (command == undefined) {
        command = module;
        module = '';
    }

    switch (module) {

        case "3d":

            switch (command) {

                case "ceildepth_up":
                case "ceildepth_down":
                case "floordepth_up":
                case "floordepth_down":
                case "ceiling":
                case "ceiling_sky":
                case "lightlevel_up":
                case "lightlevel_down":
                case "lighteffect_up":
                case "lighteffect_down":
                case "light_hue":

                    this.model.saveUndo();
                    break;

            }

            break;

    }


}

SPLODER.Editor.prototype.onFormChange = function (elem) {

    switch (elem.name) {

        case "extension":

            if (elem.id == "extensions_none" || elem.parentNode.classList.contains('disabled')) {
                this.minimizePanel();
            } else {
                this.openPanel();
            }


    }

};

SPLODER.Editor.prototype.onModalEvent = function (type, data) {

    switch (type) {

        default:
            // code
    }


};

SPLODER.Editor.prototype.bindKeys = function () {

    var scope = this;

    var undoFn = function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        if (scope.pixelEditorShowing) {
            if (e.shiftKey) {
                scope.pixelEditor.editor.doAction('redo');
            } else {
                scope.pixelEditor.editor.doAction('undo');
            }
            scope.onPixelEditorChange();
        } else {
            if (e.shiftKey) {
                scope.history.redo();
            } else {
                scope.history.restoreUndo();
            }
        }
        return false;
    };

    Mousetrap.bind(['ctrl+z', 'command+z'], undoFn);
    Mousetrap.bind(['shift+ctrl+z', 'shift+command+z'], undoFn);

    Mousetrap.bind(['ctrl+c', 'command+c'], function (e) {
        scope.copy();
        if (e.preventDefault) {
            e.preventDefault();
        }
    });
    Mousetrap.bind(['ctrl+x', 'command+x'], function (e) {
        if (this.pixelEditorShowing) {
            scope.pixelEditor.editor.doAction('cut');
        }
        if (e.preventDefault) {
            e.preventDefault();
        }
    });
    Mousetrap.bind(['ctrl+v', 'command+v'], function (e) {
        scope.paste();
        if (e.preventDefault) {
            e.preventDefault();
        }
    });

    Mousetrap.bind(['ctrl+a', 'command+a'], function (e) {
        scope.selectAll();
        if (e.preventDefault) {
            e.preventDefault();
        }
    });
    Mousetrap.bind(['ctrl+d', 'command+d', 'shift+ctrl+a', 'shift+command+a'], function () { scope.selectNone(); return false; });
    Mousetrap.bind(['del', 'backspace'], function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            // internet explorer
            e.returnValue = false;
        }
        scope.deleteSelection();
    });

    Mousetrap.bind(['ctrl+n', 'command+n'], function (e) {

        e.preventDefault();
        scope.projectMenu.onButtonPress('project-new');

    });

    Mousetrap.bind(['ctrl+o', 'command+o'], function (e) {

        e.preventDefault();
        scope.projectMenu.onButtonPress('project-load');

    });

    Mousetrap.bind(['ctrl+s', 'command+s'], function (e) {

        e.preventDefault();
        scope.projectMenu.onButtonPress('project-save');

    });

    Mousetrap.bind(['ctrl+m', 'command+m'], function (e) {

        e.preventDefault();
        scope.flowModel.saveUndo();
        scope.tagModel.saveUndo();
        scope.envModel.saveUndo();
        scope.levels.saveCurrentLevel();
        scope.levels.saveUndo();
        console.log("Saving levels...");

    });


    Mousetrap.bind(['ctrl+p', 'command+p'], function (e) {

        e.preventDefault();
        scope.flowModel.saveUndo();
        scope.tagModel.saveUndo();
        scope.envModel.saveUndo();
        scope.levels.saveCurrentLevel();
        scope.levels.saveUndo();
        console.log("Saving levels...");

        if (window._previewWindow && window._previewWindow.location && window._previewWindow.location.reload) {
            window._previewWindow.location.reload();
            setTimeout(function () {
                window._previewWindow.focus();
            }, 100);
        } else {
            console.log(window._previewWindow)
            window._previewWindow = window.open(location.href + "/game.html", "_blank", "width=880,height=680,menubar=no,toolbar=no");
        }

    });

    Mousetrap.bind(['shift+ctrl+s', 'shift+command+s'], function (e) {

        e.preventDefault();
        scope.projectMenu.onButtonPress('project-saveas');

    });

    Mousetrap.bind('escape', function (e) {
        if (scope.modal.showing()) {
            scope.modal.hide();
        } else if (scope.pixelEditorShowing) {
            scope.hidePixelEditor();
        }
    });

    Mousetrap.bind(['ctrl+='], function (e) {

        scope.drawingArea.zoomIn();

    });

    Mousetrap.bind(['ctrl+-'], function (e) {
        scope.drawingArea.zoomOut();
    });

    Mousetrap.bind('t', function () {
        scope.drawingArea.changeCreateToolType();
        scope.flowArea.changeCreateToolType();
    }, 'keyup');

    Mousetrap.bind(['=', '-'], function (e) {
        scope.drawingArea.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_FLOORDEPTH, e.charCode == 61 ? 1 : -1]);
    });

    Mousetrap.bind(['+', '_'], function (e) {
        scope.drawingArea.changed.dispatch([SPLODER.ACTION_CHANGE, -1, SPLODER.Item.PROPERTY_CEILDEPTH, e.charCode == 43 ? 1 : -1]);
    });


    Mousetrap.bind(['m'], function (e) {

        if (scope.pixelEditorShowing) {
            scope.pixelEditor.editor.doAction('tool_select');
        } else {
            scope.onButtonPress("draw-fliph");
        }

    });

    Mousetrap.bind(['M'], function (e) {

        scope.onButtonPress("draw-flipv");

    });

    Mousetrap.bind(['r'], function (e) {

        scope.onButtonPress("draw-rotate");

    });

    Mousetrap.bind(['e', 'E'], function (e) {

        if (scope.pixelEditorShowing) {
            scope.pixelEditor.editor.doAction('tool_eraser');
        }

    });

    Mousetrap.bind(['p', 'P'], function (e) {

        if (scope.pixelEditorShowing) {
            scope.pixelEditor.editor.doAction('tool_paintbrush');
        }

    });

    Mousetrap.bind(['k', 'K'], function (e) {

        if (scope.pixelEditorShowing) {
            scope.pixelEditor.editor.doAction('tool_fill');
        }

    });


};
