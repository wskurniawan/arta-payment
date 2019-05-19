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