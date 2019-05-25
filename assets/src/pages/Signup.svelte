<div class="uk-width-1-1 uk-height-viewport uk-flex uk-flex-center uk-flex-middle">
	<div class="uk-width-2-5@m uk-width-1-1@s" style="padding: 12px">
		<!-- fail alert -->
		{#if alert.success}
		<div class="uk-alert-success" uk-alert>
			<p>Registeration success, click <a href="/app/login">here</a> to login!</p>
		</div>
		{/if}

		{#if alert.fail}
		<div class="uk-alert-danger" uk-alert>
			<p>Registeration failed, { error_message }!</p>
		</div>
		{/if}

		<!-- end -->
		<!-- content -->
		<div class="uk-card uk-card-default" style="background-color: #F0F2F2">
			<div class="uk-card-body">
				<div class="uk-flex uk-flex-center">
					<img src="/assets/public/img/logo_arta.png" alt="logo">
				</div>

				<h5 class="uk-text-center"><b>CREATE NEW ACCOUNT</b></h5>
				<div class="uk-flex uk-flex-center">
					<div class="uk-width-2-3@m uk-width-1-1@s">
						<input class="uk-input" placeholder="Your Name or Company Name" type="text" style="margin-bottom: 12px;" bind:value={form_input.name}>
						<input class="uk-input" placeholder="Your Email" type="email" style="margin-bottom: 12px;" bind:value={form_input.email}>
						<input class="uk-input" type="password" placeholder="Password" bind:value={form_input.password}>
						
						{#if !loading_signup}
						<button class="uk-align-center uk-button uk-button-default ws-blue-btn" on:click={do_signup}>
							SIGN UP
						</button>
						{:else}
						<Loading></Loading>
						{/if}
					</div>
				</div>

				<div class="uk-text-center">
					<span>Already have an account? Sign in <a href="/app/login">here!</a></span>
				</div>
			</div>
		</div>
	</div>
</div>

<script>
	import Loading from './../components/loading.svelte';

	const alert = {
		success: false,
		fail: false
	}

	var error_message = '';

	const form_input = {
		name: '',
		email: '',
		password: ''
	}
	
	var loading_signup = false;
	

	function do_signup(){
		loading_signup = true;
		
		alert.success = false;
		alert.fail = false;

		fetch('/account/register', { 
			method: 'POST', 
			headers: {
				'Content-Type': 'application/json' 
			},
			body: JSON.stringify(form_input) 
		}).then(response => {
			loading_signup = false;

			if(!response.ok){
				alert.fail = true;
				error_message = response.statusText;
			}else{
				alert.success = true;
			}

			return response.json();
		}).then(result => {
			if(!result.success && result.error != 'validation_error'){
				error_message = result.message;
			}
			
		}).catch(error => {
			alert.fail = true;
			error_message = error.message;

			loading_signup = false;
		});
	}
</script>