import Cache from "./helper/cache";

class Authentication {
   private cache = new Cache(1_800_000); //30 minutes

   async signature(sign: string): Promise<boolean> {
      //TODO: Check signature
      return false;
   }

   async token(token: string): Promise<boolean> {
      //TODO: Check token
      return false;
   }
}
const Auth = new Authentication();
export default Auth;