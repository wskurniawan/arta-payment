import express, { Request, Response, NextFunction } from 'express';
import body_parser from 'body-parser';
import { auth_payload_type } from './types/common_types';

//extend express Request type definition
declare global {
   namespace Express{
      interface Request{
         user: auth_payload_type
      }
   }
}

const app = express();
const port = process.env.PORT || 5022;

app.use(body_parser.json());

app.get('/', function(req, res, next){
   res.send('oke');
});

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