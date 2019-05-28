<Modal bind:show={show}>
   <input class="uk-input" bind:value={input_resi} placeholder="Masukkan nomor resi">
   
   {#if !loading_cek_resi && input_resi.length > 0}
   <button class="uk-align-center uk-button uk-button-default ws-blue-btn" on:click={ check_resi }>
      CHECK
   </button>
   {/if}
   {#if loading_cek_resi}
   <Loading></Loading>
   {/if}

   {#if display_data}
   <div style="margin-top: 24px;">
      <h3 class="ws-title">Detail Resi</h3>
      <div class="uk-width-1-1">
         <span class="ws-title">Paket </span>
         <span style="margin-left: 12px;">{data_resi.data_resi.nama_barang}</span>
      </div>
      <div uk-grid>
         <div class="uk-width-1-1@s uk-width-1-2@m" style="padding: 4px;">
            <h3 class="ws-title">Penerima</h3>
            <span><b>{data_resi.data_resi.nama_penerima}</b></span> {data_resi.data_resi.lokasi_tujuan.kota}, {data_resi.data_resi.lokasi_tujuan.kecamatan}, {data_resi.data_resi.lokasi_tujuan.provinsi}, <span class="ws-title">kode pos</span> {data_resi.data_resi.lokasi_tujuan.kode_pos}
         </div>
         <div class="uk-width-1-1@s uk-width-1-2@m" style="padding: 4px;">
            <h3 class="ws-title">Pengirim</h3>
            <span><b>{data_resi.data_resi.nama_pengirim}</b></span> {data_resi.data_resi.lokasi_asal.kota}, {data_resi.data_resi.lokasi_asal.kecamatan}, {data_resi.data_resi.lokasi_asal.provinsi}, <span class="ws-title">kode pos</span> {data_resi.data_resi.lokasi_asal.kode_pos}
         </div>
      </div>

      <h3>Riwayat Lokasi</h3>
      <table class="uk-table uk-table-striped">
         <thead>
            <tr>
               <th>Tanggal</th>
               <th>Lokasi</th>
            </tr>
         </thead>
         <tbody>
            {#each data_resi.history as item}
            <tr>
               <td>{item.tanggal_update}</td>
               <td>{item.lokasi.kota}, {item.lokasi.kecamatan}, {item.lokasi.provinsi} <span class="ws-title">kode pos</span> {item.lokasi.kode_pos}</td>
            </tr>
            {/each}
         </tbody>
      </table>
   </div>
   {/if}

   <div class="uk-flex uk-flex-right">
      <span class="ws-title">Powered by</span>
      <span style="font-size: 12px; margin-left: 4px;">Trexin</span>
   </div>

</Modal>

<script>
   import Modal from './modal.svelte';
   import Loading from './loading.svelte';

   var input_resi = '';
   var loading_cek_resi = false;
   var display_data = false;
   var data_resi = {};

   function check_resi(){
      loading_cek_resi = true;
      display_data = false;

      fetch('/service/resi/' + input_resi).then(result => result.json()).then(result => {
         loading_cek_resi = false;
         data_resi = result.data;
         if(result.data.data_resi != null){
            display_data = true;
         }
      }).catch(error => {
         loading_cek_resi = false;
         console.log(error);
      });
   }

   export let show = false;
</script>