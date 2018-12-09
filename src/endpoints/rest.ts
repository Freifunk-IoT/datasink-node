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
   res.setHeader("Content-Type", "text/html")
   res.end(`<h1>Freifunk IOT Data Sink API</h1>`);
}

interface PostDataStructure {
   signature?: string;
   token?: string;
   values: { sensorID: string, channel: string, value: string | number }[];
}

let unauthorized = (res) => res.end(`{"success":false,"message":"Body to large!"}`);

function input_post(req: http.IncomingMessage, res: http.ServerResponse) {
   const timestamp = new Date();
   let ct = req.headers["content-type"].toLowerCase();
   if (ct.indexOf("json") < 0) {
      res.end(`{"success":false,"message":"invalid content-type"}`);
   } else {
      let invalid = false; //Check invalid
      let body = "";
      req.on("data", (chunk: Buffer) => {
         if (invalid) return;
         if (chunk.length + body.length > 4096) {
            res.end(`{"success":false,"message":"Body to large!"}`);
            invalid = true;
         } else {
            body += chunk.toString("utf8");
         }
      })
      req.on("end", async () => {
         try {
            if (!invalid) {
               let data: PostDataStructure = JSON.parse(body);
               if (data.signature) {
                  Logging.debug("Found signature", data.signature);
                  if (!await Auth.signature(data.signature)) {
                     return unauthorized(res)
                  }
               }

               if (data.token) {
                  Logging.debug("Found token", data.token)
                  if (!await Auth.token(data.token)) {
                     return unauthorized(res)
                  }
               }

               let points: DataPoint[] = [];
               data.values.forEach(val => {
                  let data_point = new DataPoint({
                     channel: val.channel,
                     sensorId: val.sensorID,
                     timestamp: timestamp,
                     value: val.value
                  });
                  points.push(data_point);
               })
               res.end(`{"success":true,"message":""}`);
            }
         } catch (err) {
            Logging.error(err);
            if (!res.finished) {
               res.end(`{"success":false,"message":"${err.message}"}`);
            }
         }
      })
   }
}

async function input_get(req: http.IncomingMessage, res: http.ServerResponse) {
   try {
      const timestamp = new Date();

      let url = new URL(req.url, "http://localhost");
      let signature = url.searchParams.get("signature")
      if (signature) {
         Logging.debug("Found signature", signature);
         if (!await Auth.signature(signature)) {
            return unauthorized(res)
         }
         url.searchParams.delete("signature");
      }

      let token = url.searchParams.get("token")
      if (token) {
         Logging.debug("Found token", token)
         if (!await Auth.token(token)) {
            return unauthorized(res)
         }
         url.searchParams.delete("token");
      }

      let points: DataPoint[] = [];
      url.searchParams.forEach((value, key) => {
         let [sensorID, channel] = key.split(".");
         if (!sensorID || !channel) {
            Logging.warning("Cannot get sensorId or channel", key);
         } else {
            let val: number | string = Number(value);
            if (Number.isNaN(val)) val = value;

            let data_point = new DataPoint({
               channel: channel,
               sensorId: sensorID,
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