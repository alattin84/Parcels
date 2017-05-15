/**
 * Created by alattin on 2/2/2017.
 */
var app;

define([
    "esri/Map",
    "esri/geometry/Extent",
    "esri/layers/FeatureLayer",
    "esri/layers/TileLayer",
    "esri/layers/MapImageLayer",
    "esri/layers/support/ImageParameters",
    "esri/views/MapView",
    "esri/views/SceneView",
    "esri/widgets/LayerList",
    "esri/widgets/Legend",
    "esri/widgets/Print",
    "esri/widgets/Search",
    "esri/widgets/ScaleBar",
    "esri/widgets/Popup",
    "esri/core/watchUtils",
    "dojo/_base/kernel",
    "dojo/_base/array",

    "dojo/query",
    "dojo/on",

    // Bootstrap
    "bootstrap/Collapse",
    "bootstrap/Dropdown",
    "bootstrap/Tab",

    // Calcite Maps
    "calcite-maps/calcitemaps-v0.2",
    "dojo/domReady!"
], function(Map, Extent, FeatureLayer, TileLayer, MapImageLayer, ImageParameters, MapView, SceneView, LayerList, Legend,
            Print, Search, ScaleBar, Popup, watchUtils, kernel, arrayUtil, query, on) {
    return {
        init: function(){
            /******************************************************************
             *
             * App settings
             *
             ******************************************************************/

            app = {
                map: null,
                zoom: 1,
                viewPadding: {
                    top: 50,
                    bottom: 0
                },
                uiComponents: ["zoom", "compass", "attribution"],
                dockOptions: {
                    position: "auto",
                    // Custom docking breakpoints
                    breakpoint: {
                        width: 768,
                        height: 768
                    }
                },
                mapView: null,
                sceneView: null,
                activeView: null,
                searchWidget: null,
                screenWidth: 0
            };

            app.initialExtent = new Extent({
                "xmin": 541916,
                "ymin": 635021,
                "xmax": 778177,
                "ymax": 799939,
                "spatialReference": { "wkid": 102651 }
            });

            /******************************************************************
             *
             * Create the map
             *
             ******************************************************************/

            //Map
            app.map = new Map();

            kernel.global.map = app.map;

            //ImageParameters
            var imageParameters = new ImageParameters();
            imageParameters.format = "png32";
            imageParameters.dpi = "200";

            //app.map.layers = [featureLayer];

            //Standard Basemap Layers
            var aerial16 = new TileLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Aerials/Aerials_2016/MapServer", {visible: true, title: "Aerial: 2016"});
            var parcelBasemap = new TileLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Assessor/ParcelMap/MapServer", {visible: true, title: "Basemap"});
            var parcelMobile = new MapImageLayer("http://gis.bentoncountyar.gov/arcgis/rest/services/Assessor/ParcelMobile/MapServer", {visible: true, title: "Additional Layers"});

            //Create Feature Layer for popups
            var parcelPopups = new FeatureLayer({
                url: "http://gis.bentoncountyar.gov/arcgis/rest/services/Assessor/ParcelPopUps/MapServer/0",
                listMode: "hide",
                outFields: ["*"],
                title: "ParcelPopUps"
            });

            var link = "<a href='http://www.arcountydata.com/parcel.asp?parcelid={PARCELID}&county=Benton&AISGIS=Benton' target='_blank' style='color: #196fa6 !important; font-weight: bold;'>ARCounty Data</a>";
            var template = {
                title: "{PARCELID}",
                // Four fields are used in this template. The value of the selected feature will be
                // inserted in the location of each field name below
                content: "<b>Owner</b>: {OW_NAME}</br><b>Address</b>: {PH_ADD}</br><b>Subdivision</b>: {SUBDIVNAME}</br><b>Type</b>: {TYPE_}</br><b>Acres</b>: {ACRE_AREA}</br><b>School Code</b>: {SCHL_CODE}</br><b>Link</b>:" + link
            };

            parcelPopups.popupTemplate = template;

            //Add Layers to map
            app.map.addMany([aerial16, parcelBasemap, parcelMobile, parcelPopups]);

            //Setup mapView
            app.mapView = new MapView({
                container: "mapViewDiv",
                map: app.map,
                center: app.center,
                zoom: app.zoom,
                padding: app.viewPadding,
                popup: new Popup({
                    dockOptions: app.dockOptions
                }),
                ui: {
                    components: app.uiComponents
                }
            });

            //Disable rotation in 4.x
            app.mapView.constraints = {
                rotationEnabled: false
            };

            //iOS and Android zoom issues. Placed this piece of code to handle touch moves.
            app.mapView.surface.addEventListener("touchmove", function(event) {
                event.preventDefault();
            });

            // Set the active view to scene
            app.activeView = app.mapView;
            kernel.global.mapView = app.mapView;

            //Get layers and map them to array
            var layerInfo = arrayUtil.map(app.map.layers.items, function (layer, index) {
                return {layer:layer, title:layer.title};
            });

            //Set the layer list widget
            var layerList = new LayerList({
                view: app.activeView
            }, "layerList");

            //Pass layerInfos to the legend widget
            if (layerInfo.length > 0) {
                var legend = new Legend({
                    view: app.activeView,
                    layerInfos: layerInfo
                }, "legendList");
            }

            //Setup print service
            var print = new Print({
                view: app.activeView,
                printServiceUrl:  "http://gis.bentoncountyar.gov/arcgis/rest/services/PrintService/GeneralExportWebMap/GPServer/Export%20Web%20Map"
            }, "printWidget");

            //var scaleBar = new ScaleBar({
                //view: app.activeView,
                //unit: "dual"
            //});

            // Add the widget to the bottom left corner of the view
            //app.activeView.ui.add(scaleBar, "bottom-left");

            //app.activeView.ui.add(legend, "bottom-right");

            //app.activeView.ui.add(layerList, {
                //position: "top-right"
            //});

            /******************************************************************
             *
             * Synchronize the view, search and popup
             *
             ******************************************************************/

            // Tab - toggle between map and scene view
            query(".calcite-navbar li a[data-toggle='tab']").on("click", function(
                e) {
                syncTabs(e);
                if (e.target.text.indexOf("Map") > -1) {
                    syncViews(app.sceneView, app.mapView);
                    app.activeView = app.mapView;
                } else {
                    syncViews(app.mapView, app.sceneView);
                    app.activeView = app.sceneView;
                }
                syncSearch();
            });

            // Tabs - sync ui menus
            function syncTabs(e) {
                query(".calcite-navbar li.active").removeClass("active");
                query(e.target).addClass("active");
            }

            // Views - sync viewpoint and popup
            function syncViews(fromView, toView) {
                watchUtils.whenTrueOnce(toView, "ready").then(function(result) {
                    watchUtils.whenTrueOnce(toView, "stationary").then(function(
                        result) {
                        toView.goTo(fromView.viewpoint);
                        toView.popup.reposition();
                    });
                });
            }

            // Search - sync search location and popup
            function syncSearch() {
                app.searchWidget.view = app.activeView;
                if (app.searchWidget.selectedResult) {
                    app.searchWidget.search(app.searchWidget.selectedResult.name);
                    app.activeView.popup.reposition();
                }
            }

            /******************************************************************
             *
             * Show and hide the panels and popup
             *
             ******************************************************************/

            // Views - Listen to view size changes to show/hide panels
            app.mapView.watch("size", viewSizeChange);

            function viewSizeChange(screenSize) {
                if (app.screenWidth !== screenSize[0]) {
                    app.screenWidth = screenSize[0];
                    setPanelVisibility();
                }
            }

            // Popups - Listen to popup changes to show/hide panels
            app.mapView.popup.watch(["visible", "currentDockPosition"],
                setPanelVisibility);

            // Panels - Show/hide the panel when popup is docked
            function setPanelVisibility() {
                var isMobileScreen = app.activeView.widthBreakpoint === "xsmall" ||
                        app.activeView.widthBreakpoint === "small",
                    isDockedVisible = app.activeView.popup.visible && app.activeView.popup
                            .currentDockPosition,
                    isDockedBottom = app.activeView.popup.currentDockPosition && app.activeView
                            .popup.currentDockPosition.indexOf("bottom") > -1,
                    isDockedTop = app.activeView.popup.currentDockPosition && app.activeView
                            .popup.currentDockPosition.indexOf("top") > -1;
                // Mobile (xsmall/small)
                if (isMobileScreen) {
                    if (isDockedVisible && isDockedBottom) {
                        query(".calcite-panels").addClass("invisible");
                    } else {
                        query(".calcite-panels").removeClass("invisible");
                    }
                } else { // Desktop (medium+)
                    if (isDockedVisible && isDockedTop) {
                        query(".calcite-panels").addClass("invisible");
                    } else {
                        query(".calcite-panels").removeClass("invisible");
                    }
                }
            }

            // Panels - Dock popup when panels show (desktop or mobile)
            query(".calcite-panels .panel").on("show.bs.collapse", function(e) {
                if (app.activeView.popup.currentDockPosition || app.activeView.widthBreakpoint ===
                    "xsmall") {
                    app.activeView.popup.dockEnabled = false;
                }
            });

            // Panels - Undock popup when panels hide (mobile only)
            query(".calcite-panels .panel").on("hide.bs.collapse", function(e) {
                if (app.activeView.widthBreakpoint === "xsmall") {
                    app.activeView.popup.dockEnabled = true;
                }
            });

            // Popup
            query(".esri-popup__header-title").on("click", function(e) {
                query(".esri-popup__main-container").toggleClass(
                    "esri-popup-collapsed");
                app.activeView.popup.reposition();
            }.bind(this));
        }
    }
});