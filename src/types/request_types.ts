export type create_payment_type = {
   token: string,
   jumlah: number
}

export type pay_type = {
   session_token: string,
   payment_code: string
}

export type topup_type = {
   session_token: string,
   jumlah: number
}

export type user_pay_type = {
   paymentCode: string,
   successRedirect?: string
}

export type get_ongkir_post_type = {
   id_kota_asal: string,
   id_kota_tujuan: string,
   berat: string
}