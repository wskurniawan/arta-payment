import express, { Request, Response, NextFunction, response } from 'express';
import body_parser from 'body-parser';
import { auth_payload_type } from './types/common_types';
import mongoose from 'mongoose';
import axios from 'axios';
import response_helper from './helper/response_helper';
import joi from 'joi';
import { user_pay_type } from './types/request_types';
import auth from './helper/auth';
import cors from 'cors';

const db_uri = <string> require('../config.json').db_uri;

//extend express Request type definition
declare global {
   namespace Express{
      interface Request{
         user: auth_payload_type
      }
   }
}

mongoose.connect(db_uri, { useNewUrlParser: true }).then(() => {
   console.log('db connected');
}).catch(error => {
   console.log(error);
});

const app = express();
const port = process.env.PORT || 5022;

app.use(cors());
app.set('view engine', 'ejs');
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use('/assets/public', express.static(`${__dirname}/../assets/public`));

app.get('/', function(req, res, next){
   res.redirect('/app');
});

app.get('/dokumentasi', async function(req, res, next){
   try {
      var result = await axios.post(`https://arta.ruangkarya.id/payment/create-bill`, { token: 'tk1558783861903', jumlah: 10000 });
   } catch (error) {
      //console.log(error.response);
      return response_helper.internal_server_error(res, <string> error.message);
   }

   res.render('dokumentasi', { kode_pembayaran: result.data.data.kode});
});

app.get('/pay', async function(req, res, next){
   const schema = joi.object().keys({
      paymentCode: joi.string().required(),
      successRedirect: joi.string().optional()
   });

   try {
      await joi.validate(req.query, schema);
   } catch (error) {
      return response_helper.validation_error(res, <string> error.message);
   }

   next();
}, function(req, res, next){
   const request_data = <user_pay_type> req.query;

   var session_id = auth.generate_session_id({ action: 'pay', payment_code: request_data.paymentCode, redirect_url: request_data.successRedirect });

   res.redirect(`/app/login?sessionId=${session_id}`);
});

app.use('/app', require('./routes/view_routes').default);
app.use('/account', require('./routes/account_routes').default);
app.use('/payment', require('./routes/payment_routes').default);
app.use('/service/pjt', require('./routes/cek_ongkir_routes').default);
app.use('/service/ads', require('./routes/ads_routes').default);

app.use(function(err: Error, req: Request, res: Response, next: NextFunction){
   console.log(err);
   
   res.status(500).send({
      success: false,
      error: 'internal_server_error',
      message: err
   });
});

app.listen(port, function(){
   console.log(`app ready di port ${port}`);
});