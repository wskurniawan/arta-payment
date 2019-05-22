import express from 'express';
import joi, { date, string } from 'joi';
import request_helper from '../helper/response_helper';
import wallet_model from '../models/wallet_model';
import { create_payment_type, pay_type, topup_type } from '../types/request_types';
import response_helper from '../helper/response_helper';
import { bill_type } from '../types/database_types';
import bill_model from '../models/bill_model';
import { Schema } from 'mongoose';
import auth from '../helper/auth';

const Router = express.Router();

//base: /payment
Router.post('/create-bill', async function(req, res, next){
   const schema = joi.object().keys({
      token: joi.string().required(),
      jumlah: joi.number().required()
   });

   // try {
   //    await joi.validate(req.body, schema);
   // } catch (error) {
   //    return request_helper.validation_error(res, error);
   // }

   next();
}, async function(req, res, next){
   const request_data = <create_payment_type> req.body;

   try {
      var wallet_data = await wallet_model.get_by_token(request_data.token);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   if(!wallet_data){
      return response_helper.validation_error(res, 'Token tidak valid');
   }

   const bill_data: bill_type = {
      penerbit: wallet_data.email,
      jumlah: request_data.jumlah,
      kode: `PY${Date.now()}`,
      is_paid: false
   }

   try {
      await bill_model.insert(bill_data);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   response_helper.success(res, bill_data);
});

Router.get('/get-status/:payment_code', async function(req, res, next){
   var payment_code = <string> req.params.payment_code;
   try {
      var bill_data = await bill_model.get(payment_code);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   // if(!bill_data){
   //    return response_helper.not_found_error(res, 'invalid payment code');
   // }

   response_helper.success(res, bill_data);
});

Router.post('/pay', async function(req, res, next){
   const schema = joi.object().keys({
      payment_code: joi.string().required(),
      session_token: joi.string().required()
   });

   // try {
   //    await joi.validate(req.body, schema);
   // } catch (error) {
   //    return response_helper.validation_error(res, error);
   // }

   next();
}, async function(req, res, next){
   var token = <string> req.body.session_token;

   try {
      var auth_payload = await auth.verify(token)
   } catch (error) {
      return response_helper.invalid_auth(res, error);  
   }

   req.user = auth_payload;

   next();
}, async function(req, res, next){
   const request_data = <pay_type> req.body;

   try {
      var payment_detail = await bill_model.get(request_data.payment_code);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   if(!payment_detail){
      return response_helper.not_found_error(res, 'invalid payment_code');
   }

   if(payment_detail.is_paid){
      return response_helper.forbidden(res, 'Tagihan sudah dibayar');
   }

   try {
      var sender_wallet = await wallet_model.get(req.user.email);
      var dest_wallet = await wallet_model.get(payment_detail.penerbit);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   if(!sender_wallet || !dest_wallet){
      return response_helper.not_found_error(res, 'invalid wallet id');
   }

   //check balance
   if(sender_wallet.saldo < payment_detail.jumlah){
      return response_helper.forbidden(res, 'saldo tidak cukup');
   }

   sender_wallet.saldo = sender_wallet.saldo - payment_detail.jumlah;

   //update balance
   try {
      await wallet_model.update_saldo(sender_wallet.email, sender_wallet.saldo);
      dest_wallet = await wallet_model.get(payment_detail.penerbit);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   if(dest_wallet === null){
      return response_helper.not_found_error(res, 'invalid wallet id');
   }

   dest_wallet.saldo = dest_wallet.saldo + payment_detail.jumlah;
   
   try {
      await wallet_model.update_saldo(dest_wallet.email, dest_wallet.saldo);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   //update payment status
   try {
      await bill_model.set_payment_status(payment_detail.kode);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   response_helper.success(res, null);
});

Router.post('/topup', async function(req, res, next){
   const schema = joi.object().keys({
      session_token: joi.string().required(),
      jumlah: joi.number().required()
   });

   // try {
   //    await joi.validate(req.body, schema);
   // } catch (error) {
   //    return response_helper.validation_error(res, error);
   // }

   var token = <string> req.body.session_token;

   try {
      var decode = await auth.verify(token);
   } catch (error) {
      return response_helper.invalid_auth(res, error);
   }

   req.user = decode;
   next();
}, async function(req, res, next){
   var request_data = <topup_type> req.body;

   try {
      var wallet_data = await wallet_model.get(req.user.email);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   if(!wallet_data){
      return response_helper.not_found_error(res, 'invalid wallet id');
   }

   wallet_data.saldo += request_data.jumlah;

   try {
      await wallet_model.update_saldo(wallet_data.email, wallet_data.saldo);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   response_helper.success(res, null);
}); 

export default Router;