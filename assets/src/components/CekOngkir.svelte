<Modal bind:show={show}>
   <!-- input section -->
   {#if !loading.get_cost}
   <div>
      <!-- origin -->
      <h3 class="ws-title">Origin</h3>
      <div uk-grid>
         <div class="uk-width-1-2@m uk-width-1-1@s">
            {#if loading.load_province}
               <Loading></Loading>   
            {/if}

            {#if !loading.load_province}
            <label class="uk-form-label" for="form-stacked-select">Province</label>
            <div class="uk-form-controls">
               <select class="uk-select" id="form-stacked-select" bind:value={origin.province_id} on:change={reset_origin_city}>
                  {#each list_province as province}
                     <option value={province.province_id}>{province.province}</option>
                  {/each}
               </select>
            </div>
            {/if}
         </div>
         <div class="uk-width-1-2@m uk-width-1-1@s">
            {#if loading.load_origin_city}
               <Loading></Loading>   
            {/if}
            
            {#if origin.province_id.length > 0 && !loading.load_origin_city}
            <label class="uk-form-label" for="form-stacked-select">City</label>
            <div class="uk-form-controls">
               <select class="uk-select" id="form-stacked-select" bind:value={origin.city_id}>
                  {#each list_origin_city as city}
                     <option value={city.city_id}>{city.city_name}</option>
                  {/each}
               </select>
            </div>
            {/if}
         </div>
      </div>
      <!-- end -->

      <!-- destination -->
      <h3 class="ws-title">Destination</h3>
      <div uk-grid>
         <div class="uk-width-1-2@m uk-width-1-1@s">
            {#if loading.load_province}
               <Loading></Loading>   
            {/if}

            {#if !loading.load_province}
            <label class="uk-form-label" for="form-stacked-select">Province</label>
            <div class="uk-form-controls">
               <select class="uk-select" id="form-stacked-select" bind:value={destination.province_id} on:change={reset_destination_city}>
                  {#each list_province as province}
                     <option value={province.province_id}>{province.province}</option>
                  {/each}
               </select>
            </div>
            {/if}
         </div>
         <div class="uk-width-1-2@m uk-width-1-1@s">
            {#if loading.load_dest_city}
               <Loading></Loading>   
            {/if}
            
            {#if destination.province_id.length > 0 && !loading.load_dest_city}
            <label class="uk-form-label" for="form-stacked-select">City</label>
            <div class="uk-form-controls">
               <select class="uk-select" id="form-stacked-select" bind:value={destination.city_id}>
                  {#each list_dest_city as city}
                     <option value={city.city_id}>{city.city_name}</option>
                  {/each}
               </select>
            </div>
            {/if}
         </div>
      </div>
      <!-- end -->

      <!-- wight -->
      <h3 class="ws-title">Weight (gram)</h3>
      <input class="uk-input" type="number" bind:value={packet_weight}>
      <!-- end -->

      {#if origin.city_id.length > 0 && destination.city_id.length > 0}
      <div class="uk-flex uk-flex-center" style="margin: 24px;">
         <button class="uk-button uk-button-default ws-blue-btn" on:click={get_cost}>Check</button>
      </div>
      {/if}
   </div>
   {:else}
   <Loading></Loading>
   {/if}
   <!-- end -->

   <!-- result section -->
   {#if display_result}
   <div style="margin-top: 12px;">
      <h3 class="ws-title">Results</h3>
      <table class="uk-table uk-table-striped">
         <thead>
            <tr>
               <th>Service</th>
               <th>Cost</th>
               <th>Est (days)</th>
            </tr>
         </thead>
         <tbody>
            {#each result_list as item}
               <tr>
                  <td>{item.name} - {item.service}</td>
                  <td>Rp. { parseInt(item.cost.value).toLocaleString() },00</td>
                  <td>{ item.cost.etd }</td>
               </tr>
            {/each}
         </tbody>
      </table>
   </div>
   {/if}
   <!-- end -->

   <div class="uk-flex uk-flex-right" style="margin-top: 24px;">
      <span class="ws-title">Powered by </span>
      <span style="font-size: 12px; margin-left: 12px">PJT-Logistik</span>
   </div>
</Modal>

<script>
   import Modal from './modal.svelte';
   import { onMount } from 'svelte';
   import Loading from './loading.svelte';

   export let show = false;

   var list_province = [];
   var list_origin_city = [];
   var list_dest_city = [];

   var result_list = [];

   const loading = {
      load_province: false,
      load_origin_city: false,
      load_dest_city: false,
      get_cost: false
   }

   var display_result = false;

   const origin = {
      province_id: '',
      city_id: ''
   }

   var packet_weight = 0;

   const destination = {
      province_id: '',
      city_id: ''
   }

   function reset_origin_city(){
      origin.city_id = '';

      loading.load_origin_city = true;
      get_city(origin.province_id).then(result => {
         list_origin_city = result.data;
         loading.load_origin_city = false;

         origin.city_id = list_origin_city[0].city_id;
      }).catch(error => {
         loading.load_origin_city = false;
         console.log(error);
      });
   }

   function reset_destination_city(){
      destination.city_id = '';

      loading.load_dest_city = true;
      get_city(destination.province_id).then(result => {
         list_dest_city = result.data;
         loading.load_dest_city = false;

         destination.city_id = list_dest_city[0].city_id;
      }).catch(error => {
         loading.load_dest_city = false;
         console.log(error);
      });
   }

   function get_province_list(){
      loading.load_province = true;
      fetch('/service/pjt/provinsi').then(result => {
         return result.json();
      }).then(result => {
         list_province = result.data;
         loading.load_province = false;
      }).catch(error => {
         console.log(error);
      });
   }

   function get_city(province_id){
      return fetch('/service/pjt/kota?id_provinsi=' + province_id).then((result) => result.json());
   }

   function get_cost(){
      loading.get_cost = true;
      display_result = false;

      const request_body = {
         id_kota_asal: origin.city_id,
         id_kota_tujuan: origin.province_id,
         berat: packet_weight
      }

      fetch('/service/pjt/biaya', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(request_body)
      }).then(result => result.json()).then(result => {
         loading.get_cost = false;
         result_list = result.data;
         display_result = true;
      }).catch(error => {
         loading.get_cost = false;
         console.log(error);
      });
   }

   onMount(() => {
      get_province_list();
   });

   
</script>