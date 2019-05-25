import { Router } from 'express';
import path from 'path';
import response_helper from '../helper/response_helper';
import auth from '../helper/auth';

const router = Router();

//base: /app

router.get('/', function(req, res, next){
   res.redirect(`${req.baseUrl}/login`);
});

router.get('/login', function(req, res, next){
   res.render('login');
});

router.get('/signup', function(req, res, next){
   res.render('signup');
});

router.get('/home', function(req, res, next){
   res.render('home');
});

router.get('/action/:session_id', async function(req, res, next){
   try {
      var decode = await auth.verify_session_id(req.params.session_id);
   } catch (error) {
      return response_helper.forbidden(res, <string> error.message);
   }

   response_helper.success(res, decode);
})

export default router;