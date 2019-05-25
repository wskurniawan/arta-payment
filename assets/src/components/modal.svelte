{#if show}
<div class="ws-modal-container">
   <div class="uk-height-viewport uk-flex uk-flex-middle uk-flex-center">
      <div class="uk-align-center uk-width-2-5@m uk-width-1-1@s">
         <div class="uk-card uk-card-default">
            <div class="uk-card-header">
               <button class=" uk-button uk-button-link uk-text-danger uk-align-right" on:click={() => show = false}>close</button>
            </div>
            <div class="uk-card-body">
               <slot></slot>
            </div>
         </div>
      </div>
   </div>
</div>
{/if}

<script>
   import { createEventDispatcher } from 'svelte';
   export var show;
</script>