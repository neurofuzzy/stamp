/**
 * Created by ggaudrea on 7/25/15.
 */
SPLODER.ProjectMenu = function () {

    this.container = null;
    this.modal = null;

    this.history = null;
    this.projectService = null;

    this.initWithHistoryAndService = function (history, service) {

        this.container = $$('#projectmenu');

        this.history = history;
        this.projectService = service;

        return this;

    };

    this.setModal = function (modal) {

        this.modal = modal;
        SPLODER.connectButtons(this, this.container, this.onButtonPress);
        this.modal.accepted.add(this.onModalEvent, this);

    }

    this.registerModel = function (model) {

        model.changed.add(this.onChange, this);

        _models[model.id] = model;
        _dispatchers[model.id] = new signals.Signal();
        model.registerWithDispatcher(_dispatchers[model.id]);

    };

};

SPLODER.ProjectMenu.prototype.onButtonPress = function (id, button) {

    if (id == undefined) return;
    if (button && button.classList.contains('disabled')) return;

    var module = id.split('-')[0];
    var command = id.split('-')[1];

    if (command == undefined) {
        command = module;
        module = '';
    }

    var scope = this;

    console.log("Project menu", module, command);

    switch (module) {

        case "modal":

            this.modal.onCommand(command);
            break;

        case "project":

            switch (command) {

                case 'new':
                    this.modal.show(SPLODER.ACTION_PROJECT_NEW, SPLODER.ACTION_CONFIRM);
                    break;

                case 'load':
                    this.modal.show(SPLODER.ACTION_PROJECT_LOAD, SPLODER.ACTION_PROJECT_LIST);
                    this.projectService.getProjectList(
                        function (data, xhr) {
                            scope.modal.populateList(data);
                        },
                        function (data, xhr) {
                            scope.modal.show(null, SPLODER.ACTION_RETURNED_ERROR);
                        }
                    )
                    break;

                case 'save':
                    console.log("History project ID:", this.history.projectId);
                    if (!this.history.projectId) {
                        this.modal.show(SPLODER.ACTION_PROJECT_SAVE, SPLODER.ACTION_PROJECT_GETNAME);
                    } else {
                        this.saveProject(this.history.projectId);
                    }
                    break;

                case 'saveas':
                    this.modal.show(SPLODER.ACTION_PROJECT_SAVEAS, SPLODER.ACTION_PROJECT_GETNAME);
                    break;

                default:
                    // code
            }

            $$('#submenus ul[data-id="project"]').classList.add('hidden');

    }

};

SPLODER.ProjectMenu.prototype.onModalEvent = function (context, action, value) {

    switch (context) {

        case SPLODER.ACTION_PROJECT_NEW:
            this.newProject();
            break;

        case SPLODER.ACTION_PROJECT_SAVE:

            this.saveProject(value);
            break;

        case SPLODER.ACTION_PROJECT_SAVEAS:

            this.saveProjectAs(value);
            break;

        case SPLODER.ACTION_PROJECT_LOAD:

            this.loadProject(value);
            break;

        default:
            // code
    }

};

SPLODER.ProjectMenu.prototype.newProject = function () {

    console.log('Creating new project...');
    this.history.clearStoredHistory();
    this.history.reset();
    this.history.projectId = '';

};

SPLODER.ProjectMenu.prototype.saveProject = function (projectId) {

    console.log('Saving project...');
    this.modal.show(null, SPLODER.ACTION_BUSY);

    var scope = this;
console.log(this.history.projectId, projectId);
    if (this.history.projectId && this.history.projectId == projectId) {

        this.projectService.putProject(projectId, this.history.exportProject(),
            function (data, xhr) {
                console.log("put success", data)
                scope.history.projectId = data.id;
                scope.modal.show(null, SPLODER.ACTION_ALERT, "Your project was saved successfully");
            },
            function (data, xhr) {
                scope.modal.show(null, SPLODER.ACTION_RETURNED_ERROR);
            }
        );

    } else {

        this.projectService.createProject(projectId, this.history.exportProject(),
            function (data, xhr) {
                console.log("create success", data)
                scope.history.projectId = data.id;
                scope.modal.show(null, SPLODER.ACTION_ALERT, "Your project was saved successfully");
            },
            function (data, xhr) {
                scope.modal.show(null, SPLODER.ACTION_RETURNED_ERROR);
            }
        );

    }

};

SPLODER.ProjectMenu.prototype.saveProjectAs = function (projectId) {

    console.log('Saving project...');
    this.modal.show(null, SPLODER.ACTION_BUSY);

    var scope = this;

    this.projectService.createProject(projectId, this.history.exportProject(),
        function (data, xhr) {
            scope.history.projectId = projectId;
            scope.modal.show(null, SPLODER.ACTION_ALERT, "Your project was saved successfully");
        },
        function (data, xhr) {
            scope.modal.show(null, SPLODER.ACTION_RETURNED_ERROR);
        }
    );

};


SPLODER.ProjectMenu.prototype.loadProject = function (projectId) {

    console.log('Loading project...');
    this.modal.show(null, SPLODER.ACTION_BUSY);

    var scope = this;

    if (projectId) {

        this.projectService.getProject(projectId,
            function (project, xhr) {
                console.log("Project", project.name, "loaded...");
                scope.history.reset();
                scope.history.importProject(project, projectId);
            },
            function (data, xhr) {
                scope.modal.show(null, SPLODER.ACTION_RETURNED_ERROR);
            }
        );

    }

}