﻿/* 
 * Field: String - Dropdown
 */

angular.module("eavFieldTemplates")
    .config(function(formlyConfigProvider) {

        formlyConfigProvider.setType({
            name: "string-dropdown",
            template: "<select class=\"form-control\" ng-model=\"value.Value\"></select>",
            wrapper: ["eavLabel", "bootstrapHasError", "eavLocalization"],
            defaultOptions: function defaultOptions(options) {

                // DropDown field: Convert string configuration for dropdown values to object, which will be bound to the select
                if (!options.templateOptions.options && options.templateOptions.settings.String.DropdownValues) {
                    var o = options.templateOptions.settings.String.DropdownValues;
                    o = o.replace(/\r/g, "").split("\n");
                    o = o.map(function (e, i) {
                        var s = e.split(":");
                        return {
                            name: s[0],
                            value: s[1] ? s[1] : s[0]
                        };
                    });
                    options.templateOptions.options = o;
                }

                function _defineProperty(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); }

                var ngOptions = options.templateOptions.ngOptions || "option[to.valueProp || 'value'] as option[to.labelProp || 'name'] group by option[to.groupProp || 'group'] for option in to.options";
                return {
                    ngModelAttrs: _defineProperty({}, ngOptions, {
                        value: "ng-options"
                    })
                };

            }
        });
    });