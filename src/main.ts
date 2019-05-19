import express from 'express';
import body_parser from 'body-parser';

const app = express();
const port = process.env.PORT || 5022;

app.use(body_parser.json());

app.get('/', function(req, res, next){
   res.send('oke');
});

app.listen(port, function(){
   console.log(`app ready di port ${port}`);
});