/**
 * Created by ggaudrea on 8/7/15.
 */

SPLODER.GameSceneModel = function () {

    SPLODER.SceneFactory.call(this);

    this.refreshed = false;

    this.playerMesh = null;
    this.playerX = 0;
    this.playerY = 0;

    this.healthBars = [];

    this.pointHelper = null;

};

SPLODER.GameSceneModel.prototype = Object.create(SPLODER.SceneFactory.prototype);
SPLODER.GameSceneModel.prototype.constructor = SPLODER.GameSceneModel;


SPLODER.GameSceneModel.prototype.build = function (renderer) {

    SPLODER.SceneFactory.prototype.build.call(this, renderer);

    var geom = new THREE.Geometry();
    var vertex = new THREE.Vector3(0, 0, 0);
    geom.vertices.push(vertex)
    __ptGeom = geom;
    __pt = vertex;

    this.model.pointHelper = new THREE.Points(geom, new THREE.PointsMaterial({ size: 20, color: 0xff0000 }));

    this.scene.add(this.model.pointHelper);


}



SPLODER.GameSceneModel.prototype.updateModel = function () {

    console.warn("SCENE REFRESH: Try to avoid this!");

    SPLODER.SceneFactory.prototype.updateModel.call(this);

    this.healthBars = [];

    var items = this.model.items;

    var i = items.length;
    var gameItem;
    var health;
    var meshesById;
    var mesh;

    while (i--) {

        gameItem = items[i];
        meshesById = this.sceneMeshesById[gameItem.id];
        mesh = meshesById ? meshesById[0] : null;

        health = gameItem.getAttrib(SPLODER.GameProps.PROPERTY_HEALTH);

        var isItemWithHealth = gameItem.type == SPLODER.Item.TYPE_ITEM && gameItem.specialTag == SPLODER.GameProps.TAG_EVIL;
        var isBipedWithHealth = gameItem.type == SPLODER.Item.TYPE_BIPED && gameItem.specialTag == SPLODER.GameProps.TAG_EVIL;
        var isItemOfValue = gameItem.type == SPLODER.Item.TYPE_ITEM && (gameItem.specialTag == SPLODER.GameProps.TAG_WEAPON || gameItem.specialTag == SPLODER.GameProps.TAG_ARMOR || gameItem.specialTag == SPLODER.GameProps.TAG_POWERUP);

        if (gameItem.specialTag) {
            // console.log("FLOOP", gameItem.id, isItemWithHealth, isBipedWithHealth, isItemOfValue, gameItem.type == SPLODER.Item.TYPE_BIPED, gameItem.specialTag);
        }

        if (gameItem.type == SPLODER.Item.TYPE_ITEM &&
            (
                gameItem.specialTag == SPLODER.GameProps.TAG_WEAPON ||
                gameItem.specialTag == SPLODER.GameProps.TAG_ARMOR ||
                gameItem.specialTag == SPLODER.GameProps.TAG_POWERUP
            )
           ) {

            if (mesh) {
                // console.log("Adding score value bar to game item", gameItem.id);
                this.healthBars[gameItem.id] = new SPLODER.ScoreValueBar().init(gameItem, mesh, this.assets.getTextMaterial());
            }

        } else if (health > 0 && (isItemWithHealth || isBipedWithHealth)) {

            if (mesh) {
                // console.log("Adding health value bar to game item", gameItem.id);
                this.healthBars[gameItem.id] = new SPLODER.HealthBar().init(gameItem, mesh, this.assets.getHealthMaterial());
            }

        }


    }

    this.buildPlayer();

    this.refreshed = true;

}

SPLODER.GameSceneModel.prototype.buildPlayer = function () {

    if (this.model.player) {

        if (this.playerMesh) {
            this.scene.remove(this.playerMesh);
            SPLODER.MeshUtils.destroyMesh(this.playerMesh, false);
            this.playerMesh = null;
        }

        // console.log(this.model.player.getAttrib(SPLODER.Biped.PROPERTY_ITEMFRAME_RIGHT), this.model.player.getAttrib(SPLODER.Biped.PROPERTY_ITEMFRAME_LEFT));

        //console.log(this.model.player)
        //this.model.player.setAttrib(SPLODER.Biped.PROPERTY_HEIGHT, 0);
        //this.model.player.setAttrib(SPLODER.Biped.PROPERTY_ITEMFRAME_RIGHT, 8);
        //this.model.player.setAttrib(SPLODER.Biped.PROPERTY_ITEMFRAME_LEFT, 2);

        this.playerMesh = this.buildMesh(this.model.player);
        this.playerMesh.position.x = this.camera.position.x;
        this.playerMesh.position.z = this.camera.position.z;
        this.model.player.biped = this.playerMesh.userData.biped;

    }

}


SPLODER.GameSceneModel.prototype.removeMeshesById = function (rects, preserveMaterials) {

    if (!(rects instanceof Array)) {
        rects = [rects];
    }

    var j = rects.length;
    var id;
    var mats = null;

    if (preserveMaterials) mats = [];

    while (j--) {

        id = rects[j].id;

        if (rects[j].type == SPLODER.Item.TYPE_PARTICLE) {
            this.removeParticleGroup(id);
        }

        var meshes = this.sceneMeshesById[id];

        if (meshes) {

            var i = meshes.length;
            var mesh, idx;

            while (i--) {

                mesh = meshes[i];

                if (mesh instanceof THREE.Group || mesh instanceof THREE.Mesh) {

                    idx = this.sceneMeshes.indexOf(mesh);

                    if (idx != -1) {
                        this.sceneMeshes.splice(idx, 1);
                    }

                    if (preserveMaterials) {

                        if (mesh instanceof THREE.Mesh) {

                            mats.unshift(mesh.material);

                        } else if (mesh.userData.biped) {

                            mats = mesh.userData.biped.materials;

                        }

                    }

                    // console.log("REMOVING MESH", mesh);

                    this.scene.remove(mesh);

                    SPLODER.MeshUtils.destroyMesh(mesh, preserveMaterials)

                }

            }

            this.sceneMeshesById[id] = null;
            this.sceneUniformsById[id] = null;

        }

    }

    return mats;

};

SPLODER.GameSceneModel.prototype.update = function (_frame, player) {

    SPLODER.SceneFactory.prototype.update.call(this, _frame);

    if (this.model.player && this.camera && this.playerMesh) {

        this.playerMesh.position.x = this.camera.position.x;
        this.playerMesh.position.z = this.camera.position.z;
        this.playerMesh.position.y = this.camera.position.y - 120;
        this.playerMesh.rotation.y = this.model.player.heading;
        this.playerMesh.position.x -= 20 * Math.sin(this.model.player.heading);
        this.playerMesh.position.z -= 20 * Math.cos(this.model.player.heading);

        //this.playerMesh.userData.biped.setPose(SPLODER.BipedPoses.POSE_ATTACK)
        this.playerMesh.userData.biped.poses.update(_frame)

    }

    var items = this.model.items;

    if (items) {

        var i = items.length;
        var g;

        while (i--) {

            g = items[i];

            if (g.gameProps && (this.refreshed || g.gameProps.changed)) {

                // console.log("item changed", g.id);

                if (this.healthBars[g.id]) {
                    this.healthBars[g.id].update();
                }

                g.gameProps.changed = false;

            }

        }

    }

    // __ptGeom.verticesNeedUpdate = true;
    this.refreshed = false;

}


SPLODER.GameSceneModel.prototype.onPlayerChanged = function (prop) {

    switch (prop) {

        case SPLODER.GameProps.PROPERTY_ITEMFRAME_RIGHT:
        case SPLODER.GameProps.PROPERTY_ITEMFRAME_LEFT:

            this.buildPlayer();
            break;

    }

}



SPLODER.GameSceneModel.prototype.onModelChanged = function (actionType, data, prop) {

    var j, rect;
    var usById = this.sceneUniformsById;

    if (actionType == SPLODER.ACTION_CHANGE_GAMEPROPS) {
        if (prop == -1) this.onPlayerChanged(data);
        return;
    }

    if (actionType == SPLODER.ACTION_CONTEXT_CHANGE) {
        this.setDirty();
        this.assets.setLightMapDirty();
    }

    if (actionType == SPLODER.ACTION_DESELECT) {
        this.setAllUniforms('selected', 0);
        return;
    }

    // console.log(actionType);

    if (data instanceof Array) {

        switch (actionType) {

            case SPLODER.ACTION_SELECT_ITEM:
            case SPLODER.ACTION_SELECT_POINT:

                this.setAllUniforms('selected', 0);

                j = data.length;

                while (j--) {

                    rect = data[j];
                    uu = usById[rect.id];

                    if (uu) {
                        i = uu.length;
                        while (i--) {
                            u = uu[i];
                            if (u && u.selected) {
                                u.selected.value = 1;
                            }
                        }
                    }


                }
                break;

            case SPLODER.ACTION_SET_CURRENTSTATE:
            case SPLODER.ACTION_CHANGE:

                j = data.length;

                if (j) {

                    while (j--) {

                        rect = data[j];

                        this.updateMeshPositionById(rect.id);
                        this.updateMeshTexturesById(rect.id);

                        if (rect.moving) {
                            this.updateVertexColors(rect);
                        }

                    }

                }
                break;

        }

    } else if (data && data.id) {

        rect = data;

        switch (actionType) {

            case SPLODER.ACTION_SET_CURRENTSTATE:
            case SPLODER.ACTION_CHANGE:

                this.updateMeshPositionById(rect.id);
                this.updateMeshTexturesById(rect.id);

                if (rect.moving) {
                    this.updateVertexColors(rect);
                }
                break;

            case SPLODER.ACTION_CREATE:
            case SPLODER.ACTION_ACTIVATE:

                // console.log("SETTING MESH VISIBILITY ON", rect.id)
                this.setMeshVisibilityById(rect.id, true);
                break;

            case SPLODER.ACTION_DEACTIVATE:
            case SPLODER.ACTION_DESTROY:

                // console.log("SETTING MESH VISIBILITY OFF", rect.id)
                this.setMeshVisibilityById(rect.id, false);
                break;

        }

    }

};