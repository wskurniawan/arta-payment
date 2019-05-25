import Home from './pages/Home.svelte';

const app = new Home({
	target: document.body,
	props: {
		name: 'Home'
	}
});

export default app;