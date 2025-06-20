/**
 * Created by ggaudrea on 3/4/15.
 */

SPLODER.PreviewArea = function () {

    this.domElement = null;
    this.renderer = null;

    this.model = null;
    this.envModel = null;
    this.sceneAssets = null;
    this.loadComplete = null;

    this.selected = null;
    this.selectedMeshId = null;
    this.changed = null;
    this.shiftKey = false;
    this.width = 0;
    this.height = 0;
    this.tilesize = 32;
    this.tilesizeHalf = 16;

    this.sceneModel = null;
    this.pixelRatio = null;
    this.sceneMeshesCameraAligned = null;
    this.camera = null;
    this.cameraDummy = null;
    this.cameraAngle = null;
    this.camControls = null;
    this.mouse = null;
    this.dragging = false;
    this.dupeCheck = false;
    this.startDragPos = null;

    this.isDirty = true;
    this.ready = false;

    var _autoCamera = true;

    var scope = this;

    Object.defineProperty(this, 'autoCamera', {
        get: function () {
            return _autoCamera;
        },
        set: function (val) {
            this.selected.dispatch([SPLODER.ACTION_DESELECT]);
            _autoCamera = val ? true : false;
            scope.camControls.autoTracking = _autoCamera;
        }
    })

};


SPLODER.PreviewArea.prototype.initWithModelsAndSize = function (model, envModel, sceneAssets, width, height, tilesize, pixelRatio) {

    this.model = model;
    this.envModel = envModel;
    this.width = width;
    this.height = height;
    this.tilesize = tilesize || 32;
    this.tilesizeHalf = this.tilesize * 0.5;
    this.pixelRatio = pixelRatio || 1.0;

    this.selected = new signals.Signal();
    this.changed = new signals.Signal();
    this.mouse = new THREE.Vector2();

    this.sceneAssets = sceneAssets;
    this.loadComplete = new signals.Signal();

    return this;

};


SPLODER.PreviewArea.prototype.setSize = function (width, height) {

    this.width = width;
    this.height = height;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.sceneAssets.setViewportSize(width, height);

};


SPLODER.PreviewArea.prototype.build = function (domElement, renderer) {

    this.domElement = domElement;
    this.renderer = renderer;

    this.camera = new SPLODER.PreviewCamera( 90, this.width / this.height, 10, 2400 );
    this.cameraAngle = new THREE.Vector3();

    this.sceneMeshesCameraAligned = [];
    this.sceneAssets.prepared.addOnce(this.onAssetsPrepared, this);

    renderer.domElement.addEventListener( 'mouseup', SPLODER.bind(this, this.onMouseUp), false );
    renderer.domElement.addEventListener( 'mousemove', SPLODER.bind(this, this.onMouseMove), false );
    renderer.domElement.addEventListener( 'mousedown', SPLODER.bind(this, this.onMouseDown), false );

};


SPLODER.PreviewArea.prototype.onAssetsPrepared = function () {

    this.sceneAssets.assignUniformValue('cameraAngle', this.cameraAngle);
    this.buildScene();
    this.loadComplete.dispatch(true);
    this.sceneAssets.forcedUpdateOnly = false;
    this.sceneModel.updateLightMap(true);

};



SPLODER.PreviewArea.prototype.buildScene = function () {

    this.sceneModel = new SPLODER.SceneModel().initWithModelsAndSize(this.model, this.envModel, this.sceneAssets, this.tilesize);
    this.sceneModel.build(this.renderer);
    this.sceneModel.watchModel();

    this.camera.setModel(this.model, this.tilesize);
    this.resetCamera();

    var scene = this.sceneModel.scene;

    scene.add(this.camera);

    this.cameraDummy = new THREE.Camera();
    scene.add(this.cameraDummy);

    // add camera controller

    var ctrl = this.camControls = new SPLODER.PreviewControlsFirstPerson(this.camera, this.model, this.sceneModel, this.tilesize, this.domElement);
    ctrl.lookSpeed = 0.1;
    ctrl.movementSpeed = 800;
    ctrl.noFly = true;
    ctrl.lookVertical = true;
    ctrl.constrainVertical = true;
    ctrl.verticalMin = 0.7;
    ctrl.verticalMax = 2.2;

    this.resetCamera();

    this.camera.changed.add(ctrl.onCameraChanged, ctrl);

    this.ready = true;

    ctrl.collisionCheck();
    this.updatePreview();

    this.model.changed.add(this.onModelChanged, this);

};


SPLODER.PreviewArea.prototype.resetCamera = function () {

    var playerStart = this.model.getPlayerStart();

    this.camera.setPosition(playerStart.x * this.tilesize, 72 * this.tilesizeHalf, playerStart.y * this.tilesize);

    if (this.camControls) {
        this.camControls.rotateTo(0 - playerStart.r);
    }

    this.camera.easeFactor = 0.15;

};


SPLODER.PreviewArea.prototype.onMouseDown = function (e) {

    this.mouse.x = e.offsetX;
    this.mouse.y = e.offsetY;

    if (this.model.selection.length >= 1) {

        var mesh = SPLODER.MeshUtils.getClickedMesh(this.mouse, this.width, this.height, this.camera, this.sceneModel);

        if (mesh) {

            var rect = mesh.userData.rect;

            if (rect && this.model.selection.indexOf(rect) != -1) {

                var rectDepth = Math.min(rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) * this.tilesizeHalf, this.camera.position.y - this.tilesizeHalf * 6);

                this.dragging = true;

                this.dupeCheck = false;
                this.camControls.enabled = false;

                this.startDragPos = SPLODER.MeshUtils.getTilePositionAtDepth(e, rectDepth, this.width, this.height, this.camera);

            }

        }

    }

};

SPLODER.PreviewArea.prototype.onMouseMove = function (e) {

    if (this.dragging && this.model.selection.length >= 1) {

        if (!this.dupeCheck) {
            if (this.shiftKey) {
                this.changed.dispatch([SPLODER.ACTION_SELECTION_DUPLICATE]);
            }
            this.dupeCheck = true;
        }

        var rect = this.model.selection[0];

        if (rect) {

            var rectDepth = Math.min(rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) * this.tilesizeHalf, this.camera.position.y - this.tilesizeHalf * 6);

            var pos = SPLODER.MeshUtils.getTilePositionAtDepth(e, rectDepth, this.width, this.height, this.camera);

            var delta = pos.sub(this.startDragPos);

            var deltaX = Math.floor(delta.x / this.tilesize);
            var deltaY = Math.floor(delta.z / this.tilesize);

            this.changed.dispatch([SPLODER.ACTION_SELECTION_MOVE, deltaX, deltaY]);

            this.startDragPos.x += deltaX * this.tilesize;
            this.startDragPos.z += deltaY * this.tilesize;

        }

    }

};


SPLODER.PreviewArea.prototype.onMouseUp = function (e) {

    // select on tap only

    this.dragging = false;
    this.camControls.enabled = true;

    if (Math.abs(this.mouse.x - e.offsetX) +
        Math.abs(this.mouse.y - e.offsetY) < 10) {

        var mesh = SPLODER.MeshUtils.getClickedMesh(this.mouse, this.width, this.height, this.camera, this.sceneModel);

        if (mesh) {

            var rect = mesh.userData.rect;

            if (!this.model.itemWithIdIsSelected(rect.id, true)) {

                this.selectedMeshId = mesh.uuid;
                this.selected.dispatch([SPLODER.ACTION_SELECT_ITEM, rect, this.shiftKey]);
                return;

            }

        }

        this.selected.dispatch([SPLODER.ACTION_DESELECT]);

    }

};


SPLODER.PreviewArea.prototype.scroll = function (deltaX, deltaY) {

    this.camControls.scroll(deltaX, deltaY);

};


SPLODER.PreviewArea.prototype.setDirty = function () {

    this.isDirty = true;

};


SPLODER.PreviewArea.prototype.onModelChanged = function (actionType, data, prop) {

    if (!this.sceneModel) return;

    this.isDirty = true;

    var len = this.model.selection.length;
    var t = this.tilesize;
    var th = this.tilesizeHalf;

    if (!this.autoCamera) return;

    if (actionType == SPLODER.ACTION_CHANGE_PLAYERSTART) {
        var playerStart = data;
        this.camera.translateTo(playerStart.x * this.tilesize, null, playerStart.y * this.tilesize);

        if (this.camControls) {
            this.camControls.rotateTo(0 - playerStart.r);
        }
        return;
    }

    if (len == 0 || actionType == SPLODER.ACTION_SELECTION_DELETE) this.camControls.blur();

    if (actionType >= SPLODER.ACTION_SELECTION_DUPLICATE && actionType <= SPLODER.ACTION_CLIPBOARD_PASTE) return;

    if (data instanceof Array) {

        if (data.length == 1) {

            data = data[0];

        } else if (data.length) {

            var bounds = SPLODER.ShapeUtils.getBounds(this.model.selection);

            if (bounds) {

                this.camera.setTarget(
                    (bounds.x + bounds.width * 0.5) * t,
                    bounds.depth * th + t * 2,
                    (bounds.y + bounds.height * 0.5) * t
                    );
            }


        }

    }

    // items may not be created in scene yet, so defer

    if (actionType == SPLODER.ACTION_CREATE && data instanceof SPLODER.Item && data.type == SPLODER.Item.TYPE_ITEM && !this.sceneModel.hasObjectWithId(data.id)) {

        var scope = this;
        var args = arguments;
        setTimeout(function () {
            scope.onModelChanged.apply(scope, args);
        }, 100);

    }

    var objects = this.sceneModel.sceneMeshesById;

    if (data instanceof SPLODER.Item && objects[data.id]) {

        if (SPLODER.Geom.pointWithinRect(this.camera.position.x, this.camera.position.z, data, this.tilesize)) {

            //this.camera.updateStep();

        } else {

            var meshes = objects[data.id];

            if (!meshes) {
                return;
            }

            var mesh;

            if (this.selectedMeshId) {

                if (meshes[1] && meshes[1].uuid == this.selectedMeshId) {

                    mesh = meshes[1];

                } else if (meshes[0] && meshes[0].uuid == this.selectedMeshId) {

                    mesh = meshes[0];

                }

            }

            if (!mesh) {

                var idx = 0;

                if (prop == SPLODER.Item.PROPERTY_CEILDEPTH ||
                    prop == SPLODER.Item.PROPERTY_CEILTEXTURE ||
                    prop == SPLODER.Item.PROPERTY_CEIL_SKY ||
                    prop == SPLODER.Item.PROPERTY_TOPWALLTEXTURE ||
                    prop == SPLODER.Item.PROPERTY_TOPWALLCORNICETEXTURE ||
                    data.type == SPLODER.Item.TYPE_LIQUID) {

                    idx = 1;

                }

                if (data.type == SPLODER.Item.TYPE_LIQUID) {
                    if (prop != SPLODER.Item.PROPERTY_CEILTEXTURE && prop != SPLODER.Item.PROPERTY_FLOORTEXTURE) {
                        idx = idx ? 0 : 1;
                    }
                }

                mesh = objects[data.id][idx];

            }

            if (mesh) {

                this.camControls.focusOn(mesh);

            }

        }

    }

    this.selectedMeshId = null;
    this.setDirty();

};



SPLODER.PreviewArea.prototype.updatePreview = function () {

    if (!this.ready) {
        return;
    }

    // TODO: Move to game view only

    this.isDirty = false;

};

SPLODER.PreviewArea.prototype.update = function (delta) {

    if (!this.ready) {
        return;
    }

    var forceCollisionCheck = this.sceneModel.isDirty;

    this.sceneModel.update();

    if (this.isDirty || forceCollisionCheck) {
        this.updatePreview();
    }

    this.camControls.update(delta, forceCollisionCheck);


    var ca = this.cameraAngle;

    if (this.camControls) {
        ca.z = this.camControls.heading;
        ca.y = this.camControls.pitch;
        ca.x = this.camControls.elev;
    }

    // hmm
    //this.skiesMaterial.needsUpdate = true;


    this.sceneAssets.setTime(Date.now() / 1000);

    // console.log(this.globalUniforms.time.value);

    // updating materials is SLOOOWWWW
    // this.wallsMaterial.needsUpdate = this.liquidsMaterial.needsUpdate = this.itemsMaterial.needsUpdate = true;


    // update camera, then handle camera-aligned objects

    this.camera.update();

    var cameraItems = this.sceneMeshesCameraAligned;
    var cameraItem;

    for (i = 0; i < cameraItems.length; i++) {

        cameraItem = cameraItems[i];
        this.cameraDummy.position.copy(this.camera.position);
        this.cameraDummy.position.y = cameraItem.position.y;
        //cameraItem.lookAt(this.cameraDummy.position);
        //cameraItem.lookAt(this.camera.position);

    }

};


SPLODER.PreviewArea.prototype.render = function (renderer3d) {

    renderer3d.render(this.sceneModel.scene, this.camera);
    this.isDirty = false;

};
