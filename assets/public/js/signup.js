
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

	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
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

	/* src/pages/Signup.svelte generated by Svelte v3.4.2 */

	const file = "src/pages/Signup.svelte";

	function create_fragment(ctx) {
		var div7, div6, div5, div4, div0, img, t0, h5, b, t2, div2, div1, input0, t3, input1, t4, input2, t5, button, t7, div3, span, t8, a;

		return {
			c: function create() {
				div7 = element("div");
				div6 = element("div");
				div5 = element("div");
				div4 = element("div");
				div0 = element("div");
				img = element("img");
				t0 = space();
				h5 = element("h5");
				b = element("b");
				b.textContent = "CREATE NEW ACCOUNT";
				t2 = space();
				div2 = element("div");
				div1 = element("div");
				input0 = element("input");
				t3 = space();
				input1 = element("input");
				t4 = space();
				input2 = element("input");
				t5 = space();
				button = element("button");
				button.textContent = "SIGN UP";
				t7 = space();
				div3 = element("div");
				span = element("span");
				t8 = text("Already have an account? Sign in ");
				a = element("a");
				a.textContent = "here!";
				img.src = "/assets/public/img/logo_arta.png";
				img.alt = "logo";
				add_location(img, file, 5, 5, 306);
				div0.className = "uk-flex uk-flex-center";
				add_location(div0, file, 4, 4, 263);
				add_location(b, file, 8, 31, 408);
				h5.className = "uk-text-center";
				add_location(h5, file, 8, 4, 381);
				input0.className = "uk-input";
				input0.placeholder = "Your Name or Company Name";
				attr(input0, "type", "text");
				set_style(input0, "margin-bottom", "12px");
				add_location(input0, file, 11, 6, 538);
				input1.className = "uk-input";
				input1.placeholder = "Your Email";
				attr(input1, "type", "email");
				set_style(input1, "margin-bottom", "12px");
				add_location(input1, file, 12, 6, 651);
				input2.className = "uk-input";
				attr(input2, "type", "password");
				input2.placeholder = "Password";
				add_location(input2, file, 13, 6, 750);
				button.className = "uk-align-center uk-button uk-button-default ws-blue-btn";
				add_location(button, file, 14, 6, 821);
				div1.className = "uk-width-2-3@m uk-width-1-1@s";
				add_location(div1, file, 10, 5, 487);
				div2.className = "uk-flex uk-flex-center";
				add_location(div2, file, 9, 4, 444);
				a.href = "/app/login";
				add_location(a, file, 21, 44, 1033);
				add_location(span, file, 21, 5, 994);
				div3.className = "uk-text-center";
				add_location(div3, file, 20, 4, 959);
				div4.className = "uk-card-body";
				add_location(div4, file, 3, 3, 231);
				div5.className = "uk-card uk-card-default";
				set_style(div5, "background-color", "#F0F2F2");
				add_location(div5, file, 2, 2, 155);
				div6.className = "uk-width-2-5@m uk-width-1-1@s";
				set_style(div6, "padding", "12px");
				add_location(div6, file, 1, 1, 86);
				div7.className = "uk-width-1-1 uk-height-viewport uk-flex uk-flex-center uk-flex-middle";
				add_location(div7, file, 0, 0, 0);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div7, anchor);
				append(div7, div6);
				append(div6, div5);
				append(div5, div4);
				append(div4, div0);
				append(div0, img);
				append(div4, t0);
				append(div4, h5);
				append(h5, b);
				append(div4, t2);
				append(div4, div2);
				append(div2, div1);
				append(div1, input0);
				append(div1, t3);
				append(div1, input1);
				append(div1, t4);
				append(div1, input2);
				append(div1, t5);
				append(div1, button);
				append(div4, t7);
				append(div4, div3);
				append(div3, span);
				append(span, t8);
				append(span, a);
			},

			p: noop,
			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div7);
				}
			}
		};
	}

	class Signup extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, null, create_fragment, safe_not_equal, []);
		}
	}

	const app = new Signup({
	   target: document.body,
	   props:{
	      name: 'signup'
	   }
	});

	return app;

}());
//# sourceMappingURL=signup.js.map
