# pat-leaflet

## Description

Implements [Leaflet.js](https://leafletjs.com/) with various options.


## Documentation

Example usage:

```
    <div id="map1" style="height:400px" class="pat-leaflet" data-pat-leaflet='
    {
      "fullscreencontrol": false,
      "locatecontrol": false,
      "zoomcontrol": true,
      "geosearch": true,
      "latitude": 47.33325135,
      "longitude": 9.645877746692685
    }'></div>
```

For more examples see the [demo page](./index.html).


### Options reference

Some options resemble the options from leaflet.
You might also check [their documentation](https://leafletjs.com/reference.html).


| Property           | Default Value | Values | Type              | Description                                      |
| ------------------ | ------------- | ------ | ----------------- | ------------------------------------------------ |
| latitude           | 0.0           |        | Float             | Latitude of the map.                             |
| longitude          | 0.0           |        | Float             | Longitude of the map.                            |
| boundsPadding      | 20            |        | Integer           | Padding for map boundaries.                      |
| useCluster         | true          |        | Boolean           | Enable/Disable the marker cluster feature.       |
| maxClusterRadius   | 80            |        | Integer           | Set the marker cluster radius.                   |
| zoom               | auto          | 1 - 19 | Integer           | Zoom level of he map.                            |
| zoomControl        | true          |        | Boolean           | Show zoom control buttons.                       |
| fullscreenControl  | true          |        | Boolean           | Show the fullscreen control button.              |
| addMarker          | false         |        | Boolean           | Enable feature to add markers.                   |
| locatecontrol      | false         |        | Boolean           | Adds a button to show your position on the map.  |
| autolocate         | false         |        | Boolean           | Automatically set map to your location.          |
| geosearch          | false         |        | Boolean           | Search a location via osm, esri, google or bing. |
| geosearch_provider | openstreetmap | openstreetmap, esri, google, bing | String | Service for location searches.   |
| minimap            | false         |        | Boolean           | Enables the minimap overview map.                |
| defaullt_map_layer | { id: "OpenStreetMap.Mapnik", options: {} } |  | Dict | Define the default map layer.         |
| map_layers         | []            |        | List of Dicts     | Define the available map layers (More info in source code). |
| image_path         | 'node_modules/leaflet.awesome-markers/dist/images' | | String | Import path to icons.         |
| geojson_ajaxurl    |               |        | String            | Define a AJAX endpoint for geojson data to load (More info in source code. |
