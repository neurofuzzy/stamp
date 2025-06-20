/**
 * Created by ggaudrea on 3/24/16
 */


SPLODER.ProjectService = function () {

  this.sceneAssets = null;
  this.completed = null;
  this.screenshotService = null;

};

SPLODER.ProjectService.prototype.init = function (endpoint, collection, sceneAssets) {

  collection = '/' + collection.split('/').join('') + '/';

  atomic.setContentType('application/json');

  this.sceneAssets = sceneAssets;
  this.completed = new signals.Signal();

  /* api functions */

  this.getProjectList = function (onSuccess, onError) {

    atomic.get(endpoint + collection)
      .success(function (data, xhr) {
        if (onSuccess) onSuccess(data, xhr);
      })
      .error(function (data, xhr) {
        if (onError) onError(data, xhr);
      });

  };

  this.getProject = function (projectId, onSuccess, onError) {

    atomic.get(endpoint + collection + projectId)
      .success(function (data, xhr) {
        if (onSuccess) onSuccess(data, xhr);
      })
      .error(function (data, xhr) {
        if (onError) onError(data, xhr);
      });

  };

  this.putProject = function (projectId, projectData, onSuccess, onError) {

    if (projectId && projectData) {

      var pt = this.sceneAssets.getAllTextureData();

      this.screenshotService(function (thumb) {

        atomic.put(endpoint + collection + projectId, JSON.stringify(
          {
            name: projectId,
            data: projectData,
            thumbnail: thumb,
            textures: pt
          }

          ))
          .success(function (data, xhr) {
            if (onSuccess) onSuccess(data, xhr);
          })
          .error(function (data, xhr) {
            if (onError) onError(data, xhr);
          });

      });

    }

  };

  this.createProject = function (projectId, projectData, onSuccess, onError) {

    if (projectId) {
      if (!projectData) projectData = ' ';
      var pt = this.sceneAssets.getAllTextureData();

      atomic.post(endpoint + collection + '?name=' + projectId,
        JSON.stringify(
        {
          name: projectId,
          data: projectData,
          thumbnail: (this.screenshotService) ? this.screenshotService() : null,
          textures: pt
        }
        ))
        .success(function (data, xhr) {
          if (onSuccess) onSuccess(data, xhr);
        })
        .error(function (data, xhr) {
          if (onError) onError(data, xhr);
        });
    }

  };

  this.deleteProject = function (projectId, onSuccess, onError) {

    if (projectId) {
      atomic.delete(endpoint + collection + projectId)
        .success(function (data, xhr) {
          if (onSuccess) onSuccess(data, xhr);
        })
        .error(function (data, xhr) {
          if (onError) onError(data, xhr);
        });
    }
  };

  return this;

};
