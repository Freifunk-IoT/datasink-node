import { config } from "../config";
import { LoggingBase } from "@hibas123/nodelogging";

const Logging = new LoggingBase({
   name: "carbon"
})

import DataPoint from "../datapoint";
import Database from "../database";

function handle(line: string) {
   Logging.debug("Line", line);
   let fields = line.split(/\s/g);
   Logging.debug("Fields:", fields);
   let [sensorId, channel] = fields[0].split(".");
   if (!sensorId || !channel) {
      Logging.debug("SensorId or channel not defined");
      return;
   }

   let value = Number(fields[1])
   let ts = Number(fields[2])
   if (Number.isNaN(value) || Number.isNaN(ts)) {
      Logging.debug("Value or Timestamp not valid numbers!");
      return;
   }

   let timestamp = new Date(ts * 1000);
   let data_point = new DataPoint({
      channel: channel,
      sensorId: sensorId,
      timestamp: timestamp,
      value: value
   });
   Database.addDataPoint(data_point).catch(err => {
      Logging.error(err);
   })
}

import * as net from "net";
import * as readline from "readline";
const tcp_server = net.createServer((socket) => {
   let rl = readline.createInterface(socket);
   rl.on("line", (line: string) => handle(line))
}).listen(config.carbon.port, config.carbon.host, () => {
   Logging.log(`Carbon listening on ${config.carbon.host}:${config.carbon.port}`);
})