SPLODER.FlowBuilder = function () {

    this.init = function () {

    };

};

SPLODER.FlowBuilder.toString = function (flowNode, model) {

    var text = '';
    var error = false;


    var getTargetText = function (flowNode) {

        var text = '';
        var f = flowNode;

        var ftt = f.targetType;

        if (ftt == SPLODER.FlowNode.TARGET_TYPE_NONE) {

            return text;

        } else  if (ftt == SPLODER.FlowNode.TARGET_TYPE_TAG) {

            if (f.target <= 0) text = SPLODER.FlowBuilder.specialTags[Math.abs(parseInt(f.target))];
            else text = f.target;

        } else if (ftt == SPLODER.FlowNode.TARGET_TYPE_TEXT) {

            text = '"' + window.atob(f.target).split('"').join('`') + '"';

        } else {

            text = f.target;

        }

        return ' ' + text;

    }

    try {

        var f = flowNode;
        var C = SPLODER.FlowBuilder;
        var t;
        var ids = [];
        var stackLen = 0;

        if (flowNode) {

            while (f) {

                ids.push(f.id);
                stackLen++;

                if (stackLen >= 48) throw new Error('Max stack length exceeded');

                if (f.children.length > 2 || (f.children.length > 1 && f.type != SPLODER.FlowNode.TYPE_CONDITION)) throw new Error('Cannot parse branching nodes');
                else if (f.children.length > 1 && f.childrenTerminal[0] == f.childrenTerminal[1]) throw new Error('Cannot parse more than one flow from same node terminal');

                t = C.reservedWordTypes[f.type - 1];
                //console.log(f.type, t, f, "reserved:", C.reservedWords[t]);
                text += C.reservedWords[t][0] + ' ';

                if (f.type == SPLODER.FlowNode.TYPE_CONDITION) {

                    text += C.subtypeWords[t][f.subtype];

                    if (f.targetType == SPLODER.FlowNode.TARGET_TYPE_NUMBER && f.operator >= 0) {
                        text += ' ' + SPLODER.FlowNode.operatorSymbols[f.operator] + ' ';
                    }

                    text += getTargetText(f);

                    if (f.children.length == 2) {

                        var elseCode = '';

                        if (f.childrenTerminal[0] == 1) elseCode = SPLODER.FlowBuilder.toString(model.getItemById(f.children[0]), model);
                        else if (f.childrenTerminal[1] == 1) elseCode = SPLODER.FlowBuilder.toString(model.getItemById(f.children[1]), model);

                        if (elseCode) {
                            if (elseCode.indexOf('if') != -1) throw new Error('Cannot parse cascading conditionals');
                            stackLen += 1;
                            text += ' else ' + elseCode + ' endelse';
                        }

                    }

                } else if (f.type == SPLODER.FlowNode.TYPE_CONTEXT) {

                    text += f.target;

                } else if (f.type == SPLODER.FlowNode.TYPE_DELAY) {

                    text += f.target;

                } else if (f.type == SPLODER.FlowNode.TYPE_LOOP) {

                    var rewindToId = f.children.length ? f.children[0] : 0;

                    //console.log(f.id, rewindToId, ids.indexOf(rewindToId));

                    if (rewindToId && ids.indexOf(rewindToId) != -1) {
                        var rewindSteps = ids.length - ids.indexOf(rewindToId) - 2;
                        text += ' ' + rewindSteps + ' repeat ' + (f.target ? f.target : 'infinite');
                    }

                } else {

                    text += C.subtypeWords[t][f.subtype];
                    text += getTargetText(f);

                }

                if (f.type == SPLODER.FlowNode.TYPE_LOOP) break;


                if (f.children.length == 0) {
                    f = null;
                } else if (f.type == SPLODER.FlowNode.TYPE_TRIGGER && f.childrenTerminal[0] === 1) {
                    text += ' with B ';
                    f = model.getItemById(f.children[0]);
                } else if (f.childrenTerminal[0] === 0) {
                    f = model.getItemById(f.children[0]);
                } else if (f.childrenTerminal[1] === 0) {
                    f = model.getItemById(f.children[1]);
                } else {
                    throw new Error('Confused!')
                }

                if (f) {
                    text += ' then ';
                }

            }

        }

    } catch (err) {

        console.warn(text);
        console.error(err);
        error = true;

    }

    if (error) return false;

    return text;

};

SPLODER.FlowBuilder.fromString = function (text, model, isGame, flowId) {

    if (!text) return;

    text = text.toLowerCase();
    text = text.split("\n").join('');

    var nodeIds = [];
    var nodeTypes = [];

    var tokens = SPLODER.FlowBuilder.getTokens(text);
    var word;
    var context = -1;
    var rectType, rectSubtype, rectOperator, rectValue, targetType, tileX = 0, tileY = 0;

    var subtypes = {};

    for (var key in SPLODER.FlowBuilder.subtypeWords) {
        subtypes[key] = SPLODER.FlowBuilder.subtypeWords[key].join(',').toLowerCase().split(',');
    }

    if (!isGame) {

        var itemsById = model.getItemsMatchingFlowID();
        var bounds = SPLODER.ShapeUtils.getBounds(itemsById);

        tileX = bounds.x;
        tileY = bounds.y + bounds.height + 4;

    }

    var parentNode, prevNode, prevNodeType, prevNodeNumTerminals, prevNodeUseAltTerminal;

    var isConnectorWord = function (word) {
        word = word.trim().toLowerCase();
        return SPLODER.FlowBuilder.connectorWords.indexOf(word) > -1;
    }

    var rectTypeTokens = ['', 'on', 'if', 'do', 'with', 'wait', 'rewind'];

    var resetTypes = function () {
        context = -1;
        rectType = rectSubtype = rectOperator = rectValue = targetType = null;
    }

    resetTypes();

    for (var i = 0; i < tokens.length; i++) {

        word = tokens[i];

        if (isConnectorWord(word)) {

            if ((word == 'endif' || word == 'endelse') && parentNode) {
                prevNode = parentNode;
                tileX = prevNode.x + 18;
                tileY -= 6;
            } else if (word == 'else' && prevNodeType == SPLODER.FlowNode.TYPE_CONDITION) {
                prevNodeUseAltTerminal = true;
                tileY += 6;
            }

            resetTypes();

        }

        if (word == "repeat") continue;

        if (rectType === null) {

            rectType = rectTypeTokens.indexOf(word);
            if (rectType == -1) resetTypes();
            else if (rectType >= SPLODER.FlowNode.TYPE_CONTEXT) rectSubtype = 0;

            if (rectType >= SPLODER.FlowNode.TYPE_DELAY) {
                rectSubtype = 1;
                targetType = SPLODER.FlowNode.TARGET_TYPE_NUMBER;
            }

        } else if (rectSubtype === null) {

            var wordType = SPLODER.FlowBuilder.reservedWordTypes[rectType - 1];

            if (wordType) {

                var arr = subtypes[wordType];

                if (arr) rectSubtype = arr.indexOf(word);

                if (rectSubtype == -1) {
                    rectSubtype = targetType = null;
                } else {
                    var arr = SPLODER.FlowNode.subtypeTargetTypes[rectType];
                    if (arr) targetType = arr[rectSubtype];
                }

            }

            if (rectType == SPLODER.FlowNode.TYPE_CONDITION) {

                var operators = SPLODER.FlowBuilder.reservedWords.conditions;

                if (targetType > 0 && operators.indexOf(tokens[i + 1]) == -1) {
                    rectOperator = SPLODER.FlowNode.OPERATOR_EQUALS;
                }

            }

        } else if (rectType == SPLODER.FlowNode.TYPE_CONDITION && rectOperator === null && targetType) {

            var operators = SPLODER.FlowBuilder.reservedWords.conditions;

            rectOperator = operators.indexOf(word);
            if (rectOperator == -1) rectOperator = null;

            // console.log("SETTING OPERATOR", word, rectOperator)

        } else if (rectType == SPLODER.FlowNode.TYPE_CONTEXT) {

            if (word == 'a') {

                rectSubtype = SPLODER.FlowNode.CONTEXT_SUBJECT;
                rectValue = 0;

            } else if (word == 'b') {

                rectSubtype = SPLODER.FlowNode.CONTEXT_B;
                rectValue = 0;

            } else if (!isNaN(parseInt(word)) || SPLODER.FlowBuilder.specialTags.indexOf(word) != -1) {

                rectSubtype = SPLODER.FlowNode.CONTEXT_TAG;
                rectValue = parseInt(word);
                if (isNaN(rectValue)) {
                    rectValue = 0 - SPLODER.FlowBuilder.specialTags.indexOf(word);
                }

            }

            // console.log("PREV NODE TYPE", prevNodeType, SPLODER.FlowNode.TYPE_TRIGGER, prevNodeNumTerminals, rectSubtype);

            if (prevNodeType == SPLODER.FlowNode.TYPE_TRIGGER && prevNodeNumTerminals == 2 && (rectSubtype == SPLODER.FlowNode.CONTEXT_A || rectSubtype == SPLODER.FlowNode.CONTEXT_B)) {
                if (rectSubtype == SPLODER.FlowNode.CONTEXT_B) {
                    // console.log("USER ALT TERMINAL")
                    prevNodeUseAltTerminal = true;
                }
                resetTypes();
            }

        } else if (targetType > 0 && rectValue === null) {

            if (!isNaN(parseInt(word))) {

                rectValue = parseInt(word);

            } else if (targetType == SPLODER.FlowNode.TARGET_TYPE_TAG) {

                var specialIdx = SPLODER.FlowBuilder.specialTags.indexOf(word);
                if (specialIdx >= 0) rectValue = 0 - specialIdx;

            } else if (targetType == SPLODER.FlowNode.TARGET_TYPE_TEXT) {

                rectValue = window.btoa(word.split('"').join(''))

            }

        }


        if (rectType !== null && rectSubtype !== null &&
            (rectType != SPLODER.FlowNode.TYPE_CONDITION || !isNaN(rectOperator)) &&
            (targetType == 0 || rectValue !== null)) {

            // console.log("New node", rectType, rectSubtype, rectOperator, targetType, rectValue);

            var w = SPLODER.FlowNode.rectWidths[rectType];
            var node;

            if (!isGame) {

                model.onAction([SPLODER.ACTION_CREATE, rectType, rectSubtype, rectOperator, rectValue, tileX, tileY, w, 4]);
                node = model.selection[0];

            } else {
                
                node = model.addNode(flowId, rectType, rectSubtype, rectOperator, targetType, rectValue);
            }

            if (node) {

                nodeIds.push(node.id);
                nodeTypes.push(node.type);

                // let's connect this thing
                if (prevNode) {
                    // console.log("ATTACHING new node to previous node", prevNode.type, prevNodeNumTerminals, prevNodeUseAltTerminal);
                    prevNode.addChild(node.id, prevNodeUseAltTerminal ? 1 : 0);
                }

                if (node.type == SPLODER.FlowNode.TYPE_LOOP) {

                    var stepsBack = parseInt(rectValue);

                    if (stepsBack > 0 && stepsBack < nodeIds.length - 2) {
                        var loops = tokens[i + 2];
                        if (loops == 'infinite') loops = 0;
                        else loops = parseInt(loops);
                        node.setAttrib(SPLODER.FlowNode.PROPERTY_TARGET, loops);
                        var rewindNodeId = nodeIds[nodeIds.length - stepsBack - 2];
                        node.addChild(rewindNodeId);
                        node.y += 8;
                        node.x -= Math.floor(12 * stepsBack);
                    }


                }

            } else {

                return;

            }

            prevNode = node;
            prevNodeType = rectType;
            if (prevNodeType == SPLODER.FlowNode.TYPE_CONDITION) parentNode = prevNode;
            prevNodeNumTerminals = (rectType == SPLODER.FlowNode.TYPE_TRIGGER) ? SPLODER.FlowNode.triggerTerminals[rectSubtype] : (rectType == SPLODER.FlowNode.TYPE_CONDITION) ? 2 : 1;
            prevNodeUseAltTerminal = false;

            // console.log("prev node num terminals", rectType == SPLODER.FlowNode.TYPE_TRIGGER, SPLODER.FlowNode.triggerTerminals[rectSubtype], rectSubtype, prevNodeNumTerminals)

            tileX += w + 6;
            resetTypes()

        } else {

            // console.log(word, rectType, rectSubtype, rectOperator, targetType, rectValue);

        }

        /*
        console.log(
            rectType !== null,
            rectSubtype !== null,
            (rectType != SPLODER.FlowNode.TYPE_CONDITION || !isNaN(rectOperator)),
            (targetType == 0 || rectValue !== null)
        );
        */

    }

};

SPLODER.FlowBuilder.getTokens = function (text) {

    text = text + '';
    if (!text) return [];

    var inQuotes = false;
    var char;
    var chars = [];

    for (var i = 0; i < text.length; i++) {
        char = text.charAt(i);
        if (char == '"') inQuotes = !inQuotes;
        if (inQuotes && (char == ' ' || char == '\xa0')) chars.push('_');
        else chars.push(char);
    }

    text = chars.join('');

    var tokens = text.split('\xa0').join(' ').split(' ');

    for (var i = 0; i < tokens.length; i++) {
        tokens[i] = tokens[i].split('_').join(' ');
    }

    return tokens;

}

SPLODER.FlowBuilder.connectorWords = ['then', 'else', 'endif', 'endelse'];
SPLODER.FlowBuilder.reservedWordTypes = ['triggers', 'conditions', 'actions', 'contexts', 'delays', 'flowcontrol'];

SPLODER.FlowBuilder.reservedWords = {
    triggers: ['on'],
    conditions: ['if', '==', '!=', '>', '<'],
    actions: ['do'],
    contexts: ['with', 'A', 'B'],
    delays: ['wait'],
    flowcontrol: ['rewind', 'repeat']
};

SPLODER.FlowBuilder.subtypeWords = {
    triggers: ['',
        'frame', 'start', 'collision', 'collisionEnd', 'selected', 'nearIn', 'near', 'nearOut', 'rangeIn', 'rangeOut',
        'steppedOn', 'crush', 'enterSector', 'exitSector', 'sectorEmpty', 'see', 'attackStart', 'attackHit',
        'stateChanged', 'healthChanged', 'playerScored', 'pickedUp', 'destroyed'
    ],
    conditions: ['',
        'touching', 'playerHas', 'contains', 'tagged', 'bTagged', 'state', 'isNear', 'isInRange',
        'inSector', 'followingB', 'health', 'strength', 'range', 'armor', 'memory', 'score'
    ],
    actions: ['',
        'goto', 'changeHealth', 'changeStrength', 'changeRange', 'changeArmor', 'setMemory', 'solidOff', 'solidOn',
        'teleportTo', 'selfDestruct', 'watchB', 'faceB', 'followB', 'unfollow', 'attackB', 'defend',
        'spawnItem', 'showText', 'turnOff', 'turnOn', 'create', 'changeScore', 'loseGame', 'winGame'
    ],
    contexts: ['',
        'A', 'B', 'tag'
    ],
    delays: ['',
        'wait'
    ],
    flowcontrol: ['',
        'loop'
    ]
}

SPLODER.FlowBuilder.specialTags = ['any', 'player', 'good', 'bad', 'hazard', 'projectile', 'key', 'powerup', 'shield', 'weapon'];
