﻿
(function () {
	"use strict";

	angular.module("eavEditEntity")
        .directive("eavEditEntityForm", function () {
		return {
		    templateUrl: "form/edit-single-entity.html",
			restrict: "E",
			scope: {
			    entity: "=",
                header: "=",
                registerEditControl: "=",
                readOnly: "="
			},
			controller: "EditEntityFormCtrl",
			controllerAs: "vm"
		};
	});
	

})();