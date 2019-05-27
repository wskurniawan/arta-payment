<div class="uk-width-1-1 uk-height-viewport uk-flex uk-flex-center uk-flex-middle">
   <div class="uk-width-2-3@m uk-width-1-1@s" style="padding: 12px">
      <!-- main feature -->
      <img class="uk-align-center" src="/assets/public/img/logo_arta.png" alt="logo" width="204">

      <div class="uk-card uk-card-default">
         <div class="uk-card-body">
            <div uk-grid>
               <!-- profile -->
               <div class="uk-width-1-2@m uk-width-1-1@s">
                  <img class="uk-align-center" src="/assets/public/img/account-icon.png" width="86" alt="account">
                  <h3 class="ws-title uk-text-center">WELCOME TO ARTA, {account_data.name} !</h3>

                  <div class="uk-text-center">
                     <span class="ws-title"><b>Your balance:</b></span>
                     <h2><b>Rp. {account_data.str_balance}.00</b></h2>
                  </div>

                  <button class="uk-align-center uk-button uk-button-default ws-blue-btn" on:click={() => modal.profile = true}>
                     MY PROFILE
                  </button>
               </div>
               <!-- end -->
               <!-- action -->
               <div class="uk-width-1-2@m uk-width-1-1@s uk-flex uk-flex-middle">
                  <div class="uk-width-1-1">
                     <h3 class="ws-title uk-text-center">WHAT WOULD YOU LIKE TO DO?</h3>
                     <div class="uk-align-center uk-width-1-1@s uk-width-3-5@m">
                        <button class="uk-width-1-1 ws-blue-btn uk-button uk-button-default" style="margin-bottom: 12px;" on:click={() => modal.topup = true}>
                           TOP UP E-WALLET
                        </button>
                        <button class="uk-width-1-1 ws-blue-btn uk-button uk-button-default" style="margin-bottom: 12px;" on:click={() => modal.do_payment = true}>
                           DO PAYMENT
                        </button>
                        <button class="uk-width-1-1 ws-blue-btn uk-button uk-button-default" style="margin-bottom: 12px;" on:click={() => modal.publish_payment = true}>PUBLISH BILL</button>
                     </div>
                  </div>
               </div>
               <!-- end -->
            </div>
         </div>
      </div>
      <!-- end -->

      <!-- adds -->
      <div uk-grid style="margin-top: 24px;">
         <div class="uk-width-1-2@m uk-width-1-1@s">
            <img src="/assets/public/img/ad_arta_1.png" alt="ads">
         </div>
         <div class="uk-width-1-2@m uk-width-1-1@s">
            <img src="/assets/public/img/ad_arta_2.png" alt="ads">
         </div>
      </div>
      <!-- end -->

      <!-- modal topup -->
      <Modal bind:show={modal.topup}>
         <h4 class="uk-text-center">
            <b>TOP UP</b>   
         </h4>

         <div class="uk-text-center">
            <span class="ws-title"><b>Your balance:</b></span>
            <h2><b>Rp. {account_data.str_balance}.00</b></h2>
         </div>

         {#if !loading.topup && !topup_status.success && !topup_status.failed}
         <div uk-grid>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1" on:click={() => do_topup(50000)}>
                  Rp. 50,0000.00
               </uk-button>
            </div>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1" on:click={() => do_topup(300000)}>
                  Rp. 300,0000.00
               </uk-button>
            </div>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1"  on:click={() => do_topup(100000)}>
                  Rp. 100,0000.00
               </uk-button>
            </div>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1"  on:click={() => do_topup(500000)}>
                  Rp. 500,0000.00
               </uk-button>
            </div>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1"  on:click={() => do_topup(200000)}>
                  Rp. 200,0000.00
               </uk-button>
            </div>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1"  on:click={() => do_topup(1000000)}>
                  Rp. 1,000,0000.00
               </uk-button>
            </div>
         </div>
         {/if}

         {#if loading.topup}
         <Loading></Loading>
         {/if}

         <!-- topup success -->
         {#if topup_status.success}
         <div class="uk-card uk-card-default">
            <div class="uk-card-body">
               <h3 class="uk-text-success uk-text-center">Topup Sucess</h3>
            </div>
         </div>
         <!-- end -->
         {/if}

         <!-- topup failed -->
         {#if topup_status.failed}
         <div class="uk-card uk-card-default">
            <div class="uk-card-body">
               <h3 class="uk-text-danger uk-text-center">Topup Failed</h3>
            </div>
         </div>
         {/if}
         <!-- end -->
      </Modal>
      <!-- end -->

      <!-- modal do payment -->
      <Modal bind:show={modal.do_payment}>
         <!-- alert -->
         
         {#if payment.display_error}
         <div class="uk-alert-danger" uk-alert>
            <p>Error: {payment.error_message}!</p>
         </div>
         {/if}

         {#if payment.display_success}
         <div class="uk-alert-success" uk-alert>
            <p>Payment success.</p>
         </div>
         {/if}
         
         <!-- end -->

         <h4 class="uk-text-center">
            <b>DO PAYMENT</b>   
         </h4>

         <div class="uk-text-center">
            <span class="ws-title"><b>Your balance:</b></span>
            <h2><b>Rp. {account_data.str_balance}.00</b></h2>
         </div>

         {#if !payment.display_data}
         <div class="uk-text-center">
            <h5>FILL PAYMENT DETAILS</h5>
            <input class="uk-input" placeholder="enter payment code" bind:value={payment.code}>

            <button class="uk-button uk-button-default ws-blue-btn" style="margin-top: 12px" on:click={do_check_payment}>CHECK</button>
         </div>
         {/if}

         {#if payment.display_data}
         <div class="uk-card uk-card-body">
            <div class="uk-width-1-1 uk-text-center">
               <span>Issued by</span>
               <h3>{payment.data.publisher}</h3>
               <span>amount</span>
               <h2>Rp. {Number.parseInt(payment.data.amount).toLocaleString()},00</h2>

               <div class="uk-align-center">
                  {#if !payment.loading_pay && !payment.complete}
                     <div>
                        {#if payment.data.amount < account_data.balance}
                        <button class="uk-button uk-button-default ws-blue-btn" on:click={do_payment}>
                           PAY
                        </button>
                        {:else}
                        <h3 class="uk-text-danger ws-title">insufficient balance, please topup</h3>
                        <button class="uk-button uk-button-default ws-blue-btn" on:click={do_topup_from_payment}>
                           TOPUP
                        </button>
                        {/if}
                     </div>
                  {/if}
                  {#if payment.loading_pay}
                     <Loading></Loading>
                  {/if}
                  {#if payment.complete && payment.is_redirect}
                     <span class="uk-text-center">Redirect in {payment.timer}...</span>
                  {/if}
               </div>
            </div>
         </div>
         {/if}
      </Modal>
      <!-- end -->

      <!-- modal publish bill -->
      <Modal bind:show={modal.publish_payment}>
         <h4 class="uk-text-center">
            <b>PUBLISH BILL</b>   
         </h4>

         <div class="uk-text-center">
            <span class="ws-title"><b>Your balance:</b></span>
            <h2><b>Rp. {account_data.str_balance}.00</b></h2>
         </div>

         {#if !loading.create_bill && !create_bill_status.success && !create_bill_status.fail}
         <div class="uk-text-center">
            <h5>FILL AMOUNT</h5>
            <input class="uk-input uk-text-center" placeholder="enter amount" type="number" bind:value={create_bill_amount}>

            {#if !loading.create_bill}
            <button class="uk-button uk-button-default ws-blue-btn" style="margin-top: 12px" on:click={do_create_bill}>CREATE</button>
            {:else}
            <Loading></Loading>
            {/if}
         </div>
         {/if}

         {#if create_bill_status.success}
         <div class="uk-text-center">
            <div class="uk-text-center" style="margin-top: 24px;">
               <h5><span class="uk-text-success">Bill Created</span>, payment code:</h5>
               <input class="uk-input uk-text-center" placeholder="wallet token" bind:value={create_bill_status.payment_code} disabled>
            </div>
         </div>
         {/if}

         {#if create_bill_status.failed}
         <div class="uk-card uk-card-default">
            <div class="uk-card-body">
               <h3 class="uk-text-danger uk-text-center">Failed to create bill</h3>
            </div>
         </div>
         {/if}
      </Modal>
      <!-- end -->

      <!-- modal profile -->
      <Modal bind:show={modal.profile}>
         <h4 class="uk-text-center">
            <b>PROFILE</b>   
         </h4>

         <div class="uk-text-center">
            <span class="ws-title"><b>Your balance:</b></span>
            <h2><b>Rp. {account_data.str_balance}.00</b></h2>
         </div>

         <div class="uk-text-center">
            <h5>YOUR TOKEN</h5>
            <input class="uk-input uk-text-center" placeholder="wallet token" bind:value={account_data.wallet_token} disabled>
         </div>
      </Modal>
      <!-- end -->

      <!-- arta platform service -->
      <div class="uk-card uk-card-default" style="margin-top: 24px;">
         <div class="uk-card-body">
            <div uk-grid>
               <div class="uk-width-1-3@m uk-width-1-1@s">

               </div>
               <div class="uk-width-2-3@m uk-width-1-1@s">
                  <h3 class="ws-title">ARTA PLATFORM</h3>
                  <div class="uk-width-1-1" uk-grid>
                     <div class="uk-width-1-2@m uk-width-1-1@s">
                        <div class="uk-card uk-card-default">
                           <div class="uk-card-body">
                              <h3 class="ws-title-small">Arta Logistik</h3>
                              <div class="uk-button uk-button-link" style="padding: 0px;" on:click={() => modal.cek_ongkir = true}>
                                 <img src="/assets/public/img/delivery-truck.png" width="32" alt="pjt logo">
                                 <span class="ws-title">CEK ONGKIR</span>
                              </div>
                              <div class="uk-button uk-button-link" style="padding: 0px;">
                                 <img src="/assets/public/img/delivery-truck.png" width="32" alt="pjt logo">
                                 <span class="ws-title">CEK RESI</span>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div class="uk-width-1-2@m uk-width-1-1@s">
                        <div class="uk-card uk-card-default">
                           <div class="uk-card-body">
                              <h3 class="ws-title-small">Arta Ads</h3>
                              <div class="uk-button uk-button-link" style="padding: 0px;">
                                 <img src="/assets/public/img/delivery-truck.png" width="32" alt="pjt logo">
                                 <span class="ws-title">IKLAN.IN</span>
                              </div>
                              <div class="uk-button uk-button-link" style="padding: 0px;">
                                 <img src="/assets/public/img/delivery-truck.png" width="32" alt="pjt logo">
                                 <span class="ws-title">IAI SEMANGAT</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
      <!-- end -->

      <!-- modal cek ongkir -->
      {#if modal.cek_ongkir}
      <CekOngkir bind:show={modal.cek_ongkir}></CekOngkir>
      {/if}
      <!-- end -->

      <!-- iklanin ads -->
      <div style="margin-bottom: 24px; margin-top: 24px;" uk-grid>
         {#if iklan.iklan_1.length > 0}
         <div class="uk-width-1-1@s uk-width-1-2@m">
            <img src={iklan.iklan_1} alt="iklan">
         </div>
         {/if}
         {#if iklan.iklan_2.length > 0}
         <div class="uk-width-1-1@s uk-width-1-2@m">
            <img src={iklan.iklan_2} alt="iklan">
         </div>
         {/if}
         <div class="uk-width-1-1 uk-flex uk-flex-right">
            <span class="ws-title">Ads by</span>
            <span style="font-size: 12px">Iklanin</span>
         </div>
      </div>
      <!-- end -->
   </div>
</div>

<script>
   import Modal from './../components/modal.svelte';
   import { onMount } from 'svelte';
   import Loading from './../components/loading.svelte';
   import CekOngkir from './../components/CekOngkir.svelte';
   
   var query_param = new URLSearchParams(window.location.search);
   var session = query_param.get('session');
   var session_id = query_param.get('sessionId');

   let modal = {
      topup: false,
      do_payment: false,
      publish_payment: false,
      profile: false,
      cek_ongkir: false
   }

   const account_data = {
      name: '',
      email: '',
      balance: 0,
      wallet_token: '',
      str_balance: '0'
   }

   const topup_status = {
      success: false,
      failed: false,
      reload: false
   }

   const loading = {
      topup: false,
      create_bill: false
   }

   let create_bill_amount = 0;

   const create_bill_status = {
      success: false,
      fail: false,
      payment_code: ''
   }

   const payment = {
      code: '',
      loading: false,
      success: false,
      display_error: false,
      display_success: false,
      display_data: false,
      error_message: '',
      data: {
         publisher: '',
         amount: '',
         code: ''
      },
      loading_pay: false,
      complete: false,
      is_redirect: false,
      redirect_url: '',
      timer: 5
   }

   const iklan = {
      iklan_1: '',
      iklan_2: '',
      iklan_topup: '',
      iklan_payment: '',
      iklan_create_bill: '' 
   }

   $: {
      if(account_data.balance != 0){
         account_data.str_balance = Number.parseInt(account_data.balance).toLocaleString();
      }
   }

   $: {
      if(modal.topup){
         reset_topup_status();
      }

      if(modal.publish_payment){
         reset_create_bill_status();
      }

      if(modal.do_payment){
         reset_payment_status();
      }
   }

   function reset_topup_status(){
      topup_status.success = false;
      topup_status.failed = false;
   }

   function reset_create_bill_status(){
      create_bill_status.success = false;
      create_bill_status.fail = false;
   }

   function reset_payment_status(){
      payment.display_data = false;
      payment.display_error = false;
      payment.code = '';
      payment.display_success = false;
   }

   onMount(() => {
      fetch('/account/data-profile?session_token=' + session).then(response => {
         return response.json();
      }).then(result => {
         account_data.name = result.data.name;
         account_data.email = result.data.email;
      }).catch(error => {
         console.log(error);
      });

      get_wallet_data();
      get_action();

      //get iklan
      get_ads().then(result => {
         iklan.iklan_1 = result.data.url
      }).catch(error => {
         console.log(error);
      });

      get_ads().then(result => {
         iklan.iklan_2 = result.data.url
      }).catch(error => {
         console.log(error);
      });
   });

   function do_topup(amount){
      loading.topup = true;

      const topup_request = {
         session_token: session,
         jumlah: amount
      }

      fetch('/payment/topup', { 
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(topup_request)
      }).then(response => {
         loading.topup = false;

         if(response.ok === true){
            topup_status.success = true;

            if(topup_status.reload){
               window.location.reload();
            }

            get_wallet_data();
         }else{
            topup_status.failed = true;
         }
      }).catch(error => {
         loading.topup = false;
         topup_status.failed = true;
      });
   }

   function get_wallet_data(){
      fetch('/account/wallet?session_token=' + session).then(response => {
         return response.json();
      }).then(result => {
         account_data.balance = result.data.saldo;
         account_data.wallet_token = result.data.token;
      }).catch(error => {
         console.log(error);
      });
   }

   function do_create_bill(){
      if(create_bill_amount === 0){
         return;
      }

      const create_bill_request = {
         token: account_data.wallet_token,
         jumlah: create_bill_amount
      }

      loading.create_bill = true;
      fetch('/payment/create-bill', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(create_bill_request)
      }).then(result => {
         if(result.ok === true){
            create_bill_status.success = true;
         }else{
            create_bill_status.fail = true;
         }

         loading.create_bill = false;
         return result.json();
      }).then(result => {
         if(result.success){
            create_bill_amount = 0;
            create_bill_status.payment_code = result.data.kode;
         }
      }).catch(error => {
         create_bill_status.fail = true;
         loading.create_bill = false;
      });
   }

   function do_check_payment(){
      payment.display_error = false;

      fetch('/payment/get-status/' + payment.code).then(result => {
         return result.json();
      }).then(result => {
         if(result.success === true){
            payment.data.amount = result.data.jumlah;
            payment.data.publisher = result.data.penerbit;
            payment.data.code = result.data.kode;

            payment.display_data = true;
         }else{
            payment.error_message = result.message;
            payment.display_error = true;
         }
      })
   }

   function do_payment(){
      payment.display_error = false;

      const do_payment_request = {
         payment_code: payment.data.code,
         session_token: session
      };

      fetch('/payment/pay', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(do_payment_request)
      }).then(result => {
         return result.json();
      }).then(result => {
         if(result.success){
            payment.display_success = true;
            payment.complete = true;

            get_wallet_data();

            if(payment.is_redirect){
               do_redirect();
            }
         }else{
            payment.error_message = result.message;
            payment.display_error = true;
         }
      })
   }

   function get_action(){
      if(session_id === null){
         return;
      }

      fetch('/app/action/' + session_id).then(result => {
         return result.json();
      }).then(result => {
         if(result.success){
            if(result.data.action === 'pay'){
               do_action_pay(result.data.payment_code, result.data.redirect_url);
            }
         }
      }).catch(error => {
         console.log(error);
      });
   }

   function do_action_pay(payment_code, redirect_url){
      payment.code = payment_code;
      
      if(redirect_url){
         payment.is_redirect = true;
         payment.redirect_url = redirect_url;
      }

      do_check_payment();
      modal.do_payment = true;
   }

   function do_redirect(){
      var time = 5;
      payment.timer = time;
      var timer = setInterval(interval, 1000);

      function interval(){
         time -= 1;
         payment.timer = time;

         if(time === 0){
            stop_timer();
            window.location.href = payment.redirect_url;
         }
      }

      function stop_timer(){
         clearInterval(timer);
      }
   }

   function do_topup_from_payment(){
      modal.do_payment = false;
      modal.topup = true;

      topup_status.reload = true;
   }

   function get_ads(){
      return fetch('/service/ads/img-ads').then(result => {
         return result.json();
      })
   }
</script>