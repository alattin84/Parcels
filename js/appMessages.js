/**
 * Created by alattin on 2/23/2017.
 */
define(["dijit/registry",
        "dojo/query",
        "dojo/dom",
        "dojox/widget/Toaster",
        "bootstrap/Modal",
        "dojo/domReady!"
], function(registry, query, dom, Toaster) {

    var errorModal;

    return {
        init: function(){
            //errorModal = new Toaster({id: 'errorToaster'}, dom.byId('errorPane'));
            //errorModal.positionDirection = "br-left";

            errorModal = query("#errorModal");
        },

        showMessage: function(errorMsg){
            var errorContent = query("#errorContent");
            errorContent[0].innerHTML = errorMsg;
            errorModal.modal('show');

            //errorToaster.setContent(errorMsg, "error", 3000);
            //errorToaster.show();
        }
    };

});