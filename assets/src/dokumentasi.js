import Dokumentasi from './pages/Dokumentasi.svelte';

const app = new Dokumentasi({
	target: document.body,
	props: {
		name: 'Dokumentasi'
	}
});

export default app;