
SPLODER.GameController = function () {

    this.library = null;
    this.model = null;
    this.levels = null;
    this.tags = null;
    this.dispatcher = null;
    this.player = null;
    this.simulation = null;
    this.simulationDispatcher = null;
    this.flowProcessor = null;
    this.gameEvents = null;
    this.console = null;
    this.consoleDispatcher = new signals.Signal();
    this.playerEvent = null;

    var scope = this;

    this.initWithGameShit = function (library, model, levels, tags, player, simulation, flowProcessor, gameEvents, gameConsole) {

        this.library = library;
        this.model = model;
        this.levels = levels;
        this.tags = tags;
        this.dispatcher = new signals.Signal();
        this.player = player;
        this.simulation = simulation;
        this.flowProcessor = flowProcessor;
        this.gameEvents = gameEvents;
        this.console = gameConsole;

        this.model.changed.add(this.onModelChanged, this);
        this.model.registerWithDispatcher(this.dispatcher);

        this.consoleDispatcher = new signals.Signal();
        this.console.registerWithDispatcher(this.consoleDispatcher);

        this.addSpecialTagsToItems();

        this.simulationDispatcher = new signals.Signal();
        this.simulation.registerWithDispatcher(this.simulationDispatcher);

        this.player.controls.inputReceived.add(this.onPlayerInputEvent, this);
        this.gameEvents.dispatcher.add(this.onGameEvent, this);

        return this;

    };

    this.addSpecialTagsToItems = function () {

        var items = this.levels.getAllItems();
        var item;

        for (var i = 0; i < items.length; i++) {

            item = items[i];

            if (item && this.tags.hasSpecialTag(item.id)) {

                item.specialTag = this.tags.getSpecialTagByItemId(item.id);
console.log("SPECIAL", item.id, this.tags.getSpecialTagByItemId(item.id), item.specialTag, item)
            }

        }

    }

    this.setPointHelper = function (x, y, z) {
        //console.log(x, y, z);
        var pt = this.model.pointHelper.position;
        pt.x = x;
        pt.y = y;
        pt.z = z;
    }

    this.applyAttackHit = function (sourceBody, targetBody) {

        var angle = 0 - SPLODER.Geom.angleBetween(sourceBody.rect.x, sourceBody.rect.y, targetBody.rect.x, targetBody.rect.y) + Math.PI * 0.5;
        console.log("FORCE!", sourceBody.id, targetBody.id, angle);

        let sourceStrength = sourceBody.rect.strength || 0;

        scope.simulationDispatcher.dispatch(SPLODER.ACTION_APPLY_FORCE, sourceBody.id, angle + Math.PI, 20);
        scope.simulationDispatcher.dispatch(SPLODER.ACTION_APPLY_FORCE, targetBody.id, angle, 5 + sourceStrength);

        if (sourceStrength > 0) {

            scope.dispatcher.dispatch([SPLODER.ACTION_CHANGE_GAMEPROPS, targetBody.id, SPLODER.GameProps.PROPERTY_HEALTH, 0 - sourceStrength]);

            if (targetBody == scope.player) {
                var lookAngleDelta = SPLODER.Geom.normalizeAngleDeg(180 + scope.player.rect.rotation - (angle * 180 / Math.PI));
                scope.consoleDispatcher.dispatch(SPLODER.GameEvent.TYPE_PLAYER_DAMAGED, sourceStrength, lookAngleDelta);
                this.gameEvents.addEvent(SPLODER.GameEvent.TYPE_PLAYER_HEALTH_CHANGED, targetBody.rect, null, 0, 0 - sourceStrength);
            }

            scope.simulation.triggered.dispatch(SPLODER.FlowNode.TRIGGER_ATTACK_HIT, targetBody, sourceBody);

        }

    }

    this.onPlayerInputEvent = function (type) {

        var i, hitPt, success, nearBodies, sourceBody, targetBody;

        sourceBody = this.player;

        switch (type) {

            case SPLODER.GameEvent.TYPE_ATTACK:

                nearBodies = this.simulation.getBodiesNearPlayer();
                i = nearBodies.length;

                while (i--) {

                    targetBody = nearBodies[i];

                    scope.simulation.triggered.dispatch(SPLODER.FlowNode.TRIGGER_ATTACK_START, targetBody, sourceBody);
                    console.log("Starting player attack run...")
                    this.gameEvents.addEvent(SPLODER.GameEvent.TYPE_ATTACK, sourceBody.rect, targetBody.rect, 5);

                }

                break;

        }

    }

    this.onModelChanged = function(event, prop, id, newVal) {

        switch (event) {

            case SPLODER.ACTION_SELECT_ITEM:
            case SPLODER.EVENT_STATE_CHANGE_START:
            case SPLODER.EVENT_STATE_CHANGE_COMPLETE:
                break;

            case SPLODER.ACTION_CHANGE_GAMEPROPS:
                
                if (prop == SPLODER.GameProps.PROPERTY_HEALTH && newVal <= 0) {
                    var item = this.model.getItemById(id);
                    item.startDying();
                    this.gameEvents.addEvent(SPLODER.GameEvent.TYPE_DEATH_COMPLETE, item, null, 250);
                }

        }

    };

    this.onGameEvent = function (event) {

        if (!event) return;

        var hitPt, success;
        var item = event.targetItem;
        var playerItem = scope.player.rect;
        var specialTag;
        var textureId, val;

        // console.log("GAME EVENT", event.type);

        switch (event.type) {

            case SPLODER.GameEvent.TYPE_PLAYER_SELECT:

                if (!item) return;

                specialTag = item.specialTag;
console.log("selected", item.id, specialTag)
                if (item.type == SPLODER.Item.TYPE_ITEM) {

                    switch (specialTag) {

                        case SPLODER.FlowNode.TAG_GROUP_INVENTORY_ITEM:

                            playerItem.addToInventory(item, scope.tags.getTagsByItemId(item.id));
                            break;

                        case SPLODER.FlowNode.TAG_GROUP_WEAPON:

                            console.log("weapon picked up");
                            textureId = item.getAttrib(SPLODER.Item.PROPERTY_TEXTURE1);
                            val = item.strength || 5;

                            //scope.model.onAction([SPLODER.ACTION_CHANGE_GAMEPROPS, -1, SPLODER.Biped.PROPERTY_ITEMFRAME_RIGHT, textureId]);
                            scope.dispatcher.dispatch([SPLODER.ACTION_CHANGE_GAMEPROPS, -1, SPLODER.GameProps.PROPERTY_ITEMFRAME_RIGHT, textureId]);
                            scope.dispatcher.dispatch([SPLODER.ACTION_CHANGE_GAMEPROPS, -1, SPLODER.GameProps.PROPERTY_STRENGTH, val]);
                            console.log("WEAPON with strength", val, "picked up and player strength is", playerItem.strength);
                            break;

                        case SPLODER.FlowNode.TAG_GROUP_ARMOR:

                            console.log("armor picked up");
                            textureId = item.getAttrib(SPLODER.Item.PROPERTY_TEXTURE1);
                            val = item.armor || 0;
                            
                            //scope.model.onAction([SPLODER.ACTION_CHANGE_GAMEPROPS, -1, SPLODER.Biped.PROPERTY_ITEMFRAME_LEFT, textureId]);
                            scope.dispatcher.dispatch([SPLODER.ACTION_CHANGE_GAMEPROPS, -1, SPLODER.GameProps.PROPERTY_ITEMFRAME_LEFT, textureId]);
                            scope.dispatcher.dispatch([SPLODER.ACTION_CHANGE_GAMEPROPS, -1, SPLODER.GameProps.PROPERTY_ARMOR, val]);
                            console.log("ARMOR with value", val, "picked up and player armor is", playerItem.armor);
                            break;

                    }

                    scope.flowProcessor.onTrigger(SPLODER.FlowNode.TRIGGER_SELECTED, item);
                    scope.flowProcessor.onTrigger(SPLODER.FlowNode.TRIGGER_ITEM_PICKED_UP, item);

                }

                break;

            case SPLODER.GameEvent.TYPE_ATTACK:

                var sourceBody = scope.simulation.getBody(event.sourceItem);
                var targetBody = scope.simulation.getBody(event.targetItem);
                success = false;

                if (!sourceBody && event.sourceItem.id == -1) {
                    sourceBody = this.player;
                }
                if (!targetBody && event.targetItem.id == -1) {
                    targetBody = this.player;
                }

                console.log("ATTACK EVENT")

                if (this.simulation.canSee(sourceBody, targetBody) === false) {
                    break;
                }

                if (sourceBody && targetBody) {
                    console.log(sourceBody.boundingBox.y, targetBody.boundingBox.y);

                    if (sourceBody == this.player) {

                        var pitch = this.player.rect.pitch;
                        hitPt = SPLODER.GamePhysics.getPointInFrontOfBody(sourceBody, 96 - Math.abs(pitch) * 64, pitch * 128);
                        this.setPointHelper(hitPt.sx, hitPt.y, hitPt.z);

                    } else {

                        var h = sourceBody.boundingBox.depth * 8;
                        var d = 64;
                        if (sourceBody.rect.type == SPLODER.Item.TYPE_BIPED) {
                            d = 128;
                        }

                        if (sourceBody.boundingBox.y > targetBody.boundingBox.y) {
                            h -= 32;
                        }

                        console.log("hit h", h)

                        hitPt = SPLODER.GamePhysics.getPointInFrontOfBody(sourceBody, d, h);
                        this.setPointHelper(hitPt.x, hitPt.y, hitPt.z);

                    }

                    // __pt.copy(hitPt);
                    // __ptGeom.verticesNeedUpdate = true;
                    success = SPLODER.GamePhysics.checkHitOnBody(targetBody, hitPt, true);
                }

                if (success) {
                    
                    console.log("HIT!");
                    
                    if (SPLODER.GameRules.allowDefault(event, this.tags)) {

                        console.log("DEFAULT ATTACK HIT ALLOWED");
                        this.applyAttackHit(sourceBody, targetBody);
                    
                    } else {

                        console.warn("DEFAULT ATTACK HIT NOT ALLOWED:", sourceBody.rect.id, targetBody.rect.id);

                    }

                }

                break;

            case SPLODER.GameEvent.TYPE_PLAYER_DAMAGED:

                console.log("PLAYER DAMAGED!", event.eventData);
                scope.consoleDispatcher.dispatch(SPLODER.GameEvent.TYPE_PLAYER_DAMAGED, Math.abs(event.eventData));
                break;

            case SPLODER.GameEvent.TYPE_DEATH_COMPLETE:
                console.log("DEATH COMPLETE!");
                scope.dispatcher.dispatch(SPLODER.ACTION_DESTROY, event.sourceItem);
                scope.gameEvents.addEvent(SPLODER.GameEvent.TYPE_ITEM_DESTROYED, event.sourceItem, null, 0);
                break;

        }

    };

}