SPLODER.FlowBuilderArea = function () {

    var container;
    var codeElem;

    var scope = this;

    var subtypes = {};

    for (var key in SPLODER.FlowBuilder.subtypeWords) {
        subtypes[key] = SPLODER.FlowBuilder.subtypeWords[key].join(',').toLowerCase().split(',');
    }

    this.model = null;
    this.flowArea = null;

    this.init = function (flowStore, flowArea) {

        this.model = flowStore;
        this.flowArea = flowArea;

        this.model.changed.add(onModelChanged, this);

        container = $('flowbuilderarea');
        codeElem = $$('#flowbuilderarea code');

        codeElem.addEventListener('keyup', SPLODER.bind(this, this.onCodeChanged));
        codeElem.addEventListener('mouseup', SPLODER.bind(this, this.onCodeChanged));
        codeElem.addEventListener('touchend', SPLODER.bind(this, this.onCodeChanged));

        this.onCodeChanged();

        return this;

    }

    var getCaretOffset = function (editableDiv) {
        var caretPos = 0;
        var sel;
        if (window.getSelection) {
            sel = window.getSelection();
            caretPos += sel.focusOffset;
            var node = sel.anchorNode;
            while (node && node != editableDiv) {
                if (node.previousSibling) {
                    node = node.previousSibling;
                    if (node.nodeType == 3) caretPos += node.nodeValue.length;
                    else if (node.innerText !== undefined) caretPos += node.innerText.length;
                }
                else node = node.parentNode;
                if (node == editableDiv) break;
            }
        }
        return caretPos;
    }

    var setCaretOffset = function (element, offset, context, subContext, targetType, e) {

        var originalOffset = offset;
        var autocompleted = false;
        var range = document.createRange();
        var sel = window.getSelection();
        var childNum = 0;
        var len = 0;
        var clen;
        var n;

        for (var i = 0; i < element.childNodes.length; i++) {
            n = element.childNodes[i];
            if (n.nodeType == 3) {
                clen = n.nodeValue.length;
            } else if (n.innerText) {
                clen = n.innerText.length;
            } else {
                clen = 0;
            }
            if (offset > clen) {
                childNum++;
                offset -= clen;
            } else {
                break;
            }
        }

        childNum = Math.min(childNum, element.childNodes.length - 1);

        var selectedElem = element.childNodes[childNum];
        var isSpan = false;

        if (!selectedElem) return;

        if (selectedElem.nodeType != 3) {
            selectedElem = selectedElem.firstChild;
            isSpan = true;
        }
        offset = Math.min(offset, selectedElem.nodeValue.length);

        if (e && (e.keyCode == 39 || e.keyCode == 32 || (e.keyCode == 13 && codeElem.getAttribute('data-after') != ''))) {
            autocompleted = true;
            if (codeElem.dataset && codeElem.dataset.after) {
                selectedElem.nodeValue = ' ' + selectedElem.nodeValue.trim() + codeElem.dataset.after + ' ';
                offset = selectedElem.nodeValue.length - 1;
            } else if (context == -1) {
                if (selectedElem.nodeValue.toLowerCase().charAt(0) == 't') {
                    selectedElem.nodeValue = ' ' + 'then';
                    offset = selectedElem.nodeValue.length - 1;
                } if (selectedElem.nodeValue.toLowerCase().charAt(0) == 'e') {
                    selectedElem.nodeValue = ' ' + 'else';
                    offset = selectedElem.nodeValue.length - 1;
                }
            }
        }

        range.setStart(selectedElem, offset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        codeElem.setAttribute('data-after', '');

        if (isSpan && !autocompleted) {

            var p = selectedElem.parentNode;
            var pp, pn;
            var pcontext = p.dataset.context;

            p.classList.add('caretWithin');
            pp = p.previousSibling;

            while (pp && (!pp.dataset || pp.dataset.context == pcontext)) {
                if (pp.classList) pp.classList.add('caretWithin');
                pp = pp.previousSibling;
            }

            pn = p.nextSibling;

            while (pn && (!pn.dataset || pn.dataset.context == pcontext)) {
                if (pn.classList) pn.classList.add('caretWithin');
                pn = pn.nextSibling;
            }

            if (p.innerText.toLowerCase().trim() == 'else') {
                pp = p.previousSibling;
                while (pp) {
                    if (pp.innerText && pp.innerText.toLowerCase() == 'if') {
                        pp.style.textDecoration = 'underline';
                        break;
                    }
                    pp = pp.previousSibling;
                }
            }

        } else {

            if (!autocompleted && selectedElem.previousSibling && selectedElem.previousSibling.previousSibling && !selectedElem.nextSibling) {

                var spp = selectedElem.previousSibling.previousSibling;

                if (spp.dataset) {

                    var autocompleteContext = parseInt(spp.dataset.context);

                    if (autocompleteContext >= 0 && selectedElem.nodeValue.trim().length > 1) {
                        var arr = subtypes[SPLODER.FlowBuilder.reservedWordTypes[autocompleteContext]];
                        if (arr) {
                            console.log(arr);
                            var search = selectedElem.nodeValue.trim().toLowerCase();
                            for (var i = 0; i < arr.length; i++) {

                                if (arr[i].indexOf(search) == 0) {
                                    codeElem.setAttribute('data-after', arr[i].substr(search.length));
                                    //selectedElem.nodeValue = ' ' + selectedElem.nodeValue.trim();
                                    break;
                                }
                            }
                        }
                    }
                }
            }

        }

        setHinting(selectedElem, offset, context, subContext, originalOffset);

        return autocompleted;

    };

    var setHinting = function (elem, offset, context, subContext, originalOffset) {

        var codebox = $('codebox');
        codebox.style.display = 'none';

        var codeText = codeElem.innerText.toLowerCase();

        if (originalOffset < codeText.length - 2) return;

        var hasRewind = (codeText.indexOf('rewind') != -1);

        if (elem) {
            elem = elem.parentNode;
        }

        if (codebox && elem && elem.parentNode && context == -1 && subContext == -1) {
            var bottom = 0 - elem.offsetTop - elem.parentNode.offsetTop + 48;
            var left = elem.offsetLeft + elem.parentNode.offsetLeft + offset * 9 - codebox.offsetWidth * 0.5;
            codebox.style.left = left + 'px';
            codebox.style.bottom = bottom + 'px';
            if (elem.previousSibling && (elem.previousSibling.innerText == 'THEN' || elem.previousSibling.innerText == 'ELSE')) {
                codebox.innerHTML = "<pre>IF \nDO \nWITH \nWAIT \nREWIND</pre>";
            } else {
                if (elem.parentNode.innerText.indexOf('IF ') != -1) {
                    if (hasRewind) {
                        codebox.innerHTML = "<pre>\nELSE \nENDELSE</pre>";
                    } else {
                        codebox.innerHTML = "<pre>THEN \nENDIF \nELSE \nENDELSE</pre>";
                    }
                } else {
                    codebox.innerHTML = "<pre>THEN</pre>";
                }
            }
            codebox.style.display = 'block';
        }

    }

    var getMatchedWord = function (word, context) {

        if (context == -1) return word.toUpperCase();

        word = word.toLowerCase();
        var word2 = word.trim();

        var contextKey = SPLODER.FlowBuilder.reservedWordTypes[context];
        var arr = subtypes[contextKey];
        var arr2 = SPLODER.FlowBuilder.subtypeWords[contextKey];
        if (arr && arr.indexOf(word2) != -1) return arr2[arr.indexOf(word2)];
        return word;

    };

    var getContextForWord = function (word, context, targetType) {

        if (context === undefined) context = -1;
        word = word.toLowerCase();
        var word2 = word.trim();

        if (!isNaN(parseInt(word2)) || word == '==' || word == '>' || word == '<') {
            return context;
        } else if (targetType == 3) {
            if (['a', 'b', 'any', 'player', 'good', 'bad', 'hazard', 'projectile', 'key', 'powerup', 'shield', 'weapon'].indexOf(word2) >= 0) {
                return context;
            }
        }

        var arr;
        var t = SPLODER.FlowBuilder.reservedWordTypes;

        if (context < 0) {

            arr = SPLODER.FlowBuilder.reservedWords;

            for (var i = 0; i < t.length; i++) {
                var loc = SPLODER.FlowBuilder.reservedWords[t[i]].indexOf(word2);
                if (loc != -1) return i;
            }

        } else {

            arr = subtypes[t[context]];
            return arr ? arr.indexOf(word2) : -1;

        }

        return -1;

    }

    var getColorForWord = function (word, context, targetType) {

        word = word.toLowerCase().trim();

        if (!isNaN(parseInt(word)) || word == 'infinite') {
            return SPLODER.FlowBuilderArea.numberColor;
        } else if (word == '==' || word == '>' || word == '<') {
            return SPLODER.FlowBuilderArea.equationColor;
        } else if (targetType == SPLODER.FlowNode.TARGET_TYPE_TEXT && word.charAt(0) == '"') {
            return SPLODER.FlowBuilderArea.stringColor;
        }

        loc = getContextForWord(word, context, targetType);

        if (loc != -1) {
            if (context < 0) {
                return SPLODER.FlowBuilderArea.reservedWordColors[loc];
            } else {
                return SPLODER.FlowBuilderArea.subtypeColors[context];
            }
        }

        return false;

    }

    var isConnectorWord = function (word) {
        word = word.trim().toLowerCase();
        return SPLODER.FlowBuilder.connectorWords.indexOf(word) > -1;
    }

    var joinSpaces = function () {

        var elem = codeElem.firstChild;

        while (elem.nextSibling) {

            var p = elem.previousSibling;
            var n = elem.nextSibling;

            if (p && n && p.dataset && n.dataset) {

                if (elem.innerText == ' ' && p.dataset.context == n.dataset.context) {
                    elem.setAttribute('data-context', p.dataset.context);
                }

            }

            elem = elem.nextSibling;

        }

    }



    /*
    SPLODER.FlowNode.TARGET_TYPE_NONE = 0;
    SPLODER.FlowNode.TARGET_TYPE_LOCAL = 0;
    SPLODER.FlowNode.TARGET_TYPE_NUMBER = 1;
    SPLODER.FlowNode.TARGET_TYPE_STATE = 2;
    SPLODER.FlowNode.TARGET_TYPE_TAG = 3;
    SPLODER.FlowNode.TARGET_TYPE_TEXT = 4;
    */

    this.onCodeChanged = function (e, recursed) {

        var hasError = false;
        var errorInfo = '';

        var caretOffset = getCaretOffset(codeElem);
        console.log(caretOffset)

        var rawText = codeElem.innerText;
        console.log(rawText);
        rawText = rawText.trim();
        while (rawText.length < caretOffset) rawText += ' ';

        if (!rawText) {
            rawText = 'ON';
            caretOffset = 4;
        }

        var addNonBreakingSpace = (rawText.charAt(rawText.length - 1) == '\xa0' || rawText.charAt(rawText.length - 1) == ' ');
        var tokens = SPLODER.FlowBuilder.getTokens(rawText);
        var context = -1;
        var subContext = -1;
        var targetType = -1;
        var codeLen = 0;
        var hasRewind = false;

        for (var i = 0; i < tokens.length; i++) {

            var word = tokens[i];
            if (!word) continue;
            var startContext = context;
            var word2 = word.toLowerCase().trim();

            if (word2 == 'else') hasRewind = false;

            var c;
            if (hasRewind && context == -1 && (!isNaN(word) || word.toLowerCase().trim() != 'repeat')) {
                c = false;
            } else if (isConnectorWord(word)) {
                context =  subContext = targetType = -1;
                if (word2 == 'endif' || word2 == 'else' || word2 == 'endelse') c = SPLODER.FlowBuilderArea.reservedWordColors[1];
                else c = SPLODER.FlowBuilderArea.connectorColor;
            } else {
                c = getColorForWord(word.toLowerCase().trim(), context, targetType);
            }

            if (c) {
                var dword = (context == -1) ? word.toUpperCase() : word;
                var targetTypeClass = '';
                if (!isNaN(word) && (subContext || context == 3)) {
                    targetTypeClass = 'target-type-' + targetType;
                } else if (targetType == 3 && subContext) {
                    targetTypeClass = 'target-type-3s';
                } else if (context == 4 && word.charAt(0) == '"') {
                    targetTypeClass = 'target-type-4';
                }
                tokens[i] = '<span style="color:' + c + '" class="' + targetTypeClass + '" data-context="{CONTEXT}" data-targettype="' + targetType + '">' + getMatchedWord(word, context) + '</span>';
            } else {
                if (caretOffset < codeLen || caretOffset > codeLen + word.length) hasError = true;
                errorInfo = word;
            }

            if (c && context == -1) context = getContextForWord(word.toLowerCase().trim(), context);
            //else if (context >= 0) context = -1;

            tokens[i] = tokens[i].split('{CONTEXT}').join(context);

            if (startContext >= 0 && subContext == -1) {
                if (startContext == 0) {
                    context = subContext = targetType = -1;
                } else {
                    subContext = getContextForWord(word, startContext);
                    if (subContext >= 0) {
                        var targetArr = SPLODER.FlowNode.subtypeTargetTypes[startContext + 1];
                        if (targetArr) targetType = targetArr[subContext];
                    }
                    console.log(word, "context", context, "subcontext", subContext, "targetType", targetType);
                }
            }

            if (targetTypeClass) {
                context = subContext = targetType = -1;
            }

            if (context == 3) {
                targetType = 3;
            }

            if (context == 5) {
                hasRewind = true;
            }

            codeLen += word.trim().length + 1;
        }

        if (addNonBreakingSpace) tokens.push('\xa0');

        codeElem.innerHTML = tokens.join('<span> </span>');
        joinSpaces();

        var autocompleted = false;

        if (e || recursed) {
            autocompleted = setCaretOffset(codeElem, caretOffset, context, subContext, targetType, e);
        }

        if (autocompleted) {
            this.onCodeChanged(null, true);
            return;
        }

        if (hasError) {
            console.warn('error!');
            codeElem.classList.add('error');
        } else {
            codeElem.classList.remove('error');

            if (e && (e.keyCode == 13)) {
                SPLODER.FlowBuilder.fromString(rawText, this.model);
            }
        }

    }


    var clearCode = function () {
        codeElem.innerHTML = '';
        codeElem.classList.remove('disabled');
        codeElem.disabled = false;
    }

    var onModelChanged = function (data) {

        var model = scope.model;

        console.log(data);

        codeElem.blur();
        clearCode();

        if (model.selection.length == 1) {

            var node = model.selection[0];

            if (node.type == SPLODER.FlowNode.TYPE_TRIGGER) {

                var newCode = SPLODER.FlowBuilder.toString(node, scope.model);

                if (newCode) {

                    codeElem.innerHTML = newCode;
                    scope.onCodeChanged();

                } else if (newCode === false) {

                    codeElem.innerHTML = '<em>This group of nodes could not be transformed into code.</em>';
                    codeElem.classList.add('disabled');
                    codeElem.disabled = true;
                    codeElem.blur();

                }
            }

        }

    }

};

SPLODER.FlowBuilderArea.numberColor = '#dddddd';
SPLODER.FlowBuilderArea.stringColor = '#dd8866';
SPLODER.FlowBuilderArea.equationColor = '#dddddd';
SPLODER.FlowBuilderArea.connectorColor = '#0099cc';
SPLODER.FlowBuilderArea.reservedWordColors = ['#ff3300', '#cccc00', '#dd8866', '#cc33cc', '#66aaee', '#00cc99'];
SPLODER.FlowBuilderArea.subtypeColors = ['#cc0000', '#999900', '#aa5533', '#990099', '#3377bb', '#009966'];