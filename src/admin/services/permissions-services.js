
angular.module("EavServices")
    .factory("permissionsSvc", function($http, eavConfig, entitiesSvc, metadataSvc, svcCreator, contentTypeSvc) {
        var eavConf = eavConfig;

        // Construct a service for this specific targetGuid
        return function createSvc(appId, permissionTargetGuid) {
            var svc = {
                PermissionTargetGuid: permissionTargetGuid,
                ctName: "PermissionConfiguration",
                ctId: 0,
                EntityAssignment: eavConf.metadataOfEntity,
                ctSvc: contentTypeSvc(appId)
            };

            svc = angular.extend(svc, svcCreator.implementLiveList(function getAll() {
                // todo: refactor this - get out of the eavmanagemnetsvc
                return metadataSvc.getMetadata(svc.EntityAssignment, svc.PermissionTargetGuid, svc.ctName).then(svc.updateLiveAll);
            }));

            // 2016-02-14 2dm commented out, don't think the ctId is ever used...
            // Get ID of this content-type 
            svc.ctSvc.getDetails(svc.ctName).then(function (result) {
                svc.ctId = result.data.Id; // 2016-02-14 previously AttributeSetId;
            });

            // delete, then reload
            svc.delete = function del(id) {
                return entitiesSvc.delete(svc.ctName, id)
                    .then(svc.liveListReload);
            };
            return svc;
        };
    });