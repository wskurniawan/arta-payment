import mongoose, { Model } from 'mongoose';
import { wallet_type } from '../types/database_types';

type document_type = mongoose.Document & wallet_type;

const schema = new mongoose.Schema({
   email: String,
   saldo: Number,
   token: String
});

const model: Model<document_type> = mongoose.model('wallet', schema);

export async function insert(data: wallet_type): Promise<boolean>{
   try {
      await model.create(data);
   } catch (error) {
      return Promise.reject(error);
   }

   return Promise.resolve(true);
}

export async function get(email: string): Promise<wallet_type | null>{
   try {
      var result = await model.findOne({ email: email });
   } catch (error) {
      return Promise.reject(error);
   }

   if(!result){
      return Promise.resolve(null);
   }

   return Promise.resolve({
      email: result.email,
      saldo: result.saldo,
      token: result.token
   });
}

export async function get_by_token(token: string): Promise<wallet_type | null>{
   try {
      var result = await model.findOne({ token: token });
   } catch (error) {
      return Promise.reject(error);
   }

   if(!result){
      return Promise.resolve(null);
   }

   return Promise.resolve({
      email: result.email,
      saldo: result.saldo,
      token: result.token
   });
}

export async function update_saldo(email: string, saldo: number): Promise<boolean>{
   var update = {
      saldo: saldo
   }

   try {
      await model.updateOne({ email: email }, { $set: update });
   } catch (error) {
      return Promise.reject(error);
   }

   return Promise.resolve(true);
} 

export default {
   insert,
   get, 
   update_saldo,
   get_by_token
}