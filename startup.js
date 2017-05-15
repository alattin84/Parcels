/**
 * Created by alattin on 2/2/2017.
 */
require(["js/appMessages",
         "js/appEvents",
         "js/map",
         "js/search",
         "dojo/dom",
         "dojo/dom-class",
         "dojo/ready"],
    function (messages, events, Map, search, dom, domClass, ready) {
    //Load components
    ready(function(){

        messages.init();

        events.init();

        //Loading map
        Map.init();

        search.init();

        var preloadingPane = dom.byId("preloadingPane");
        setTimeout(function(){
            domClass.add(preloadingPane, "loader-hidden");
        }, 5000);
    });
});