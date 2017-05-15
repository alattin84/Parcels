/**
 * Created by alattin on 2/3/2017.
 */
define(["dojo/window",
        "dojo/dom",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/_base/kernel",
        "dojo/_base/array",

        "esri/Graphic",
        "esri/layers/GraphicsLayer",
        "esri/PopupTemplate",
        "esri/geometry/Point",
        "esri/geometry/Polyline",
        "esri/geometry/Polygon",
        "esri/geometry/Extent",
        "esri/geometry/geometryEngine",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/layers/GraphicsLayer",
        "esri/tasks/QueryTask",
        "esri/tasks/support/Query",

        "dojo/on",
        "dojox/grid/EnhancedGrid",
        "dojo/data/ItemFileWriteStore",
        "js/appMessages",
        "dojox/grid/enhanced/plugins/Pagination",
        "dojox/grid/enhanced/plugins/Printer",
        "dojox/grid/enhanced/plugins/exporter/CSVWriter",
        "dijit/form/Select",
        "dijit/form/Button",
        "dijit/form/NumberSpinner",
        "dijit/layout/ContentPane",
        "dojox/layout/ContentPane",
        "dojo/domReady!"],
    function(win, dom, domClass, domConstruct, domAttr, kernel, arrayUtil, Graphic, GraphicsLayer, PopupTemplate, Point, Polyline, Polygon, Extent,
             geometryEngine, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, GraphicsLayer, QueryTask, Query,
             on, EnhancedGrid, ItemFileWriteStore, messages){

        var dataField;
        var globSearch;
        var hasLink = false;
        var identifyGraLayer;
        var isDisabled;
        var isIdentify = false;
        var isSpatial = false;
        var layerInfo;
        var layerObj;
        var layout;
        var link;
        var linkTitle;
        var markerSymbol;
        var lineSymbol;
        var polygonSymbol;
        var options = [];
        var selectedItem;
        var splitOutFields;
        var splitAliasValues;
        var template;
        var resultItems;
        var fl;

        return {

            init: function() {

                globSearch = this;
                identifyGraLayer = new GraphicsLayer({id: "identifyGra"});

                var ddlTxtSearch =  dom.byId("ddlTxtSearch");
                var ddlIdentifyLayers = dom.byId("ddlIdentifyLayers");
                var ddlSpatialLayers = dom.byId("ddlSpatialLayers");
                var txtSearch = dom.byId("txtSearch");

                dojo.xhrGet({
                    url: "xml/searchConfig.json",
                    handleAs: "json",
                    load: function (obj) {
                        var layers = obj.layers.layer;
                        layerInfo = layers;
                        kernel.global.layerInfo = layerInfo;

                        //var defaultOption = {value: 0, innerHTML: "--"};
                        //options.push(defaultOption);

                        arrayUtil.forEach(layers, function (item, index) {
                            var option = {value: index + 1, innerHTML: item.name};
                            domConstruct.create("option", {value: index + 1, innerHTML: item.name}, ddlTxtSearch);
                            domConstruct.create("option", {value: index + 1, innerHTML: item.name}, ddlIdentifyLayers);
                            domConstruct.create("option", {value: index + 1, innerHTML: item.name}, ddlSpatialLayers);
                            options.push(option);
                        });
                        kernel.global.layerOptions = options;
                    },
                     error: function () {
                        var error = "Could not load search list.";
                        messages.showMessage(error);
                     }
                });

                on(ddlTxtSearch, "change", function(){
                    var index = ddlTxtSearch.value;
                    if(index > 0){
                        layerObj = layerInfo[index - 1];
                        txtSearch.placeholder = layerObj.placeholder;
                        dom.byId("example").innerHTML = "i.e. " + layerObj.example;

                    }else{
                        txtSearch.textbox.placeholder = "Select layer to search...";
                        dom.byId("example").innerHTML = "";
                    }
                });

                on(dom.byId("btnSearch"), "click", function(){
                    layerObj = layerInfo[ddlTxtSearch.value - 1];
                    globSearch.validateSearch(ddlTxtSearch, txtSearch);
                });

                on(dom.byId("txtSearch"), "keyup", function(evt){
                    if (evt) {
                        if (evt.keyCode == 13) {
                            layerObj = layerInfo[ddlTxtSearch.value - 1];
                            globSearch.validateSearch(ddlTxtSearch, txtSearch);
                        }
                        else {
                            return;
                        }
                    }
                });

                on(dom.byId("headingResults"), "click", function(){
                   domClass.toggle("collapseResults", "results-open");
                });

                //var infoDraw = dom.byId("infoDraw");
                //var drawButtons = infoDraw.domNode;
                on(dom.byId("infoDraw"), "click", function(evt){

                    //Disable Popups
                    fl = map.allLayers.find(function(layer) {
                        return layer.title === "ParcelPopUps";
                    });
                    fl.visible = false;

                    var currElem = evt.target.id;
                    if(currElem == "infoDraw"){
                        return;
                    }
                    var tool = currElem.toLowerCase().split("-");
                    globSearch.createGraphics(tool[1]);
                });

                on(dom.byId("btnBuffer"), "click", function(){
                    if(selectedItem != null){
                        globSearch.createBuffer(selectedItem.geometry);
                    }else{
                        messages.showMessage("Search or select a result item to buffer!")
                    }
                });

                on(dom.byId("btnClrBuffer"), "click", function() {
                    kernel.global.mapView.graphics.removeAll();
                });

                on(dom.byId("btnSpaCon"), "click", function(){
                    var spaLayer = dom.byId("ddlSpatialLayers");
                    if(selectedItem != null){
                        isSpatial = true;
                        var spaRelation = "contains";
                        layerObj = layerInfo[spaLayer.value - 1];
                        globSearch.createInfoWindow(layerObj, "", selectedItem.geometry, spaRelation);
                    }else{
                        messages.showMessage("Error selecting features in: " + spaLayer.options[spaLayer.value - 1].text);
                    }
                });

                on(dom.byId("btnSpaInt"), "click", function(){
                    var spaLayer = dom.byId("ddlSpatialLayers");
                    if(selectedItem != null){
                        isSpatial = true;
                        var spaRelation = "intersects";
                        layerObj = layerInfo[spaLayer.value - 1];
                        globSearch.createInfoWindow(layerObj, "", selectedItem.geometry, spaRelation);
                    }else{
                        messages.showMessage("Error intersecting features in: " + spaLayer.options[spaLayer.value -1].text);
                    }
                });

                globSearchGrid = this;

                var cssFiles = [
                    "css/printDocument.css"
                ];

                on(dom.byId("printAll"), "click", function (evt) {
                    if(!evt.currentTarget.disabled){
                        grid.exportToHTML({
                            title: "Benton County GIS Data:",
                            cssFiles: cssFiles
                        }, function(str){
                            var win = window.open();
                            win.document.open();
                            win.document.write(str);
                            /*Adjust row height/view width for multi-view grid*/
                            dijit.byId("grid").normalizePrintedGrid(win.document);
                            win.document.close();
                        });
                    }
                });

                on(dom.byId("exportAll"), "click", function (evt) {
                    if(!evt.currentTarget.disabled){
                        grid.exportGrid("csv", function(str){
                            var print = window.open('', '_blank');
                            print.document.write('<html><head><title>Benton County GIS: Exported Data</title></head>');
                            print.document.write('<body><textarea style="width: 100%; height: 100%;">' + str + '</textarea></body></html>');
                        });
                    }
                });

                on(dom.byId("clearAll"), "click", function (evt) {
                    if(!evt.currentTarget.disabled){

                        //domClass.toggle("resultsContainer", "results-open");
                        kernel.global.mapView.graphics.removeAll();

                        var data = {
                            identifier: 'id',
                            items: []
                        };

                        //Create empty store
                        var emptyCells = new ItemFileWriteStore({data: data});
                        kernel.global.grid.setStore(emptyCells);

                        domAttr.set("printAll", "disabled", "true");
                        domAttr.set("exportAll", "disabled", "true");
                        domAttr.set("clearAll", "disabled", "true");
                    }
                });
            },

            addGraphicToMap: function(graphic){
                // Add the graphics to the view's graphics layer
                kernel.global.mapView.graphics.add(graphic);

            },

            createGraphics: function(tool){

                var graphic = new Graphic;
                if(tool == "point"){

                    on.once(kernel.global.mapView, "click", function(evt){
                        var mp = evt.mapPoint;

                        var point = new Point({
                            x: mp.x,
                            y: mp.y,
                            spatialReference: kernel.global.mapView.spatialReference
                        });

                        // Create a symbol for drawing the point
                        var markerSymbol = new SimpleMarkerSymbol({
                            color: [226, 119, 40],
                            outline: { // autocasts as new SimpleLineSymbol()
                                color: [255, 255, 255],
                                width: 2
                            }
                        });

                        // Create a graphic and add the geometry and symbol to it
                        graphic = new Graphic({
                            geometry: point,
                            symbol: markerSymbol
                        });

                        globSearch.addGraphicToMap(graphic);

                        globSearch.identify(graphic);
                    });
                }
                else if(tool == "polygon"){

                    // Create a polygon geometry
                    var polygon = new Polygon({
                        spatialReference: kernel.global.mapView.spatialReference
                    });

                    // Create a symbol for rendering the graphic
                    var fillSymbol = new SimpleFillSymbol({
                        color: [227, 139, 79, 0.2],
                        outline: { // autocasts as new SimpleLineSymbol()
                            color: [255, 255, 255],
                            width: 1
                        }
                    });

                    // Create a symbol for drawing the point
                    var markerSymbol = new SimpleMarkerSymbol({
                        color: [226, 119, 40],
                        size: "5px",
                        outline: { // autocasts as new SimpleLineSymbol()
                            color: [255, 255, 255],
                            width: 1
                        }
                    });

                    // Add the geometry and symbol to a new graphic
                    graphic.geometry = polygon;
                    graphic.symbol = fillSymbol;

                    //Create event handler
                    var paths = [];
                    var lineHandler = on(kernel.global.mapView, "click", function(evt){

                        //Create point for polygon vertices
                        var point = new Point({
                            spatialReference: kernel.global.mapView.spatialReference
                        });

                        //Add points to paths
                        paths.push([evt.mapPoint.x, evt.mapPoint.y]);
                        point.x = evt.mapPoint.x;
                        point.y = evt.mapPoint.y;

                        // Create a point and add the geometry and symbol to it
                        var PntGraphic = new Graphic({
                            geometry: point,
                            symbol: markerSymbol
                        });

                        if(paths.length > 1){

                            //Create polyline
                            var polyline = new Polyline({
                                spatialReference: kernel.global.mapView.spatialReference
                            });

                            polyline.paths = [paths];

                            var lineSymbol = new SimpleLineSymbol({
                                color: [226, 119, 40],
                                width: 1
                            });

                            var polylineGraphic = new Graphic({
                                geometry: polyline,
                                symbol: lineSymbol
                            });

                            kernel.global.mapView.graphics.addMany([PntGraphic, polylineGraphic]);
                        }else{
                            globSearch.addGraphicToMap(PntGraphic);
                        }
                    });

                    var polyHandler = on(kernel.global.mapView, "double-click", function(evt){

                        //Create final point for dbl-click
                        //Create point for polygon vertices
                        var point = new Point({
                            spatialReference: kernel.global.mapView.spatialReference
                        });

                        point.x = evt.mapPoint.x;
                        point.y = evt.mapPoint.y;

                        var finalPnt = new Graphic({
                            geometry: point,
                            symbol: markerSymbol
                        });

                        globSearch.addGraphicToMap(finalPnt);

                        //Add the first path to end path
                        paths.push([evt.mapPoint.x, evt.mapPoint.y]);
                        paths.push(paths[0]);

                        //Give the array of paths to rings
                        polygon.rings = [paths];

                        globSearch.addGraphicToMap(graphic);

                        //Remove event handlers after polygon creation.
                        lineHandler.remove();
                        polyHandler.remove();

                        globSearch.identify(graphic);
                    });
                }
                else if (tool == "polyline"){

                    //Create polyline
                    var polyline = new Polyline({
                        spatialReference: kernel.global.mapView.spatialReference
                    });

                    var lineSymbol = new SimpleLineSymbol({
                        color: [226, 119, 40],
                        width: 4
                    });

                    graphic.geometry = polyline;
                    graphic.symbol = lineSymbol;

                    // Create a symbol for drawing the point
                    var markerSymbol = new SimpleMarkerSymbol({
                        color: [226, 119, 40],
                        size: "5px",
                        outline: { // autocasts as new SimpleLineSymbol()
                            color: [255, 255, 255],
                            width: 1
                        }
                    });

                    var paths = [];
                    var lineHandler = on(kernel.global.mapView, "click", function(evt){

                        //Create point for polygon vertices
                        var point = new Point({
                            spatialReference: kernel.global.mapView.spatialReference
                        });

                        //Add points to paths
                        paths.push([evt.mapPoint.x, evt.mapPoint.y]);
                        point.x = evt.mapPoint.x;
                        point.y = evt.mapPoint.y;

                        // Create a point and add the geometry and symbol to it
                        var PntGraphic = new Graphic({
                            geometry: point,
                            symbol: markerSymbol
                        });

                        globSearch.addGraphicToMap(PntGraphic);
                    });

                    var polyHandler = on(kernel.global.mapView, "double-click", function(evt){

                        //Create final point for dbl-click
                        //Create point for polyline vertices
                        var point = new Point({
                            spatialReference: kernel.global.mapView.spatialReference
                        });

                        point.x = evt.mapPoint.x;
                        point.y = evt.mapPoint.y;

                        var finalPnt = new Graphic({
                            geometry: point,
                            symbol: markerSymbol
                        });

                        globSearch.addGraphicToMap(finalPnt);

                        //Add the final point
                        paths.push([evt.mapPoint.x, evt.mapPoint.y]);

                        //Give the array of paths to rings
                        polyline.paths = [paths];

                        globSearch.addGraphicToMap(graphic);

                        //Remove event handlers after polygon creation.
                        lineHandler.remove();
                        polyHandler.remove();

                        globSearch.identify(graphic);
                    });
                }
                else{
                    kernel.global.mapView.graphics.removeAll();
                    fl.visible = true;
                }
            },

            createInfoWindow: function (layer, searchValue, geometry, spatialRel) {
                var content = "";
                var outFields = [];
                var layerField = layer.fields.field;
                splitOutFields = [];
                splitAliasValues = [];

                if(layerField.length > 1){
                    for (var m = 0; m < layerField.length; m++) {
                        outFields.push(layerField[m].name);
                        splitOutFields[m] = layerField[m].name;
                        splitAliasValues[m] = layerField[m].alias;
                        content += "<b>" + layerField[m].alias + ":</b> {" + layerField[m].name + "}<br>";
                    }
                }else{
                    outFields.push(layerField.name);
                    splitOutFields[0] = layerField.name;
                    splitAliasValues[0] = layerField.alias;
                    content += "<b>" + layerField.alias + ":</b> {" + layerField.name + "}<br>";
                }

                if(layer.link){
                    hasLink = true;
                    var infoLink;
                    splitAliasValues.push("Link");
                    splitOutFields.push("link");
                    link = layer.link;
                    linkTitle = layer.linkTitle;
                    dataField = layer.dataField;
                    infoLink = "<b>Link: </b><a href='" + link + "' target='_blank' style='color: #196fa6 !important; font-weight: bold;'>" + linkTitle + "</a>";
                    content += infoLink;
                }

                template = new PopupTemplate({
                    title: "{" + dataField + "}",
                    content: content
                });

                globSearch.createQueryTask(layer, outFields, searchValue, geometry, spatialRel);
            },

            createQueryTask: function(layer, outFields, searchValue, geometry, spatialRel){

                var queryExpr = layer.value.replace(/value/g, searchValue);
                var queryTask = new QueryTask(layer.url);
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = outFields;

                if(isIdentify){

                    if(geometry.type === "point"){
                        query.geometry = globSearch.pointToExtent(geometry, 0.5);
                    }else{
                        query.geometry = geometry.extent;
                    }

                    query.spatialRelationship = "intersects";
                    queryExpr = "";
                    isIdentify = false;
                }

                if(isSpatial){
                    query.spatialRelationship = spatialRel;
                    query.geometry = geometry;
                    queryExpr = "";
                    isSpatial = false;
                }

                query.where = queryExpr;

                queryTask.execute(query).then(globSearch.getResults);
            },

            createTable: function(){
                layout = [];

                var colWidth;
                var window = win.getBox();
                if(window.w < 768){
                    colWidth = Math.round(768 / (splitAliasValues.length + 1)) + "px";
                }else{
                    colWidth = "auto";
                }

                var identifyObj = {field: "id", name: "ID", styles: 'text-align: center;'};
                layout.push(identifyObj);

                //Create columns
                for (var i = 0; i < splitAliasValues.length; i++) {
                    var layoutObj;
                    if(splitAliasValues[i] == "Link"){
                        layoutObj = {field: splitOutFields[i], name: splitAliasValues[i], styles: 'text-align: center;', formatter: globSearch.makeHTMLLink, width: colWidth};
                    }
                    else{
                        layoutObj = {field: splitOutFields[i], name: splitAliasValues[i], styles: 'text-align: center;', width: colWidth};
                    }
                    layout.push(layoutObj);
                }
            },

            createGridSize: function(curRowCnt, layout, store){

                var grid;

                if(kernel.global.grid){
                    kernel.global.grid.destroy();
                }

                if(curRowCnt > 5){
                    grid = new EnhancedGrid({
                        id: 'grid',
                        store: store,
                        structure: layout,
                        autoHeight: false,
                        plugins: {
                            pagination: {
                                defaultPageSize: 5,
                                /*pageSizes: ["5", "10", "25", "50", "100", "All"],*/
                                description: true,
                                sizeSwitch: false,
                                pageStepper: true,
                                gotoButton: true,
                                /*page step to be displayed*/
                                maxPageStep: 4,
                                /*position of the pagination bar*/
                                position: "bottom"
                            },
                            printer: true,
                            exporter: true
                        }
                    });
                }else{
                    grid = new EnhancedGrid({
                        id: 'grid',
                        store: store,
                        structure: layout,
                        autoHeight: true,
                        plugins: {
                            printer: true,
                            exporter: true
                        }
                    });
                }

                grid.placeAt('resultsDiv');
                grid.startup();

                kernel.global.grid = grid;

                on(window, "resize", function(){

                    var colWidth;
                    var window = win.getBox();
                    //if(window.w < 768){
                    colWidth = Math.round(window.w / (splitAliasValues.length + 1)) + "px";
                    //}else{
                        //colWidth = "auto";
                    //}

                    grid.resize();
                    grid.update();
                });
            },

            getResults: function(results){

                var data = {
                    identifier: 'id',
                    items: []
                };

                resultItems = results.features;

                globSearch.createTable();

                //Clear other unnecessary graphics
                kernel.global.mapView.graphics.removeAll();

                for (var i = 0; i < resultItems.length; i++) {
                    var content = "";
                    var featureAttributes = resultItems[i].attributes;

                    var symbol;
                    var graphic = resultItems[i];
                    switch (graphic.geometry.type){
                        case "point":

                            // Create a symbol for drawing the point
                            graphic.symbol = new SimpleMarkerSymbol({
                                color: [226, 119, 40],
                                outline: { // autocasts as new SimpleLineSymbol()
                                    color: [255, 255, 255],
                                    width: 2
                                }
                            });

                            break;
                        case "polyline":

                            // Create a symbol for drawing the line
                            graphic.symbol = new SimpleLineSymbol({
                                color: [226, 119, 40],
                                width: 4
                            });

                            break;
                        case "polygon":

                            // Create a symbol for rendering the graphic
                            graphic.symbol = new SimpleFillSymbol({
                                color: [227, 139, 79, 0.2],
                                outline: { // autocasts as new SimpleLineSymbol()
                                    color: [255, 255, 255],
                                    width: 1
                                }
                            });

                            break;
                    }

                    //Format the link from search json
                    if(hasLink){
                        var formatHTML = link;
                        for (var att in featureAttributes) {
                            var temp = formatHTML;
                            var value = featureAttributes[att];
                            formatHTML = temp.replace("{" + att + "}", value);
                        }
                        featureAttributes.link = formatHTML;
                    }

                    //Add result graphics to map
                    graphic.popupTemplate = template;
                    kernel.global.mapView.graphics.add(graphic);

                    //Push all result items to data store for search grid
                    data.items.push(dojo.mixin({id: i+1}, featureAttributes));
                }

                hasLink = false;

                //Create data store and pass to createGridSize
                var store = new ItemFileWriteStore({data: data});
                globSearch.createGridSize(resultItems.length, layout, store);

                //Set buttons and set them to disabled
                //var printAll = dom.byId("printAll");
                //var exportAll = dom.byId("exportAll");
                //var clearAll = dom.byId("clearAll");
                domAttr.remove("printAll", "disabled");
                domAttr.remove("exportAll", "disabled");
                domAttr.remove("clearAll", "disabled");

                var grid = kernel.global.grid;
                grid.on("rowclick", globSearch.onRowClickHandler);

                if(resultItems.length < 1){
                    messages.showMessage("No results found!")
                }

                //If result is 1 then zoom to feature
                if(resultItems.length == 1){
                    selectedItem = resultItems[0];
                    kernel.global.mapView.goTo(graphic);
                }

                var window = win.getBox();
                if(window.w < 768){
                    domClass.toggle("panelSearch", "in");

                }

                if(resultItems.length != 0){
                    if(!domClass.contains("collapseResults", "results-open")){
                        domClass.toggle("collapseResults", "results-open");
                    }
                }

                if(!fl.visible){
                    fl.visible = true;
                }
            },

            identify: function(graphic){
                isIdentify = true;
                layerObj = layerInfo[dom.byId("ddlIdentifyLayers").value - 1];
                globSearch.createInfoWindow(layerObj, "", graphic.geometry, "");
            },

            makeHTMLLink: function (data) {
                return "<a style='color: #396b9e' href='" + data + "' target = '_blank' title='Go to link...'><i class='fa fa-link fa-2x'></i></a>";
            },

            onRowClickHandler: function(evt){
                selectedItem = resultItems[evt.rowIndex];
                kernel.global.mapView.goTo(selectedItem);
                //if(selectedItem.geometry.type == "point"){
                    //kernel.global.mapView.goTo(selectedItem.geometry);
                //}else{
                    //map.setExtent(selectedItem.geometry.getExtent(), true);
                //}
            },

            pointToExtent: function (point, toleranceInPixel) {
                //calculate map coords represented per pixel
                var pixelWidth =  0.5;

                //calculate map coords for tolerance in pixel
                var toleraceInMapCoords = toleranceInPixel * pixelWidth;

                //Create bounding area
                var xmin = point.x - toleraceInMapCoords;
                var ymin = point.y - toleraceInMapCoords;
                var ymax = point.y + toleraceInMapCoords;
                var xmax = point.x + toleraceInMapCoords;

                var newExtent = new Extent(xmin, ymin, xmax, ymax, kernel.global.mapView.spatialReference);

                return newExtent;
            },

            validateSearch: function(ddlTxtSearch, txtSearch){

                if(ddlTxtSearch.value > 0){
                    if(txtSearch.value !== ""){
                        globSearch.createInfoWindow(layerObj, txtSearch.value);
                    }else{
                        var error = "Please enter a search value!";
                        messages.showMessage(error);
                    }
                }else{
                    var error = "Please select a search layer!";
                    messages.showMessage(error);
                }
            },

            createBuffer: function(geometry){
                var bufferDistance = dojo.byId("txtDistance").value;
                var bufferUnit = dojo.byId("ddlUnit").value;

                try {
                    var geomBuffer = geometryEngine.buffer(geometry, [bufferDistance], bufferUnit, false);

                    // add the buffer to the view as a graphic
                    var bufferGeometry = new Graphic({
                        geometry: geomBuffer,
                        symbol: new SimpleFillSymbol({
                            outline: {
                                color: [255, 0, 0],
                                width: 4
                            },
                            style: "none"
                        })
                    });

                    //Pass buffer geometry to selectedItem so
                    //that it can be reused for other spatial searches
                    selectedItem = bufferGeometry;
                    kernel.global.mapView.graphics.removeAll();
                    kernel.global.mapView.graphics.add(selectedItem);
                }catch(error){
                    var error = "Buffer Error!";
                    messages.showMessage(error);
                }
            }
        };
    });
