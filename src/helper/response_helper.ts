import { Response } from "express";

function validation_error(res: Response, error: any){
   res.status(400).send({
      success: false,
      error: 'validation_error',
      message: error
   })
}

function internal_server_error(res: Response, error: any){
   res.status(500).send({
      success: false,
      error: 'internal_server_error',
      message: error
   });
}

function not_found_error(res: Response, error: any){
   res.status(404).send({
      success: false,
      error: 'not_found_error',
      message: error
   });
}

function invalid_auth(res: Response, error: any){
   res.status(401).send({
      success: false,
      error: 'invalid_auth',
      message: error
   })
}

function forbidden(res: Response, error: any){
   res.status(403).send({
      success: false,
      error: 'forbidden_transaction',
      message: error
   });
}

function success(res: Response, data: any | null){
   res.send({
      success: true,
      data: data
   });
}

export default {
   validation_error,
   internal_server_error,
   not_found_error,
   invalid_auth,
   forbidden,
   success
}