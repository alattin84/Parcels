/**
 * Created by alattin on 2/24/2017.
 */
define(["dojo/query",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "bootstrap/Modal",
    "bootstrap/Popover",
    "dojo/domReady!"
], function(query, on, dom, domClass) {

    return {
        init: function(){

            //var discModal = query('#disc-modal');
            //discModal.modal('show');

            //var btnAccept = query('#btnAccept');
            document.getElementById("btnAccept").addEventListener("click", function(){
                var loadingPane = dom.byId("loadingPane");
                domClass.add(loadingPane, "loader-hidden");
            });

            //btnAccept.on('click', function(){
                //var loadingPane = dom.byId("loadingPane");
                //domClass.add(loadingPane, "loader-hidden");
            //});

            var btnDecline = query('#btnDecline');
            btnDecline.on('click', function(){
                window.location.href = "http://gis.bentoncountyar.gov";
            });

            //Search
            query("#txtSrchPop").popover({
                html: true,
                content: "<p>1: Start by selecting a search layer.</p>" +
                "<p>2: Enter your search query.</p>"
            });

            query("#graSrchPop").popover({
                html: true,
                content: "<p>1: Start by selecting a search layer.</p>" +
                "<p>2: Draw a feature on the map to search your area of interest.</p>"
            });

            query("#spaSrchPop").popover({
                html: true,
                content: "<p>1: Start by using the text/graphical search and getting a result.</p>" +
                "<p>2: From the result window, select the feature you want to process.</p>" +
                "<p>3: Choose a buffer distance and apply buffer.</p>" +
                "<p>4: Select features in another layer and click the intersect/contained by button.</p>"
            });
        }
    };
});
