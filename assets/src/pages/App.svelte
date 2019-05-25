<div class="uk-width-1-1 uk-height-viewport uk-flex uk-flex-center uk-flex-middle">
	<div class="uk-width-2-5@m uk-width-1-1@s" style="padding: 12px">
		<!-- alert -->
		{#if alert.fail}
		<div class="uk-alert-danger" uk-alert>
			<p>Login failed, { error_message }!</p>
		</div>
		{/if}
		<!-- end -->
		
		<!-- content -->
		<div class="uk-card uk-card-default" style="background-color: #F0F2F2">
			<div class="uk-card-body">
				<div class="uk-flex uk-flex-center">
					<img src="/assets/public/img/logo_arta.png" alt="logo">
				</div>

				<h5 class="uk-text-center"><b>LOGIN TO YOUR ACCOUNT</b></h5>
				<div class="uk-flex uk-flex-center">
					<div class="uk-width-2-3@m uk-width-1-1@s">
						<input class="uk-input" placeholder="Your Email" type="email" style="margin-bottom: 12px;" bind:value={input_form.email}>
						<input class="uk-input" type="password" placeholder="Password" bind:value={input_form.password}>
						
						{#if !loading_login}
						<button class="uk-align-center uk-button uk-button-default ws-blue-btn" on:click={do_login}>
							SIGN IN
						</button>
						{:else}
						<Loading></Loading>
						{/if}
					</div>
				</div>

				<div class="uk-text-center">
					<span>Have no account yet? Create new account <a href="/app/signup" target="__blank">here!</a></span>
				</div>
			</div>
		</div>
		<!-- end -->
	</div>
</div>

<script>
	import Loading from './../components/loading.svelte';

	let session_id = '';

	const queryParameter = new URLSearchParams(window.location.search);
	session_id = queryParameter.get('sessionId');

	const alert = {
		fail: false
	}

	var error_message = '';

	const input_form = {
		email: '',
		password: ''
	}

	var loading_login = false;

	function do_login(){
		alert.fail = false;
		loading_login = true;

		fetch('/account/login', { 
			method: 'POST',
			headers: {
				'Content-Type': 'application/json' 
			},
			body: JSON.stringify(input_form)
		}).then(response => {
			loading_login = false;
			if(!response.ok){
				alert.fail = true;
				error_message = response.statusText;
			}

			return response.json();
		}).then(result => {
			if(result.success){
				const queryParam = new URLSearchParams();
				queryParam.set('session', result.data.token)
				
				if(session_id != null){
					queryParam.set('sessionId', session_id);
				}

				window.location = '/app/home?' + queryParam;
			}else{
				if(result.error != 'validation_error'){
					error_message = result.message;
				}
			}
		}).catch(error => {
			loading_login = false;
			alert.fail = true;
			error_message = error.message;
		});
	}
</script>