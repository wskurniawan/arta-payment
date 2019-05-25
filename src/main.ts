import express, { Request, Response, NextFunction } from 'express';
import body_parser from 'body-parser';
import { auth_payload_type } from './types/common_types';
import mongoose from 'mongoose';

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

app.set('view engine', 'ejs');
app.use(body_parser.json());
app.use('/assets/public', express.static(`${__dirname}/../assets/public`));

app.get('/', function(req, res, next){
   res.send('oke');
});

app.use('/app', require('./routes/view_routes').default);
app.use('/account', require('./routes/account_routes').default);
app.use('/payment', require('./routes/payment_routes').default);

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