export type auth_payload_type = {
   email: string,
   name: string
}

export type session_id_type = {
   action: string,
   payment_code?: string,
   redirect_url?: string
}