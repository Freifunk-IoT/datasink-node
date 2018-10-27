import { Logging } from "@hibas123/nodelogging";
import * as influx from "influx";
import { config } from "./config";
import DataPoint from "./datapoint";

class _Database {
   database: influx.InfluxDB;

   constructor() {
      this.database = new influx.InfluxDB({
         database: config.database.database,
         host: config.database.host
      })
      this.database.createDatabase(config.database.database);
   }

   public addDataPoint(point: DataPoint) {
      return this.addDataPoints([point]);
   }

   public async addDataPoints(points: DataPoint[]) {
      if (points.length > 0) {
         points.forEach(p => p.triggerEvent());
         return this.database.writePoints(points.map(p => p.toIPoint()))
            .catch(err => {
               Logging.error(err);
               return Promise.reject(new Error("Database error!"))
            });
      }
   }
}

const Database = new _Database();
export default Database;