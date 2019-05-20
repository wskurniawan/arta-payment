export type account_type = {
   email: string,
   password: string
}

export type wallet_type = {
   email: string,
   saldo: number,
   token: string
}

export type bill_type = {
   penerbit: string,
   jumlah: number,
   kode: string,
   is_paid: boolean
}