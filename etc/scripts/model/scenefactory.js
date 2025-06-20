/**
 * Created by ggaudrea on 3/4/15.
 */

SPLODER.SceneFactory = function () {

    this.model = null;
    this.shapes = null;
    this.shapesById = null;
    this.ceilingShapes = null;
    this.tilesize = 32;
    this.tilesizeHalf = 16;

    this.scene = null;
    this.renderer = null;

    this.sceneMeshes = null;
    this.sceneMeshesById = null;
    this.sceneUniforms = null;
    this.sceneUniformsById = null;

    this.particleGroups = null;
    this.particleGroupsById = null;

    this.sceneMeshesHovering = null;

    this.light = null;
    this.camera = null;
    this.cameraDummy = null;
    this.cameraAngle = null;
    this.isDirty = true;

    this.assets = null;
    this.lightMap = null;
    this.emptyArray = [];

    this.wireFrameMaterial = new THREE.MeshBasicMaterial({
        wireframe: true,
        wireframeLinewidth: 0.5,
        color: 0x999999
    })

    var image = document.createElement( 'img' );
    var texture = this.particleTexture = new THREE.Texture( image );
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    image.onload = function()  {
        texture.needsUpdate = true;
    };
    image.src = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAG0lEQVQI12P4+/9/AzJmABH//v//D8K4BZAxALLRObHTMzLjAAAAAElFTkSuQmCC";

    var image2 = document.createElement( 'img' );
    texture2 = this.particleRoundTexture = new THREE.Texture( image2 );
    //texture2.minFilter = texture2.magFilter = THREE.NearestFilter;
    image2.onload = function()  {
        texture2.needsUpdate = true;
    };
    image2.src = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA0UlEQVRYw82XzQ2DMAxGcyIjMAVzsBgbZCOkTJEjI5D742KpVEJV2kI+PykXlGDHdvwTQiNABGYgAStQgN1WsW/J9sRwF8BoP660U+3M+I/gAVi+FHylyAIMv9w6cx+52RrABGzczwZMLTd/QvhZifGTzzPPky9jwoKlF8uV6WtHBeqbK+zN9iadM1wVKFCBGCx1qphV5n+5wYqIijVYJVNRgpVTFbsLBeQukAeh/BnKE5E2FcuLkYtyLG9IXLRk8qbURVvuYjBxMZq5GE57jecHuK8a9COL7yoAAAAASUVORK5CYII=";

};


SPLODER.SceneFactory.prototype.initWithModelsAndSize = function (model, envModel, assets, tilesize) {

    this.model = model;
    this.envModel = envModel;
    this.assets = assets;
    this.tilesize = tilesize || 32;
    this.tilesizeHalf = this.tilesize * 0.5;

    this.shapesById = [];
    this.sceneMeshes = [];
    this.sceneMeshesById = [];
    this.sceneMeshesHovering = [];
    this.sceneUniforms = [];
    this.sceneUniformsById = [];
    this.particleGroups = [];
    this.particleGroupsById = [];

    SPLODER.ShapeUtils.errorOccured.add(this.onError);

    return this;

};


SPLODER.SceneFactory.prototype.build = function (renderer) {

    var light;

    this.renderer = renderer;

    this.scene = new THREE.Scene();

   // light = new THREE.PointLight(0xffffff, 1.0, 2560);
    //light.position.y = 16 * 72;
    //this.scene.add(light);

    var envs = this.envModel.getEnvs();
    if (envs) {
        this.setSkyColor(null, envs[SPLODER.EnvModel.PROPERTY_SKY_COLOR]);
    } else {
        console.log("ENVIRONMENT UNDEFINED");
    }


};


SPLODER.SceneFactory.prototype.watchModel = function () {

    this.model.changed.add(this.onModelChanged, this);
    this.envModel.changed.add(this.onEnvModelChanged, this);
    this.updateModel();

};


SPLODER.SceneFactory.prototype.onModelChanged = function (actionType, data, prop) {

    this.setDirty();

};

SPLODER.SceneFactory.prototype.onEnvModelChanged = function () {

    console.log("ENV MODEL CHANGED", arguments);
    var envs = this.envModel.getEnvs();

    var skyColor = new THREE.Color();
    skyColor.setHex(envs[SPLODER.EnvModel.PROPERTY_SKY_COLOR]);
    this.setSkyColor(skyColor);

};


SPLODER.SceneFactory.prototype.setAllUniforms = function (key, value) {

    var us = this.sceneUniforms;

    var i = us.length;

    while (i--) {
        u = us[i];
        if (u && u.hasOwnProperty(key)) {
           u[key].value = value;
        }
    }

};


SPLODER.SceneFactory.prototype.setDirty = function () {

    this.isDirty = true;

};


SPLODER.SceneFactory.prototype.getObjectById = function (id, idx) {

    idx = idx || 0;

    if (this.sceneMeshesById[id]) {
        return this.sceneMeshesById[id][idx];
    }

};

SPLODER.SceneFactory.prototype.hasObjectWithId = function (id) {

    return this.sceneMeshesById[id] != null;

};


SPLODER.SceneFactory.prototype.setVertexColors = function (rect, geom) {

    if (!rect || !geom || !geom.faces) return;

    var j = geom.faces.length;

    var face;
    var normal;
    var v = geom.vertices;
    var faceCenterX;
    var faceCenterY;
    var liquid;

    var changed = false;

    while (j--) {

        face = geom.faces[j];
        normal = face.normal;
        face.color.setRGB(0, 0, 0);

        faceCenterX = (v[face.a].x + v[face.b].x + v[face.c].x) / 3 / 32.0;
        faceCenterY = (v[face.a].y + v[face.b].y + v[face.c].y) / 3 / 32.0;

        faceCenterX += rect.x;
        faceCenterY += rect.y;

        liquid = this.model.getItemUnderPoint(faceCenterX, faceCenterY, 0, SPLODER.Item.TYPE_LIQUID);

        if (liquid) {

            face.color.setRGB(liquid.getAttrib(SPLODER.Item.PROPERTY_LIQUIDLEVEL), liquid.getAttrib(SPLODER.Item.PROPERTY_LIQUIDTYPE), 0);
            changed = true;

        }

    }

    if (changed) geom.colorsNeedUpdate = true;

};



SPLODER.SceneFactory.prototype.updateMeshTexturesById = function (id) {

    var meshes = this.sceneMeshesById[id];

    if (meshes) {

        var rect = this.model.getItemById(id);

        if (meshes[0]) this.setTextures(rect, meshes[0].material);
        if (meshes[1]) this.setTextures(rect, meshes[1].material);

        if (rect && rect.type <= SPLODER.Item.TYPE_LIQUID) {

            var i = rect.numChildren;

            if (i) {

                var children = rect.children;

                while (i--) {

                    this.updateMeshTexturesById(children[i].id);

                }

            }

        }

    }

};


SPLODER.SceneFactory.prototype.setTextures = function (rect, material) {

    if (rect && material) {

        var u = material.uniforms;

        if (!u) return;

        var forCeiling = (u.ceiling) ? u.ceiling.value : 0;
        var altType;
        if (rect.type == SPLODER.Item.TYPE_LIQUID && !forCeiling) altType = SPLODER.SceneAssets.TYPE_WALLS;
        var textureSet = this.assets.getTextureSet(rect, altType);

        var frames = [];
        var tids, tid, f;

        switch (rect.type) {

            case SPLODER.Item.TYPE_LIQUID:

                if (forCeiling) {
                    u.textureSet.value = [rect.getAttrib(SPLODER.Item.PROPERTY_LIQUIDTYPE), 0, 0];
                    break;
                }

            /* falls through */


            case SPLODER.Item.TYPE_WALL:

                if (forCeiling && rect.getAttrib(SPLODER.Item.PROPERTY_CEIL_SKY)) return;

            /* falls through */


            case SPLODER.Item.TYPE_PLATFORM:

                if (u.textureSet) {

                    u.textureSet.value = tids = !forCeiling ? textureSet[0] : textureSet[1];

                    for (f = 0; f < 3; f++) {
                        tid = tids[f];
                        frames = frames.concat(this.assets.getTextureFrames(SPLODER.SceneAssets.TYPE_WALLS, tid));
                    }

                    u.frames.value = frames;

                }

                break;

            case SPLODER.Item.TYPE_PANEL:
            case SPLODER.Item.TYPE_ITEM:

                tids = textureSet;
                u.textureSet.value = tids;

                for (f = 0; f < 3; f++) {
                    tid = tids[f];
                    frames = frames.concat(this.assets.getTextureFrames(SPLODER.SceneAssets.TYPE_ITEMS, tid));
                }

                u.frames.value = frames;

                break;

            case SPLODER.Item.TYPE_PARTICLE:

                if (u.textureSet) {

                    u.textureSet.value = tids = !forCeiling ? textureSet[0] : textureSet[1];

                    for (f = 0; f < 3; f++) {
                        tid = tids[f];
                        frames = frames.concat(this.assets.getTextureFrames(SPLODER.SceneAssets.TYPE_WALLS, tid));
                    }

                    u.frames.value = frames;

                }

                break;

        }

        if (u.hasOwnProperty('selected')) {
            u.selected.value = this.model.itemWithIdIsSelected(rect.id) ? 1 : 0;
        }

    }

};


SPLODER.SceneFactory.prototype.buildMesh = function (rect, rectShape, forCeiling, mats) {

    if (!rect) return;

    if (rect instanceof Array) {
        console.log("RECT IS ARRAY", rect);
        return;
    }

    mats = mats || this.emptyArray;

    if (rectShape == null && (rect.type < SPLODER.Item.TYPE_LIQUID || (rect.type == SPLODER.Item.TYPE_LIQUID && !forCeiling))) {

        var shapes = !forCeiling ? this.shapes : this.ceilingShapes;

        if (shapes) {
            var i = shapes.length;

            while (i--) {

                try {
                    if (shapes[i].userData.parentNode.id == rect.id) {

                        rectShape = shapes[i];
                        break;

                    }
                } catch (err) {

                    console.log("error checking rectShape");

                }

            }
        }

        if (rectShape == null) {
            console.log("Error! Item shape not found for rect", rect.id, forCeiling, this.shapes.length, this.ceilingShapes.length);
            this.setDirty();
            return;
        }

    }

    var geom, mesh, mesh2, floorDepth, ceilingIsSky, ceilDepth, textureSet;
    var material, u;
    var t = this.tilesize;
    var th = this.tilesizeHalf;
    var frames, tids;
    var x, y, w, h, r, mw, mh;

    x = rect.x;
    y = rect.y;
    w = rect.width;
    h = rect.height;

    var options = {
        bevelEnabled: false
    };

    floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
    ceilDepth = rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);
    ceilingIsSky = rect.getAttrib(SPLODER.Item.PROPERTY_CEIL_SKY);

    textureSet = this.assets.getTextureSet(rect);


    mesh = null;
    u = null;

    switch (rect.type) {

        case SPLODER.Item.TYPE_WALL:

            options.amount = 128 * th;

            try {
                geom = new THREE.ExtrudeGeometry(rectShape, options);
            } catch (err) {
                console.log(err.stack);
                return;
            }

            if (!forCeiling || !ceilingIsSky) {

                var mat_idx = forCeiling ? 1 : 0;

                if (mats[mat_idx] instanceof THREE.ShaderMaterial) {
                    material = mats[mat_idx];
                } else {
                    material = this.assets.getNewMaterial(SPLODER.SceneAssets.TYPE_WALLS);
                }

                u = material.uniforms;
                if (u && u.ceiling) {
                    u.ceiling.value = !forCeiling ? 0 : 1;
                }

                this.setTextures(rect, material);
                this.setVertexColors(rect, geom);

            } else {

                material = this.assets.getNewMaterial(SPLODER.SceneAssets.TYPE_SKIES);
                u = material.uniforms;
                u.ceiling.value = 1;

            }

            mesh = new THREE.Mesh(geom, material);
            this.updateMeshPosition(mesh, rect, forCeiling);

            break;

        case SPLODER.Item.TYPE_PLATFORM:

            options.amount = Math.max(1, ceilDepth) * th;
            try {
                geom = new THREE.ExtrudeGeometry(rectShape, options);
            } catch (err) {
                console.log(err.stack);
                return;
            }

            material = mats[0] || this.assets.getNewMaterial(SPLODER.SceneAssets.TYPE_WALLS);
            u = material.uniforms;
            u.ceiling.value = 0;

            this.setTextures(rect, material);
            this.setVertexColors(rect, geom);

            mesh = new THREE.Mesh(geom, material);
            this.updateMeshPosition(mesh, rect);

            break;

        case SPLODER.Item.TYPE_LIQUID:

            if (forCeiling) {

                geom = new THREE.PlaneBufferGeometry(rect.width * t, rect.height * t, 1);

                material = mats[0] || this.assets.getNewMaterial(SPLODER.SceneAssets.TYPE_LIQUIDS);
                u = material.uniforms;
                u.ceiling.value = 1;

                this.setTextures(rect, material);

            } else if (rect.getAttrib(SPLODER.Item.PROPERTY_LIQUID_HASFLOOR) != 0) {

                options.amount = 128 * th;

                try {
                    geom = new THREE.ExtrudeGeometry(rectShape, options);
                } catch (err) {
                    console.log(err.stack);
                    return;
                }

                material = this.assets.getNewMaterial(SPLODER.SceneAssets.TYPE_WALLS);

                u = material.uniforms;
                u.ceiling.value = 0;

                this.setTextures(rect, material);
                this.setVertexColors(rect, geom);

            }

            mesh = new THREE.Mesh(geom, material);
            this.updateMeshPosition(mesh, rect, forCeiling);

            break;

        case SPLODER.Item.TYPE_PANEL:

            material = mats[0] || this.assets.getNewMaterial(SPLODER.SceneAssets.TYPE_PANELS);
            u = material.uniforms;
            u.tiles.value = Math.max(1, Math.floor(Math.max(rect.width, rect.height) / 4));
            u.size.value = Math.max(rect.width, rect.height);


        case SPLODER.Item.TYPE_ITEM:

            if (!material) material = mats[0] || this.assets.getNewMaterial(SPLODER.SceneAssets.TYPE_ITEMS);
            u = material.uniforms;

            frames = this.assets.getTextureFrames(SPLODER.SceneAssets.TYPE_ITEMS, textureSet[0]);
            mw = frames[2] * 8 || 128;
            mh = frames[3] * 8 || 128;

            if (rect.type == SPLODER.Item.TYPE_PANEL) {

                var aspect = mw / mh;

                if (w >= h) mw = w;
                else mw = h;

                mh = mw / aspect;

                if (mw == mh && mw < 3){
                    mw *= 2;
                    mh *= 3;
                }

                mw *= t;
                mh *= t;

            }

            geom = new THREE.PlaneGeometry(mw, mh, 1);

            u.nofollow.value = (rect.type == SPLODER.Item.TYPE_PANEL && w != h) ? 1 : 0;
            if (u.nofollow.value == 0) u.tiles.value = 1;

            this.setTextures(rect, material);
            this.setVertexColors(rect, geom);

            if (u.nofollow.value == 1) {
                mesh = new THREE.Mesh(geom, material);
            } else {
                mesh = new THREE.FacingMesh(geom, material);
            }
            this.updateMeshPosition(mesh, rect);

            break;

        case SPLODER.Item.TYPE_BIPED:
        case SPLODER.Item.TYPE_PLAYER:

            material = mats[0] || this.assets.getNewMaterial(SPLODER.SceneAssets.TYPE_BIPEDS);
            u = material.uniforms;
            u.selected.value = this.model.itemWithIdIsSelected(rect.id) ? 1 : 0;

            var itemRight;
            var itemLeft;

            if ('gameProps' in rect) {

                itemRight = rect.gameProps.getProp(SPLODER.Biped.PROPERTY_ITEMFRAME_RIGHT);
                itemLeft = rect.gameProps.getProp(SPLODER.Biped.PROPERTY_ITEMFRAME_LEFT);

            } else {

                itemRight = rect.getAttrib(SPLODER.Biped.PROPERTY_ITEMFRAME_RIGHT);
                itemLeft = rect.getAttrib(SPLODER.Biped.PROPERTY_ITEMFRAME_LEFT);

            }

            if (itemRight >= 0) {

                var itemMaterialRight = mats[1] || this.assets.getNewMaterial(SPLODER.SceneAssets.TYPE_BIPEDS);
                this.assets.setAltTexture(itemMaterialRight, SPLODER.SceneAssets.TYPE_ITEMS);
                var itemFrameRight = this.assets.getTextureFrames(SPLODER.SceneAssets.TYPE_ITEMS, itemRight);
                itemMaterialRight.uniforms.frames.value = itemFrameRight.concat(itemFrameRight, itemFrameRight);

            }

            if (itemLeft >= 0) {

                var itemMaterialLeft = mats[2] || this.assets.getNewMaterial(SPLODER.SceneAssets.TYPE_BIPEDS);
                this.assets.setAltTexture(itemMaterialLeft, SPLODER.SceneAssets.TYPE_ITEMS);
                var itemFrameLeft = this.assets.getTextureFrames(SPLODER.SceneAssets.TYPE_ITEMS, itemLeft);
                itemMaterialLeft.uniforms.frames.value = itemFrameLeft.concat(itemFrameLeft, itemFrameLeft);

            }

            tids = textureSet[0];
            frames = this.assets.getTextureFrames(SPLODER.SceneAssets.TYPE_BIPEDS, tids);

            var biped = new SPLODER.Biped().initWithRectAndMaterial(rect, material, frames[0] || 0, frames[1] || 0);
            biped.setItemMaterials(itemMaterialRight, itemFrameRight, itemMaterialLeft, itemFrameLeft);
            biped.build();
            mesh = biped.mesh;

            var scope = this;

            biped.geometries.forEach(function (geom) {
                scope.setVertexColors(rect, geom);
            });

            this.updateMeshPosition(mesh, rect);

            break;

        case SPLODER.Item.TYPE_PARTICLE:

            this.removeParticleGroup(rect.id);

            options.amount = Math.max(1, ceilDepth) * th;
            try {
                geom = new THREE.BoxGeometry(rect.width * t, rect.height * t, options.amount, 1 + Math.floor(rect.width / 8), 1 +  Math.floor(rect.height / 8), 1 + Math.floor(ceilDepth / 8));
            } catch (err) {
                console.log(err.stack);
                return;
            }
            console.log(options.amount)

            material = this.wireFrameMaterial;
            u = null;

            this.setTextures(rect, material);
            this.setVertexColors(rect, geom);

            mesh = new THREE.Mesh(geom, material);
            this.updateMeshPosition(mesh, rect);

            if (!window.editor) {
               mesh.visible = false;
            }


            // Used in initParticles()
            var emitter, particleGroup;

            var pColor = SPLODER.Store.PARTICLE_COLOR_CHOICES[rect.getAttrib(SPLODER.Item.PROPERTY_COLOR)];

            var pSize = rect.getAttrib(SPLODER.Item.PROPERTY_PSIZE);
            var pAmount = rect.getAttrib(SPLODER.Item.PROPERTY_PAMOUNT) * 2;
            var pMaxAge = rect.getAttrib(SPLODER.Item.PROPERTY_PMAXAGE);
            var pSpeed = (rect.getAttrib(SPLODER.Item.PROPERTY_PSPEED) - 50) * 8;
            var pHoriz = rect.getAttrib(SPLODER.Item.PROPERTY_PHORIZ);
            var pGravity = rect.getAttrib(SPLODER.Item.PROPERTY_PGRAVITY);
            var pRound = rect.getAttrib(SPLODER.Item.PROPERTY_PROUND);
            var pVary = rect.getAttrib(SPLODER.Item.PROPERTY_PVARY);

            console.log("Particle:", pSize, pAmount, pMaxAge, pSpeed, pHoriz, pGravity);

            particleGroup = new SPE.Group({
                texture: {
                    value: pRound ? this.particleRoundTexture : this.particleTexture
                },
                maxParticleCount: 2000
            });

            particleGroup.rect = rect;

            // if (pGravity) pSpeed *= 2;

            var opacity = 0.35 / Math.max(1, pSize * 0.1);

            emitter = new SPE.Emitter({
                type: SPE.distributions.BOX,
                maxAge: {
                    value: pMaxAge * 0.025
                },
                position: {
                    value: new THREE.Vector3(rect.x * t + rect.width * t * 0.5, floorDepth * th - ceilDepth * 0.5 * th, rect.y * t + rect.height * t * 0.5),
                    spread: new THREE.Vector3(rect.width * t, ceilDepth * th, rect.height * t)
                },
                size: {
                    value: 2 + pSize
                },
                opacity: {
                    value: pMaxAge == 100 ? 0.25 : [0, opacity, opacity, 0]
                },
        		velocity: {
                    value: !pHoriz ? new THREE.Vector3(0, pSpeed, 0) : rect.width > rect.height ? new THREE.Vector3(pSpeed, 0, 0) : new THREE.Vector3(0, 0, pSpeed)
                },
                acceleration: {
                    value: pGravity ? new THREE.Vector3(0, -200, 0) : new THREE.Vector3(0, 0, 0),
                    spread: pVary ? new THREE.Vector3(pSpeed, pSpeed, pSpeed) : new THREE.Vector3(0, 0, 0)
                },
                wiggle: {
                    value: pVary ? pSpeed * 0.5 : 0
                },
                color: {
                    value: new THREE.Color(pColor)
                },
                particleCount: 1 + pAmount * 10,
                colorize: true,
                isStatic: pMaxAge == 100


            });

            particleGroup.addEmitter( emitter );
            this.particleGroups.push(particleGroup);
            this.particleGroupsById[rect.id] = particleGroup;
            mesh2 = particleGroup.mesh;
            mesh2.userData.rect = rect;

/*
            setInterval(function () {
                var p = particleGroup.emitters[0].position;
                p.value = p.value.set(p.value.x + 5, p.value.y, p.value.z);

            })
*/
            break;

    }

    if (mesh) {

        this.scene.add(mesh);
        this.sceneMeshes.push(mesh);

        if (mesh2) {
            this.scene.add(mesh2);
            this.sceneMeshes.push(mesh2);
        }


        if (this.sceneMeshesById[rect.id]) {
            this.sceneMeshesById[rect.id].push(mesh);
        } else {
            this.sceneMeshesById[rect.id] = [mesh];
            if (mesh2) this.sceneMeshesById[rect.id].push(mesh2);
        }

        if (u) {

            this.sceneUniforms.push(u);

            if (this.sceneUniformsById[rect.id]) {
                this.sceneUniformsById[rect.id].push(u);
            } else {
                this.sceneUniformsById[rect.id] = [u];
            }

        }

    }

    return mesh;

};


SPLODER.SceneFactory.prototype.placeMesh = function (mesh, rect, x, y, z, rx, sz, ry) {

    if (!mesh.userData) mesh.userData = {};
    mesh.userData.rect = rect;

    if (rect.deactivated) {
        mesh.visible = false;
    }

    if (mesh.position) {

        mesh.position.set(x, y, z);

        if (!isNaN(rx)) {
            mesh.rotation.x = rx;
        }

        if (!isNaN(ry)) {
            mesh.rotation.y = ry;
        }

        if (!isNaN(sz)) {
            mesh.scale.z = sz;
        }

    }

};



SPLODER.SceneFactory.prototype.updateMeshPositionById = function (id, depth) {

    var i;
    var forCeiling;
    var meshes = this.sceneMeshesById[id];
    var rect;

    depth = depth || 0;

    if (meshes) {

        for (i = 0; i < 2; i++) {

            forCeiling = i;

            if (meshes[i]) {

                rect = meshes[i].userData.rect;

                if (!depth && (rect.type == SPLODER.Item.TYPE_PLATFORM)) {
                    if (rect.root != rect) {
                        this.updateMeshPositionById(rect.root.id);
                        return;
                    }
                }

                this.updateMeshPosition(meshes[i], rect, forCeiling);

            }

        }

    }

    if (rect && rect.type <= SPLODER.Item.TYPE_PLATFORM) {

        i = rect.numChildren;

        if (i) {

            var children = rect.children;

            while (i--) {

                this.updateMeshPositionById(children[i].id, depth + 1);

            }

        }

    }

};


SPLODER.SceneFactory.prototype.updateMeshPosition = function (mesh, rect, forCeiling) {

    if (mesh && rect) {

        var t = this.tilesize;
        var th = this.tilesizeHalf;

        var x = rect.x;
        var y = rect.y;
        var w = rect.width;
        var h = rect.height;
        var r = 0;
        var floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
        var ceilDepth = rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);
        var mw, mh;

        switch (rect.type) {

            case SPLODER.Item.TYPE_WALL:

                if (!forCeiling) {
                    this.placeMesh(mesh, rect, x * t, floorDepth * th, y * t, 90 * Math.PI / 180);
                } else {
                    this.placeMesh(mesh, rect, x * t, Math.max(ceilDepth, floorDepth) * th, y * t, 90 * Math.PI / 180, -1);
                }
                break;

            case SPLODER.Item.TYPE_PLATFORM:

                this.placeMesh(mesh, rect, x * t, floorDepth * th, y * t, 90 * Math.PI / 180);
                break;

            case SPLODER.Item.TYPE_LIQUID:

                if (forCeiling) {
                    this.placeMesh(mesh, rect, x * t + w * 0.5 * t, rect.getAttrib(SPLODER.Item.PROPERTY_LIQUIDLEVEL) * th + 0.01, y * t + h * 0.5 * t, -90 * Math.PI / 180);
                } else {
                    this.placeMesh(mesh, rect, x * t, floorDepth * th, y * t, 90 * Math.PI / 180);
                }
                this.updateVertexColorsIntersecting(rect);
                break;


            case SPLODER.Item.TYPE_PANEL:

                mw = mesh.geometry.parameters.width;
                mh = mesh.geometry.parameters.height;

                r = 0;
                if (w < h) r = Math.PI * 0.5;
                this.placeMesh(mesh, rect, x * t + w * 0.5 * t, floorDepth * th + mh * 0.5, y * t + h * 0.5 * t);
                mesh.rotation.y = r;
                break;

            case SPLODER.Item.TYPE_ITEM:

                mh = mesh.geometry.parameters.height;
                this.placeMesh(mesh, rect, x * t, (floorDepth * th) + mh * 0.5, y * t, 0, 1, rect.rotation * Math.PI / 180);

                break;

            case SPLODER.Item.TYPE_BIPED:
            case SPLODER.Item.TYPE_PLAYER:

                this.placeMesh(mesh, rect, x * t, floorDepth * th, y * t, 0, 1, rect.rotation * Math.PI / 180);
                break;

            case SPLODER.Item.TYPE_PARTICLE:

                var pg = this.particleGroupsById[rect.id];

                if (pg) {
                    var p = pg.emitters[0].position;
                    p.value = p.value.set(x * t + rect.width * 0.5 * t, floorDepth * th - ceilDepth * 0.5 * th, y * t + rect.height * 0.5 * t);
                }

                if (!pg || pg.mesh != mesh) this.placeMesh(mesh, rect, x * t + rect.width * 0.5 * t, floorDepth * th - ceilDepth * 0.5 * th, y * t + rect.height * 0.5 * t, -90 * Math.PI / 180);
                break;

        }

    }

};


SPLODER.SceneFactory.prototype.updateVertexColors = function (rect) {

    var scope = this;
    var meshes = this.sceneMeshesById[rect.id];

    if (meshes instanceof Array && meshes.length) {

        if (rect.type == SPLODER.Item.TYPE_BIPED || rect.type == SPLODER.Item.TYPE_PLAYER) {

            biped = meshes[0].userData.biped;
            biped.geometries.forEach(function (geom) {
                scope.setVertexColors(rect, geom);
            });

        } else {

            this.setVertexColors(rect, meshes[0].geometry);

        }

    }

};


SPLODER.SceneFactory.prototype.updateVertexColorsIntersecting = function (rect) {

    if (rect instanceof SPLODER.Item) {

        var nearRects = this.model.getItemsIntersectingRect(rect.x - 1, rect.y - 1, rect.width + 2, rect.height + 2);

        if (nearRects instanceof Array) {

            var scope = this;
            var biped;

            nearRects.forEach(function (item) {

                var meshes = scope.sceneMeshesById[item.id];

                if (meshes instanceof Array && meshes.length) {

                    if (item.type == SPLODER.Item.TYPE_BIPED) {

                        biped = meshes[0].userData.biped;
                        biped.geometries.forEach(function (geom) {
                            scope.setVertexColors(item, geom);
                        });

                    } else {

                        scope.setVertexColors(item, meshes[0].geometry);

                    }

                }

            });

        }

    }

};



SPLODER.SceneFactory.prototype.updateLightMap = function (forced) {

    this.assets.updateLightMap(this.model, this.shapes, forced);

};

SPLODER.SceneFactory.prototype.setSkyColor = function (color, hex) {

    if (color && !hex) hex = color.getHex();
    this.scene.fog = new THREE.Fog(hex, 1200, 2400);
    this.renderer.setClearColor(hex);

};

SPLODER.SceneFactory.prototype.updateShapes = function () {

    var newShapes;

    console.log("UPDATING SHAPES");
    newShapes = this.shapes = SPLODER.ShapeUtils.getShapes(this.model.items, false, this.tilesize);
    this.ceilingShapes = SPLODER.ShapeUtils.getShapes(this.model.items, true, this.tilesize);

    var i = this.shapes.length;

    this.shapesById = [];

    while (i--) {

        var shape = this.shapes[i];

        if (shape && shape.userData && shape.userData.parentNode) {
            this.shapesById[shape.userData.parentNode.id] = shape[0];
        }

    }

    return newShapes;

};


SPLODER.SceneFactory.prototype.addItemToModel = function (rect) {

    if (!rect) return;

    if (rect.type == SPLODER.Item.TYPE_ITEM || rect.type == SPLODER.Item.TYPE_BIPED || rect.type == SPLODER.Item.TYPE_PANEL || rect.type == SPLODER.Item.TYPE_PARTICLE) {

        this.buildMesh(rect);

        if (rect.getAttrib(SPLODER.GameProps.PROPERTY_HOVER) == 1) {
            console.log("ADDING HOVERING MESH")
            this.sceneMeshesHovering[rect.id] = this.sceneMeshesById[rect.id][0];
        }

    }

};


SPLODER.SceneFactory.prototype.updateModel = function () {

    if (!this.isDirty) {
        return;
    }

    this.updateShapes();

    var j = this.scene.children.length;
    var i;
    var child;

    // clear scene

    for (var pgid in this.particleGroupsById) {
        this.removeParticleGroup(pgid);
    }

    j = this.scene.children.length;

    while (j--) {
        child = this.scene.children[j];

        if (child.hasOwnProperty('children') && child.children.length > 0) {
            this.scene.remove(child);
        } else if (child instanceof THREE.Mesh) {
            this.scene.remove(child);
            child.geometry.dispose();
            // child.material.dispose();
            // child.dispose();
        }
    }

    // rebuild

    this.sceneMeshes = [];
    this.sceneMeshesById = [];
    this.sceneMeshesHovering = [];
    this.sceneUniforms = [];
    this.sceneUniformsById = [];
    this.particleGroups = [];
    this.particleGroupsById = [];

    var shapes = this.shapes;
    var ceilingShapes = this.ceilingShapes;
    var rectShape, rect;

    i = shapes.length;

    while (i--) {

        rectShape = shapes[i];
        rect = rectShape.userData.parentNode;

        if (!rect || rect.width <= 0 || rect.height <= 0) {
            continue;
        }

        this.buildMesh(rect, rectShape);


    }

    // add ceiling geoms and meshes for walls

    i = ceilingShapes.length;

    while (i--) {

        rectShape = ceilingShapes[i];
        rect = rectShape.userData.parentNode;

        if (rect.width <= 0 || rect.height <= 0) {
            continue;
        }

        this.buildMesh(rect, rectShape, true);

    }

    // add liquid surfaces

    i = shapes.length;

    while (i--) {

        rectShape = shapes[i];
        rect = rectShape.userData.parentNode;

        if (!rect || rect.type != SPLODER.Item.TYPE_LIQUID) {
            continue;
        }

        this.buildMesh(rect, rectShape, true);

    }

    // finally, add items

    var items = this.model.items;
    i = items.length;

    while (i--) {

        rect = items[i];

        this.addItemToModel(rect);

    }

    this.isDirty = false;

    if (!this.assets.forcedUpdateOnly) {
        this.assets.setLightMapDirty();
    }

};

SPLODER.SceneFactory.prototype.setMeshVisibilityById = function (id, visible) {

    var meshes = this.sceneMeshesById[id];

    if (meshes) {

        if (meshes[0]) meshes[0].visible = visible;
        if (meshes[1]) meshes[1].visible = visible;

    }

};

SPLODER.SceneFactory.prototype.removeParticleGroup = function (id) {

    var pg = this.particleGroupsById[id];

    if (pg) {
        this.scene.remove( pg.mesh );
        pg.dispose();
        if (pg.emitters) pg.emitters[0].remove();

        this.particleGroupsById[id] = null;
        var idx = this.particleGroups.indexOf(pg);
        if (idx >= 0) {
            console.log(idx);
            this.particleGroups.splice(idx, 1);
        }
        if (this.sceneMeshesById[id]) {
            var s = this.sceneMeshesById[id];
            while (s.length) {
                this.scene.remove(s.pop());
            }
        }
    }

};

SPLODER.SceneFactory.prototype.update = function (_frame) {

    var i;

    if (this.isDirty) {
        console.log("UPDATING MODEL")
        this.updateModel();
    }

    var time = Date.now();
    var sin_time = Math.sin(time / 160) * 8;

    for (var meshId in this.sceneMeshesHovering) {

        var mesh = this.sceneMeshesHovering[meshId];
        var rect = mesh.userData.rect;
        var multiplier = 1;

        mesh.position.y = (rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) + 4) * 16 + sin_time;
        
    }

    // the following loop is inefficient,
    // but necessary for jitter fix I have not root-caused

    i = this.sceneMeshes.length;

    while (i--) {

        var mesh = this.sceneMeshes[i];
        var rect = mesh.userData.rect;
        if (rect.type >= SPLODER.Item.TYPE_ITEM) {
            this.updateMeshPosition(mesh, rect, false);
        }

    }


    i = this.particleGroups.length;

    while (i--) {
        var pg = this.particleGroups[i];
        if (pg) {
            var prect = pg.rect;
            var emitter = pg.emitters[0];
            if (emitter.alive && prect.deactivated) {
                emitter.disable();
            } else if (!emitter.alive && !prect.deactivated) {
                emitter.enable();
            }
            pg.tick();
        }
    }

    this.updateLightMap();

};

SPLODER.SceneFactory.prototype.onError = function (rect) {

    console.log("Triangulation error in rect", rect.id);

};
