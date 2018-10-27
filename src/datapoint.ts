export default class DataPoint {
   sensorId: string;
   channel: string;
   value: number | string;
   timestamp: Date | string;
   constructor(init?: Partial<DataPoint>) {
      if (init) {
         for (let key in init) {
            this[key] = init[key];
         }
      }
   }

   toIPoint() {
      return {
         measurement: this.sensorId,
         fields: {
            [this.channel]: this.value
         },
         timestamp: this.timestamp
      }
   }

   triggerEvent() {
      //TODO: implement event interface
   }
}