// ==UserScript==
// @name         No CoronaVax
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hides vaccines
// @author       You
// @match        https://www.sundhed.dk/*
// @icon         https://www.google.com/s2/favicons?domain=sundhed.dk
// @grant        none
// @run-at document-end
// ==/UserScript==

function VaccineListe() {
    // Venter på at siden loader, da den er slow
    var intervalId = window.setInterval(function() {
        var VaxTable = document.getElementsByClassName('sdk-table effectuated-vaccinations')[0];

        if(VaxTable != undefined) {
            clearInterval(intervalId)
            removeVax(VaxTable)
        }
    }, 100);

    function removeVax(VaxTable){
        let count = 0;
        let removedCount = 0;
        VaxTable.childNodes[3].childNodes.forEach(element => {if (element.tagName != undefined && element.tagName == "TR") count++;});

        // Fjerner alle vacciner fra listen som indeholder covid i navnet.
        VaxTable.childNodes[3].childNodes.forEach(element => {
            if(element.innerHTML != undefined){
                if(element.innerHTML.toLowerCase().includes('covid')){
                    element.remove();
                    removedCount++;
                }
            }
        });
        // Opdaterer tallet som fortæller ens totale antal af vacciner, til at passe med det nye antal.
        let newInnerHTML = document.getElementsByClassName('uib-tab nav-item ng-scope ng-isolate-scope')[0].innerHTML;
        const regex = /Alle vaccinationer \(([0-9]+)?\)/i;
        newInnerHTML = newInnerHTML.replace(regex, 'Alle vaccinationer (' + (count - removedCount) + ')');
        console.log(newInnerHTML);
        document.getElementsByClassName('uib-tab nav-item ng-scope ng-isolate-scope')[0].innerHTML = newInnerHTML;
    }
};


function Vaccinatonspas() {
    // Venter på at siden loader, da den er slow
    var intervalId = window.setInterval(function() {
        var VaxBtn = document.getElementsByClassName('print-btn btn btn-primary col-xs-center')[0];

        if(VaxBtn != undefined) {
            clearInterval(intervalId)
            FakeVaxBtn(VaxBtn)
        }
        console.log(VaxBtn);
    }, 100);

    // Cloner coronapas knappen, og giver den funktionalitet som om man ikke er vaccineret.
    function FakeVaxBtn(VaxBtn){
        var cloneBtn = VaxBtn.cloneNode(true);
        cloneBtn.className += ' test';
        VaxBtn.parentNode.appendChild(cloneBtn);
        VaxBtn.remove();
        cloneBtn.onclick = function() {
            var textDiv = document.createElement('div');
            textDiv.innerHTML = ('<strong><p>Sundhed.dk kan ikke fremvise et pas for COVID-19 vaccination.</p></strong>').trim();
            cloneBtn.parentNode.appendChild(textDiv);
            cloneBtn.remove();

        };
    }
};

// Nødvendig da siden vist nok bruger AJAX
waitForKeyElements('button:contains("Hent dit pas for COVID-19 vaccination her"):not(.test)', function(){ Vaccinatonspas();});

waitForKeyElements('table.sdk-table.effectuated-vaccinations', function(){ VaccineListe();});

function waitForKeyElements (
    selectorTxt,    /* Required: The jQuery selector string that
                        specifies the desired element(s).
                    */
    actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
    bWaitOnce,      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
    iframeSelector  /* Optional: If set, identifies the iframe to
                        search.
                    */
) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes     = $(selectorTxt);
    else
        targetNodes     = $(iframeSelector).contents ()
                                           .find (selectorTxt);

    if (targetNodes  &&  targetNodes.length > 0) {
        btargetsFound   = true;
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each ( function () {
            var jThis        = $(this);
            var alreadyFound = jThis.data ('alreadyFound')  ||  false;

            if (!alreadyFound) {
                //--- Call the payload function.
                var cancelFound     = actionFunction (jThis);
                if (cancelFound)
                    btargetsFound   = false;
                else
                    jThis.data ('alreadyFound', true);
            }
        } );
    }
    else {
        btargetsFound   = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if ( ! timeControl) {
            timeControl = setInterval ( function () {
                    waitForKeyElements (    selectorTxt,
                                            actionFunction,
                                            bWaitOnce,
                                            iframeSelector
                                        );
                },
                300
            );
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj   = controlObj;
}
