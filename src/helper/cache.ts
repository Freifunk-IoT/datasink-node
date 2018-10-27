declare type Entry = { timeout: NodeJS.Timer, value: any };
export default class Cache {
   private data = new Map<any, Entry>();

   /**
    * 
    * @param ttl Time the entry stays valid in seconds. default = 3600
    */
   constructor(private ttl: number = 3600) { }

   /**
    * 
    * @param {any} key The key the entry should be referenced with
    * @param {any} value The value, that should be linked with the key
    * @param {number} ttl The time the valid stays valid. defaults to the value set in constructor
    */
   set(key: any, value: any, ttl?: number) {
      let entry = this.data.get(key);
      if (entry) {
         clearTimeout(entry.timeout);
      } else {
         entry = { timeout: null, value: null };
      }

      entry.value = value;
      entry.timeout = setTimeout(() => {
         this.data.delete(key);
      }, ttl || this.ttl);
      this.data.set(key, entry);
   }

   /**
    * Gets the value of the specific key or undefined if not available
    * @param {any} key The key, which data should be returned
    */
   get(key: any) {
      let entry = this.data.get(key);
      if (entry) return entry.value;
      return entry;
   }

   /**
    * Checks if the key is in the cache
    * @param {any} key The key that should be checked
    */
   has(key: any) {
      return this.data.has(key);
   }

   /**
    * Deletes key and its value from cache
    * @param key The key, that should be deleted
    */
   delete(key: any) {
      let entry = this.data.get(key);
      if (entry) {
         clearTimeout(entry.timeout);
      }
      return this.data.delete(key);
   }

   /**
    * Clears the whole cache
    */
   clear() {
      this.data.forEach(value => {
         clearTimeout(value.timeout);
      })
      return this.data.clear();
   }

   get size() {
      return this.data.size;
   }

   get keys() {
      return this.data.keys();
   }
}