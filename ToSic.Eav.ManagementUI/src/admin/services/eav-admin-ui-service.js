/*  this file contains a service to handle 
 * How it works
 * This service tries to open a modal dialog if it can, otherwise a new window returning a promise to allow
 * ...refresh when the window close. 
 * 
 * In most cases there is a nice command to open something, like openItemEditWithEntityId(id, callback)
 * ...and there is also a more advanced version where you could specify more closely what you wanted
 * ...usually ending with an X, so like openItemEditWithEntityIdX(resolve, callbacks)
 * 
 * the simple callback is 1 function (usually to refresh the main list), the complex callbacks have the following structure
 * 1. .success (optional)
 * 2. .error (optional) 
 * 3. .notify (optional)
 * 4. .close (optional) --> this one is attached to all events if no primary handler is defined 
 *  
 * How to use
 * 1. you must already include all js files in your main app - so the controllers you'll need must be preloaded
 * 2. Your main app must also  declare the other apps as dependencies, so angular.module('yourname', ['dialog 1', 'diolag 2'])
 * 3. your main app must also need this ['EavAdminUI']
 * 4. your controller must require eavAdminDialogs
 * 5. Then you can call such a dialog
 */


// Todo
// 1. Import / Export
// 2. Pipeline Designer

angular.module("EavAdminUi", ["ng",
    "ui.bootstrap",         // for the $modal etc.
    "eavTemplates",         // Provides all cached templates
    "PermissionsApp",       // Permissions dialogs to manage permissions
    "ContentItemsApp",      // Content-items dialog - not working atm?
    "PipelineManagement",   // Manage pipelines
    "ContentTypeServices",  // Needed to retrieve an Id in a special case
    //"ContentEditApp",       // the edit-app (doesn't work yet)
    "HistoryApp",            // the item-history app
	"eavEditEntity"			// the edit-app
])
    .factory("eavAdminDialogs", function ($modal, eavConfig, eavManagementSvc, contentTypeSvc, $window) {

        var svc = {};

        //#region Content Items dialogs
            svc.openContentItems = function oci(appId, staticName, itemId, closeCallback) {
                return svc.openContentItemsX(svc._createResolve({ appId: appId, contentType: staticName, contentTypeId: itemId }), { close: closeCallback });
            };


            svc.openContentItemsX = function ociX(resolve, callbacks) {
                return svc._openModalWithCallback("content-items/content-items.html", "ContentItemsList as vm", "lg", resolve, callbacks);
            };

        //#endregion

        //#region ContentType dialogs
            svc.openContentTypeEdit = function octe(item, closeCallback) {
                return svc.openContentTypeEditX(svc._createResolve({ item: item }), { close: closeCallback });
            };

            svc.openContentTypeEditX = function octeX(resolve, callbacks) {
                return svc._openModalWithCallback("content-types/content-types-edit.html", "Edit as vm", "sm", resolve, callbacks);
            };

            svc.openContentTypeFields = function octf(item, closeCallback) {
                return svc.openContentTypeFieldsX(
                    svc._createResolve({contentType: item }), { close: closeCallback });
            };

            svc.openContentTypeFieldsX = function octfX(resolve, callbacks) {
                return svc._openModalWithCallback("content-types/content-types-fields.html", "FieldList as vm", "lg", resolve, callbacks);
            };
        //#endregion
        
        //#region Item - new, edit
            svc.openItemNew = function oin(contentTypeId, closeCallback) {
                //if (useDummyContentEditor) {
                    return svc.openItemEditWithEntityIdX(svc._createResolve({ mode: "new", entityId: null, contentTypeName: contentTypeId}), { close: closeCallback });
                //} else {
                //    var url = eavConfig.itemForm.getNewItemUrl(contentTypeId);
                //    return PromiseWindow.open(url).then(null, function(error) { if (error === "closed") closeCallback(); });
                //}
            };

            svc.openItemEditWithEntityId = function oie(entityId, closeCallback) {
                //if (useDummyContentEditor) {
                    return svc.openItemEditWithEntityIdX(svc._createResolve({ mode: "edit", entityId: entityId, contentTypeName:null }), { close: closeCallback });
                //} else {
                //    var url = eavConfig.itemForm.getEditItemUrl(entityId, undefined, true);
                //    return PromiseWindow.open(url).then(null, function(error) { if (error == "closed") closeCallback(); });
                //}
            };

            svc.openItemEditWithEntityIdX = function oieweix(resolve, callbacks) {
            	return svc._openModalWithCallback("wrappers/edit-entity-wrapper.html", "EditEntityWrapperCtrl as vm", "lg", resolve, callbacks);
            };

            svc.openItemHistory = function ioh(entityId, closeCallback) {
                return svc._openModalWithCallback("content-items/history.html", "History as vm", "lg",
                    svc._createResolve({ entityId: entityId }),
                    { close: closeCallback });
            };
            

        //#endregion

        //#region Metadata - mainly new
            svc.openMetadataNew = function omdn(appId, targetType, targetId, metadataType, closeCallback) {
                var key = {}, assignmentType;
                switch (targetType) {
                    case "entity":
                        key.keyGuid = targetId;
                        assignmentType = eavConfig.metadataOfEntity;
                        break;
                    case "attribute":
                        key.keyNumber = targetId;
                        assignmentType = eavConfig.metadataOfAttribute;
                        break;
                    default: throw "targetType unknown, only accepts entity or attribute";
                }
                // return eavManagementSvc.getContentTypeDefinition(metadataType)
                return contentTypeSvc(appId).getDetails(metadataType)
                    .then(function (result) {
                    //if (useDummyContentEditor) {
                        var resolve = svc._createResolve({ mode: "new", entityId: 0, contentTypeName: metadataType });
                        angular.extend(resolve, key);
                        return svc.openItemEditWithEntityIdX(resolve, { close: closeCallback });
                    //} else {

                    //    var attSetId = result.data.AttributeSetId;
                    //    var url = eavConfig.itemForm
                    //        .getNewItemUrl(attSetId, assignmentType, key, false);

                    //    return PromiseWindow.open(url).then(null, function(error) { if (error == "closed") closeCallback(); });
                    //}
                });
            };
        //#endregion

        //#region Permissions Dialog
            svc.openPermissionsForGuid = function opfg(appId, targetGuid, closeCallback) {
                return svc.openPermissionsForGuidX(
                    svc._createResolve({ appId: appId, targetGuid: targetGuid }), { close: closeCallback });
            };

            svc.openPermissionsForGuidX = function opfgX(resolve, callbacks) {
                return svc._openModalWithCallback("permissions/permissions.html", "PermissionList as vm", "lg", resolve, callbacks);
            };
        //#endregion

        //#region Pipeline Designer
            svc.editPipeline = function ep(appId, pipelineId, closeCallback) {
                var url = eavConfig.adminUrls.pipelineDesigner(appId, pipelineId);
                $window.open(url);
                return;
            };
        //#endregion

        //#region Export / Import content Types

        svc.openContentExport = function oce(appId, closeCallback) {
            var url = eavConfig.adminUrls.exportContent(appId);
            window.open(url);
        };
        svc.openContentImport = function oci(appId, closeCallback) {
            var url = eavConfig.adminUrls.importContent(appId);
            window.open(url);
        };
        //#endregion

        //#region Internal helpers
            svc._attachCallbacks = function attachCallbacks(promise, callbacks) {
                return promise.result.then(callbacks.success || callbacks.close, callbacks.error || callbacks.close, callbacks.notify || callbacks.close);
            };

        // Will open a modal window. Has various specials, like
        // 1. If the templateUrl begins with "~/" - this will be re-mapped to the ng-app root. Only use this for not-inline stuff
        // 2. The controller can be written as "something as vm" and this will be split and configured corectly
            svc._openModalWithCallback = function _openModalWithCallback(templateUrl, controller, size, resolveValues, callbacks) {
                //if (templateUrl.substring(0, 2) == "~/")
                //    templateUrl = eavConfig.adminUrls.ngRoot() + templateUrl.substring(2);
                var foundAs = controller.indexOf(" as ");
                var contAs = foundAs > 0 ?
                    controller.substring(foundAs + 4)
                    : null;
                if (foundAs > 0)
                    controller = controller.substring(0, foundAs);

                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: templateUrl,
                    controller: controller,
                    controllerAs: contAs,
                    size: size,
                    resolve: resolveValues
                });

                return svc._attachCallbacks(modalInstance, callbacks);
            };

        /// This will create a resolve-object containing return function()... for each property in the array
            svc._createResolve = function createResolve() {
                var fns = {}, list = arguments[0];
                for (var prop in list) 
                    if (list.hasOwnProperty(prop))
                        fns[prop] = svc._create1Resolve(list[prop]);
                return fns;
            };

            svc._create1Resolve = function (value) {
                return function () { return value; };
            };
        //#endregion


        return svc;
    })

;