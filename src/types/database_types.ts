export type account_type = {
   name: string,
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
   email: string,
   jumlah: number,
   kode: string,
   is_paid: boolean
}