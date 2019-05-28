import express from 'express';
import axios from 'axios';
import response_helper from '../helper/response_helper';

const router = express.Router();

//base: /service/resi
router.get('/:no_resi', async function(req, res, next){
   try {
      var response = await axios.get('https://trexin.herokuapp.com/api/resi/' + req.params.no_resi);
   } catch (error) {
      return response_helper.internal_server_error(res, error.message);
   }

   response_helper.success(res, {
      data_resi: response.data.data_resi,
      history: response.data.data_history
   });
});

export default router;