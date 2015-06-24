# angular-optmizely
A simple directive to allow A/B testing with optimizely in angular applications.

Rewritten to support multiple A/B tests in one angular app.

## Usage
1. `bower install angular-optimizely`
2. Include the `ngshowvariant.js` script provided by this component into your app.
3. Add `ngshowvariant` as a module dependency to your app.
5. Insert the `ng-show-variant` directive into your template where you wish to conditionally show items.

```html
<div variant-switch="experiment_name">
    <div variant-switch-default>variant default is running</div>
    <div variant-switch-when="cactus">variant cactus is running</div>
    <div variant-switch-when="variant_name">variant variant_name is running</div>
</div>
```

In optimizely, add custom javascript where you wish to change the variant:

```javascript
var scope = angular.element(document.getElementsByTagName("body")[0]).injector().get('$rootScope');


scope.$apply( function() {
    scope.$broadcast('$updateVariant', {variant: "variant_name", "experiment": 'experiment_name'});
});
```

Add this to the run block in your angular app:

```
$rootScope.$on('$updateVariant', function (event, args) {
    if ($window.variants == undefined) {
        $window.variants = {};
    }
    $window.variants[args.experiment] = args.variant;
});
```

## License
MIT
