<div class="uk-width-1-1 uk-height-viewport uk-flex uk-flex-center uk-flex-middle">
   <div class="uk-width-2-3@m uk-width-1-1@s" style="padding: 12px">
      <!-- main feature -->
      <img class="uk-align-center" src="/assets/public/img/logo_arta.png" alt="logo" width="204">

      <div class="uk-card uk-card-default">
         <div class="uk-card-body">
            <div class="uk-flex">
               <!-- profile -->
               <div class="uk-width-1-2@m uk-width-1-1@s">
                  <img class="uk-align-center" src="/assets/public/img/account-icon.png" width="86" alt="account">
                  <h3 class="ws-title uk-text-center">WELCOME TO ARTA, WISNU KURNIAWAN !</h3>

                  <div class="uk-text-center">
                     <span class="ws-title"><b>Your balance:</b></span>
                     <h2><b>Rp. 10,000.00</b></h2>
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
                        <button class="uk-width-1-1 ws-blue-btn uk-button uk-button-default" style="margin-bottom: 12px;" on:click={showTopupModal}>
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

      <!-- integration feature -->
      <!-- end -->

      <!-- modal topup -->
      <Modal bind:show={modal.topup}>
         <h4 class="uk-text-center">
            <b>TOP UP</b>   
         </h4>

         <div class="uk-text-center">
            <span class="ws-title"><b>Your balance:</b></span>
            <h2><b>Rp. 10,000.00</b></h2>
         </div>

         <div uk-grid>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1">
                  Rp. 50,0000.00
               </uk-button>
            </div>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1">
                  Rp. 300,0000.00
               </uk-button>
            </div>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1">
                  Rp. 100,0000.00
               </uk-button>
            </div>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1">
                  Rp. 500,0000.00
               </uk-button>
            </div>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1">
                  Rp. 200,0000.00
               </uk-button>
            </div>
            <div class="uk-width-1-2@m uk-width-1-1@s" style="padding: 4px;">
               <uk-button class="uk-button uk-button-default ws-blue-btn uk-width-1-1">
                  Rp. 1,000,0000.00
               </uk-button>
            </div>
         </div>
      </Modal>
      <!-- end -->

      <!-- modal do payment -->
      <Modal bind:show={modal.do_payment}>
         <h4 class="uk-text-center">
            <b>DO PAYMENT</b>   
         </h4>

         <div class="uk-text-center">
            <span class="ws-title"><b>Your balance:</b></span>
            <h2><b>Rp. 10,000.00</b></h2>
         </div>

         <div class="uk-text-center">
            <h5>FILL PAYMENT DETAILS</h5>
            <input class="uk-input" placeholder="enter payment code">

            <button class="uk-button uk-button-default ws-blue-btn" style="margin-top: 12px">CHECK</button>
         </div>
      </Modal>
      <!-- end -->

      <!-- modal do payment -->
      <Modal bind:show={modal.do_payment}>
         <h4 class="uk-text-center">
            <b>DO PAYMENT</b>   
         </h4>

         <div class="uk-text-center">
            <span class="ws-title"><b>Your balance:</b></span>
            <h2><b>Rp. 10,000.00</b></h2>
         </div>

         <div class="uk-text-center">
            <h5>FILL PAYMENT DETAILS</h5>
            <input class="uk-input" placeholder="enter payment code">

            <button class="uk-button uk-button-default ws-blue-btn" style="margin-top: 12px">CHECK</button>
         </div>
      </Modal>
      <!-- end -->

      <!-- modal publish bill -->
      <Modal bind:show={modal.publish_payment}>
         <h4 class="uk-text-center">
            <b>PUBLISH BILL</b>   
         </h4>

         <div class="uk-text-center">
            <span class="ws-title"><b>Your balance:</b></span>
            <h2><b>Rp. 10,000.00</b></h2>
         </div>

         <div class="uk-text-center">
            <h5>FILL AMOUNT</h5>
            <input class="uk-input" placeholder="enter amount">

            <button class="uk-button uk-button-default ws-blue-btn" style="margin-top: 12px">CREATE</button>
         </div>
      </Modal>
      <!-- end -->

      <!-- modal profile -->
      <Modal bind:show={modal.profile}>
         <h4 class="uk-text-center">
            <b>PROFILE</b>   
         </h4>

         <div class="uk-text-center">
            <span class="ws-title"><b>Your balance:</b></span>
            <h2><b>Rp. 10,000.00</b></h2>
         </div>

         <div class="uk-text-center">
            <h5>YOUR TOKEN</h5>
            <input class="uk-input uk-text-center" placeholder="wallet token" value="kajsdnkjasdnkjs" disabled>
         </div>
      </Modal>
      <!-- end -->

   </div>
</div>

<script>
   import Modal from './../components/modal.svelte';

   let modal = {
      topup: false,
      do_payment: false,
      publish_payment: false,
      profile: false
   }

   function showTopupModal(){
      modal.topup = true;
   }
</script>