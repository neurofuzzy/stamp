/**
 * Created by ggaudrea on 3/4/15.
 */

SPLODER.SceneModel = function () {

    SPLODER.SceneFactory.call(this);

};

SPLODER.SceneModel.prototype = Object.create(SPLODER.SceneFactory.prototype);
SPLODER.SceneModel.prototype.constructor = SPLODER.SceneModel;



SPLODER.SceneModel.prototype.onModelChanged = function (actionType, data, prop) {

    var i, j, rect, u, uu;
    var usById = this.sceneUniformsById;

    var item;
    var selection = this.model.selection;

    //console.log("SCENEMODEL ONMODELCHANGED", actionType, data, prop);

    if (actionType == SPLODER.ACTION_DESELECT) {

        this.setAllUniforms('selected', 0);
        return;

    }

    if (actionType == SPLODER.ACTION_CONTEXT_CHANGE) {
        this.setDirty();
        this.assets.setLightMapDirty();
    }

    /*
    if (data instanceof Array) {
        console.log("Changed with action", actionType);
    } else {
        console.log("Changed with action", actionType, "but data is not array!");
    }
    */

    // update scene

    if (data instanceof Array) {

        switch (actionType) {

            case SPLODER.ACTION_SET_CURRENTSTATE:
                j = data.length;

                if (j) {

                    while (j--) {

                        rect = data[j];
                        this.updateMeshPositionById(rect.id);
                        this.updateMeshTexturesById(rect.id);

                    }
                } else {
                    this.setDirty();
                }

                //console.log("state changed!")
                break;


            case SPLODER.ACTION_SELECT_ALL:
            case SPLODER.ACTION_SELECT_ITEM:
            case SPLODER.ACTION_SELECT_POINT:
            case SPLODER.ACTION_SELECT_WINDOW:

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


            case SPLODER.ACTION_TWEAK_START:
            case SPLODER.ACTION_TWEAK_COMPLETE:
                return;

            case SPLODER.ACTION_TWEAK:

                if (prop < SPLODER.GameProps.PROPERTY_HEALTH) {

                    j = data.length;

                    this.removeMeshesById(data);

                    while (j--) {

                        rect = data[j];
                        this.buildMesh(rect);

                    }

                } else if (prop == SPLODER.GameProps.PROPERTY_GRAVITY) {

                    this.updateMeshPositionById(data[0].id);

                } else if (prop == SPLODER.GameProps.PROPERTY_HOVER) {

                    rect = data[0]
                    
                    this.removeMeshesById(rect);
                    this.addItemToModel(rect);
                    return;

                }

                break;


            case SPLODER.ACTION_CHANGE:

                j = data.length;

                while (j--) {

                    rect = data[j];
                    uu = usById[rect.id];

                    switch (prop) {

                        case SPLODER.Item.PROPERTY_FLOORDEPTH:
                        case SPLODER.Item.PROPERTY_CEILDEPTH:

                            if (rect.type == SPLODER.Item.TYPE_WALL || rect.type == SPLODER.Item.TYPE_PANEL || rect.type == SPLODER.Item.TYPE_ITEM) {
                                this.updateMeshPositionById(rect.id);
                            } else if (rect.type == SPLODER.Item.TYPE_PLATFORM) {
                                this.updateRectMeshes(rect, true);
                            } else  if (rect.type == SPLODER.Item.TYPE_LIQUID) {
                                this.updateMeshPositionById(rect.id);
                                this.updateVertexColorsIntersecting(rect);
                            } else if (rect.type == SPLODER.Item.TYPE_PARTICLE) {
                                this.updateRectMeshes(rect, true);
                            }
                            /* falls through */

                        case SPLODER.Item.PROPERTY_LIGHTLEVEL:
                        case SPLODER.Item.PROPERTY_LIGHTEFFECT:
                        case SPLODER.Item.PROPERTY_COLOR:
                        case SPLODER.Item.PROPERTY_POWER:

                            if (rect.type == SPLODER.Item.TYPE_PARTICLE) {
                                this.updateRectMeshes(rect, true);
                            } else {
                                this.assets.setLightMapDirty();
                            }
                            break;

                        case SPLODER.Rect.PROPERTY_TOPLEFT:
                        case SPLODER.Rect.PROPERTY_TOPRIGHT:
                        case SPLODER.Rect.PROPERTY_BOTTOMRIGHT:
                        case SPLODER.Rect.PROPERTY_BOTTOMLEFT:

                            if (rect.type == SPLODER.Item.TYPE_LIQUID) {
                                this.updateVertexColorsIntersecting(rect);
                            }

                            if (data.length == 1 && rect.type > SPLODER.Item.TYPE_LIQUID) {

                                this.removeMeshesById(data);
                                this.buildMesh(rect);
                                return;

                            } else {
                                this.updateMeshesNear(selection, true);
                            }


                            break;

                        case SPLODER.Item.PROPERTY_FLOORTEXTURE:
                        case SPLODER.Item.PROPERTY_CEILTEXTURE:
                        case SPLODER.Item.PROPERTY_BOTTOMWALLTEXTURE:
                        case SPLODER.Item.PROPERTY_BOTTOMWALLCORNICETEXTURE:
                        case SPLODER.Item.PROPERTY_TOPWALLTEXTURE:
                        case SPLODER.Item.PROPERTY_TOPWALLCORNICETEXTURE:

                            if (rect.type <= SPLODER.Item.TYPE_ITEM) {

                                this.updateMeshTexturesById(rect.id);

                                if (rect.type == SPLODER.Item.TYPE_LIQUID) {
                                    this.updateVertexColorsIntersecting(rect);
                                }


                            } else {

                                this.removeMeshesById(data);
                                this.buildMesh(rect);
                                return;

                            }

                            break;

                        default:

                            this.setDirty();
                            break;

                    }

                }

                break;


            case SPLODER.ACTION_SELECTION_MOVE:

                if (selection.length == 1) {

                    item = selection[0];

                    if (item.type == SPLODER.Item.TYPE_LIGHT) {

                        this.assets.setLightMapDirty();
                        return;

                    } else if (item.type == SPLODER.Item.TYPE_PARTICLE) {

                        this.updateMeshPosition(this.sceneMeshesById[item.id], item);
                        return;

                    } else if (item.type > SPLODER.Item.TYPE_LIQUID) {

                        this.removeMeshesById(item);
                        this.buildMesh(item);

                        return;

                    }

                }

                this.updateMeshesNear(selection, true);

                i = selection.length;

                while (i--) {

                    item = selection[i];

                    if (item && item.type == SPLODER.Item.TYPE_LIQUID) {
                        this.updateVertexColorsIntersecting(item);
                    }

                }

                break;

            case SPLODER.ACTION_SELECTION_DELETE:

                this.removeShapes(data);
                this.removeMeshesById(data);
                this.updateMeshesNear(data);
                break;

            default:

                this.setDirty();

        }

    } else {

        switch (actionType) {

            case SPLODER.ACTION_TWEAK_START:
            case SPLODER.ACTION_TWEAK_COMPLETE:
                return;

            case SPLODER.ACTION_CREATE:

                this.buildMesh(data);
                this.assets.setLightMapDirty();
                break;

            case SPLODER.ACTION_CHANGE_COMPLETE:

                if (data.type > SPLODER.Item.TYPE_LIQUID) {

                    this.removeMeshesById(data);
                    this.buildMesh(data);

                } else {

                    this.updateMeshesNear([data]);

                }
                break;

            default:

                this.setDirty();

        }

    }


};

SPLODER.SceneModel.prototype.onEnvModelChanged = function () {

    //console.log("ENV MODEL CHANGED", arguments);
    var envs = this.envModel.getEnvs();

    var skyColor = new THREE.Color();
    skyColor.setHex(envs[SPLODER.EnvModel.PROPERTY_SKY_COLOR]);
    this.setSkyColor(skyColor);

};


SPLODER.SceneModel.prototype.setDirty = function () {

    //console.log("SETTING DIRTY")
    this.isDirty = true;

};


SPLODER.SceneModel.prototype.hasObjectWithId = function (id) {

    return this.sceneMeshesById[id] != null;

};


SPLODER.SceneModel.prototype.getFloorLevel = function (tileX, tileY) {

    var th = this.tilesizeHalf;
    var floorLevel = 0;

    var platformRect = this.model.getItemsUnderPoint(tileX, tileY, 0, null, false, SPLODER.Item.TYPE_PLATFORM);

    if (platformRect) {

        floorLevel = Math.max(floorLevel, platformRect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) * th);

    }

    var wallRect = this.model.getItemsUnderPoint(tileX, tileY, 0, null, false, SPLODER.Item.TYPE_WALL);

    if (wallRect) {

        floorLevel = Math.max(floorLevel, wallRect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) * th);

    }

    var liquidRect = this.model.getItemsUnderPoint(tileX, tileY, 0, null, false, SPLODER.Item.TYPE_LIQUID);

    if (liquidRect) {

        floorLevel = Math.max(floorLevel, liquidRect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) * th - liquidRect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) * th);

    }

    if (!platformRect && !wallRect && this.camera) {

        floorLevel = Math.floor(this.camera.position.y / th);

    }

    return floorLevel;

};


SPLODER.SceneModel.prototype.removeMeshesById = function (rects, preserveMaterials) {

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


SPLODER.SceneModel.prototype.updateRectMeshes = function (rect, updateChildren, preserveMaterials) {

    if (rect instanceof SPLODER.Item) {

        var mats = this.removeMeshesById([rect], preserveMaterials);

        this.buildMesh(rect, null, false, mats);
        if (rect.type == SPLODER.Item.TYPE_LIQUID || (rect.type == SPLODER.Item.TYPE_WALL && rect.getAttrib(SPLODER.Item.PROPERTY_CEIL))) {
            this.buildMesh(rect, null, true, mats);
        }

        if (updateChildren && rect.numChildren) {

            var i = rect.numChildren;

            while (i--) {

                this.updateRectMeshes(rect.children[i], true, preserveMaterials);

            }

        }

    }

};


SPLODER.SceneModel.prototype.removeShapes = function (rects) {

    var shapesets = [this.shapes, this.ceilingShapes];
    var shapeset;
    var i, j, k = 2;
    var rect, shape;

    while (k--) {

        shapeset = shapesets[k];

        if (shapeset instanceof Array) {

            j = rects.length;

            while (j--) {

                rect = rects[j];

                i = shapeset.length;

                while (i--) {

                    shape = shapeset[i];

                    try {
                        if (shape.userData.parentNode.id == rect.id) {

                            shapeset.splice(i, 1);
                            break;

                        }
                    } catch (err) {
                        console.log("Error! Shape does not contain reference to rect.");
                    }

                }

            }

        }

    }

};


SPLODER.SceneModel.prototype.updateShapes = function (rectsSubset) {

    var newShapes;

    if (rectsSubset) {

        this.removeShapes(rectsSubset);

        newShapes = SPLODER.ShapeUtils.getShapes(rectsSubset, false, this.tilesize, this.model.items);

        this.shapes = this.shapes.concat(newShapes);
        this.ceilingShapes = this.ceilingShapes.concat(SPLODER.ShapeUtils.getShapes(rectsSubset, true, this.tilesize, this.model.items));

    } else {

        //console.log("UPDATING SHAPES");
        newShapes = this.shapes = SPLODER.ShapeUtils.getShapes(this.model.items, false, this.tilesize);
        this.ceilingShapes = SPLODER.ShapeUtils.getShapes(this.model.items, true, this.tilesize);

    }

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


SPLODER.SceneModel.prototype.updateMeshesNear = function (rects, preserveMaterials) {

    if (rects instanceof Array) {

        if (rects.length > 16 || rects.length > this.model.items.length * 0.5) {
            this.setDirty();
            return;
        }

        var bounds = SPLODER.ShapeUtils.getBounds(rects);

        if (bounds) {

            var nearRects = this.model.getItemsIntersectingRect(bounds.x - 8, bounds.y - 8, bounds.width + 16, bounds.height + 16);

            if (nearRects && nearRects.length) {

                SPLODER.ShapeUtils.sortByAreaDesc(nearRects);
                this.updateShapes(nearRects);

                this.assets.setLightMapDirty();

                var i = nearRects.length;

                while (i--) {

                    this.updateRectMeshes(nearRects[i], false, preserveMaterials);

                }

            }

        }

    }

};
