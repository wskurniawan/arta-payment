import express from 'express';
import soal_model from '../models/soal_model';
import response_helper from '../helper/response_helper';
import joi from 'joi';
import { periksa_jawaban_type } from '../types/common_types';
import axios from 'axios';

const router = express.Router();

// base: /service/kuis
router.get('/list-soal', function(req, res, next){
   const list_soal = soal_model.get_soal();

   response_helper.success(res, list_soal);
});

router.post('/periksa', async function(req, res, next){
   const jumlah_soal = soal_model.get_soal().length;

   const schema = joi.object().keys({
      jawaban: joi.array().items(joi.string()).max(jumlah_soal).required()
   });

   try {
      await joi.validate(req.body, schema);
   } catch (error) {
      return response_helper.validation_error(res, <string> error.message);
   }

   next();
}, async function(req, res, next){
   const jawaban = <string[]> req.body.jawaban;
   const list_soal = soal_model.get_soal();
   const list_jawaban_kunci_jawaban: periksa_jawaban_type[] = [];

   for(var index in jawaban){
      list_jawaban_kunci_jawaban.push({
         teks1: list_soal[index].answer,
         teks2: jawaban[index]
      });
   }

   var final_result = 0;

   for(var index in list_jawaban_kunci_jawaban){
      const item = list_jawaban_kunci_jawaban[index];
      try {
         var response = await axios.get(`https://ai-nya-yuda.herokuapp.com/api/text-similarity?teks1=${item.teks1}&teks2=${item.teks2}`);
      } catch (error) {
         return console.log(error);
      }
      
      final_result += response.data['tingkat kemiripan'];
   }

   final_result = ( final_result / list_soal.length ) * 100;

   response_helper.success(res, final_result);
});

export default router;