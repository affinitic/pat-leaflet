# pat-leaflet

## Description

Implements `Leaflet.js` with various options.

## Documentation

A more detailed documentation on how to use it goes here.

### Options reference

| Property         | Default Value | Values | Type              | Description                   |
| -----------------| ------------- | ------ | ----------------- | ----------------------------- |
| latitude         | 0.0           |        | Float             | latitude of the map           |
| longitude        | 0.0           |        | Float             | longitude of the map          |
| maxClusterRadius | 80            |        | Integer           |                               |
| zoom             | auto          | 1 - 19 | Integer           | zoom level of he map          |
| zoomControl      | true          |        | Boolean           | are the zoomcontols avaible   |
| fullscreenControl| true          |        | Boolean           | is the fullscreencontrol avaible |
| addMarker        | false         |        | Boolean           | enables adding markers        |
| boundsPadding    | 20            |        | Integer           |                               |
| autolocate       | false         |        | Boolean           | locates your location         |
| geosearch        | false         |        | Boolean           | search a location via osm,esri, google, bing|
| geosearchProvider| openstreetmap | esri, google, bing | String | select your favorit locator|
| locatecontrol    | false         |        | Boolean           |                               |
| minimap          | false         |        | Boolean           | enables the minimap            |
| defaullt_map_layer | { id: "OpenStreetMap.Mapnik", options: {} } |  |Dict |                   |
| map_layers       | []            |        | List of Dicts     |                               |
| image_path       | 'node_modules/leaflet.awesome-markers/dist/images' |        | String            |                               |
| geojson_ajaxurl |               |        | String            |                               |