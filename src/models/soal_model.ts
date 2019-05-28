import { soal_types } from "../types/common_types";

const list_soal: soal_types[] = [
   {
      question: 'Kalo dimakan berasa, kalo nggak dimakan juga berasa, apakah itu?',
      answer: 'Makanan. Kalo nggak makan kan berasa laper.'
   },
   {
      question: 'Sebutkan satu kalimat yang jika dibaca baik dari kiri maupun kanan tetap sama!',
      answer: 'Kasur ini rusak.'
   },
   {
      question: 'Apa perbedaan antara sarung dan kotak?',
      answer: 'Sarung ada yang kotak-kotak, tapi kalo kotak nggak ada yang sarung-sarung.'
   },
   {
      question: 'Apa perbedaan antara sepatu dan jengkol?',
      answer: 'Sepatu disemir, kalo jengkol disemur.'
   },
   {
      question: 'Kenapa ban mobil bentuknya bundar?',
      answer: 'Karena kalo segitiga nanti nggak nyaman,'
   }
]

export function get_soal(): soal_types[]{
   return list_soal
}

export default {
   get_soal
}