# Changelog



## [2.0.0](https://github.com/patternslib/pat-leaflet/compare/1.4.0...2.0.0) (2022-09-27)


### Breaking Changes


* Upgrade Pattern to ES6 based Patternslib. ([1f073b6](https://github.com/patternslib/pat-leaflet/commit/1f073b687b67080586749732b2e07dba1ffce618))


### Maintenance


* Add infrastructure files. ([9780063](https://github.com/patternslib/pat-leaflet/commit/978006397336c6c8573a9514ed4f629eed464f1e))

* Modernize - Reduce dependency on jQuery. ([81fd1a0](https://github.com/patternslib/pat-leaflet/commit/81fd1a03d691d74528d9b265d95a69bca87a9ce7))

* Modernize - replace ``self`` with ``this``. ([40d2bcd](https://github.com/patternslib/pat-leaflet/commit/40d2bcdc922a47cade23a2095e94b01733533c44))

* Modernize - replace $.ajax with fetch. ([4f89206](https://github.com/patternslib/pat-leaflet/commit/4f8920650f4406496a9b9c89aaff7d7475f6292b))

* Modernize - Use const/let instead of var. ([6471b64](https://github.com/patternslib/pat-leaflet/commit/6471b64d18b5c852363af57451a9a9cc9369af9a))

* Modernize - Use dynamic imports and import only what is needed. ([d26ded3](https://github.com/patternslib/pat-leaflet/commit/d26ded3ad8cd84797c93eae55f828c04779a5014))

* Modernize - Use Patternslib code style functions. ([a4fae68](https://github.com/patternslib/pat-leaflet/commit/a4fae68e379b37687293ee59294a1a9c281236f6))

## **1.4.0**

* Fix a problem with ``map_layers`` option when it's a list of ids and no title was generated for the baseLayers object.
  [thet]

* Add some nicer, opinionated styles for the popup close button.
  [thet]

* Add option to add some padding to ``fitBounds`` with a default of ``20``.
  This brings search result on corners more in the map.
  [thet]

* Add ``extraClasses`` property to marker icons creation.
  This allows for extra classes like a marker uuid to work with.
  [thet]

* Add feature to load external ``geoJSON`` data via AJAX
  [petschki]


## **1.3.0**

* Add ``maxClusterRadius`` option for the marker cluster plugin. Default is 80 (pixels).
  [thet]

* Add ``color`` options to feature properties to explicitly set the marker color.
  ``color`` must be one of the predefined colors ``blue``, ``red``, ``darkred``, ``orange``, ``green``, ``darkgreen``, ``blue``, ``purple``, ``darkpurple``, ``cadetblue`` from https://github.com/lvoogdt/Leaflet.awesome-markers
  [thet]

* Add ``create_marker`` factory function instead of predefining "awesome marker" instances.
  [thet]


## **1.2.0**

* Fire ``moveend`` and ``zoomend`` on the pattern root element.
  [thet]


## **1.1.0**

* Allow optional arguments in pat-leaflet for tile providers that require registration (Fix https://github.com/plone/plone.patternslib/issues/24)
  [pbauer]

* Update bower dependencies to last working versions.
  [thet]


## **1.0.0 (2017-02-24)**

* Initial release.
  [thet]


## **0.0.1 (2016-01-11)**

* Start of everything.
  [thet]