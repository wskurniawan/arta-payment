import express from 'express';
import axios from 'axios';
import response_helper from '../helper/response_helper';

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

// router.get('/txt-ads', async function(req, res, next){
//    try {
//       var response = await axios.get('')
//    } catch (error) {
      
//    }
// });

export default router;