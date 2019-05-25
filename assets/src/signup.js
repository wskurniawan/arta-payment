import Signup from './pages/Signup.svelte';

const app = new Signup({
   target: document.body,
   props:{
      name: 'signup'
   }
});

export default app;