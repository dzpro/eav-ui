(function () { // TN: this is a helper construct, research iife or read https://github.com/johnpapa/angularjs-styleguide#iife

    angular.module("ContentTypesApp", ["ContentTypeServices", "ContentTypeFieldServices", "eavGlobalConfigurationProvider", "EavAdminUi"])
        .constant("createdBy", "2sic")          // just a demo how to use constant or value configs in AngularJS
        .constant("license", "MIT")             // these wouldn't be necessary, just added for learning exprience
        .controller("List", ContentTypeListController)
        .controller("Edit", ContentTypeEditController)
        .controller("FieldList", ContentTypeFieldListController)
        .controller("FieldsAdd", ContentTypeFieldAddController)
    ;


    /// Manage the list of content-types
    function ContentTypeListController(contentTypeSvc, eavAdminDialogs, appId) {
        var vm = this;
        var svc = contentTypeSvc(appId);

        vm.items = svc.liveList();
        vm.refresh = svc.liveListReload;

        vm.isLoaded = function isLoaded() { return vm.items.isLoaded; };

        vm.tryToDelete = function tryToDelete(title, entityId) {
            var ok = confirm("Delete '" + title + "' (" + entityId + ") ?");
            if (ok)
                svc.delete(entityId);
        };

        vm.edit = function edit(item) {
            if (item === undefined)
                item = svc.newItem();
            eavAdminDialogs.openContentTypeEdit(item, vm.refresh);
        };

        vm.editFields = function editFields(item) {
            eavAdminDialogs.openContentTypeFields(item, vm.refresh);
        };

        vm.editItems = function editItems(item) {
            eavAdminDialogs.openContentItems(svc.appId, item.StaticName, item.Id, vm.refresh);
        };
        


        vm.tryToDelete = function tryToDelete(item) {
            if (confirm("Delete?")) 
                svc.delete(item);
        };

        vm.liveEval = function admin() {
            var inp = prompt("This is for very advanced operations. Only use this if you know what you're doing. \n\n Enter admin commands:");
            if (inp)
                eval(inp); // jshint ignore:line
        };

        vm.isGuid = function isGuid(txtToTest) {
            var patt = new RegExp(/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/i);
            return patt.test(txtToTest); // note: can't use the txtToTest.match because it causes infinite digest cycles
        };

        vm.permissions = function permissions(item) {
            if (!vm.isGuid(item.StaticName))
                return (alert("Permissions can only be set to Content-Types with Guid Identifiers"));
            return eavAdminDialogs.openPermissionsForGuid(svc.appId, item.StaticName, vm.refresh);
        };

        vm.openExport = function openExport() {
            return eavAdminDialogs.openContentExport(svc.appId);
        };

        vm.openImport = function openImport() {
            return eavAdminDialogs.openContentImport(svc.appId);
        };
    }

    /// Edit or add a content-type
    function ContentTypeEditController(appId, contentTypeSvc, item, $modalInstance) {
        var vm = this;
        var svc = contentTypeSvc(appId);
        
        vm.item = item;

        vm.ok = function () {
            svc.save(item);
            $modalInstance.close(vm.item);
        };

        vm.cancel = function () {
            $modalInstance.dismiss("cancel");
        };
    }

    /// The controller to manage the fields-list
    function ContentTypeFieldListController(appId, contentTypeFieldSvc, contentType, eavGlobalConfigurationProvider, eavManagementSvc, $modalInstance, $modal, $q, eavAdminDialogs) {
        var vm = this;
        var svc = contentTypeFieldSvc(appId, contentType);

        // to close this dialog
        vm.close = function () {
            $modalInstance.dismiss("cancel");
        };

        // Reset & reload the list - initial reset important, because it could still have the previous list cached
        // svc.liveListReset();
        vm.items = svc.liveList();

        // Open an add-dialog, and add them if the dialog is closed
        vm.add = function add() {
            $modal.open({
                animation: true,
                templateUrl: "content-types/content-types-field-edit.html",
                controller: "FieldsAdd",
                controllerAs: "vm",
                resolve: {
                    dataSvc: function() { return svc; }
                }
            });
        };


        // Actions like moveUp, Down, Delete, Title
        vm.moveUp = svc.moveUp;
        vm.moveDown = svc.moveDown;
        vm.setTitle = svc.setTitle;

        vm.tryToDelete = function tryToDelete(item) {
            if (item.IsTitle)
                return alert("Can't delete Title");
            if (confirm("Delete?")) {
                return svc.delete(item);
            }
        };

        // Edit / Add metadata to a specific fields
        vm.createOrEditMetadata = function createOrEditMetadata(item, metadataType) {
            metadataType = "@" + metadataType;
            var exists = item.Metadata[metadataType] !== undefined;

            if (exists) {
                eavAdminDialogs.openItemEditWithEntityId(
                    item.Metadata[metadataType].EntityId,
                    svc.liveListReload);
            } else {
                eavAdminDialogs.openMetadataNew(appId, "attribute", item.Id, metadataType,
                    svc.liveListReload);
            }
        };
    }

    /// This is the main controller for adding a field
    /// Add is a standalone dialog, showing 10 lines for new field names / types
    function ContentTypeFieldAddController(dataSvc, $modalInstance) {
        var vm = this;
        var svc = dataSvc;// (appId, contentType);

        // prepare empty array of up to 10 new items to be added
        var nw = svc.newItem;
        vm.items = [nw(), nw(), nw(), nw(), nw(), nw(), nw(), nw(), nw(), nw()];

        vm.item = svc.newItem();
        vm.types = svc.types.liveList();

        vm.ok = function () {
            var items = vm.items;
            var newList = [];
            for (var c = 0; c < items.length; c++)
                if (items[c].StaticName)
                    newList.push(items[c]);
            svc.addMany(newList, 0);
            $modalInstance.close();//vm.items);
        };

        vm.cancel = function() { $modalInstance.dismiss("cancel"); };
    }
}());