'use strict';

angular.module('ngshowvariant', []);

/**
 * A directive that shows elements only when the given variation state is in effect
 * Requires a window variable to be set using optimizely.
 * <div variant-switch="experiment_name">
 *    <div variant-switch-default>variant default is running</div>
 *    <div variant-switch-when="cactus">variant cactus is running</div>
 *    <div variant-switch-when="variant_name">variant variant_name is running</div>
 * </div>
 */

/**
 * In optimizely, add this to 'custom javascript'
 *
 * //tell angular the variant has changed.
 * var scope = angular.element(document.getElementsByTagName("body")[0]).injector().get('$rootScope');
 *
 * scope.$apply( function() {
 *   scope.$broadcast('$updateVariant', {variant: "variant_name", "experiment": 'experiment_name'});
 * });
 */
angular.module('ngshowvariant').directive('variantSwitch', function ($animate, $rootScope, $window) {
        return {
            require: 'variantSwitch',

            // asks for $scope to fool the BC controller module
            controller: ['$scope', function ngSwitchController() {
                this.cases = {};
            }],
            link: function (scope, element, attr, ngSwitchController) {
                var experimentName = attr.variantSwitch || attr.on;
                var watchExpr = "$window.variants['" + experimentName + "']";
                var selectedTranscludes = [],
                    selectedElements = [],
                    previousLeaveAnimations = [],
                    selectedScopes = [];

                var spliceFactory = function (array, index) {
                    return function () {
                        array.splice(index, 1);
                    };
                };

                var getBlockNodes = function(nodes) {
                  var node = nodes[0];
                  var endNode = nodes[nodes.length - 1];
                  var blockNodes = [node];

                  do {
                    node = node.nextSibling;
                    if (!node) break;
                    blockNodes.push(node);
                  } while (node !== endNode);

                  return $(blockNodes);
                };

                var ngSwitchWatchAction = function(value) {
                    var i, ii;
                    for (i = 0, ii = previousLeaveAnimations.length; i < ii; ++i) {
                        $animate.cancel(previousLeaveAnimations[i]);
                    }
                    previousLeaveAnimations.length = 0;

                    for (i = 0, ii = selectedScopes.length; i < ii; ++i) {
                        var selected = getBlockNodes(selectedElements[i].clone);
                        selectedScopes[i].$destroy();
                        var promise = previousLeaveAnimations[i] = $animate.leave(selected);
                        promise.then(spliceFactory(previousLeaveAnimations, i));
                    }

                    selectedElements.length = 0;
                    selectedScopes.length = 0;

                    if ((selectedTranscludes = ngSwitchController.cases['!' + value] || ngSwitchController.cases['?'])) {
                        forEach(selectedTranscludes, function (selectedTransclude) {
                            selectedTransclude.transclude(function (caseElement, selectedScope) {
                                selectedScopes.push(selectedScope);
                                var anchor = selectedTransclude.element;
                                caseElement[caseElement.length++] = document.createComment(' end ngSwitchWhen: ');
                                var block = {clone: caseElement};

                                selectedElements.push(block);
                                $animate.enter(caseElement, anchor.parent(), anchor);
                            });
                        });
                    }
                };


                scope.$watch(function(){
                    var variants = window.variants;
                    if(variants == undefined){
                        return undefined;
                    }
                    var value = variants[experimentName];
                    if(value == undefined){
                        return undefined;
                    }
                    return value;
                }, ngSwitchWatchAction);
            }
        };
    }).directive('variantSwitchWhen', function () {
        return {
            transclude: 'element',
            priority: 1200,
            require: '^variantSwitch',
            multiElement: true,
            link: function (scope, element, attrs, ctrl, $transclude) {
                ctrl.cases['!' + attrs.variantSwitchWhen] = (ctrl.cases['!' + attrs.variantSwitchWhen] || []);
                ctrl.cases['!' + attrs.variantSwitchWhen].push({transclude: $transclude, element: element});
            }
        }
    }).directive('variantSwitchDefault', function () {
        return {
            transclude: 'element',
            priority: 1200,
            require: '^variantSwitch',
            multiElement: true,
            link: function (scope, element, attr, ctrl, $transclude) {
                ctrl.cases['?'] = (ctrl.cases['?'] || []);
                ctrl.cases['?'].push({transclude: $transclude, element: element});
            }
        }
    });
