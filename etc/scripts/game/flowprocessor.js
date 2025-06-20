/**
 * Created by ggaudrea on 8/20/15.
 */

SPLODER.FlowCursor = function() {

    this.id = null;
    this.node = null;
    this.sourceId = null;
    this.targetId = null;
    this.startTime = 0;
    this.context = null;
    this.contextType = SPLODER.FlowNode.TARGET_TYPE_LOCAL;
    this.loopsByNode = null;
    this.processed = false;
    this.waiting = false;

    this.init = function(node, sourceId, targetId) {

        this.node = node;
        this.sourceId = this.context = sourceId;
        this.targetId = targetId;
        this.startTime = Date.now();
        this.loopsByNode = [];

        if (this.node.type == SPLODER.FlowNode.TYPE_TRIGGER) {
            this.id = this.node.id;
        }

        return this;

    };

};

SPLODER.FlowProcessor = function() {

    this.model = null;
    this.levels = null;
    this.tags = null;
    this.flows = null;
    this.gameEvents = null;
    this.simulation = null;
    this.console = null;

    this.dispatcher = null;
    this.levelsDispatcher = null;
    this.simulationDispatcher = null;
    this.consoleDispatcher = null;

    var _flowCursors = [];
    var _flowTriggers = null;
    var _frameTriggers = [];

    var scope = this;

    this.initWithModels = function(model, levels, tags, flows, simulation, gameEvents, gameConsole) {

        this.model = model;
        this.levels = levels;
        this.tags = tags;
        this.flows = flows;
        this.simulation = simulation;
        this.gameEvents = gameEvents;
        this.console = gameConsole;

        this.dispatcher = new signals.Signal();
        this.levelsDispatcher = new signals.Signal();
        this.simulationDispatcher = new signals.Signal();
        this.consoleDispatcher = new signals.Signal();

        this.model.changed.add(this.onModelChanged, this);
        this.model.registerWithDispatcher(this.dispatcher);

        this.levels.registerWithDispatcher(this.levelsDispatcher);

        this.simulation.triggered.add(this.onTrigger, this);
        this.simulation.registerWithDispatcher(this.simulationDispatcher);

        this.gameEvents.dispatcher.add(this.onGameEvent, this);

        this.console.changed.add(this.onConsoleChanged, this);
        this.console.registerWithDispatcher(this.consoleDispatcher);

        return this;

    };

    this.start = function() {

        var i, node, item;

        _flowTriggers = this.flows.getAllTriggers();
        //console.log(_flowTriggers)
        _frameTriggers = this.flows.getTriggersByType(SPLODER.FlowNode.TRIGGER_EVERYFRAME);

        var startTriggers = this.flows.getTriggersByType(SPLODER.FlowNode.TRIGGER_START);

        i = startTriggers.length;

        while (i--) {

            node = startTriggers[i];

            if (node) {

                beginFlow(SPLODER.FlowNode.TRIGGER_START, node.flowId, 0);

            }

        }

        var selectTriggers = this.flows.getTriggersByType(SPLODER.FlowNode.TRIGGER_SELECTED);

        i = selectTriggers.length;

        while (i--) {

            node = selectTriggers[i];

            if (node && node.flowId) {

                item = getItemById(node.flowId);

                if (item) item.selectable = true;

            }

        }

        var tagged_inventory_items = this.tags.getItemsByTag(SPLODER.FlowNode.TAG_GROUP_INVENTORY_ITEM)
            .concat(this.tags.getItemsByTag(SPLODER.FlowNode.TAG_GROUP_WEAPON))
            .concat(this.tags.getItemsByTag(SPLODER.FlowNode.TAG_GROUP_ARMOR));

        i = tagged_inventory_items.length;

        while (i--) {

            item = getItemById(tagged_inventory_items[i]);

            if (item) item.selectable = true;

        }

    };


    this.step = function() {

        var flows, cursors, cursor, i;

        i = _frameTriggers.length;

        while (i--) {

            node = _frameTriggers[i];

            if (node) {

                beginFlow(SPLODER.FlowNode.TRIGGER_EVERYFRAME, node.flowId, 0);

            }

        }

        for (var nodeId in _flowCursors) {

            flows = _flowCursors[nodeId];

            for (var targetId in flows) {

                cursors = flows[targetId];

                if (cursors) {

                    i = cursors.length;

                    while (i--) {

                        cursor = cursors[i];

                        if (cursor.node.id == 129) {
                            //console.log(cursor.node.id, cursor.processed);
                        }
                        if (!cursor.processed) {
                            processCursor(cursor);
                        }
                        else {
                            if (validateCursor(cursor)) {
                                checkCursorTaskComplete(cursor);
                            }
                        }

                    }

                }

            }


        }

    };

    this.reset = function() {



    };


    var resetFlowActionTimes = function(flowId) {

        var nodes = scope.flows.getNodesByItemId(flowId);

        var i = nodes.length;

        while (i--) {
            if (nodes[i]) nodes[i].lastAction = -100000;
        }

    };

    var checkProperty = function(item, subtype, operator, compareVal) {

        if (!item) return false;

        var currentVal;

        switch (subtype) {

            case SPLODER.FlowNode.CONDITION_PROPERTY_HEALTH:

                currentVal = item.health;
                break;

            case SPLODER.FlowNode.CONDITION_PROPERTY_STRENGTH:

                currentVal = item.strength;
                break;

            case SPLODER.FlowNode.CONDITION_PROPERTY_RANGE:

                currentVal = item.range;
                break;

            case SPLODER.FlowNode.CONDITION_PROPERTY_ARMOR:

                currentVal = item.armor;
                break;

            case SPLODER.FlowNode.CONDITION_PROPERTY_MEMORY:

                currentVal = item.memory;
                break;

            case SPLODER.FlowNode.CONDITION_PROPERTY_SCORE:

                currentVal = item.score;
                break;

        }

        switch (operator) {

            case SPLODER.FlowNode.OPERATOR_NONE:
            case SPLODER.FlowNode.OPERATOR_EQUALS:

                return currentVal == compareVal;

            case SPLODER.FlowNode.OPERATOR_NOTEQUALS:

                return currentVal != compareVal;

            case SPLODER.FlowNode.OPERATOR_GREATERTHAN:

                return currentVal > compareVal;

            case SPLODER.FlowNode.OPERATOR_LESSTHAN:

                return currentVal < compareVal;

        }



    };

    var changeGameProps = function(targetItem, prop, sourceItem, delta) {

        if (targetItem && targetItem.id) {

            console.log("triggering changing of gameprop", prop, "delta", delta, "for item", targetItem.id, "...");
            scope.dispatcher.dispatch([SPLODER.ACTION_CHANGE_GAMEPROPS, targetItem.id, prop, delta, sourceItem ? sourceItem.id : 0]);

            if (targetItem == scope.simulation.player.rect && delta != 0) {

                /*
                SPLODER.FlowNode.TRIGGER_HEALTH_CHANGED = 20;
                SPLODER.FlowNode.TRIGGER_PLAYER_SCORED = 21;
                SPLODER.FlowNode.TRIGGER_ITEM_PICKED_UP = 22;
                SPLODER.FlowNode.TRIGGER_ITEM_DESTROYED = 23;
                */

                switch (prop) {

                    case SPLODER.GameProps.PROPERTY_HEALTH:

                        //scope.onTrigger(SPLODER.FlowNode.TRIGGER_HEALTH_CHANGED, SPLODER.FlowNode.SCOPE_GAME, targetItem);
                        console.log("triggering health")
                        scope.gameEvents.addEvent(SPLODER.GameEvent.TYPE_PLAYER_HEALTH_CHANGED, targetItem, null, 0, delta);
                        break;

                    case SPLODER.GameProps.PROPERTY_SCORE:

                        //scope.onTrigger(SPLODER.FlowNode.TRIGGER_PLAYER_SCORED, SPLODER.FlowNode.SCOPE_GAME, targetItem);
                        console.log("triggering scored")
                        scope.gameEvents.addEvent(SPLODER.GameEvent.TYPE_PLAYER_SCORED, targetItem, null, 0, delta);
                        break;
P
                }

            } else {
                console.log("triggering not player or delta 0")
            }

        }

    };

    var getItemById = function(id) {

        if (id == -1) return scope.simulation.player.rect;
        else return scope.levels.getItemById(id);

    }

    var getCursorById = function(id) {

        var flows, cursors, i;

        for (var nodeId in _flowCursors) {

            flows = _flowCursors[nodeId];

            for (var targetId in flows) {

                cursors = flows[targetId];

                if (cursors) {

                    i = cursors.length;

                    while (i--) {

                        if (cursors[i] && cursors[i].id == id) return cursors[i];

                    }

                }

            }

        }

    };


    var processCursor = function(cursor) {

        if (!cursor || cursor.processed) return;
        cursor.processed = true;

        //console.log("processing cursor", cursor.id, cursor.node.id, cursor.node.type, cursor.context);

        var type = cursor.node.type;
        var subtype = cursor.node.subtype;
        var sourceItem, targetItem, item, itemId, items, prop, i, delta, useDefault, busy;

        switch (type) {

            case SPLODER.FlowNode.TYPE_TRIGGER:

                branchCursor(cursor);
                break;

            case SPLODER.FlowNode.TYPE_LOOP:

                //console.log("branching...")
                var numLoops = cursor.node.target || 0;
                var loopNum = cursor.loopsByNode[cursor.node.id] || 0;

                //console.log(cursor.node.id, numLoops, loopNum)

                if (numLoops == 0 || loopNum < numLoops) {

                    loopNum++;
                    cursor.loopsByNode[cursor.node.id] = loopNum;

                    branchCursor(cursor);
                }
                else {

                    endCursor(cursor);

                }

                break;

            case SPLODER.FlowNode.TYPE_CONDITION:

                //console.log("condition", type, subtype, cursor.node.id, cursor.node.type, cursor.node.subtype);

                switch (subtype) {

                    case SPLODER.FlowNode.CONDITION_TOUCHING:
                    case SPLODER.FlowNode.CONDITION_CONTAINS:
                    case SPLODER.FlowNode.CONDITION_TAG_MATCHES:

                        if (scope.tags.itemHasTag(cursor.context, cursor.node.target)) {
                            console.log("OYOYOYOYOYOYO CONTAINS!")
                            branchCursor(cursor, 0);
                        }
                        else {
                            console.log("TAG NO MATCHY", cursor.context, cursor.node.target);
                            branchCursor(cursor, 1);
                        }
                        break;

                    case SPLODER.FlowNode.CONDITION_PLAYER_HAS:

                        if (scope.simulation.player.rect.has(null, cursor.node.target)) {
                            branchCursor(cursor, 0);
                        }
                        else {
                            //console.log("TAG NO MATCHY", cursor.node.id);
                            branchCursor(cursor, 1);
                        }
                        break;

                    case SPLODER.FlowNode.CONDITION_B_TAG_MATCHES:

                        if (scope.tags.itemHasTag(cursor.targetId, cursor.node.target)) {
                            branchCursor(cursor, 0);
                        }
                        else {
                            //console.log("TAG NO MATCHY", cursor.node.id);
                            branchCursor(cursor, 1);
                        }
                        break;


                    case SPLODER.FlowNode.CONDITION_STATE_MATCHES:

                        item = getFirstCursorItem(cursor);

                        //console.log(item.currentState, cursor.node.target - 1);

                        if (item && item.currentState == cursor.node.target - 1) {
                            //console.log(cursor.node.id, "TRUE")
                            branchCursor(cursor, 0);
                        }
                        else {
                            //console.log(cursor.node.id, "FALSE")
                            branchCursor(cursor, 1);
                        }
                        break;

                    case SPLODER.FlowNode.CONDITION_FOLLOWING_B:

                        sourceItem = getItemById(cursor.sourceId);

                        targetItem = getItemById(cursor.targetId);

                        if (sourceItem && sourceItem.following && targetItem && sourceItem.target == targetItem) {
                            branchCursor(cursor, 0);
                        } else {
                            branchCursor(cursor, 1);
                        }

                        break;


                    case SPLODER.FlowNode.CONDITION_PROPERTY_HEALTH:
                    case SPLODER.FlowNode.CONDITION_PROPERTY_STRENGTH:
                    case SPLODER.FlowNode.CONDITION_PROPERTY_RANGE:
                    case SPLODER.FlowNode.CONDITION_PROPERTY_ARMOR:
                    case SPLODER.FlowNode.CONDITION_PROPERTY_MEMORY:
                    case SPLODER.FlowNode.CONDITION_PROPERTY_SCORE:

                        item = getFirstCursorItem(cursor);

                        if (checkProperty(item, subtype, cursor.node.operator, cursor.node.target)) {
                            branchCursor(cursor, 0);
                        }
                        else {
                            branchCursor(cursor, 1);
                        }

                        break;

                }

                break;

            case SPLODER.FlowNode.TYPE_ACTION:

                switch (subtype) {

                    case SPLODER.FlowNode.ACTION_GOTO_STATE:

                        items = getCursorItems(cursor);
                        busy = false;

                        for (i = 0; i < items.length; i++) {
                            if (items[i]) {
                                //console.log("GOTO", items[i].id, cursor.node.target - 1, "current level:", scope.levels.currentLevel, "item level:", items[i].levelNum);
                                if (scope.levels.currentLevel == items[i].levelNum) {
                                    scope.dispatcher.dispatch([SPLODER.ACTION_SET_CURRENTSTATE, items[i].id, cursor.node.target - 1]);
                                    if (items[i] && items[i].moving) busy = true;
                                } else {
                                    items[i].currentState = cursor.node.target - 1;
                                }
                            }
                        }

                        //console.log(busy)

                        if (!busy) {
                            branchCursor(cursor);
                        }

                        break;

                    case SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_HEALTH:
console.log("CHANGING HEALTH", cursor.targetId)

                    case SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_STRENGTH:
                    case SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_RANGE:
                    case SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_ARMOR:

                        sourceItem = getItemById(cursor.sourceId);
                        items = getCursorItems(cursor);
                        prop = subtype + SPLODER.GameProps.PROPERTY_HEALTH - SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_HEALTH;

                        delta = parseInt(cursor.node.target);

                        if (subtype == SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_HEALTH && cursor.targetId == -1 && delta < 0) {
                            console.log("Adding Gamecontroller Game Event 'PLAYER DAMAGED'");
                            //scope.gameEvents.addEvent(SPLODER.GameEvent.TYPE_PLAYER_DAMAGED, sourceItem.rect, scope.model.player, 0, delta);
                        }

                        // change is DEFAULT which uses the converse property of the sourceItem to affect the target item
                        useDefault = (delta == 0);
console.log("CURSOR NODE TARGET:", cursor.node.target, "DELTA:", delta)
                        for (i = 0; i < items.length; i++) {
                            targetItem = items[i];
                            if (useDefault) delta = getDefaultPropertyChangeDelta(sourceItem, subtype, targetItem);
                            changeGameProps(targetItem, prop, null, delta);
                        }



                        branchCursor(cursor);

                        break;

                    case SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_MEMORY:

                        sourceItem = getItemById(cursor.sourceId);
                        items = getCursorItems(cursor);

                        for (i = 0; i < items.length; i++) {
                            changeGameProps(items[i], SPLODER.GameProps.PROPERTY_MEMORY, null, cursor.node.target);
                        }

                        branchCursor(cursor);

                        break;

                    case SPLODER.FlowNode.ACTION_SOLID_OFF:

                        items = getCursorItems(cursor);

                        for (i = 0; i < items.length; i++) {
                            changeGameProps(items[i], SPLODER.GameProps.PROPERTY_SOLID, null, 0);
                        }

                        branchCursor(cursor);

                        break;

                    case SPLODER.FlowNode.ACTION_SOLID_ON:

                        items = getCursorItems(cursor);

                        for (i = 0; i < items.length; i++) {
                            changeGameProps(items[i], SPLODER.GameProps.PROPERTY_SOLID, null, 1);
                        }

                        branchCursor(cursor);

                        break;

                    case SPLODER.FlowNode.ACTION_TELEPORT:

                        itemId = scope.tags.getItemByTag(cursor.node.target);

                        if (itemId && scope.simulation.playerCanTeleport()) {
                            scope.levelsDispatcher.dispatch(SPLODER.ACTION_TELEPORT, itemId);
                            console.log("YO TELEPORT", scope.simulation.frame)
                            scope.simulationDispatcher.dispatch(SPLODER.ACTION_TELEPORT, itemId);
                            console.log("YO TELEPORT SIMMED BABY");
                        }

                        branchCursor(cursor);

                        break;

                    case SPLODER.FlowNode.ACTION_DESTROY:

                        console.log("SELF_DESTRUCT!", cursor.sourceId)
                        sourceItem = getItemById(cursor.sourceId);
                        scope.dispatcher.dispatch(SPLODER.ACTION_DESTROY, sourceItem);
                        scope.gameEvents.addEvent(SPLODER.GameEvent.TYPE_ITEM_DESTROYED, sourceItem, null, 0);

                        // send "picked_up" trigger event if this is a powerup
                        if (sourceItem.specialTag == SPLODER.GameProps.TAG_POWERUP) {
                            scope.onTrigger(SPLODER.FlowNode.TRIGGER_ITEM_PICKED_UP, sourceItem);
                        }
                        //scope.onTrigger(SPLODER.FlowNode.TRIGGER_ITEM_DESTROYED, sourceItem);

                        break;


                    case SPLODER.FlowNode.ACTION_WATCH:

                        sourceItem = getItemById(cursor.sourceId);
                        targetItem = getItemById(cursor.targetId);

                        if (sourceItem && targetItem) {
                            sourceItem.target = targetItem;
                            sourceItem.watching = true;
                        }

                        branchCursor(cursor);

                        break;

                    case SPLODER.FlowNode.ACTION_FACE:

                        sourceItem = getItemById(cursor.sourceId);
                        targetItem = getItemById(cursor.targetId);

                        if (sourceItem && targetItem) {
                            if (SPLODER.GameRules.allowAction(SPLODER.FlowNode.ACTION_FACE, sourceItem, targetItem)) {
                                sourceItem.target = targetItem;
                                sourceItem.face();
                            }
                        }

                        branchCursor(cursor);

                        break;

                    case SPLODER.FlowNode.ACTION_FOLLOW:

                        sourceItem = getItemById(cursor.sourceId);
                        targetItem = getItemById(cursor.targetId);

                        if (sourceItem && targetItem) {
                            if (SPLODER.GameRules.allowAction(SPLODER.FlowNode.ACTION_FOLLOW, sourceItem, targetItem)) {
                                sourceItem.target = targetItem;
                                sourceItem.following = true;
                            }
                        }

                        branchCursor(cursor);

                        break;

                    case SPLODER.FlowNode.ACTION_UNFOLLOW:

                        sourceItem = getItemById(cursor.sourceId);
                        targetItem = getItemById(cursor.targetId);

                        if (sourceItem && targetItem) {
                            sourceItem.target = null;
                            sourceItem.following = false;
                        }

                        branchCursor(cursor);

                        break;

                    case SPLODER.FlowNode.ACTION_ATTACK:

                        sourceItem = getItemById(cursor.sourceId);
                        targetItem = getItemById(cursor.targetId);

                        if (!scope.simulation.canSeeRects(sourceItem, targetItem)) {
                            return;
                        }

                        if (SPLODER.GameRules.allowAction(SPLODER.FlowNode.ACTION_ATTACK, sourceItem, targetItem)) {

                            sourceItem.target = targetItem;
                            sourceItem.gameState = SPLODER.GameItem.STATE_ATTACKING;

                            if (sourceItem.mesh instanceof SPLODER.Biped) {
                                sourceItem.mesh.setPose(SPLODER.BipedPoses.POSE_ATTACK);
                            }

                            var waitPeriod = 20;
                            if (sourceItem.type != SPLODER.Item.TYPE_BIPED) waitPeriod = 5;

                            scope.gameEvents.addEvent(SPLODER.GameEvent.TYPE_ATTACK, sourceItem, targetItem, waitPeriod);
                            //scope.onTrigger(SPLODER.FlowNode.TRIGGER_ATTACK_START, targetItem, sourceItem);

                            cursor.waiting = true;

                            setTimeout(function () {
                                cursor.waiting = false;
                                if (sourceItem.gameState == SPLODER.GameItem.STATE_ATTACKING) {
                                    sourceItem.gameState = SPLODER.GameItem.STATE_IDLE;
                                }
                            }, 650)

                        } else {

                            branchCursor(cursor);

                        }

                        break;

                    case SPLODER.FlowNode.ACTION_DEFEND:

                        sourceItem = getItemById(cursor.sourceId);
                        targetItem = getItemById(cursor.targetId);

                        if (SPLODER.GameRules.allowAction(SPLODER.FlowNode.ACTION_DEFEND, sourceItem, targetItem)) {

                            sourceItem.face(targetItem);
                            sourceItem.gameState = SPLODER.GameItem.STATE_DEFENDING;
                            sourceItem.setPose(SPLODER.BipedPoses.POSE_DEFEND);

                            // scope.gameEvents.addEvent(SPLODER.GameEvent.TYPE_DEFEND, sourceItem, targetItem, 20);

                            cursor.waiting = true;

                            setTimeout(function () {
                                cursor.waiting = false;
                                if (sourceItem.gameState == SPLODER.GameItem.STATE_DEFENDING) {
                                    sourceItem.gameState = SPLODER.GameItem.STATE_IDLE;
                                    sourceItem.unface(targetItem);
                                }
                            }, 1000)

                        } else {

                            branchCursor(cursor);

                        }
                        break;


                    case SPLODER.FlowNode.ACTION_SHOW_TEXT:

                        if (Date.now() - cursor.node.lastAction > 20000) {

                            if (validateCursor(cursor)) {

                                scope.consoleDispatcher.dispatch(SPLODER.FlowNode.ACTION_SHOW_TEXT, cursor.sourceId, cursor.id, cursor.node.target);
                                cursor.node.lastAction = Date.now();
                                cursor.waiting = true;

                                setTimeout(function () {
                                    cursor.waiting = false;
                                }, 1000)

                            } else {
                                console.log('Cursor invalid', cursor);
                            }

                        }

                        break;

                    case SPLODER.FlowNode.ACTION_TURN_OFF:
                    case SPLODER.FlowNode.ACTION_TURN_ON:


                        itemId = scope.tags.getItemByTag(cursor.node.target);
                        targetItem = getItemById(itemId);
                        if (targetItem) targetItem.deactivated = (subtype == SPLODER.FlowNode.ACTION_TURN_OFF);

                        branchCursor(cursor);

                        break;

                    case SPLODER.FlowNode.ACTION_SPAWN_ITEM:

                        console.log("SPAWN ITEM", cursor.node.target, scope.tags.getItemByTag(cursor.node.target));

                    case SPLODER.FlowNode.ACTION_CREATE:


                        console.log("CREATE", cursor.node.target);
                        if (cursor.node.target > 0) {
                            scope.levels.createItemByTag(cursor.node.target);
                        }
                        break;

                    case SPLODER.FlowNode.ACTION_CHANGE_SCORE:

                        sourceItem = getItemById(cursor.sourceId);
                        changeGameProps(scope.simulation.player.rect, SPLODER.GameProps.PROPERTY_SCORE, sourceItem, cursor.node.target);

                        branchCursor(cursor);

                        break;

                }

                break;


            case SPLODER.FlowNode.TYPE_CONTEXT:

                //console.log("FLOW CONTEXT", cursor.node.targetType)

                if (cursor.node.targetType == SPLODER.FlowNode.TARGET_TYPE_TAG) {

                    cursor.context = cursor.node.target;
                    cursor.contextType = SPLODER.FlowNode.TARGET_TYPE_TAG;

                }
                else {

                    cursor.contextType = SPLODER.FlowNode.TARGET_TYPE_LOCAL;

                    console.log("TELL", cursor.node.subtype == 1 ? "A" : "B");

                    if (cursor.node.subtype == 1) {
                        cursor.context = cursor.sourceId;
                    } else {
                        cursor.context = cursor.targetId;
                    }

                }

                branchCursor(cursor);

                break;

            case SPLODER.FlowNode.TYPE_DELAY:

                cursor.startTime = Date.now();
                break;

        }

    };

    var getFirstCursorItem = function(cursor) {

        if (cursor) {

            switch (cursor.contextType) {

                case SPLODER.FlowNode.TARGET_TYPE_TAG:

                    var itemId = scope.tags.getItemByTag(cursor.context);
                    if (itemId) return getItemById(itemId);
                    break;

                default:

                    return getItemById(cursor.context);

            }

        }

    };


    var getCursorItems = function(cursor) {

        var items = [];

        if (cursor) {

            switch (cursor.contextType) {

                case SPLODER.FlowNode.TARGET_TYPE_TAG:

                    var itemIds = scope.tags.getItemsByTag(cursor.context);

                    for (var i = 0; i < itemIds.length; i++) {
                        items.push(getItemById(itemIds[i]));
                    }

                    if (cursor.context == SPLODER.FlowNode.TAG_PLAYER) {
                        items.push(scope.simulation.player.rect);
                    }
                    break;

                default:

                    items.push(getItemById(cursor.context));

            }

        }

        return items;

    };


    var checkCursorTaskComplete = function(cursor) {

        if (cursor.waiting) return;

        if (cursor.node.type == SPLODER.FlowNode.TYPE_DELAY) {

            if (Date.now() - cursor.startTime > cursor.node.target * 1000) {
                branchCursor(cursor);
            }

            return;
        }

        var items = getCursorItems(cursor);
        var busy = false;

        for (var i = 0; i < items.length; i++) {
            if (items[i] && items[i].moving) busy = true;
        }

        if (!busy) {
            branchCursor(cursor);
            scope.onTrigger(SPLODER.FlowNode.TRIGGER_STATE_CHANGED, getItemById(cursor.sourceId));
        }

    };


    var validateCursor = function(cursor) {

        if (cursor.node && cursor.node.type == SPLODER.FlowNode.TYPE_ACTION) {

            if (cursor.node.subtype == SPLODER.FlowNode.ACTION_SHOW_TEXT) {

                var itemA = scope.simulation.player.rect;
                var itemB = getItemById(cursor.sourceId);

                // if source of text is farther than 12 tiles, then abort
                if (itemA && itemB && SPLODER.Geom.distanceBetween(itemA.x, itemA.y, itemB.x, itemB.y) > 16) {

                    scope.consoleDispatcher.dispatch(SPLODER.EVENT_ABORT, cursor.sourceId, cursor.id);

                    resetFlowActionTimes(cursor.node.flowId);
                    endCursor(cursor);

                    return false;

                }

            }

        }

        return true;

    };

    var endCursor = function(cursor) {

        var flows = getFlowsArray(cursor.id, cursor.targetId);

        if (flows && flows.indexOf(cursor) != -1) {

            flows.splice(flows.indexOf(cursor), 1);

        }

    };

    var branchCursor = function(cursor, terminal) {

        var terminals = cursor.node.childrenTerminal;

        var i = cursor.node.children.length;

        if (i == 0) {
            //console.log("ending cursor");
            endCursor(cursor);
            return;
        }

        var new_cursor;

        var flows = getFlowsArray(cursor.id, cursor.targetId);

        while (i--) {

            if (i > 0) {

                if (terminal === undefined || terminal == terminals[i]) {

                    new_cursor = cloneCursorWithChildNum(cursor, i);

                    if (cursor.node.type == SPLODER.FlowNode.TYPE_TRIGGER && terminals[i] === 1) {

                        //console.log("Switching context for new node to B", new_cursor.sourceId, new_cursor.targetId);
                        new_cursor.context = new_cursor.targetId;

                    }

                    //console.log("BRANCHING NODE", cursor.node.id, "TO", new_cursor.node.id, terminal, terminals[i], i);

                    if (new_cursor) {
                        flows.push(new_cursor);
                        //console.log(cursor.id, "FLOWS:", flows.length);
                    }

                }

            }
            else {

                if (terminal === undefined || terminal == terminals[i]) {

                    if (cursor.node.type == SPLODER.FlowNode.TYPE_TRIGGER && terminals[i] === 1) {

                        //console.log("Switching context for new node to B", cursor.sourceId, cursor.targetId);
                        cursor.context = cursor.targetId;

                    }

                    // console.log("ADVANCING NODE", cursor.node.id, terminal, terminals[i], i);
                    advanceCursor(cursor);

                }
                else {

                    endCursor(cursor);

                }

            }

        }

    };

    var advanceCursor = function(cursor) {

        var children = cursor.node.children;
        var childNode;

        if (children.length > 0) {

            childNode = scope.flows.getNodeById(children[0]);

            if (childNode) {
                //console.log("advancing cursor to node", children[0]);
                cursor.node = childNode;
                cursor.startTime = Date.now();
                cursor.processed = false;
            }
            else {
                //console.log("Child node", children[0], "not found...");
                endCursor(cursor);
            }
        }

    };

    var cloneCursorWithChildNum = function(cursor, childNum) {

        var children = cursor.node.children;

        var new_cursor = new SPLODER.FlowCursor().init(cursor.node, cursor.sourceId, cursor.targetId);
        new_cursor.id = cursor.id;
        new_cursor.node = scope.flows.getNodeById(children[childNum]);
        new_cursor.context = cursor.context;
        new_cursor.contextType = cursor.contextType;

        //console.log("cloning cursor from", cursor.node.id, "TO", new_cursor.node.id);

        if (new_cursor.node) return new_cursor;

    };


    var hasFlow = function(triggerNodeId, targetId) {

        return (getFlowsArray(triggerNodeId, targetId).length > 0);

    };


    var getFlowsArray = function(cursorId, targetId) {

        var idx = targetId + 10;

        if (!_flowCursors[cursorId]) _flowCursors[cursorId] = [];
        if (!_flowCursors[cursorId][idx]) _flowCursors[cursorId][idx] = [];

        return _flowCursors[cursorId][idx];

    };


    var beginFlow = function(subtype, sourceId, targetId) {

        sourceId = sourceId || 0;
        targetId = targetId || 0;

        var triggers, i, node, cursor;

        if (sourceId > 0 && targetId >= -10) {

            triggers = scope.flows.getTriggersByItemId(sourceId);

            i = triggers.length;

            while (i--) {

                node = triggers[i];
                // console.log(node.subtype, subtype, hasFlow(node.id, targetId))

                if (node.subtype == subtype && !hasFlow(node.id, targetId)) {

                    // console.log("STARTING FLOW", node.id, sourceId, targetId, " WITH NEW CURSOR", node);

                    cursor = new SPLODER.FlowCursor().init(node, sourceId, targetId);

                    getFlowsArray(node.id, targetId).push(cursor);

                }

            }

        } else if (sourceId == SPLODER.FlowNode.SCOPE_GAME) {

            var triggers = scope.flows.getTriggersByItemId(SPLODER.FlowNode.SCOPE_GAME);

            i = triggers.length;
console.log("GAME SCOPED BEGINFLOW", triggers.length)
            while (i--) {

                node = triggers[i];
                console.log(node.subtype, subtype, hasFlow(node.id, targetId))

                if (node.subtype == subtype && !hasFlow(node.id, targetId)) {

                    console.log("STARTING GAME SCOPE FLOW", node.id, sourceId, targetId, " WITH NEW CURSOR", node);

                    cursor = new SPLODER.FlowCursor().init(node, targetId);

                    getFlowsArray(node.id, targetId).push(cursor);

                }

            }


        }

    };

    /*
    SPLODER.GameProps.TAG_WEAPON = -9;
    SPLODER.GameProps.TAG_ARMOR = -8;
    SPLODER.GameProps.TAG_POWERUP = -7;
    SPLODER.GameProps.TAG_KEY = -6;
    SPLODER.GameProps.TAG_PROJECTILE = -5;
    SPLODER.GameProps.TAG_HAZARD = -4;
    SPLODER.GameProps.TAG_EVIL = -3;
    SPLODER.GameProps.TAG_GOOD = -2;
    */

    var getDefaultPropertyChangeDelta = function (sourceItem, subtype, targetItem) {

        if (!sourceItem) return 0;

        var sourceItemType = scope.tags.getSpecialTagByItemId(sourceItem.id);

        if (!isNaN(sourceItemType)) {

            switch (subtype) {

                case SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_HEALTH:

                    switch (sourceItemType) {

                        case SPLODER.GameProps.TAG_PROJECTILE:
                        case SPLODER.GameProps.TAG_HAZARD:
                        case SPLODER.GameProps.TAG_EVIL:
                        case SPLODER.GameProps.TAG_GOOD:
                            return 0 - sourceItem.getAttrib(SPLODER.GameProps.PROPERTY_STRENGTH);

                        case SPLODER.GameProps.TAG_POWERUP:
                            return sourceItem.getAttrib(SPLODER.GameProps.PROPERTY_STRENGTH);

                    }

                    break;

                case SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_STRENGTH:

                    if (sourceItemType == SPLODER.GameProps.TAG_POWERUP) {
                        return Math.max(0, sourceItem.getAttrib(SPLODER.GameProps.PROPERTY_STRENGTH) - targetItem.getAttrib(SPLODER.GameProps.PROPERTY_STRENGTH));
                    }
                    break;

                case SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_RANGE:

                    if (sourceItemType == SPLODER.GameProps.TAG_POWERUP) {
                        return Math.max(0, sourceItem.getAttrib(SPLODER.GameProps.PROPERTY_RANGE) - targetItem.getAttrib(SPLODER.GameProps.PROPERTY_RANGE))
                    }
                    break;

                case SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_ARMOR:

                    if (sourceItemType == SPLODER.GameProps.TAG_POWERUP) {
                        return Math.max(0, sourceItem.getAttrib(SPLODER.GameProps.PROPERTY_ARMOR) - targetItem.getAttrib(SPLODER.GameProps.PROPERTY_ARMOR))
                    }
                    break;

            }

        }

        return 0;

    }

    this.onModelChanged = function(event, items) {

        switch (event) {

            case SPLODER.ACTION_SELECT_ITEM:

                var item = items[0];

                if (scope.tags.hasSpecialTag(item.id)) {

                    scope.gameEvents.addEvent(SPLODER.GameEvent.TYPE_PLAYER_SELECT, scope.player, item, 0);

                } else if (item && scope.flows.itemHasTriggerOfSubtype(item.id, SPLODER.FlowNode.TRIGGER_SELECTED)) {

                    beginFlow(SPLODER.FlowNode.TRIGGER_SELECTED, item.id, -1);
                    beginFlow(SPLODER.FlowNode.TRIGGER_SELECTED, 0, item.id);


                }

                break;

            case SPLODER.EVENT_STATE_CHANGE_START:


            case SPLODER.EVENT_STATE_CHANGE_COMPLETE:


        }

    };

    this.onGameEvent = function (e) {

        if (e) {

            //console.log("TRIGGERING EVENT", e.type)

            switch (e.type) {

                case SPLODER.GameEvent.TYPE_ATTACK:
                    scope.onTrigger(SPLODER.FlowNode.TRIGGER_ATTACK_START, e.sourceItem, e.targetItem);
                    console.log("TRIGGERING ATTACK START!", e.sourceItem.id);
                    break;

                case SPLODER.GameEvent.TYPE_ITEM_PICKED_UP:
                    console.log("TRIGGERING ITEM PICKED UP!", e.sourceItem.id);
                    scope.onTrigger(SPLODER.FlowNode.TRIGGER_ITEM_PICKED_UP, e.sourceItem, e.targetItem);
                    break;

                case SPLODER.GameEvent.TYPE_ITEM_DESTROYED:
                    console.log("TRIGGERING ITEM DESTROYED!", e.sourceItem.id);
                    scope.onTrigger(SPLODER.FlowNode.TRIGGER_ITEM_DESTROYED, e.sourceItem);
                    break;

                case SPLODER.GameEvent.TYPE_PLAYER_HEALTH_CHANGED:
                    console.log("TRIGGERING PLAYER HEALTH CHANGED!", e.eventData, e.sourceItem);
                    scope.onTrigger(SPLODER.FlowNode.TRIGGER_HEALTH_CHANGED, SPLODER.FlowNode.SCOPE_GAME, e.sourceItem);
                    break;

                case SPLODER.GameEvent.TYPE_PLAYER_SCORED:
                    console.log("TRIGGERING PLAYER SCORED!", e.eventData);
                    scope.onTrigger(SPLODER.FlowNode.TRIGGER_PLAYER_SCORED, SPLODER.FlowNode.SCOPE_GAME, e.sourceItem);
                    break;

            }

        }

    }


    // this is probably for tracking SHOW TEXT completion
    this.onConsoleChanged = function(eventScope, type, sourceId, cursorId, data) {

        // console.log("game console changed!", arguments);

        var cursor = getCursorById(cursorId);

        switch (type) {

            case SPLODER.EVENT_STATE_CHANGE_START:

                break;

            case SPLODER.EVENT_STATE_CHANGE_STEP:

                break;

            case SPLODER.EVENT_STATE_CHANGE_COMPLETE:

                if (cursor) cursor.waiting = false;

                break;

            case SPLODER.ACTION_RETURNED_ERROR:

                if (cursor) endCursor(cursor);

                break;

        }

        this.simulationDispatcher.dispatch(eventScope, type, sourceId, data);

    };


    this.onOutOfRange = function(sourceId, targetId) {

        var sourceItem = getItemById(sourceId);

        if (sourceItem && sourceItem.target && sourceItem.target.id == targetId) {
            //console.log(sourceId, "OUT OF RANGE OF", targetId);
            sourceItem.target = null;
            sourceItem.watching = false;
        }

    };


    this.onTrigger = function(subtype, source, target) {

        var flows = this.flows;

        if (target && target.id == SPLODER.FlowNode.TAG_PLAYER && source && source.rect) {

            switch (subtype) {

                case SPLODER.FlowNode.TRIGGER_COLLISION:

                    scope.gameEvents.addEvent(SPLODER.GameEvent.TYPE_PLAYER_CONTACT, scope.player, source.rect, 0);
                    break;

            }

        }

        if (subtype != SPLODER.FlowNode.TRIGGER_RANGE_OUT &&
            source &&
            !flows.itemHasTriggerOfSubtype(source.id, subtype) &&
            SPLODER.FlowNode.globalTriggers.indexOf(subtype) == -1) {

            // if (subtype != 3 && subtype != 8) console.log("CANCELED TRIGGER", subtype, "ON ITEM", source.id);
            return;

        }

        if (!source && SPLODER.FlowNode.globalTriggers.indexOf(subtype) == -1) {
            return;
        }

        if (target && target.id == -1) {
            // console.log("TRIGGER", subtype, source.id, target.id)
        }

        switch (subtype) {

            case SPLODER.FlowNode.TRIGGER_COLLISION:
            case SPLODER.FlowNode.TRIGGER_COLLISION_END:
            case SPLODER.FlowNode.TRIGGER_STEPPED_ON:
            case SPLODER.FlowNode.TRIGGER_CRUSH:
            case SPLODER.FlowNode.TRIGGER_ENTER:
            case SPLODER.FlowNode.TRIGGER_EXIT:
            case SPLODER.FlowNode.TRIGGER_NEAR_IN:
            case SPLODER.FlowNode.TRIGGER_NEAR:
            case SPLODER.FlowNode.TRIGGER_NEAR_OUT:
            case SPLODER.FlowNode.TRIGGER_RANGE_IN:
            case SPLODER.FlowNode.TRIGGER_RANGE_OUT:
            case SPLODER.FlowNode.TRIGGER_SEE:
            case SPLODER.FlowNode.TRIGGER_ATTACK_START:
            case SPLODER.FlowNode.TRIGGER_ATTACK_HIT:
            case SPLODER.FlowNode.TRIGGER_SEE:

                if (source.rect && target.rect){
                    if (source.rect.levelNum !=  target.rect.levelNum) {
                        console.log("NO LEVEL MATCH", subtype, source.rect.levelNum, target.rect.levelNum)
                        return;
                    }
                }
                beginFlow(subtype, source.id, target.id);
                break;

            case SPLODER.FlowNode.TRIGGER_EMPTY:
            case SPLODER.FlowNode.TRIGGER_STATE_CHANGED:
            case SPLODER.FlowNode.TRIGGER_HEALTH_CHANGED:
console.log("T HEALTH CHANGE", source.id)
                beginFlow(subtype, source.id);
                break;

            case SPLODER.FlowNode.TRIGGER_RANGE_OUT:

                scope.onOutOfRange(source.id, target.id);
                break;

            case SPLODER.FlowNode.TRIGGER_PLAYER_SCORED:

                console.warn("YO GLOBAL TRIGGER!", subtype, 0, target ? target.id : -1);
                if (target) {
                    beginFlow(subtype, 0, target.id);
                } else {
                    beginFlow(subtype, 0, -1);
                }
                break;

            // HYBRID GLOBAL + LOCAL
            case SPLODER.FlowNode.TRIGGER_ITEM_PICKED_UP:
            case SPLODER.FlowNode.TRIGGER_ITEM_DESTROYED:

                if (source) {
                    beginFlow(subtype, source.id, -1);
                }

                beginFlow(subtype, 0, source.id);



        }

    };

};
