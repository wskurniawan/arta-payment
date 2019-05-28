<Modal bind:show={show}>
   {#if loading.get_soal}
   <Loading></Loading>
   {/if}
   {#if list_soal.length > 0}
   <div>
      <h3 class="uk-text-center">
         { list_soal[current_soal].question }
      </h3>

      <input class="uk-input" bind:value={ list_jawaban[current_soal] } placeholder="jawaban">

      {#if !display_result}
      <div class="uk-flex uk-flex-center" style="margin-top: 24px;">
         {#if current_soal != 0}
         <button class="uk-button uk-button-default" on:click={prev_soal}>Sebelumnya</button>
         {/if}
         {#if current_soal != list_soal.length - 1}
         <button class="uk-button uk-button-default" on:click={next_soal}>Selanjutnya</button>
         {/if}
      </div>
      {/if}

      <div class="uk-flex uk-flex-center" style="margin-top: 24px;">
         {#if !loading.periksa && !display_result}
         <button class="uk-button uk-button-default" on:click={periksa_jawaban}>
            submit
         </button>
         {/if}
         {#if loading.periksa}
         <Loading></Loading>
         {/if}
      </div>

      {#if display_result}
      <div class="uk-width-1-1" style="margin-top: 24px;">
         <h3 class="ws-title uk-text-center">Skor Kamu</h3>
         <h1 class="uk-text-center">{ parseInt(skor) } dari 100</h1>
      </div>
      {/if}
   </div>
   {/if}
</Modal>

<script>
   import Modal from './modal.svelte';
   import { onMount } from 'svelte';
   import Loading from './loading.svelte';

   export let show = false;
   const loading = {
      get_soal: false,
      periksa: false
   }
   let display_result = false;

   var list_soal = [];
   var list_jawaban = {};
   var current_soal = 0;
   var skor = 0;

   function get_soal(){
      loading.get_soal = true;
      fetch('/service/kuis/list-soal').then(result => result.json()).then(result => {
         loading.get_soal = false;
         list_soal = result.data;

         for(var index in list_soal){
            list_jawaban[index] = '';
         }

         console.log(list_jawaban);
      }).catch(error => {
         loading.get_soal = false;
         console.log(error);
      });
   }

   function next_soal(){
      if(current_soal === list_soal.length - 1){
         return;
      }

      current_soal++;
   }

   function prev_soal(){
      if(current_soal === 0){
         return;
      }

      current_soal--;
   }

   function periksa_jawaban(){
      var array_jawaban = [];

      for(var key in list_jawaban){
         array_jawaban.push(list_jawaban[key]);
      }
      
      var request_body = {
         jawaban: array_jawaban
      };

      loading.periksa = true;
      fetch('/service/kuis/periksa', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(request_body)
      }).then(result => {
         return result.json();
      }).then(result => {
         loading.periksa = false;
         skor = result.data;
         display_result = true;
      }).catch(error => {
         loading.periksa = false;
         console.log(error);
      });
   }

   onMount(() => {
      get_soal();
   })
</script>