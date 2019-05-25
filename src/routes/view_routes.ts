import { Router } from 'express';
import path from 'path';

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

export default router;