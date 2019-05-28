import express from 'express';
import axios from 'axios';
import response_helper from '../helper/response_helper';
import joi from 'joi';

const router = express.Router();

//base: /service/ads
router.get('/img-ads', async function(req, res, next){
   try {
      var response = await axios.get('https://integrasi-iklan.herokuapp.com/iklan')      
   } catch (error) {
      return response_helper.internal_server_error(res, error.message);
   }

   return response_helper.success(res, response.data);
});

router.get('/txt-ads', async function(req, res, next){
   const schema = joi.object().keys({
      lat: joi.string().required(),
      lng: joi.string().required()
   });

   try {
      await joi.validate(req.query, schema);
   } catch (error) {
      return response_helper.validation_error(res, <string> error.message);
   }

   next();
}, async function(req, res, next){
   try {
      var response = await axios.post('http://iaisemangat.herokuapp.com/index.php/CariIklan/getIklanAll', {
         lat_akses: req.query.lat,
         lon_akses: req.query.lng
      });
   } catch (error) {
      console.log(error.response.data);
      return response_helper.internal_server_error(res, <string> error.message);
   }

   response_helper.success(res, response.data.Data);
});

export default router;