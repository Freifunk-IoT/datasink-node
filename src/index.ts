import { Logging } from "@hibas123/nodelogging";
import { config } from "./config";

process.on('uncaughtException', function (err) {
   //TODO: Error logging
   process.kill(process.pid, 'SIGTERM')
});

if (config.web.enabled) {
   Logging.log("Spinning up REST endpoint");
   // Using require because only top level imports are allowed
   // and so would be loaded regardless of the need.
   require("./endpoints/rest");
}

if (config.mqtt.enabled) {
   Logging.log("Spinning up MQTT endpoint");
   require("./endpoints/mqtt");
}

if (config.carbon.enabled) {
   Logging.log("Spinning up Carbon endpoint");
   require("./endpoints/carbon");
}