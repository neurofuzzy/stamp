SPLODER.Modal = function () {
    
    this.model = null;
    this.accepted = null;
    this.container = null;
    
    this.context = null;
    this.action = null;
    this.value = null;
    
    var scope = this;
    var _itemId = 0;
    var _showing = false;

    Object.defineProperty(this, "itemId", {
        get: function () {
            return _itemId;
        },
        set: function (val) {
            _itemId = val;
            update();
        }
    });

    this.init = function () {
    
        this.model = {};
        this.accepted = new signals.Signal();
        this.container = $$("#modal");
        
        var scope = this;
        
        $$('.dialogue_input input').onkeyup = function (e) {
            scope.onInput (e.target.value);
        };

        return this;
    
    };

    this.show = function (context, action, value) {
    
        this.context = context;
        this.action = action;
        
        $forEach('#modal .dialogue', function (elem) { 
            elem.classList.add('hidden');
        });
        
        switch (action) {
            
            case SPLODER.ACTION_ALERT:
                if (value) {
                    $$('.dialogue_alert p').innerText = value;
                    $$('.dialogue_alert').classList.remove('hidden');
                } else {
                    return;
                }
                break;
                
            case SPLODER.ACTION_CONFIRM:
                $$('.dialogue_confirm').classList.remove('hidden');
                break;
            
            case SPLODER.ACTION_PROJECT_LIST:
                this.clearList();
                $$('.dialogue_list').classList.remove('hidden');
                break;
                
            case SPLODER.ACTION_PROJECT_GETNAME:
                this.clearInput();
                $$('.dialogue_input').classList.remove('hidden');
                setTimeout(function () { $$('.dialogue_input input').focus(); }, 10);
                break;
            
            case SPLODER.ACTION_RETURNED_ERROR:
                $$('.dialogue_alert h2').innerText = 'Error';
                $$('.dialogue_alert p').innerText = 'There was a problem communicating with the server.';
                $$('.dialogue_alert').classList.remove('hidden');
                break;
                
            case SPLODER.ACTION_BUSY:
                $$('.dialogue_busy').classList.remove('hidden');
                break;
            
            default:
                // code
        }
        
        this.container.classList.remove('hidden');
        _showing = true;
        
    };
    
    this.populateList = function (data) {
        
        console.log("DATA", data);
        
        var html = $arrayToHTML(data, '<a><li data-id="{val}" data-action="select" data-group="modal_items_list">{val}</li></a>') || '';
        console.log(html);
        
        var listElem = $$('#modal .dialogue_list div.items ul');
        
        listElem.innerHTML = html;
        
        SPLODER.connectButtons(this, listElem, this.onSelect);
        
        
    };
    
    this.hide = function () {
            
        this.context = null;
        this.action = null;
        this.value = null;
        this.clearList();
        this.clearInput();
        this.container.classList.add('hidden');
        _showing = false;
        
    };
    
    this.showing = function () {
        return _showing;
    }
    
    this.clearList = function () {
        $$('.dialogue_list .items ul').innerHTML = '';
        SPLODER.disableButtons('modal-select');
    };
    
    this.clearInput = function () {
        $$('.dialogue_input input').value = '';
        SPLODER.disableButtons('modal-apply');
    };
    
    this.onSelect = function (id, target) {
        
        if ($selectedId(this.container)) {
            SPLODER.enableButtons('modal-select');
            this.value = id;
        } else {
            SPLODER.disableButtons('modal-select');
            this.value = false;
        }
        
    };
    
    this.onInput = function (value) {
        if (value && value.length) {
            SPLODER.enableButtons('modal-apply');
        } else {
            SPLODER.disableButtons('modal-apply');
        }
        this.value = value || false;
    };
    
    this.onCommand = function (command) {
        
        switch (command) {
            
            case 'close':
            case 'decline':
            case 'hide':
            case 'acknowledge':
                this.hide();
                break;
                
            case 'accept':
            case 'select':
            case 'apply':
                if (this.context && this.action) {
                    scope.accepted.dispatch(this.context, this.action, this.value);
                    this.hide();
                }
                break;
            
        }
        
    };
    
};