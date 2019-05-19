import mongoose from 'mongoose';
import { bill_type } from '../types/database_types';

type document_type = mongoose.Document & bill_type;

const schema = new mongoose.Schema({
   penerbit: String,
   jumlah: Number,
   kode: String,
   is_paid: Boolean
});

const model: mongoose.Model<document_type> = mongoose.model('bill', schema);

export async function insert(data: bill_type): Promise<boolean>{
   try {
      await model.create(data);
   } catch (error) {
      return Promise.reject(error);
   }

   return Promise.resolve(true);
}

export async function get(kode: string): Promise<bill_type | null>{
   try {
      var result = await model.findOne({ kode: kode });
   } catch (error) {
      return Promise.reject(error);
   }

   if(!result){
      return Promise.resolve(null);
   }

   const result_data: bill_type = {
      penerbit: result.penerbit,
      jumlah: result.jumlah,
      kode: result.kode,
      is_paid: result.is_paid
   }

   return Promise.resolve(result_data);
}

export async function set_payment_status(kode: string): Promise<boolean>{
   const update = {
      is_paid: true
   }

   try {
      await model.updateOne({ kode: kode }, { $set: update });   
   } catch (error) {
      return Promise.reject(error);
   }

   return Promise.resolve(true);
}

export default {
   insert, 
   get,
   set_payment_status
}