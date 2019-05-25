
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var home = (function () {
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

	function children(element) {
		return Array.from(element.childNodes);
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

	/* src/pages/Home.svelte generated by Svelte v3.4.2 */

	const file = "src/pages/Home.svelte";

	function create_fragment(ctx) {
		var div9, div8, img0, t0, div7, div6, div5, div1, img1, t1, h30, t3, div0, span, b0, t5, h2, b1, t7, button0, t9, div4, div3, h31, t11, div2, button1, t13, button2, t15, button3;

		return {
			c: function create() {
				div9 = element("div");
				div8 = element("div");
				img0 = element("img");
				t0 = space();
				div7 = element("div");
				div6 = element("div");
				div5 = element("div");
				div1 = element("div");
				img1 = element("img");
				t1 = space();
				h30 = element("h3");
				h30.textContent = "WELCOME TO ARTA, WISNU KURNIAWAN !";
				t3 = space();
				div0 = element("div");
				span = element("span");
				b0 = element("b");
				b0.textContent = "Your balance:";
				t5 = space();
				h2 = element("h2");
				b1 = element("b");
				b1.textContent = "Rp. 10,000.00";
				t7 = space();
				button0 = element("button");
				button0.textContent = "MY PROFILE";
				t9 = space();
				div4 = element("div");
				div3 = element("div");
				h31 = element("h3");
				h31.textContent = "WHAT WOULD YOU LIKE TO DO?";
				t11 = space();
				div2 = element("div");
				button1 = element("button");
				button1.textContent = "TOP UP E-WALLET";
				t13 = space();
				button2 = element("button");
				button2.textContent = "DO PAYMENT";
				t15 = space();
				button3 = element("button");
				button3.textContent = "PUBLISH BILL";
				img0.className = "uk-align-center";
				img0.src = "/assets/public/img/logo_arta.png";
				img0.alt = "logo";
				img0.width = "204";
				add_location(img0, file, 2, 6, 161);
				img1.className = "uk-align-center";
				img1.src = "/assets/public/img/account-icon.png";
				img1.width = "86";
				img1.alt = "account";
				add_location(img1, file, 8, 18, 451);
				h30.className = "ws-title uk-text-center";
				add_location(h30, file, 9, 18, 567);
				add_location(b0, file, 12, 44, 738);
				span.className = "ws-title";
				add_location(span, file, 12, 21, 715);
				add_location(b1, file, 13, 25, 792);
				add_location(h2, file, 13, 21, 788);
				div0.className = "uk-text-center";
				add_location(div0, file, 11, 18, 664);
				button0.className = "uk-align-center uk-button uk-button-default ws-blue-btn";
				add_location(button0, file, 16, 18, 865);
				div1.className = "uk-width-1-2@m uk-width-1-1@s";
				add_location(div1, file, 7, 15, 388);
				h31.className = "ws-title uk-text-center";
				add_location(h31, file, 22, 21, 1174);
				button1.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button1, "margin-bottom", "12px");
				add_location(button1, file, 24, 24, 1349);
				button2.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button2, "margin-bottom", "12px");
				add_location(button2, file, 25, 24, 1497);
				button3.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button3, "margin-bottom", "12px");
				add_location(button3, file, 26, 24, 1640);
				div2.className = "uk-align-center uk-width-1-1@s uk-width-3-5@m";
				add_location(div2, file, 23, 21, 1264);
				div3.className = "uk-width-1-1";
				add_location(div3, file, 21, 18, 1125);
				div4.className = "uk-width-1-2@m uk-width-1-1@s uk-flex uk-flex-middle";
				add_location(div4, file, 20, 15, 1039);
				div5.className = "uk-flex";
				add_location(div5, file, 6, 12, 350);
				div6.className = "uk-card-body";
				add_location(div6, file, 5, 9, 310);
				div7.className = "uk-card uk-card-default";
				add_location(div7, file, 4, 6, 262);
				div8.className = "uk-width-2-3@m uk-width-1-1@s";
				set_style(div8, "padding", "12px");
				add_location(div8, file, 1, 3, 88);
				div9.className = "uk-width-1-1 uk-height-viewport uk-flex uk-flex-center uk-flex-middle";
				add_location(div9, file, 0, 0, 0);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div9, anchor);
				append(div9, div8);
				append(div8, img0);
				append(div8, t0);
				append(div8, div7);
				append(div7, div6);
				append(div6, div5);
				append(div5, div1);
				append(div1, img1);
				append(div1, t1);
				append(div1, h30);
				append(div1, t3);
				append(div1, div0);
				append(div0, span);
				append(span, b0);
				append(div0, t5);
				append(div0, h2);
				append(h2, b1);
				append(div1, t7);
				append(div1, button0);
				append(div5, t9);
				append(div5, div4);
				append(div4, div3);
				append(div3, h31);
				append(div3, t11);
				append(div3, div2);
				append(div2, button1);
				append(div2, t13);
				append(div2, button2);
				append(div2, t15);
				append(div2, button3);
			},

			p: noop,
			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div9);
				}
			}
		};
	}

	class Home extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, null, create_fragment, safe_not_equal, []);
		}
	}

	const app = new Home({
		target: document.body,
		props: {
			name: 'Home'
		}
	});

	return app;

}());
//# sourceMappingURL=home.js.map
