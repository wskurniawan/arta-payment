import express from 'express';
import axios from 'axios';
import response_helper from '../helper/response_helper';
import joi from 'joi';
import { get_ongkir_post_type } from '../types/request_types';

const Router = express.Router();
const base_url = 'https://pjt-logistik.herokuapp.com/';

//base: /service/pjt
Router.get('/provinsi', async function(req, res, next){
   try {
      var response = await axios.get(`${base_url}/provinsi`); 
   } catch (error) {
      return response_helper.internal_server_error(res, <string> error.message);
   }
   
   response_helper.success(res, response.data);
});

Router.get('/kota', async function(req, res, next){
   const schema = joi.object().keys({
      id_provinsi: joi.string().required()
   });

   try {
      await joi.validate(req.query, schema);
   } catch (error) {
      return response_helper.validation_error(res, <string> error.message);
   }

   next();
}, async function(req, res, next){
   const id_provinsi = <string> req.query.id_provinsi;

   try {
      var response = await axios.get(`${base_url}/city?idProvinsi=${id_provinsi}`);
   } catch (error) {
      return response_helper.internal_server_error(res, <string> error.message);
   }

   response_helper.success(res, response.data);
});

Router.post('/biaya', async function(req, res, next){
   const schema = joi.object().keys({
      id_kota_asal: joi.string().required(),
      id_kota_tujuan: joi.string().required(),
      berat: joi.number().required()
   });

   try {
      await joi.validate(req.body, schema);
   } catch (error) {
      return response_helper.validation_error(res, <string> error.message);
   }

   next();
}, async function(req, res, next){
   const request_data = <get_ongkir_post_type> req.body;

   try {
      var response = await axios.post(`${base_url}/cost`, { asal: request_data.id_kota_asal, tujuan: request_data.id_kota_tujuan, berat: request_data.berat });
   } catch (error) {
      return response_helper.internal_server_error(res, <string> error.message);
   }

   response_helper.success(res, response.data);
});

export default Router;