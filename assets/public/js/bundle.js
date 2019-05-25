
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
	'use strict';

	function noop() {}

	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	function run_all(fns) {
		fns.forEach(run);
	}

	function is_function(thing) {
		return typeof thing === 'function';
	}

	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	function detach(node) {
		node.parentNode.removeChild(node);
	}

	function element(name) {
		return document.createElement(name);
	}

	function text(data) {
		return document.createTextNode(data);
	}

	function space() {
		return text(' ');
	}

	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
	}

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	function set_style(node, key, value) {
		node.style.setProperty(key, value);
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	const dirty_components = [];

	const resolved_promise = Promise.resolve();
	let update_scheduled = false;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_scheduled = false;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	let outros;

	function group_outros() {
		outros = {
			remaining: 0,
			callbacks: []
		};
	}

	function check_outros() {
		if (!outros.remaining) {
			run_all(outros.callbacks);
		}
	}

	function on_outro(callback) {
		outros.callbacks.push(callback);
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detaching);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = blank_object();
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	class SvelteComponentDev extends SvelteComponent {
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error(`'target' is a required option`);
			}

			super();
		}

		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn(`Component was already destroyed`); // eslint-disable-line no-console
			};
		}
	}

	/* src/components/loading.svelte generated by Svelte v3.4.2 */

	const file = "src/components/loading.svelte";

	function create_fragment(ctx) {
		var div1, div0;

		return {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				attr(div0, "uk-spinner", "");
				add_location(div0, file, 1, 3, 79);
				div1.className = "uk-flex uk-flex-center uk-flex-middle";
				set_style(div1, "padding", "24px");
				add_location(div1, file, 0, 0, 0);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
			},

			p: noop,
			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}
			}
		};
	}

	class Loading extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, null, create_fragment, safe_not_equal, []);
		}
	}

	/* src/pages/App.svelte generated by Svelte v3.4.2 */

	const file$1 = "src/pages/App.svelte";

	// (4:2) {#if alert.fail}
	function create_if_block_1(ctx) {
		var div, p, t0, t1, t2;

		return {
			c: function create() {
				div = element("div");
				p = element("p");
				t0 = text("Login failed, ");
				t1 = text(ctx.error_message);
				t2 = text("!");
				add_location(p, file$1, 5, 3, 231);
				div.className = "uk-alert-danger";
				attr(div, "uk-alert", "");
				add_location(div, file$1, 4, 2, 189);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, p);
				append(p, t0);
				append(p, t1);
				append(p, t2);
			},

			p: function update(changed, ctx) {
				if (changed.error_message) {
					set_data(t1, ctx.error_message);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (28:6) {:else}
	function create_else_block(ctx) {
		var current;

		var loading = new Loading({ $$inline: true });

		return {
			c: function create() {
				loading.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(loading, target, anchor);
				current = true;
			},

			p: noop,

			i: function intro(local) {
				if (current) return;
				loading.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				loading.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				loading.$destroy(detaching);
			}
		};
	}

	// (24:6) {#if !loading_login}
	function create_if_block(ctx) {
		var button, dispose;

		return {
			c: function create() {
				button = element("button");
				button.textContent = "SIGN IN";
				button.className = "uk-align-center uk-button uk-button-default ws-blue-btn";
				add_location(button, file$1, 24, 6, 969);
				dispose = listen(button, "click", ctx.do_login);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
			},

			p: noop,
			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	function create_fragment$1(ctx) {
		var div7, div6, t0, div5, div4, div0, img, t1, h5, b, t3, div2, div1, input0, t4, input1, t5, current_block_type_index, if_block1, t6, div3, span, t7, a, current, dispose;

		var if_block0 = (ctx.alert.fail) && create_if_block_1(ctx);

		var if_block_creators = [
			create_if_block,
			create_else_block
		];

		var if_blocks = [];

		function select_block_type(ctx) {
			if (!ctx.loading_login) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		return {
			c: function create() {
				div7 = element("div");
				div6 = element("div");
				if (if_block0) if_block0.c();
				t0 = space();
				div5 = element("div");
				div4 = element("div");
				div0 = element("div");
				img = element("img");
				t1 = space();
				h5 = element("h5");
				b = element("b");
				b.textContent = "LOGIN TO YOUR ACCOUNT";
				t3 = space();
				div2 = element("div");
				div1 = element("div");
				input0 = element("input");
				t4 = space();
				input1 = element("input");
				t5 = space();
				if_block1.c();
				t6 = space();
				div3 = element("div");
				span = element("span");
				t7 = text("Have no account yet? Create new account ");
				a = element("a");
				a.textContent = "here!";
				img.src = "/assets/public/img/logo_arta.png";
				img.alt = "logo";
				add_location(img, file$1, 14, 5, 475);
				div0.className = "uk-flex uk-flex-center";
				add_location(div0, file$1, 13, 4, 433);
				add_location(b, file$1, 17, 31, 574);
				h5.className = "uk-text-center";
				add_location(h5, file$1, 17, 4, 547);
				input0.className = "uk-input";
				input0.placeholder = "Your Email";
				attr(input0, "type", "email");
				set_style(input0, "margin-bottom", "12px");
				add_location(input0, file$1, 20, 6, 704);
				input1.className = "uk-input";
				attr(input1, "type", "password");
				input1.placeholder = "Password";
				add_location(input1, file$1, 21, 6, 832);
				div1.className = "uk-width-2-3@m uk-width-1-1@s";
				add_location(div1, file$1, 19, 5, 654);
				div2.className = "uk-flex uk-flex-center";
				add_location(div2, file$1, 18, 4, 612);
				a.href = "/app/signup";
				a.target = "__blank";
				add_location(a, file$1, 34, 51, 1253);
				add_location(span, file$1, 34, 5, 1207);
				div3.className = "uk-text-center";
				add_location(div3, file$1, 33, 4, 1173);
				div4.className = "uk-card-body";
				add_location(div4, file$1, 12, 3, 402);
				div5.className = "uk-card uk-card-default";
				set_style(div5, "background-color", "#F0F2F2");
				add_location(div5, file$1, 11, 2, 327);
				div6.className = "uk-width-2-5@m uk-width-1-1@s";
				set_style(div6, "padding", "12px");
				add_location(div6, file$1, 1, 1, 85);
				div7.className = "uk-width-1-1 uk-height-viewport uk-flex uk-flex-center uk-flex-middle";
				add_location(div7, file$1, 0, 0, 0);

				dispose = [
					listen(input0, "input", ctx.input0_input_handler),
					listen(input1, "input", ctx.input1_input_handler)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div7, anchor);
				append(div7, div6);
				if (if_block0) if_block0.m(div6, null);
				append(div6, t0);
				append(div6, div5);
				append(div5, div4);
				append(div4, div0);
				append(div0, img);
				append(div4, t1);
				append(div4, h5);
				append(h5, b);
				append(div4, t3);
				append(div4, div2);
				append(div2, div1);
				append(div1, input0);

				input0.value = ctx.input_form.email;

				append(div1, t4);
				append(div1, input1);

				input1.value = ctx.input_form.password;

				append(div1, t5);
				if_blocks[current_block_type_index].m(div1, null);
				append(div4, t6);
				append(div4, div3);
				append(div3, span);
				append(span, t7);
				append(span, a);
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.alert.fail) {
					if (if_block0) {
						if_block0.p(changed, ctx);
					} else {
						if_block0 = create_if_block_1(ctx);
						if_block0.c();
						if_block0.m(div6, t0);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (changed.input_form) input0.value = ctx.input_form.email;
				if (changed.input_form) input1.value = ctx.input_form.password;

				var previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);
				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(changed, ctx);
				} else {
					group_outros();
					on_outro(() => {
						if_blocks[previous_block_index].d(1);
						if_blocks[previous_block_index] = null;
					});
					if_block1.o(1);
					check_outros();

					if_block1 = if_blocks[current_block_type_index];
					if (!if_block1) {
						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block1.c();
					}
					if_block1.i(1);
					if_block1.m(div1, null);
				}
			},

			i: function intro(local) {
				if (current) return;
				if (if_block1) if_block1.i();
				current = true;
			},

			o: function outro(local) {
				if (if_block1) if_block1.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div7);
				}

				if (if_block0) if_block0.d();
				if_blocks[current_block_type_index].d();
				run_all(dispose);
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let session_id = '';

		const queryParameter = new URLSearchParams(window.location.search);
		$$invalidate('session_id', session_id = queryParameter.get('sessionId'));

		const alert = {
			fail: false
		};

		var error_message = '';

		const input_form = {
			email: '',
			password: ''
		};

		var loading_login = false;

		function do_login(){
			alert.fail = false; $$invalidate('alert', alert);
			$$invalidate('loading_login', loading_login = true);

			fetch('/account/login', { 
				method: 'POST',
				headers: {
					'Content-Type': 'application/json' 
				},
				body: JSON.stringify(input_form)
			}).then(response => {
				$$invalidate('loading_login', loading_login = false);
				if(!response.ok){
					alert.fail = true; $$invalidate('alert', alert);
					$$invalidate('error_message', error_message = response.statusText);
				}

				return response.json();
			}).then(result => {
				if(result.success){
					const queryParam = new URLSearchParams();
					queryParam.set('session', result.data.token);
					
					if(session_id){
						queryParam.set('sessionId', session_id);
					}

					window.location = '/app/home?' + queryParam;
				}else{
					if(result.error != 'validation_error'){
						$$invalidate('error_message', error_message = result.message);
					}
				}
			}).catch(error => {
				$$invalidate('loading_login', loading_login = false);
				alert.fail = true; $$invalidate('alert', alert);
				$$invalidate('error_message', error_message = error.message);
			});
		}

		function input0_input_handler() {
			input_form.email = this.value;
			$$invalidate('input_form', input_form);
		}

		function input1_input_handler() {
			input_form.password = this.value;
			$$invalidate('input_form', input_form);
		}

		return {
			alert,
			error_message,
			input_form,
			loading_login,
			do_login,
			input0_input_handler,
			input1_input_handler
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment$1, safe_not_equal, []);
		}
	}

	const app = new App({
		target: document.body,
		props: {
			name: 'world'
		}
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
