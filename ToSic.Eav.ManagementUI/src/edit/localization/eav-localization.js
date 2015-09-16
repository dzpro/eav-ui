﻿
(function () {
	'use strict';


	/* This app handles all aspectes of the multilanguage features of the field templates */

	var eavLocalization = angular.module('eavLocalization', ['formly', "EavConfiguration"], function (formlyConfigProvider) {

		// Field templates that use this wrapper must bind to value.Value instead of model[...]
		formlyConfigProvider.setWrapper([
			{
				name: 'eavLocalization',
				templateUrl: 'localization/formly-localization-wrapper.html'
			}
		]);

	});

	eavLocalization.directive('eavLanguageSwitcher', function () {
		return {
			restrict: 'E',
			templateUrl: 'localization/language-switcher.html',
			controller: function($scope, languages) {
				$scope.languages = languages;
			}
		};
	});

	//eavLocalization.factory('eavLanguageService', function (languages) {
		//return {
		//	languages: [{ key: 'en-us', name: 'English (United States)' }],
		//	defaultLanguage: 'en-us',
		//	currentLanguage: 'en-us'
		//};
	//});

	eavLocalization.directive('eavLocalizationScopeControl', function () {
		return {
			restrict: 'E',
			transclude: true,
			template: '',
			link: function (scope, element, attrs) {
			},
			controller: function ($scope, $filter, eavDefaultValueService, languages) { // Can't use controllerAs because of transcluded scope

				var scope = $scope;
				var langConf = languages;

				var initCurrentValue = function() {

					// Set base value object if not defined
					if (!scope.model[scope.options.key])
						scope.model[scope.options.key] = { Values: [] };

					var fieldModel = scope.model[scope.options.key];

					// If current language = default language and there are no values, create an empty value object
					if (langConf.currentLanguage == langConf.defaultLanguage) {
						if (fieldModel.Values.length === 0) {
							var defaultValue = eavDefaultValueService(scope.options);
							fieldModel.Values.push({ Value: defaultValue, Dimensions: {} });
							fieldModel.Values[0].Dimensions[langConf.currentLanguage] = true; // Assign default language dimension
						}
					}

					var valueToEdit;

					// Decide which value to edit:
					// 1. If there is a value with current dimension on it, use it
					valueToEdit = $filter('filter')(fieldModel.Values, function(v, i) {
						return v.Dimensions[langConf.currentLanguage] !== undefined;
					})[0];

					// 2. Use default language value
					if (valueToEdit === undefined)
						valueToEdit = $filter('filter')(fieldModel.Values, function(v, i) {
							return v.Dimensions[langConf.defaultLanguage] !== undefined;
						})[0];

					// 3. Use the first value if there is only one
					if (valueToEdit === undefined) {
						if (fieldModel.Values.length > 1)
							throw "Default language value not found, but found multiple values - can't handle editing";
						// Use the first value
						valueToEdit = fieldModel.Values[0];
					}

					fieldModel._currentValue = valueToEdit;

					// Set scope variable 'value' to simplify binding
					scope.value = fieldModel._currentValue;

					// Decide whether the value is writable or not
					var writable = (langConf.currentLanguage == langConf.defaultLanguage) ||
					(scope.value && scope.value.Dimensions[langConf.currentLanguage]);

					scope.to.disabled = !writable;
				};

				initCurrentValue();

				// Handle language switch
				scope.langConf = langConf; // Watch does only work on scope variables
				scope.$watch('langConf.currentLanguage', function (newValue, oldValue) {
					if (oldValue === undefined || newValue == oldValue)
						return;
					initCurrentValue();
					console.log('switched language from ' + oldValue + ' to ' + newValue);
				});

				// ToDo: Could cause performance issues (deep watch array)...
				scope.$watch('model[options.key].Values', function(newValue, oldValue) {
					initCurrentValue();
				}, true);

				// The language menu must be able to trigger an update of the _currentValue property
				scope.model[scope.options.key]._initCurrentValue = initCurrentValue;
			}
		};
	});

	eavLocalization.directive('eavLocalizationMenu', function() {
		return {
			restrict: 'E',
			scope: {
				fieldModel: '=fieldModel',
				options: '=options'
			},
			templateUrl: 'localization/localization-menu.html',
			link: function (scope, element, attrs) { },
			controllerAs: 'vm',
			controller: function ($scope, languages) {
				var vm = this;
				vm.fieldModel = $scope.fieldModel;
				vm.isDefaultLanguage = function () { return languages.currentLanguage != languages.defaultLanguage; };

				vm.actions = {
					translate: function () {
						var value = { Value: 'New translated value!', Dimensions: {} };
						value.Dimensions[languages.currentLanguage] = true;
						vm.fieldModel.Values.push(value);
					}
				};

			}
		};
	});

})();