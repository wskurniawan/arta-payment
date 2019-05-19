import { auth_payload_type } from "../types/common_types";
import jwt from 'jsonwebtoken';

const auth_secret = <string> require('../../config.json').auth_secret;

export function sign_token(payload: auth_payload_type): string{
   return jwt.sign(payload, auth_secret, { expiresIn: '2h' });
}

export function verify(token: string): Promise<auth_payload_type>{
   try {
      var decoded = <auth_payload_type> jwt.verify(token, auth_secret);
   } catch (error) {
      return Promise.reject(error);
   }

   return Promise.resolve(decoded);
}

export default{
   sign_token,
   verify
}