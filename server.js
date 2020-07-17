// Example of a SquidSP Module
// Author: Enrique Gil Arcas
//
// This server will receive the address to communicate with the queuing system on the enviroment variable "SMQ_SERVER"
// The server behind this address will offer three endpoints:
//   * get '/?maxEvents=1': this request will be used to fetch events from the input topic
//   * post '/': It will be used to write results in the output topic
//   * delete '/': It will be used to undeploy the module after all the input events have been processed.

const http = require('http');

var millisecondsToRetry = 3000; // Milliseconds between request when there are not events on the input topic
var eventsToProcessPerRound = process.env.EVENTS_PER_REQUEST; // Max number of events retrieved from the input topic per request.

// Variables to log the processing rate
var processedEventsTotal = 0;
var processedEventsStep = 0;
var timeStart = Date.now();

// Variables to schedule the undeployment of the module
var firstRequestWithNoEventsTimestamp;
var maxStarvingMilliseconds = parseInt(process.env.MAX_STARVATION_MILLISECONDS);

console.log("Server: " + process.env.SMQ_SERVER);
var hostname = process.env.SMQ_SERVER.split(':')[0];
var port = process.env.SMQ_SERVER.split(':')[1];


// This function will receive:
//   'events': a list of events from the input topic.
//   'sendResults': a callback to public a list of results to be stored in the output topic.
//   'undeployModule': a callback to undeploy this module.
var eventsProcessor = function(events, sendresults, undeployModule){

    // Scheduling undeployment
    if(events.length === 0){
        if(firstRequestWithNoEventsTimestamp === undefined){ // First time without events
            firstRequestWithNoEventsTimestamp = Date.now();
        }else{
            if(Date.now() - firstRequestWithNoEventsTimestamp > maxStarvingMilliseconds){ // Exceeded starvation time
                undeployModule();
                return;
            }
        }
    }else{
        firstRequestWithNoEventsTimestamp = undefined;
    }

    // Logging rate
    processedEventsTotal = processedEventsTotal + events.length;
    processedEventsStep = processedEventsStep + events.length;


    ///////////////////////////////////////
    ///////////////////////////////////////
    // REPLACE WITH YOUR PROCESSING CODE //

    var res = events.map(function(x){ x.value.processed_data = "lulululu"; return x.value;})

    ///////////////////////////////////////
    ///////////////////////////////////////

    sendresults(res);
}

var loop = function(){
    http.get("http://" + process.env.SMQ_SERVER + "?maxEvents=" + eventsToProcessPerRound, function (resp){
        var data = '';
        resp.on('data', function(chunk){
            data += chunk;
        });
        resp.on('end', function(){
            //console.log("End data: " + data);
            if(JSON.parse(data).error === undefined) {
                var cb = function (events) {
                    //console.log("CB result: " + JSON.stringify(events));
                    var request = http.request(
                        {
                            hostname: hostname,
                            port: port,
                            path: "",
                            method: "POST",
                            headers: {
                                'Content-type': 'application/json;charset=UTF-8'
                            }
                        },
                        function (resp) {
                            resp.on('data', function (storage_result) {
                                //console.log(Date.now() + " Results stored: " + JSON.stringify(storage_result));
                                if(processedEventsStep >= 100){
                                console.log("Processed batch of " + processedEventsStep + " events in " + ((Date.now() - timeStart) / 1000 ) + " seconds. Total processed events: " + processedEventsTotal);
                                processedEventsStep = 0;
                                timeStart = Date.now();    }
                                setTimeout(loop, 0);
                            });
                        });
                    request.write(JSON.stringify(events));
                    request.end();
                };
                var undeploy = function(){
                    var request = http.request(
                        {
                            hostname: hostname,
                            port: port,
                            path: "",
                            method: "DELETE",
                            headers: {
                                'Content-type': 'application/json;charset=UTF-8'
                            }
                        },
                        function (resp) {}
                    );
                    request.end();
                }
                eventsProcessor(JSON.parse(data), cb, undeploy);
            }else{
                setTimeout(loop, millisecondsToRetry);
            }
        });

    }).on("error", function(err){
      console.log("Error: " + err.message);
    });
};

loop();