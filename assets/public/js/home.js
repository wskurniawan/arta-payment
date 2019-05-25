
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var home = (function () {
	'use strict';

	function noop() {}

	function assign(tar, src) {
		for (const k in src) tar[k] = src[k];
		return tar;
	}

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

	function create_slot(definition, ctx, fn) {
		if (definition) {
			const slot_ctx = get_slot_context(definition, ctx, fn);
			return definition[0](slot_ctx);
		}
	}

	function get_slot_context(definition, ctx, fn) {
		return definition[1]
			? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
			: ctx.$$scope.ctx;
	}

	function get_slot_changes(definition, ctx, changed, fn) {
		return definition[1]
			? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
			: ctx.$$scope.changed || {};
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

	function empty() {
		return text('');
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

	function add_binding_callback(fn) {
		binding_callbacks.push(fn);
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function add_flush_callback(fn) {
		flush_callbacks.push(fn);
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

	function bind(component, name, callback) {
		if (component.$$.props.indexOf(name) === -1) return;
		component.$$.bound[name] = callback;
		callback(component.$$.ctx[name]);
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

	/* src/components/modal.svelte generated by Svelte v3.4.2 */

	const file = "src/components/modal.svelte";

	// (1:0) {#if show}
	function create_if_block(ctx) {
		var div5, div4, div3, div2, div0, button, t_1, div1, current, dispose;

		const default_slot_1 = ctx.$$slots.default;
		const default_slot = create_slot(default_slot_1, ctx, null);

		return {
			c: function create() {
				div5 = element("div");
				div4 = element("div");
				div3 = element("div");
				div2 = element("div");
				div0 = element("div");
				button = element("button");
				button.textContent = "close";
				t_1 = space();
				div1 = element("div");

				if (default_slot) default_slot.c();
				button.className = " uk-button uk-button-link uk-text-danger uk-align-right";
				add_location(button, file, 6, 15, 293);
				div0.className = "uk-card-header";
				add_location(div0, file, 5, 12, 248);

				div1.className = "uk-card-body";
				add_location(div1, file, 8, 12, 443);
				div2.className = "uk-card uk-card-default";
				add_location(div2, file, 4, 9, 197);
				div3.className = "uk-align-center uk-width-2-5@m uk-width-1-1@s";
				add_location(div3, file, 3, 6, 127);
				div4.className = "uk-height-viewport uk-flex uk-flex-middle uk-flex-center";
				add_location(div4, file, 2, 3, 49);
				div5.className = "ws-modal-container";
				add_location(div5, file, 1, 0, 12);
				dispose = listen(button, "click", ctx.click_handler);
			},

			l: function claim(nodes) {
				if (default_slot) default_slot.l(div1_nodes);
			},

			m: function mount(target, anchor) {
				insert(target, div5, anchor);
				append(div5, div4);
				append(div4, div3);
				append(div3, div2);
				append(div2, div0);
				append(div0, button);
				append(div2, t_1);
				append(div2, div1);

				if (default_slot) {
					default_slot.m(div1, null);
				}

				current = true;
			},

			p: function update(changed, ctx) {
				if (default_slot && default_slot.p && changed.$$scope) {
					default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
				}
			},

			i: function intro(local) {
				if (current) return;
				if (default_slot && default_slot.i) default_slot.i(local);
				current = true;
			},

			o: function outro(local) {
				if (default_slot && default_slot.o) default_slot.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div5);
				}

				if (default_slot) default_slot.d(detaching);
				dispose();
			}
		};
	}

	function create_fragment(ctx) {
		var if_block_anchor, current;

		var if_block = (ctx.show) && create_if_block(ctx);

		return {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.show) {
					if (if_block) {
						if_block.p(changed, ctx);
						if_block.i(1);
					} else {
						if_block = create_if_block(ctx);
						if_block.c();
						if_block.i(1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();
					on_outro(() => {
						if_block.d(1);
						if_block = null;
					});

					if_block.o(1);
					check_outros();
				}
			},

			i: function intro(local) {
				if (current) return;
				if (if_block) if_block.i();
				current = true;
			},

			o: function outro(local) {
				if (if_block) if_block.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (if_block) if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		var { show } = $$props;

		let { $$slots = {}, $$scope } = $$props;

		function click_handler() {
			const $$result = show = false;
			$$invalidate('show', show);
			return $$result;
		}

		$$self.$set = $$props => {
			if ('show' in $$props) $$invalidate('show', show = $$props.show);
			if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
		};

		return { show, click_handler, $$slots, $$scope };
	}

	class Modal extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, ["show"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.show === undefined && !('show' in props)) {
				console.warn("<Modal> was created without expected prop 'show'");
			}
		}

		get show() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set show(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/pages/Home.svelte generated by Svelte v3.4.2 */

	const file$1 = "src/pages/Home.svelte";

	// (49:6) <Modal bind:show={modal.topup}>
	function create_default_slot_4(ctx) {
		var h4, b0, t1, div0, span, b1, t3, h2, b2, t5, div7, div1, uk_button0, t7, div2, uk_button1, t9, div3, uk_button2, t11, div4, uk_button3, t13, div5, uk_button4, t15, div6, uk_button5;

		return {
			c: function create() {
				h4 = element("h4");
				b0 = element("b");
				b0.textContent = "TOP UP";
				t1 = space();
				div0 = element("div");
				span = element("span");
				b1 = element("b");
				b1.textContent = "Your balance:";
				t3 = space();
				h2 = element("h2");
				b2 = element("b");
				b2.textContent = "Rp. 10,000.00";
				t5 = space();
				div7 = element("div");
				div1 = element("div");
				uk_button0 = element("uk-button");
				uk_button0.textContent = "Rp. 50,0000.00";
				t7 = space();
				div2 = element("div");
				uk_button1 = element("uk-button");
				uk_button1.textContent = "Rp. 300,0000.00";
				t9 = space();
				div3 = element("div");
				uk_button2 = element("uk-button");
				uk_button2.textContent = "Rp. 100,0000.00";
				t11 = space();
				div4 = element("div");
				uk_button3 = element("uk-button");
				uk_button3.textContent = "Rp. 500,0000.00";
				t13 = space();
				div5 = element("div");
				uk_button4 = element("uk-button");
				uk_button4.textContent = "Rp. 200,0000.00";
				t15 = space();
				div6 = element("div");
				uk_button5 = element("uk-button");
				uk_button5.textContent = "Rp. 1,000,0000.00";
				add_location(b0, file$1, 50, 12, 2500);
				h4.className = "uk-text-center";
				add_location(h4, file$1, 49, 9, 2459);
				add_location(b1, file$1, 54, 35, 2610);
				span.className = "ws-title";
				add_location(span, file$1, 54, 12, 2587);
				add_location(b2, file$1, 55, 16, 2655);
				add_location(h2, file$1, 55, 12, 2651);
				div0.className = "uk-text-center";
				add_location(div0, file$1, 53, 9, 2545);
				uk_button0.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button0, file$1, 60, 15, 2819);
				div1.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div1, "padding", "4px");
				add_location(div1, file$1, 59, 12, 2737);
				uk_button1.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button1, file$1, 65, 15, 3070);
				div2.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div2, "padding", "4px");
				add_location(div2, file$1, 64, 12, 2988);
				uk_button2.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button2, file$1, 70, 15, 3322);
				div3.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div3, "padding", "4px");
				add_location(div3, file$1, 69, 12, 3240);
				uk_button3.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button3, file$1, 75, 15, 3574);
				div4.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div4, "padding", "4px");
				add_location(div4, file$1, 74, 12, 3492);
				uk_button4.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button4, file$1, 80, 15, 3826);
				div5.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div5, "padding", "4px");
				add_location(div5, file$1, 79, 12, 3744);
				uk_button5.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button5, file$1, 85, 15, 4078);
				div6.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div6, "padding", "4px");
				add_location(div6, file$1, 84, 12, 3996);
				attr(div7, "uk-grid", "");
				add_location(div7, file$1, 58, 9, 2710);
			},

			m: function mount(target, anchor) {
				insert(target, h4, anchor);
				append(h4, b0);
				insert(target, t1, anchor);
				insert(target, div0, anchor);
				append(div0, span);
				append(span, b1);
				append(div0, t3);
				append(div0, h2);
				append(h2, b2);
				insert(target, t5, anchor);
				insert(target, div7, anchor);
				append(div7, div1);
				append(div1, uk_button0);
				append(div7, t7);
				append(div7, div2);
				append(div2, uk_button1);
				append(div7, t9);
				append(div7, div3);
				append(div3, uk_button2);
				append(div7, t11);
				append(div7, div4);
				append(div4, uk_button3);
				append(div7, t13);
				append(div7, div5);
				append(div5, uk_button4);
				append(div7, t15);
				append(div7, div6);
				append(div6, uk_button5);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h4);
					detach(t1);
					detach(div0);
					detach(t5);
					detach(div7);
				}
			}
		};
	}

	// (95:6) <Modal bind:show={modal.do_payment}>
	function create_default_slot_3(ctx) {
		var h4, b0, t1, div0, span, b1, t3, h2, b2, t5, div1, h5, t7, input, t8, button;

		return {
			c: function create() {
				h4 = element("h4");
				b0 = element("b");
				b0.textContent = "DO PAYMENT";
				t1 = space();
				div0 = element("div");
				span = element("span");
				b1 = element("b");
				b1.textContent = "Your balance:";
				t3 = space();
				h2 = element("h2");
				b2 = element("b");
				b2.textContent = "Rp. 10,000.00";
				t5 = space();
				div1 = element("div");
				h5 = element("h5");
				h5.textContent = "FILL PAYMENT DETAILS";
				t7 = space();
				input = element("input");
				t8 = space();
				button = element("button");
				button.textContent = "CHECK";
				add_location(b0, file$1, 96, 12, 4420);
				h4.className = "uk-text-center";
				add_location(h4, file$1, 95, 9, 4379);
				add_location(b1, file$1, 100, 35, 4534);
				span.className = "ws-title";
				add_location(span, file$1, 100, 12, 4511);
				add_location(b2, file$1, 101, 16, 4579);
				add_location(h2, file$1, 101, 12, 4575);
				div0.className = "uk-text-center";
				add_location(div0, file$1, 99, 9, 4469);
				add_location(h5, file$1, 105, 12, 4676);
				input.className = "uk-input";
				input.placeholder = "enter payment code";
				add_location(input, file$1, 106, 12, 4719);
				button.className = "uk-button uk-button-default ws-blue-btn";
				set_style(button, "margin-top", "12px");
				add_location(button, file$1, 108, 12, 4792);
				div1.className = "uk-text-center";
				add_location(div1, file$1, 104, 9, 4634);
			},

			m: function mount(target, anchor) {
				insert(target, h4, anchor);
				append(h4, b0);
				insert(target, t1, anchor);
				insert(target, div0, anchor);
				append(div0, span);
				append(span, b1);
				append(div0, t3);
				append(div0, h2);
				append(h2, b2);
				insert(target, t5, anchor);
				insert(target, div1, anchor);
				append(div1, h5);
				append(div1, t7);
				append(div1, input);
				append(div1, t8);
				append(div1, button);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h4);
					detach(t1);
					detach(div0);
					detach(t5);
					detach(div1);
				}
			}
		};
	}

	// (115:6) <Modal bind:show={modal.do_payment}>
	function create_default_slot_2(ctx) {
		var h4, b0, t1, div0, span, b1, t3, h2, b2, t5, div1, h5, t7, input, t8, button;

		return {
			c: function create() {
				h4 = element("h4");
				b0 = element("b");
				b0.textContent = "DO PAYMENT";
				t1 = space();
				div0 = element("div");
				span = element("span");
				b1 = element("b");
				b1.textContent = "Your balance:";
				t3 = space();
				h2 = element("h2");
				b2 = element("b");
				b2.textContent = "Rp. 10,000.00";
				t5 = space();
				div1 = element("div");
				h5 = element("h5");
				h5.textContent = "FILL PAYMENT DETAILS";
				t7 = space();
				input = element("input");
				t8 = space();
				button = element("button");
				button.textContent = "CHECK";
				add_location(b0, file$1, 116, 12, 5071);
				h4.className = "uk-text-center";
				add_location(h4, file$1, 115, 9, 5030);
				add_location(b1, file$1, 120, 35, 5185);
				span.className = "ws-title";
				add_location(span, file$1, 120, 12, 5162);
				add_location(b2, file$1, 121, 16, 5230);
				add_location(h2, file$1, 121, 12, 5226);
				div0.className = "uk-text-center";
				add_location(div0, file$1, 119, 9, 5120);
				add_location(h5, file$1, 125, 12, 5327);
				input.className = "uk-input";
				input.placeholder = "enter payment code";
				add_location(input, file$1, 126, 12, 5370);
				button.className = "uk-button uk-button-default ws-blue-btn";
				set_style(button, "margin-top", "12px");
				add_location(button, file$1, 128, 12, 5443);
				div1.className = "uk-text-center";
				add_location(div1, file$1, 124, 9, 5285);
			},

			m: function mount(target, anchor) {
				insert(target, h4, anchor);
				append(h4, b0);
				insert(target, t1, anchor);
				insert(target, div0, anchor);
				append(div0, span);
				append(span, b1);
				append(div0, t3);
				append(div0, h2);
				append(h2, b2);
				insert(target, t5, anchor);
				insert(target, div1, anchor);
				append(div1, h5);
				append(div1, t7);
				append(div1, input);
				append(div1, t8);
				append(div1, button);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h4);
					detach(t1);
					detach(div0);
					detach(t5);
					detach(div1);
				}
			}
		};
	}

	// (135:6) <Modal bind:show={modal.publish_payment}>
	function create_default_slot_1(ctx) {
		var h4, b0, t1, div0, span, b1, t3, h2, b2, t5, div1, h5, t7, input, t8, button;

		return {
			c: function create() {
				h4 = element("h4");
				b0 = element("b");
				b0.textContent = "PUBLISH BILL";
				t1 = space();
				div0 = element("div");
				span = element("span");
				b1 = element("b");
				b1.textContent = "Your balance:";
				t3 = space();
				h2 = element("h2");
				b2 = element("b");
				b2.textContent = "Rp. 10,000.00";
				t5 = space();
				div1 = element("div");
				h5 = element("h5");
				h5.textContent = "FILL AMOUNT";
				t7 = space();
				input = element("input");
				t8 = space();
				button = element("button");
				button.textContent = "CREATE";
				add_location(b0, file$1, 136, 12, 5729);
				h4.className = "uk-text-center";
				add_location(h4, file$1, 135, 9, 5688);
				add_location(b1, file$1, 140, 35, 5845);
				span.className = "ws-title";
				add_location(span, file$1, 140, 12, 5822);
				add_location(b2, file$1, 141, 16, 5890);
				add_location(h2, file$1, 141, 12, 5886);
				div0.className = "uk-text-center";
				add_location(div0, file$1, 139, 9, 5780);
				add_location(h5, file$1, 145, 12, 5987);
				input.className = "uk-input";
				input.placeholder = "enter amount";
				add_location(input, file$1, 146, 12, 6021);
				button.className = "uk-button uk-button-default ws-blue-btn";
				set_style(button, "margin-top", "12px");
				add_location(button, file$1, 148, 12, 6088);
				div1.className = "uk-text-center";
				add_location(div1, file$1, 144, 9, 5945);
			},

			m: function mount(target, anchor) {
				insert(target, h4, anchor);
				append(h4, b0);
				insert(target, t1, anchor);
				insert(target, div0, anchor);
				append(div0, span);
				append(span, b1);
				append(div0, t3);
				append(div0, h2);
				append(h2, b2);
				insert(target, t5, anchor);
				insert(target, div1, anchor);
				append(div1, h5);
				append(div1, t7);
				append(div1, input);
				append(div1, t8);
				append(div1, button);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h4);
					detach(t1);
					detach(div0);
					detach(t5);
					detach(div1);
				}
			}
		};
	}

	// (155:6) <Modal bind:show={modal.profile}>
	function create_default_slot(ctx) {
		var h4, b0, t1, div0, span, b1, t3, h2, b2, t5, div1, h5, t7, input;

		return {
			c: function create() {
				h4 = element("h4");
				b0 = element("b");
				b0.textContent = "PROFILE";
				t1 = space();
				div0 = element("div");
				span = element("span");
				b1 = element("b");
				b1.textContent = "Your balance:";
				t3 = space();
				h2 = element("h2");
				b2 = element("b");
				b2.textContent = "Rp. 10,000.00";
				t5 = space();
				div1 = element("div");
				h5 = element("h5");
				h5.textContent = "YOUR TOKEN";
				t7 = space();
				input = element("input");
				add_location(b0, file$1, 156, 12, 6362);
				h4.className = "uk-text-center";
				add_location(h4, file$1, 155, 9, 6321);
				add_location(b1, file$1, 160, 35, 6473);
				span.className = "ws-title";
				add_location(span, file$1, 160, 12, 6450);
				add_location(b2, file$1, 161, 16, 6518);
				add_location(h2, file$1, 161, 12, 6514);
				div0.className = "uk-text-center";
				add_location(div0, file$1, 159, 9, 6408);
				add_location(h5, file$1, 165, 12, 6615);
				input.className = "uk-input uk-text-center";
				input.placeholder = "wallet token";
				input.value = "kajsdnkjasdnkjs";
				input.disabled = true;
				add_location(input, file$1, 166, 12, 6648);
				div1.className = "uk-text-center";
				add_location(div1, file$1, 164, 9, 6573);
			},

			m: function mount(target, anchor) {
				insert(target, h4, anchor);
				append(h4, b0);
				insert(target, t1, anchor);
				insert(target, div0, anchor);
				append(div0, span);
				append(span, b1);
				append(div0, t3);
				append(div0, h2);
				append(h2, b2);
				insert(target, t5, anchor);
				insert(target, div1, anchor);
				append(div1, h5);
				append(div1, t7);
				append(div1, input);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h4);
					detach(t1);
					detach(div0);
					detach(t5);
					detach(div1);
				}
			}
		};
	}

	function create_fragment$1(ctx) {
		var div9, div8, img0, t0, div7, div6, div5, div1, img1, t1, h30, t3, div0, span, b0, t5, h2, b1, t7, button0, t9, div4, div3, h31, t11, div2, button1, t13, button2, t15, button3, t17, updating_show, t18, updating_show_1, t19, updating_show_2, t20, updating_show_3, t21, updating_show_4, current, dispose;

		function modal0_show_binding(value) {
			ctx.modal0_show_binding.call(null, value);
			updating_show = true;
			add_flush_callback(() => updating_show = false);
		}

		let modal0_props = {
			$$slots: { default: [create_default_slot_4] },
			$$scope: { ctx }
		};
		if (ctx.modal.topup !== void 0) {
			modal0_props.show = ctx.modal.topup;
		}
		var modal0 = new Modal({ props: modal0_props, $$inline: true });

		add_binding_callback(() => bind(modal0, 'show', modal0_show_binding));

		function modal1_show_binding(value_1) {
			ctx.modal1_show_binding.call(null, value_1);
			updating_show_1 = true;
			add_flush_callback(() => updating_show_1 = false);
		}

		let modal1_props = {
			$$slots: { default: [create_default_slot_3] },
			$$scope: { ctx }
		};
		if (ctx.modal.do_payment !== void 0) {
			modal1_props.show = ctx.modal.do_payment;
		}
		var modal1 = new Modal({ props: modal1_props, $$inline: true });

		add_binding_callback(() => bind(modal1, 'show', modal1_show_binding));

		function modal2_show_binding(value_2) {
			ctx.modal2_show_binding.call(null, value_2);
			updating_show_2 = true;
			add_flush_callback(() => updating_show_2 = false);
		}

		let modal2_props = {
			$$slots: { default: [create_default_slot_2] },
			$$scope: { ctx }
		};
		if (ctx.modal.do_payment !== void 0) {
			modal2_props.show = ctx.modal.do_payment;
		}
		var modal2 = new Modal({ props: modal2_props, $$inline: true });

		add_binding_callback(() => bind(modal2, 'show', modal2_show_binding));

		function modal3_show_binding(value_3) {
			ctx.modal3_show_binding.call(null, value_3);
			updating_show_3 = true;
			add_flush_callback(() => updating_show_3 = false);
		}

		let modal3_props = {
			$$slots: { default: [create_default_slot_1] },
			$$scope: { ctx }
		};
		if (ctx.modal.publish_payment !== void 0) {
			modal3_props.show = ctx.modal.publish_payment;
		}
		var modal3 = new Modal({ props: modal3_props, $$inline: true });

		add_binding_callback(() => bind(modal3, 'show', modal3_show_binding));

		function modal4_show_binding(value_4) {
			ctx.modal4_show_binding.call(null, value_4);
			updating_show_4 = true;
			add_flush_callback(() => updating_show_4 = false);
		}

		let modal4_props = {
			$$slots: { default: [create_default_slot] },
			$$scope: { ctx }
		};
		if (ctx.modal.profile !== void 0) {
			modal4_props.show = ctx.modal.profile;
		}
		var modal4 = new Modal({ props: modal4_props, $$inline: true });

		add_binding_callback(() => bind(modal4, 'show', modal4_show_binding));

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
				t17 = space();
				modal0.$$.fragment.c();
				t18 = space();
				modal1.$$.fragment.c();
				t19 = space();
				modal2.$$.fragment.c();
				t20 = space();
				modal3.$$.fragment.c();
				t21 = space();
				modal4.$$.fragment.c();
				img0.className = "uk-align-center";
				img0.src = "/assets/public/img/logo_arta.png";
				img0.alt = "logo";
				img0.width = "204";
				add_location(img0, file$1, 3, 6, 190);
				img1.className = "uk-align-center";
				img1.src = "/assets/public/img/account-icon.png";
				img1.width = "86";
				img1.alt = "account";
				add_location(img1, file$1, 10, 18, 513);
				h30.className = "ws-title uk-text-center";
				add_location(h30, file$1, 11, 18, 629);
				add_location(b0, file$1, 14, 44, 800);
				span.className = "ws-title";
				add_location(span, file$1, 14, 21, 777);
				add_location(b1, file$1, 15, 25, 854);
				add_location(h2, file$1, 15, 21, 850);
				div0.className = "uk-text-center";
				add_location(div0, file$1, 13, 18, 726);
				button0.className = "uk-align-center uk-button uk-button-default ws-blue-btn";
				add_location(button0, file$1, 18, 18, 927);
				div1.className = "uk-width-1-2@m uk-width-1-1@s";
				add_location(div1, file$1, 9, 15, 450);
				h31.className = "ws-title uk-text-center";
				add_location(h31, file$1, 26, 21, 1335);
				button1.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button1, "margin-bottom", "12px");
				add_location(button1, file$1, 28, 24, 1510);
				button2.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button2, "margin-bottom", "12px");
				add_location(button2, file$1, 31, 24, 1739);
				button3.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button3, "margin-bottom", "12px");
				add_location(button3, file$1, 34, 24, 1978);
				div2.className = "uk-align-center uk-width-1-1@s uk-width-3-5@m";
				add_location(div2, file$1, 27, 21, 1425);
				div3.className = "uk-width-1-1";
				add_location(div3, file$1, 25, 18, 1286);
				div4.className = "uk-width-1-2@m uk-width-1-1@s uk-flex uk-flex-middle";
				add_location(div4, file$1, 24, 15, 1200);
				div5.className = "uk-flex";
				add_location(div5, file$1, 7, 12, 379);
				div6.className = "uk-card-body";
				add_location(div6, file$1, 6, 9, 339);
				div7.className = "uk-card uk-card-default";
				add_location(div7, file$1, 5, 6, 291);
				div8.className = "uk-width-2-3@m uk-width-1-1@s";
				set_style(div8, "padding", "12px");
				add_location(div8, file$1, 1, 3, 88);
				div9.className = "uk-width-1-1 uk-height-viewport uk-flex uk-flex-center uk-flex-middle";
				add_location(div9, file$1, 0, 0, 0);

				dispose = [
					listen(button0, "click", ctx.click_handler),
					listen(button1, "click", ctx.showTopupModal),
					listen(button2, "click", ctx.click_handler_1),
					listen(button3, "click", ctx.click_handler_2)
				];
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
				append(div8, t17);
				mount_component(modal0, div8, null);
				append(div8, t18);
				mount_component(modal1, div8, null);
				append(div8, t19);
				mount_component(modal2, div8, null);
				append(div8, t20);
				mount_component(modal3, div8, null);
				append(div8, t21);
				mount_component(modal4, div8, null);
				current = true;
			},

			p: function update(changed, ctx) {
				var modal0_changes = {};
				if (changed.$$scope) modal0_changes.$$scope = { changed, ctx };
				if (!updating_show && changed.modal) {
					modal0_changes.show = ctx.modal.topup;
				}
				modal0.$set(modal0_changes);

				var modal1_changes = {};
				if (changed.$$scope) modal1_changes.$$scope = { changed, ctx };
				if (!updating_show_1 && changed.modal) {
					modal1_changes.show = ctx.modal.do_payment;
				}
				modal1.$set(modal1_changes);

				var modal2_changes = {};
				if (changed.$$scope) modal2_changes.$$scope = { changed, ctx };
				if (!updating_show_2 && changed.modal) {
					modal2_changes.show = ctx.modal.do_payment;
				}
				modal2.$set(modal2_changes);

				var modal3_changes = {};
				if (changed.$$scope) modal3_changes.$$scope = { changed, ctx };
				if (!updating_show_3 && changed.modal) {
					modal3_changes.show = ctx.modal.publish_payment;
				}
				modal3.$set(modal3_changes);

				var modal4_changes = {};
				if (changed.$$scope) modal4_changes.$$scope = { changed, ctx };
				if (!updating_show_4 && changed.modal) {
					modal4_changes.show = ctx.modal.profile;
				}
				modal4.$set(modal4_changes);
			},

			i: function intro(local) {
				if (current) return;
				modal0.$$.fragment.i(local);

				modal1.$$.fragment.i(local);

				modal2.$$.fragment.i(local);

				modal3.$$.fragment.i(local);

				modal4.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				modal0.$$.fragment.o(local);
				modal1.$$.fragment.o(local);
				modal2.$$.fragment.o(local);
				modal3.$$.fragment.o(local);
				modal4.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div9);
				}

				modal0.$destroy();

				modal1.$destroy();

				modal2.$destroy();

				modal3.$destroy();

				modal4.$destroy();

				run_all(dispose);
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let modal = {
	      topup: false,
	      do_payment: false,
	      publish_payment: false,
	      profile: false
	   };

	   function showTopupModal(){
	      modal.topup = true; $$invalidate('modal', modal);
	   }

		function click_handler() {
			const $$result = modal.profile = true;
			$$invalidate('modal', modal);
			return $$result;
		}

		function click_handler_1() {
			const $$result = modal.do_payment = true;
			$$invalidate('modal', modal);
			return $$result;
		}

		function click_handler_2() {
			const $$result = modal.publish_payment = true;
			$$invalidate('modal', modal);
			return $$result;
		}

		function modal0_show_binding(value) {
			modal.topup = value;
			$$invalidate('modal', modal);
		}

		function modal1_show_binding(value_1) {
			modal.do_payment = value_1;
			$$invalidate('modal', modal);
		}

		function modal2_show_binding(value_2) {
			modal.do_payment = value_2;
			$$invalidate('modal', modal);
		}

		function modal3_show_binding(value_3) {
			modal.publish_payment = value_3;
			$$invalidate('modal', modal);
		}

		function modal4_show_binding(value_4) {
			modal.profile = value_4;
			$$invalidate('modal', modal);
		}

		return {
			modal,
			showTopupModal,
			click_handler,
			click_handler_1,
			click_handler_2,
			modal0_show_binding,
			modal1_show_binding,
			modal2_show_binding,
			modal3_show_binding,
			modal4_show_binding
		};
	}

	class Home extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
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
