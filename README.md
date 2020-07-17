# Squid Module

This is an example of a Module for SquidSP in JavaScript. A Module in SquidSP is an abstraction of a Docker container that can be executed as a lambda function whenever input data exists to be processed.

## Module Specification

The next is a definition example of an SquiSP Module that runs the Docker built with the code present in this repository:

```json
{
    "moduleId": "my-module",
    "input": "rawData",
    "output": "processedData",
    "image": "engiar/squidmodule",
    "containerSlots": 2,
    "entryPoint": "node /eslap/server.js",
    "environmentVars": {
        "EVENTS_PER_REQUEST": 10,
        "MAX_STARVATION_MILLISECONDS": 30000
    }
}
```

* moduleId: It is a string that identifies the Module on the SquidSP service.
* input: It is a string that identifies a topic in SquidMQ from which the events will be fetched to be processed by the Module.
* output: It is a string that identifies a topic in SquidMQ where the processed data will be published.
* image: It is a string that points to a Docker image stored in an accesible Docker Registry.
* containerSlots: It is an integer that determines the number of Slots that will be assigned to the Docker container to be run. A Slot is an abstraction of an specific amount of CPU time and RAM GB.
* entryPoint: It is a string that defines a command that needs to be executed in the Docker container to run your code.
* environmentVars: It is a dictionary on which you can define environment variables that will be present on your Docker container.

## How it works

The Module will be scheduled for execution if there are events on the input topic to be processed. Your Module code is responsible for shutting down itself.
When a Module is running it will always be able to read the environment variable 'SMQ_SERVER' which defines the local address with which you will be able interact with SquidSP.

In the server behind the SMQ_SERVER address you will have three endpoints available:

* get '/?maxEvents=1': This request will be used to fetch events from the input topic. With the 'maxEvents' parameter you can define how many events you want to fetch per request(if they exists in the topic).
* post '/': It will be used to write an Array of results in the output topic.
* delete '/': It will be used to shut down the module whenever you want (usually after all the input events have been processed).

## The example code

The server present in this repo follows the next execution flow:

* The servers works as an infinite loop that fetches 'EVENTS_PER_REQUEST'.
* If there are no events in the input topic for more than 'MAX_STARVATION_MILLISECONDS' the Module will be shut down.
* If there are events the function 'eventsProcessor' will be triggered with a list of fetched events.
* Once all the events fetched have been processed the results are posted to the output topic.
* Every 100 events a log is printed with execution time information.

## Customize and Build your Module

This repo is an example of a NodeJs Module but you can replace the section of code marked in the 'server.js' file to add your own processing.

You can update the build.sh script parameters to build and push your Module to a Docker Registry.

 
