import express from 'express';
import account_model from '../models/account_model';
import { account_type } from '../types/database_types';
import joi from 'joi';
import bcrypt from 'bcrypt';

import response_helper from '../helper/response_helper';
import { auth_payload_type } from '../types/common_types';
import wallet_model from '../models/wallet_model';
import auth from '../helper/auth';

const Router = express.Router();

//base: /account
Router.post('/register', async function(req, res, next){
   const schema = joi.object().keys({
      email: joi.string().email().required(),
      password: joi.string().required()
   });

   try {
      await joi.validate(req.body, schema);
   } catch (error) {
      return response_helper.validation_error(res, error);
   }

   next();
}, async function(req, res, next){
   var data: account_type = {
      email: req.body.email,
      password: req.body.password
   }

   data.password = bcrypt.hashSync(data.password, 10);

   try{
      await account_model.insert(data);
      await wallet_model.insert({ email: data.email, token: `tk${Date.now()}`, saldo: 0});
   }catch(error){
      return response_helper.internal_server_error(res, error);
   }
   
   res.send({
      success: true
   });
});

Router.post('/login', async function(req, res, next){
   const schema = joi.object().keys({
      email: joi.string().email().required(),
      password: joi.string().required()
   });

   try {
      await joi.validate(req.body, schema);
   } catch (error) {
      return response_helper.validation_error(res, error);
   }

   next();
}, async function(req, res, next){
   const email = <string> req.body.email;
   const password = <string> req.body.password;

   try {
      var account = await account_model.get(email);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   if(!account){
      return response_helper.not_found_error(res, 'email tidak terdaftar');
   }

   try {
      var compare_result = await bcrypt.compare(password, account.password);
   } catch (error) {
      return response_helper.internal_server_error(res, error);
   }

   if(!compare_result){
      return response_helper.invalid_auth(res, 'password tidak benar');
   }

   const auth_payload: auth_payload_type = {
      email: account.email
   }

   const token = auth.sign_token(auth_payload);

   response_helper.success(res, { token: token });
});

export default Router;