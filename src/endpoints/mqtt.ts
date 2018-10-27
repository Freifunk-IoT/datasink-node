import { LoggingBase } from "@hibas123/nodelogging";
const Logging = new LoggingBase({
   name: "mqtt"
})

import * as mqtt from "mqtt";
import { config } from "../config";
import Auth from "../auth";
import DataPoint from "../datapoint";
import Database from "../database";

const client = mqtt.connect(config.mqtt.host);

client.on('connect', function () {
   client.subscribe(config.mqtt.base_topic + "#", function (err) {
      if (err) {
         Logging.error(err);
      }
   })
})

client.on('message', async (topic, message) => {
   Logging.debug("Received", topic);
   if (topic === config.mqtt.base_topic + "#") {
      let timestamp: Date = new Date();
      let data = JSON.parse(message.toString())
      Logging.debug("Data:", data);
      if (data.signature) {
         Logging.debug("Found signature", data.signature);
         if (!await Auth.signature(data.signature)) {
            // TODO: Error
         }
         delete data.signature;
      }

      if (data.token) {
         Logging.debug("Found token", data.token)
         if (!await Auth.token(data.token)) {
            // TODO: Error
         }
         delete data.token;
      }

      if (data.timestamp) {
         timestamp = new Date(Number(data.timestamp) * 1000);
      } else if (data.timestamp_ms) {
         timestamp = new Date(Number(data.timestamp_ms));
      }
      let points: DataPoint[] = [];
      for (let key in data) {
         let [sensorId, channel] = key.split(".");
         if (!sensorId || !channel) {
            Logging.debug("Sensor or channel not found", key);
            continue;
         }
         let value = data[key];

         let val: number | string = Number(value);
         if (Number.isNaN(val)) val = value;

         let data_point = new DataPoint({
            channel: channel,
            sensorId: sensorId,
            timestamp: timestamp,
            value: val
         });
         points.push(data_point);
      }
      Database.addDataPoints(points).catch(err => {
         Logging.error(err);
      })
   }
})

process.on('SIGTERM', () => {
   client.end(true, () => {
      Logging.log('MQTT stopped')
   })
})