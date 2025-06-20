/**
 * Created by ggaudrea on 3/4/15.
 */

SPLODER.GameView = function () {

    this.domElement = null;
    this.renderer = null;

    this.model = null;
    this.player = null;
    this.envModel = null;
    this.sceneAssets = null;
    this.loadComplete = null;

    this.selected = null;
    this.selectedMeshId = null;
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
    this.raycaster = null;
    this.mouse = null;

    this.isDirty = true;
    this.ready = false;

    var _autoCamera = true;

    this.posBuffer = new THREE.Vector3(0, 0, 0);

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


SPLODER.GameView.prototype.initWithModelsAndSize = function (model, envModel, sceneAssets, width, height, tilesize, pixelRatio) {

    this.model = model;
    this.envModel = envModel;
    this.width = width;
    this.height = height;
    this.tilesize = tilesize || 32;
    this.tilesizeHalf = this.tilesize * 0.5;
    this.pixelRatio = pixelRatio || 1.0;

    this.selected = new signals.Signal();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.sceneAssets = sceneAssets;
    this.loadComplete = new signals.Signal();

    return this;

};


SPLODER.GameView.prototype.setSize = function (width, height) {

    this.width = width;
    this.height = height;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.sceneAssets.setViewportSize(width, height);

};


SPLODER.GameView.prototype.build = function (domElement, renderer) {

    this.domElement = domElement;
    this.renderer = renderer;

    this.camera = new SPLODER.PlayerCamera(70, this.width / this.height, 1, 2400 );
    this.cameraAngle = new THREE.Vector3();

    this.sceneMeshesCameraAligned = [];
    this.sceneAssets.prepared.addOnce(this.onAssetsPrepared, this);

    var elem = document.getElementById('game_container')

    if (elem) {
        elem.addEventListener('mouseup', SPLODER.bind(this, this.onMouseUp), false);
        //elem.addEventListener( 'mousemove', SPLODER.bind(this, this.onMouseMove), false );
        elem.addEventListener('mousedown', SPLODER.bind(this, this.onMouseDown), false);
    }
};


SPLODER.GameView.prototype.onAssetsPrepared = function () {

    this.sceneAssets.assignUniformValue('cameraAngle', this.cameraAngle);
    this.buildScene();
    this.loadComplete.dispatch(true);
    this.sceneAssets.forcedUpdateOnly = false;
    this.sceneModel.updateLightMap(true);

};



SPLODER.GameView.prototype.buildScene = function () {

    this.sceneModel = new SPLODER.GameSceneModel().initWithModelsAndSize(this.model, this.envModel, this.sceneAssets, this.tilesize);
    this.sceneModel.build(this.renderer);
    this.sceneModel.watchModel();

    this.camera.setModel(this.model, this.tilesize);
    this.camera.setPosition(0, 72 * this.tilesizeHalf, this.tilesize * 10);
    this.camera.setTarget(0, 76 * this.tilesizeHalf, this.tilesize * 10 - 2000);
    this.camera.easeFactor = 0.25;

    this.sceneModel.camera = this.camera;
    this.sceneModel.cameraAngle = this.cameraAngle;

    var scene = this.sceneModel.scene;

    scene.add(this.camera);

    this.cameraDummy = new THREE.Camera();
    scene.add(this.cameraDummy);

    this.ready = true;

    this.updatePreview();

    this.model.changed.add(this.onModelChanged, this);

};


SPLODER.GameView.prototype.onMouseDown = function (e) {

    this.mouse.x = e.offsetX;
    this.mouse.y = e.offsetY;

};


SPLODER.GameView.prototype.onMouseUp = function (e) {

    // select on tap only

    var pointerLocked = document['pointerLockElement'] != null;


    if (Math.abs(this.mouse.x - e.offsetX) +
        Math.abs(this.mouse.y - e.offsetY) < 10) {

        var ptX = pointerLocked ? this.width / 2 : this.mouse.x;
        var ptY = pointerLocked ? this.height / 2 : this.mouse.y;

        // console.log(this.mouse.x, this.mouse.y, pointerLocked, ptX, ptY, document['pointerLockElement'])

        var rayPos = new THREE.Vector2();
        rayPos.x = ( ptX / this.width * 2.0) - 1;
        rayPos.y = - ( ptY / this.height * 2.0) + 1;

        this.raycaster.setFromCamera(rayPos, this.camera);

        var intersects = this.raycaster.intersectObjects(this.sceneModel.scene.children, true);

        console.log("RAYCAST", intersects);

        for (var i = 0; i < intersects.length; i++) {

            if (intersects[i].hasOwnProperty('object') && intersects[i].object instanceof THREE.Mesh) {

                var mesh = intersects[i].object;
                var rect;

                if (mesh.userData.hasOwnProperty('rect')) {

                    rect = mesh.userData.rect;

                    if (!this.model.itemWithIdIsSelected(rect.id, true)) {

                        if (!rect.selectable) break;

                        this.posBuffer.x = rect.x * 32 + rect.width * 16;
                        this.posBuffer.z = rect.y * 32 + rect.height * 16;

                        var selection_dist = SPLODER.Geom.distanceBetweenXZ(this.posBuffer, this.camera.position);
console.log(selection_dist, rect.id, this.posBuffer.x, this.posBuffer.z, this.camera.position.x, this.camera.position.z)
                        if (selection_dist > 280) break;

                        this.selectedMeshId = mesh.uuid;
                        this.selected.dispatch([SPLODER.ACTION_SELECT_ITEM, rect]);

                        return;

                    }

                    break;

                }

            }

        }

        this.selected.dispatch([SPLODER.ACTION_DESELECT]);

    }

};


SPLODER.GameView.prototype.scroll = function (deltaX, deltaY) {

    this.camControls.scroll(deltaX, deltaY);

};


SPLODER.GameView.prototype.setDirty = function () {

    this.isDirty = true;

};


SPLODER.GameView.prototype.onModelChanged = function (actionType, data, prop) {
return;
    if (!this.sceneModel) return;

    this.isDirty = true;

    var len = this.model.selection.length;
    var t = this.tilesize;
    var th = this.tilesizeHalf;

    if (!this.autoCamera) return;

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
          //  scope.onModelChanged.apply(scope, args);
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
                    prop == SPLODER.Item.PROPERTY_TOPWALLCORNICETEXTURE) {

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



SPLODER.GameView.prototype.updatePreview = function () {

    if (!this.ready) {
        return;
    }

    // TODO: Move to game view only

    this.isDirty = false;

};

SPLODER.GameView.prototype.update = function (delta) {

    if (!this.ready) {
        return;
    }

    var forceCollisionCheck = this.sceneModel.isDirty;

    this.sceneModel.update(delta, this.player);

    if (this.isDirty || forceCollisionCheck) {
        this.updatePreview();
    }

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



};


SPLODER.GameView.prototype.render = function (renderer3d) {

    renderer3d.render(this.sceneModel.scene, this.camera);
    this.isDirty = false;

};
