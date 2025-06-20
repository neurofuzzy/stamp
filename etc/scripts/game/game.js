SPLODER.Game = function () {

    SPLODER.Broadcaster.call(this);

    this.library = null;

    this.model = null;
    this.sceneAssets = null;
    this.dispatcher = null;

    this.levels = null;
    this.levelsDispatcher = null;

    this.envModel = null;
    this.envDispatcher = null;

    this.tags = null;
    this.tagDispatcher = null;

    this.player = null;
    this.simulation = null;

    this.flows = null;
    this.flowDispatcher = null;
    this.flowProcessor = null;

    this.gameEvents = null;

    this.frame = 0;

    this.width = 0;
    this.height = 0;
    this.container = null;

    this.stage3d = null;
    this.renderer3d = null;
    this.pixelRatio = null;
    this.stats = null;
    this.clock = null;

    this.gameView = null;
    this.gameConsole = null;

    this.history = null;

    this.paused = false;
    this.destroyed = false;

};


SPLODER.Game.prototype.initWithSize = function (tilesize, pixelRatio) {

    this.sceneAssets = new SPLODER.GameSceneAssets().init(tilesize, pixelRatio, true);
    this.sceneAssets.prepared.addOnce(this.onAssetsPrepared, this);

    this.library = new SPLODER.GameLibrary().init();
    this.model = new SPLODER.GameStore().init();
    this.envModel = new SPLODER.EnvModel().init();
    this.levels = new SPLODER.GameLevels().initWithModels(this.library, this.model, this.envModel);

    var width = this.width = Math.max(640, Math.min(800, window.innerWidth));
    var height = this.height = Math.max(480, Math.min(600, window.innerHeight));

    if (height >= 768 && this.bottomPanelTab) {
        panelHeight -= 270;
    }

    this.tilesize = tilesize;
    this.pixelRatio = pixelRatio || 1.0;

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

    this.tags = new SPLODER.Tags().init();
    this.tagDispatcher = new signals.Signal();
    this.tags.registerWithDispatcher(this.tagDispatcher);

    this.flows = new SPLODER.Flows().init();
    this.flowDispatcher = new signals.Signal();
    this.flows.registerWithDispatcher(this.flowDispatcher);

    this.gameEvents = new SPLODER.GameEvents().init();

    this.history = new SPLODER.ModelHistory().initWithSceneAssets(this.sceneAssets, true);
    this.history.registerModel(this.model);
    this.history.registerModel(this.levels);
    this.history.registerModel(this.flows);
    this.history.registerModel(this.tags);
    this.history.registerModel(this.envModel);
    this.history.restored.add(this.onHistoryRestored, this);

    this.gameView = new SPLODER.GameView().initWithModelsAndSize(this.model, this.envModel, this.sceneAssets, width, height, 32.0, this.pixelRatio);
    this.gameView.selected.add(this.onGameViewSelect, this);

    this.gameConsole = new SPLODER.GameConsole().initWithModel(this.model);

    window.addEventListener('mouseup', SPLODER.bind( this, this.onMouseUp ), false );
    window.addEventListener('keyup', SPLODER.bind( this, this.onMouseUp ), false );
    window.addEventListener('touchend', SPLODER.bind(this, this.onMouseUp ), false );

};


SPLODER.Game.prototype.build = function (elementId) {

    this.container = document.getElementById(elementId);

    var width = this.width = Math.max(640, Math.min(800, window.innerWidth));
    var height = this.height = Math.max(480, Math.min(600, window.innerHeight));
    var panelWidth = Math.floor(width * 0.5);
    var panelHeight = Math.floor(height) - 96;

    if (height >= 768 && this.bottomPanelTab) {
        panelHeight -= 270;
    }


    if (this.container)
    {
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



        // 3d preview

        var d = document.getElementById('gameview');

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
        this.gameView.loadComplete.addOnce(this.onLoadComplete, this);
        this.gameView.build(this.stage3d, renderer);

        if ('addEventListener' in v) {
            d.addEventListener('mousewheel', mw, false);
            d.addEventListener('wheel', mw, false);
        } else {
            d.attachEvent('onmousewheel', mw);
        }

        renderer.domElement.addEventListener( 'mouseup', SPLODER.bind(this.gameView, this.gameView.onMouseUp), false );
        renderer.domElement.addEventListener( 'mousedown', SPLODER.bind(this.gameView, this.gameView.onMouseDown), false );


        var stats = this.stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms

        // align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0';
        stats.domElement.style.top = '0';

        document.body.appendChild( stats.domElement );



        //SPLODER.connectButtons(this, null, this.onButtonPress, this.onFormChange, this.onButtonRelease);

        this.onResize(true);

        this.sceneAssets.load();

    }

};


SPLODER.Game.prototype.onAssetsPrepared = function () {

    //this.history.restoreFromStorage();

};


SPLODER.Game.prototype.onResize = function (e) {

    console.log("RESIZE CALLED", window.orientation, e);

    var width = this.width = Math.max(640, Math.min(800, window.innerWidth));
    var height = this.height = Math.max(480, Math.min(600, window.innerHeight));

    this.renderer3d.setPixelRatio(this.pixelRatio);

    this.renderer3d.setSize(width, height);
    this.gameView.setSize(width, height);

    var scope = this;

    if (e) {
        setTimeout(function () {
            scope.onResize();
        }, 1000);
    }

};


SPLODER.Game.prototype.start = function ()
{
    if (!this.started)
    {
        this.player = new SPLODER.Player().init(this.gameView.camera, this.container);
        this.gameView.player = this.player;
        this.model.player = this.player.rect;
        this.model.flows = this.flows;
        this.levels.start();

        var playerStart = this.model.getPlayerStart();
        var playerFloorLevel = this.model.getPlayerStartFloorLevel();

        this.player.camera.setPosition(playerStart.x * 32, playerFloorLevel * 16, playerStart.y * 32);

        if (this.player.controls) {
            this.player.controls.rotateTo(0 - playerStart.r);
        }

        this.player.update();

        this.simulation = new SPLODER.Simulation().initWithModel(this.model, this.player);

        SPLODER.GameRules.applyDefaultBehaviors(this.levels, this.tags, this.flows);

        this.flowProcessor = new SPLODER.FlowProcessor().initWithModels(this.model, this.levels, this.tags, this.flows, this.simulation, this.gameEvents, this.gameConsole);
        this.simulation.triggered.add(this.onTrigger, this);

        this.gameController = new SPLODER.GameController().initWithGameShit(this.library, this.model, this.levels, this.tags, this.player, this.simulation, this.flowProcessor, this.gameEvents, this.gameConsole);

        this.levels.populateLibraryItems(this.tags);

        // start anim loop

        this.gameView.sceneAssets.forcedUpdateOnly = false;

        // TEMP initialize player health on console HACK

        this.model.onAction([SPLODER.ACTION_CHANGE_GAMEPROPS, -1, SPLODER.GameProps.PROPERTY_HEALTH, -60]);
        //this.model.onAction([SPLODER.ACTION_CHANGE_GAMEPROPS, -1, SPLODER.GameProps.PROPERTY_HEALTH, 1]);

        var scope = this;

        window.onblur = function (e) {
            scope.paused = true;
        }

        window.onfocus = function (e) {
            scope.paused = false;
        }

        var anim = function ()
        {
            if (!scope.destroyed)
            {

                requestAnimationFrame(anim);

                if (scope.paused) {
                    return;
                }

                var delta = scope.clock.getDelta()

                if (scope.stats) scope.stats.begin();

                scope.simulation.preStep(delta);
                scope.flowProcessor.step();
                scope.gameEvents.step();
                scope.simulation.postStep(delta);

                var p = scope.gameView;

                if (p && p.ready) {

                    p.update(delta);
                    p.render(scope.renderer3d);

                    if (scope.stats) scope.stats.end();

                }

                scope.gameConsole.step();

            }
        };

        //this.connect();

        //this.history.restore();
        this.updateButtonStates();

        window.addEventListener('resize', SPLODER.bind(this, this.onResize), false);
        window.addEventListener('orientationchange', SPLODER.bind(this, this.onResize), false);
        window.scrollTo(0, 1);

        this.gameView.camControls = this.player.controls;
        this.gameView.setSize(this.width, this.height);
        this.gameView.update();

        this.started = true;

        this.simulation.start();
        this.flowProcessor.start();

        requestAnimationFrame(anim);
    } else {
        console.log("SIMULATION ALREADY STARTED");
    }
};


SPLODER.Game.prototype.scroll = function (deltaX, deltaY, event) {

    if (event && event.target && event.target.parentNode) {

        var id = event.target.parentNode.id;

        switch (id) {

            case 'gameview':

                this.player.scroll(deltaX, deltaY);
                event.preventDefault();
                break;

        }

    }

};

/* Model/View event handlers */



SPLODER.Game.prototype.onLoadComplete = function (e) {

    console.log("ASSETS LOAD COMPLETE");
    this.dispatcher.dispatch("loadComplete");

};


SPLODER.Game.prototype.onHistoryRestored = function () {

    // TEMP REPLACE
    this.model.items = this.levels.getLevelItems(0);


};

SPLODER.Game.prototype.onModelChanged = function (data) {




};

SPLODER.Game.prototype.onLevelsChanged = function (data) {

    if (data == SPLODER.ACTION_CONTEXT_CHANGE || data == SPLODER.ACTION_CHANGE) {

        this.gameView.setDirty();
        if (this.gameView.sceneModel) this.gameView.sceneModel.setDirty();

    }

};



SPLODER.Game.prototype.onEnvModelChanged = function (data) {

    if (data) {

        this.envDispatcher.dispatch(data);

    }

};


SPLODER.Game.prototype.onGameViewSelect = function (data) {

    this.dispatcher.dispatch(data);

};


SPLODER.Game.prototype.onTrigger = function (type, sourceItem, targetItem) {


};


/* Input Handlers */


SPLODER.Game.prototype.onMouseUp = function (e) {

    //this.gameView.sceneModel.updateLightMap(true);

};


SPLODER.Game.prototype.updateButtonStates = function (data) {


};


SPLODER.Game.prototype.onButtonPress = function (id, button) {

    if (id == undefined) return;
    if (button && button.classList.contains('disabled')) return;

    var module = id.split('-')[0];
    var command = id.split('-')[1];

    if (command == undefined) {
        command = module;
        module = '';
    }

    console.log(module, command);

    switch (module) {

        default:

            switch (command) {


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
