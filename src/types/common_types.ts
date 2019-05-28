export type auth_payload_type = {
   email: string,
   name: string
}

export type session_id_type = {
   action: string,
   payment_code?: string,
   redirect_url?: string
}

export type soal_types = {
   question: string,
   answer: string
}

export type periksa_jawaban_type = {
   teks1: string,
   teks2: string
}