import { LoggingBase } from "@hibas123/nodelogging";
const Logging = new LoggingBase({
   name: "web"
})

import * as http from "http";
import { URL } from "url";
import { config } from "../config";
import DataPoint from "../datapoint";
import Database from "../database";
import Auth from "../auth";



const httpServer = http.createServer((req, res) => {
   Logging.log(req.url);
   if (req.url.startsWith("/input")) {
      if (req.method === "POST")
         input_post(req, res);
      else
         input_get(req, res);
   } else {
      catchall(req, res);
   }
})

function catchall(req: http.IncomingMessage, res: http.ServerResponse) {
   res.end(`<h1>Freifunk IOT Data Sink API</h1>`);
}

async function input_post(req: http.IncomingMessage, res: http.ServerResponse) { }

async function input_get(req: http.IncomingMessage, res: http.ServerResponse) {
   try {
      const timestamp = new Date();

      let url = new URL(req.url, "http://localhost");
      let signature = url.searchParams.get("signature")
      if (signature) {
         Logging.debug("Found signature", signature);
         if (!await Auth.signature(signature)) {
            // TODO: Error
         }
         url.searchParams.delete("signature");
      }

      let token = url.searchParams.get("token")
      if (token) {
         Logging.debug("Found token", token)
         if (!await Auth.token(token)) {
            // TODO: Error
         }
         url.searchParams.delete("token");
      }

      let points: DataPoint[] = [];
      url.searchParams.forEach((value, key) => {
         let [sensorId, channel] = key.split(".");
         if (!sensorId || !channel) {
            Logging.warning("Cannot get sensorId or channel", key);
         } else {
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
      })

      await Database.addDataPoints(points);
      res.end(`{"success":true,"message":""}`);
   } catch (err) {
      Logging.error(err);
      if (!res.finished) {
         res.end(`{"success":false,"message":"${err.message}"}`);
      }
   }
}


httpServer.listen(config.web.port, config.web.host, () => {
   Logging.log(`Listening on ${config.web.host}:${config.web.port}`);
});

process.on('SIGTERM', () => {
   httpServer.close(() => {
      Logging.log('REST stopped')
   })
})