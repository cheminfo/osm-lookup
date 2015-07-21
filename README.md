# osm-lookup
npm code to lookup for molecules from the Open Source Malaria project

In order to use the code from javascript:

```
npm install osm-lookup
```

And then you may use a code like:

```
var osm = require('.');

/*
Retrieve all the information
 */

osm.getAll().then(function (result) {
    console.log("Get ALL (display only first 3)");
    console.log(result.content.slice(0,3));
});

/*
Retrieve all the information for a specific product
 */


osm.getOne('OSM-S-100').then(function (result) {
    console.log("Get One (display only first 3)");
    console.log(result.content);
});

osm.getOneField('OSM-S-100', 'molfile').then(function (result) {
    console.log("Get One (display only first 3)");
    console.log(result.content);
});
```