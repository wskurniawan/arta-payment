import mongoose, { Model } from 'mongoose';
import { account_type } from '../types/database_types';

type document_type = mongoose.Document & account_type;

const schema = new mongoose.Schema({
   name: String,
   email: String,
   password: String
});

const model: Model<document_type> = mongoose.model('account', schema);

export async function insert(data: account_type): Promise<boolean>{
   try {
      await model.create(data);
   } catch (error) {
      return Promise.reject(error);
   }

   return Promise.resolve(true);
}

export async function get(email: string): Promise<account_type | null>{
   try {
      var result = await model.findOne({ email: email });
   } catch (error) {
      return Promise.reject(error);
   }

   if(!result){
      return Promise.resolve(null);
   }

   return Promise.resolve({ email: result.email, password: result.password, name: result.name });
}

export default {
   insert,
   get
}

