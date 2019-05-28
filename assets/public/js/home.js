
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

	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
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

	function to_number(value) {
		return value === '' ? undefined : +value;
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

	function select_option(select, value) {
		for (let i = 0; i < select.options.length; i += 1) {
			const option = select.options[i];

			if (option.__value === value) {
				option.selected = true;
				return;
			}
		}
	}

	function select_value(select) {
		const selected_option = select.querySelector(':checked') || select.options[0];
		return selected_option && selected_option.__value;
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error(`Function called outside component initialization`);
		return current_component;
	}

	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
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

	/* src/components/loading.svelte generated by Svelte v3.4.2 */

	const file$1 = "src/components/loading.svelte";

	function create_fragment$1(ctx) {
		var div1, div0;

		return {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				attr(div0, "uk-spinner", "");
				add_location(div0, file$1, 1, 3, 79);
				div1.className = "uk-flex uk-flex-center uk-flex-middle";
				set_style(div1, "padding", "24px");
				add_location(div1, file$1, 0, 0, 0);
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
			init(this, options, null, create_fragment$1, safe_not_equal, []);
		}
	}

	/* src/components/CekOngkir.svelte generated by Svelte v3.4.2 */

	const file$2 = "src/components/CekOngkir.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.item = list[i];
		return child_ctx;
	}

	function get_each_context_1(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.city = list[i];
		return child_ctx;
	}

	function get_each_context_2(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.province = list[i];
		return child_ctx;
	}

	function get_each_context_3(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.city = list[i];
		return child_ctx;
	}

	function get_each_context_4(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.province = list[i];
		return child_ctx;
	}

	// (92:3) {:else}
	function create_else_block(ctx) {
		var current;

		var loading_1 = new Loading({ $$inline: true });

		return {
			c: function create() {
				loading_1.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(loading_1, target, anchor);
				current = true;
			},

			p: noop,

			i: function intro(local) {
				if (current) return;
				loading_1.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				loading_1.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				loading_1.$destroy(detaching);
			}
		};
	}

	// (3:3) {#if !loading.get_cost}
	function create_if_block_1(ctx) {
		var div6, h30, t1, div2, div0, t2, t3, div1, t4, t5, h31, t7, div5, div3, t8, t9, div4, t10, t11, h32, t13, input, t14, current, dispose;

		var if_block0 = (ctx.loading.load_province) && create_if_block_10(ctx);

		var if_block1 = (!ctx.loading.load_province) && create_if_block_9(ctx);

		var if_block2 = (ctx.loading.load_origin_city) && create_if_block_8(ctx);

		var if_block3 = (ctx.origin.province_id.length > 0 && !ctx.loading.load_origin_city) && create_if_block_7(ctx);

		var if_block4 = (ctx.loading.load_province) && create_if_block_6(ctx);

		var if_block5 = (!ctx.loading.load_province) && create_if_block_5(ctx);

		var if_block6 = (ctx.loading.load_dest_city) && create_if_block_4(ctx);

		var if_block7 = (ctx.destination.province_id.length > 0 && !ctx.loading.load_dest_city) && create_if_block_3(ctx);

		var if_block8 = (ctx.origin.city_id.length > 0 && ctx.destination.city_id.length > 0) && create_if_block_2(ctx);

		return {
			c: function create() {
				div6 = element("div");
				h30 = element("h3");
				h30.textContent = "Origin";
				t1 = space();
				div2 = element("div");
				div0 = element("div");
				if (if_block0) if_block0.c();
				t2 = space();
				if (if_block1) if_block1.c();
				t3 = space();
				div1 = element("div");
				if (if_block2) if_block2.c();
				t4 = space();
				if (if_block3) if_block3.c();
				t5 = space();
				h31 = element("h3");
				h31.textContent = "Destination";
				t7 = space();
				div5 = element("div");
				div3 = element("div");
				if (if_block4) if_block4.c();
				t8 = space();
				if (if_block5) if_block5.c();
				t9 = space();
				div4 = element("div");
				if (if_block6) if_block6.c();
				t10 = space();
				if (if_block7) if_block7.c();
				t11 = space();
				h32 = element("h3");
				h32.textContent = "Weight (gram)";
				t13 = space();
				input = element("input");
				t14 = space();
				if (if_block8) if_block8.c();
				h30.className = "ws-title";
				add_location(h30, file$2, 5, 6, 120);
				div0.className = "uk-width-1-2@m uk-width-1-1@s";
				add_location(div0, file$2, 7, 9, 184);
				div1.className = "uk-width-1-2@m uk-width-1-1@s";
				add_location(div1, file$2, 23, 9, 890);
				attr(div2, "uk-grid", "");
				add_location(div2, file$2, 6, 6, 160);
				h31.className = "ws-title";
				add_location(h31, file$2, 43, 6, 1658);
				div3.className = "uk-width-1-2@m uk-width-1-1@s";
				add_location(div3, file$2, 45, 9, 1727);
				div4.className = "uk-width-1-2@m uk-width-1-1@s";
				add_location(div4, file$2, 61, 9, 2443);
				attr(div5, "uk-grid", "");
				add_location(div5, file$2, 44, 6, 1703);
				h32.className = "ws-title";
				add_location(h32, file$2, 81, 6, 3209);
				input.className = "uk-input";
				attr(input, "type", "number");
				add_location(input, file$2, 82, 6, 3256);
				add_location(div6, file$2, 3, 3, 84);
				dispose = listen(input, "input", ctx.input_input_handler);
			},

			m: function mount(target, anchor) {
				insert(target, div6, anchor);
				append(div6, h30);
				append(div6, t1);
				append(div6, div2);
				append(div2, div0);
				if (if_block0) if_block0.m(div0, null);
				append(div0, t2);
				if (if_block1) if_block1.m(div0, null);
				append(div2, t3);
				append(div2, div1);
				if (if_block2) if_block2.m(div1, null);
				append(div1, t4);
				if (if_block3) if_block3.m(div1, null);
				append(div6, t5);
				append(div6, h31);
				append(div6, t7);
				append(div6, div5);
				append(div5, div3);
				if (if_block4) if_block4.m(div3, null);
				append(div3, t8);
				if (if_block5) if_block5.m(div3, null);
				append(div5, t9);
				append(div5, div4);
				if (if_block6) if_block6.m(div4, null);
				append(div4, t10);
				if (if_block7) if_block7.m(div4, null);
				append(div6, t11);
				append(div6, h32);
				append(div6, t13);
				append(div6, input);

				input.value = ctx.packet_weight;

				append(div6, t14);
				if (if_block8) if_block8.m(div6, null);
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.loading.load_province) {
					if (!if_block0) {
						if_block0 = create_if_block_10(ctx);
						if_block0.c();
						if_block0.i(1);
						if_block0.m(div0, t2);
					} else {
										if_block0.i(1);
					}
				} else if (if_block0) {
					group_outros();
					on_outro(() => {
						if_block0.d(1);
						if_block0 = null;
					});

					if_block0.o(1);
					check_outros();
				}

				if (!ctx.loading.load_province) {
					if (if_block1) {
						if_block1.p(changed, ctx);
					} else {
						if_block1 = create_if_block_9(ctx);
						if_block1.c();
						if_block1.m(div0, null);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (ctx.loading.load_origin_city) {
					if (!if_block2) {
						if_block2 = create_if_block_8(ctx);
						if_block2.c();
						if_block2.i(1);
						if_block2.m(div1, t4);
					} else {
										if_block2.i(1);
					}
				} else if (if_block2) {
					group_outros();
					on_outro(() => {
						if_block2.d(1);
						if_block2 = null;
					});

					if_block2.o(1);
					check_outros();
				}

				if (ctx.origin.province_id.length > 0 && !ctx.loading.load_origin_city) {
					if (if_block3) {
						if_block3.p(changed, ctx);
					} else {
						if_block3 = create_if_block_7(ctx);
						if_block3.c();
						if_block3.m(div1, null);
					}
				} else if (if_block3) {
					if_block3.d(1);
					if_block3 = null;
				}

				if (ctx.loading.load_province) {
					if (!if_block4) {
						if_block4 = create_if_block_6(ctx);
						if_block4.c();
						if_block4.i(1);
						if_block4.m(div3, t8);
					} else {
										if_block4.i(1);
					}
				} else if (if_block4) {
					group_outros();
					on_outro(() => {
						if_block4.d(1);
						if_block4 = null;
					});

					if_block4.o(1);
					check_outros();
				}

				if (!ctx.loading.load_province) {
					if (if_block5) {
						if_block5.p(changed, ctx);
					} else {
						if_block5 = create_if_block_5(ctx);
						if_block5.c();
						if_block5.m(div3, null);
					}
				} else if (if_block5) {
					if_block5.d(1);
					if_block5 = null;
				}

				if (ctx.loading.load_dest_city) {
					if (!if_block6) {
						if_block6 = create_if_block_4(ctx);
						if_block6.c();
						if_block6.i(1);
						if_block6.m(div4, t10);
					} else {
										if_block6.i(1);
					}
				} else if (if_block6) {
					group_outros();
					on_outro(() => {
						if_block6.d(1);
						if_block6 = null;
					});

					if_block6.o(1);
					check_outros();
				}

				if (ctx.destination.province_id.length > 0 && !ctx.loading.load_dest_city) {
					if (if_block7) {
						if_block7.p(changed, ctx);
					} else {
						if_block7 = create_if_block_3(ctx);
						if_block7.c();
						if_block7.m(div4, null);
					}
				} else if (if_block7) {
					if_block7.d(1);
					if_block7 = null;
				}

				if (changed.packet_weight) input.value = ctx.packet_weight;

				if (ctx.origin.city_id.length > 0 && ctx.destination.city_id.length > 0) {
					if (if_block8) {
						if_block8.p(changed, ctx);
					} else {
						if_block8 = create_if_block_2(ctx);
						if_block8.c();
						if_block8.m(div6, null);
					}
				} else if (if_block8) {
					if_block8.d(1);
					if_block8 = null;
				}
			},

			i: function intro(local) {
				if (current) return;
				if (if_block0) if_block0.i();
				if (if_block2) if_block2.i();
				if (if_block4) if_block4.i();
				if (if_block6) if_block6.i();
				current = true;
			},

			o: function outro(local) {
				if (if_block0) if_block0.o();
				if (if_block2) if_block2.o();
				if (if_block4) if_block4.o();
				if (if_block6) if_block6.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div6);
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
				if (if_block2) if_block2.d();
				if (if_block3) if_block3.d();
				if (if_block4) if_block4.d();
				if (if_block5) if_block5.d();
				if (if_block6) if_block6.d();
				if (if_block7) if_block7.d();
				if (if_block8) if_block8.d();
				dispose();
			}
		};
	}

	// (9:12) {#if loading.load_province}
	function create_if_block_10(ctx) {
		var current;

		var loading_1 = new Loading({ $$inline: true });

		return {
			c: function create() {
				loading_1.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(loading_1, target, anchor);
				current = true;
			},

			i: function intro(local) {
				if (current) return;
				loading_1.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				loading_1.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				loading_1.$destroy(detaching);
			}
		};
	}

	// (13:12) {#if !loading.load_province}
	function create_if_block_9(ctx) {
		var label, t_1, div, select, dispose;

		var each_value_4 = ctx.list_province;

		var each_blocks = [];

		for (var i = 0; i < each_value_4.length; i += 1) {
			each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
		}

		return {
			c: function create() {
				label = element("label");
				label.textContent = "Province";
				t_1 = space();
				div = element("div");
				select = element("select");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				label.className = "uk-form-label";
				label.htmlFor = "form-stacked-select";
				add_location(label, file$2, 13, 12, 384);
				if (ctx.origin.province_id === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
				select.className = "uk-select";
				select.id = "form-stacked-select";
				add_location(select, file$2, 15, 15, 516);
				div.className = "uk-form-controls";
				add_location(div, file$2, 14, 12, 469);

				dispose = [
					listen(select, "change", ctx.select_change_handler),
					listen(select, "change", ctx.reset_origin_city)
				];
			},

			m: function mount(target, anchor) {
				insert(target, label, anchor);
				insert(target, t_1, anchor);
				insert(target, div, anchor);
				append(div, select);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(select, null);
				}

				select_option(select, ctx.origin.province_id);
			},

			p: function update(changed, ctx) {
				if (changed.list_province) {
					each_value_4 = ctx.list_province;

					for (var i = 0; i < each_value_4.length; i += 1) {
						const child_ctx = get_each_context_4(ctx, each_value_4, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block_4(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value_4.length;
				}

				if (changed.origin) select_option(select, ctx.origin.province_id);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(label);
					detach(t_1);
					detach(div);
				}

				destroy_each(each_blocks, detaching);

				run_all(dispose);
			}
		};
	}

	// (17:18) {#each list_province as province}
	function create_each_block_4(ctx) {
		var option, t_value = ctx.province.province, t, option_value_value;

		return {
			c: function create() {
				option = element("option");
				t = text(t_value);
				option.__value = option_value_value = ctx.province.province_id;
				option.value = option.__value;
				add_location(option, file$2, 17, 21, 705);
			},

			m: function mount(target, anchor) {
				insert(target, option, anchor);
				append(option, t);
			},

			p: function update(changed, ctx) {
				if ((changed.list_province) && t_value !== (t_value = ctx.province.province)) {
					set_data(t, t_value);
				}

				if ((changed.list_province) && option_value_value !== (option_value_value = ctx.province.province_id)) {
					option.__value = option_value_value;
				}

				option.value = option.__value;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(option);
				}
			}
		};
	}

	// (25:12) {#if loading.load_origin_city}
	function create_if_block_8(ctx) {
		var current;

		var loading_1 = new Loading({ $$inline: true });

		return {
			c: function create() {
				loading_1.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(loading_1, target, anchor);
				current = true;
			},

			i: function intro(local) {
				if (current) return;
				loading_1.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				loading_1.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				loading_1.$destroy(detaching);
			}
		};
	}

	// (29:12) {#if origin.province_id.length > 0 && !loading.load_origin_city}
	function create_if_block_7(ctx) {
		var label, t_1, div, select, dispose;

		var each_value_3 = ctx.list_origin_city;

		var each_blocks = [];

		for (var i = 0; i < each_value_3.length; i += 1) {
			each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
		}

		return {
			c: function create() {
				label = element("label");
				label.textContent = "City";
				t_1 = space();
				div = element("div");
				select = element("select");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				label.className = "uk-form-label";
				label.htmlFor = "form-stacked-select";
				add_location(label, file$2, 29, 12, 1141);
				if (ctx.origin.city_id === void 0) add_render_callback(() => ctx.select_change_handler_1.call(select));
				select.className = "uk-select";
				select.id = "form-stacked-select";
				add_location(select, file$2, 31, 15, 1269);
				div.className = "uk-form-controls";
				add_location(div, file$2, 30, 12, 1222);
				dispose = listen(select, "change", ctx.select_change_handler_1);
			},

			m: function mount(target, anchor) {
				insert(target, label, anchor);
				insert(target, t_1, anchor);
				insert(target, div, anchor);
				append(div, select);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(select, null);
				}

				select_option(select, ctx.origin.city_id);
			},

			p: function update(changed, ctx) {
				if (changed.list_origin_city) {
					each_value_3 = ctx.list_origin_city;

					for (var i = 0; i < each_value_3.length; i += 1) {
						const child_ctx = get_each_context_3(ctx, each_value_3, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block_3(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value_3.length;
				}

				if (changed.origin) select_option(select, ctx.origin.city_id);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(label);
					detach(t_1);
					detach(div);
				}

				destroy_each(each_blocks, detaching);

				dispose();
			}
		};
	}

	// (33:18) {#each list_origin_city as city}
	function create_each_block_3(ctx) {
		var option, t_value = ctx.city.city_name, t, option_value_value;

		return {
			c: function create() {
				option = element("option");
				t = text(t_value);
				option.__value = option_value_value = ctx.city.city_id;
				option.value = option.__value;
				add_location(option, file$2, 33, 21, 1423);
			},

			m: function mount(target, anchor) {
				insert(target, option, anchor);
				append(option, t);
			},

			p: function update(changed, ctx) {
				if ((changed.list_origin_city) && t_value !== (t_value = ctx.city.city_name)) {
					set_data(t, t_value);
				}

				if ((changed.list_origin_city) && option_value_value !== (option_value_value = ctx.city.city_id)) {
					option.__value = option_value_value;
				}

				option.value = option.__value;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(option);
				}
			}
		};
	}

	// (47:12) {#if loading.load_province}
	function create_if_block_6(ctx) {
		var current;

		var loading_1 = new Loading({ $$inline: true });

		return {
			c: function create() {
				loading_1.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(loading_1, target, anchor);
				current = true;
			},

			i: function intro(local) {
				if (current) return;
				loading_1.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				loading_1.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				loading_1.$destroy(detaching);
			}
		};
	}

	// (51:12) {#if !loading.load_province}
	function create_if_block_5(ctx) {
		var label, t_1, div, select, dispose;

		var each_value_2 = ctx.list_province;

		var each_blocks = [];

		for (var i = 0; i < each_value_2.length; i += 1) {
			each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
		}

		return {
			c: function create() {
				label = element("label");
				label.textContent = "Province";
				t_1 = space();
				div = element("div");
				select = element("select");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				label.className = "uk-form-label";
				label.htmlFor = "form-stacked-select";
				add_location(label, file$2, 51, 12, 1927);
				if (ctx.destination.province_id === void 0) add_render_callback(() => ctx.select_change_handler_2.call(select));
				select.className = "uk-select";
				select.id = "form-stacked-select";
				add_location(select, file$2, 53, 15, 2059);
				div.className = "uk-form-controls";
				add_location(div, file$2, 52, 12, 2012);

				dispose = [
					listen(select, "change", ctx.select_change_handler_2),
					listen(select, "change", ctx.reset_destination_city)
				];
			},

			m: function mount(target, anchor) {
				insert(target, label, anchor);
				insert(target, t_1, anchor);
				insert(target, div, anchor);
				append(div, select);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(select, null);
				}

				select_option(select, ctx.destination.province_id);
			},

			p: function update(changed, ctx) {
				if (changed.list_province) {
					each_value_2 = ctx.list_province;

					for (var i = 0; i < each_value_2.length; i += 1) {
						const child_ctx = get_each_context_2(ctx, each_value_2, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block_2(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value_2.length;
				}

				if (changed.destination) select_option(select, ctx.destination.province_id);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(label);
					detach(t_1);
					detach(div);
				}

				destroy_each(each_blocks, detaching);

				run_all(dispose);
			}
		};
	}

	// (55:18) {#each list_province as province}
	function create_each_block_2(ctx) {
		var option, t_value = ctx.province.province, t, option_value_value;

		return {
			c: function create() {
				option = element("option");
				t = text(t_value);
				option.__value = option_value_value = ctx.province.province_id;
				option.value = option.__value;
				add_location(option, file$2, 55, 21, 2258);
			},

			m: function mount(target, anchor) {
				insert(target, option, anchor);
				append(option, t);
			},

			p: function update(changed, ctx) {
				if ((changed.list_province) && t_value !== (t_value = ctx.province.province)) {
					set_data(t, t_value);
				}

				if ((changed.list_province) && option_value_value !== (option_value_value = ctx.province.province_id)) {
					option.__value = option_value_value;
				}

				option.value = option.__value;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(option);
				}
			}
		};
	}

	// (63:12) {#if loading.load_dest_city}
	function create_if_block_4(ctx) {
		var current;

		var loading_1 = new Loading({ $$inline: true });

		return {
			c: function create() {
				loading_1.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(loading_1, target, anchor);
				current = true;
			},

			i: function intro(local) {
				if (current) return;
				loading_1.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				loading_1.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				loading_1.$destroy(detaching);
			}
		};
	}

	// (67:12) {#if destination.province_id.length > 0 && !loading.load_dest_city}
	function create_if_block_3(ctx) {
		var label, t_1, div, select, dispose;

		var each_value_1 = ctx.list_dest_city;

		var each_blocks = [];

		for (var i = 0; i < each_value_1.length; i += 1) {
			each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
		}

		return {
			c: function create() {
				label = element("label");
				label.textContent = "City";
				t_1 = space();
				div = element("div");
				select = element("select");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				label.className = "uk-form-label";
				label.htmlFor = "form-stacked-select";
				add_location(label, file$2, 67, 12, 2695);
				if (ctx.destination.city_id === void 0) add_render_callback(() => ctx.select_change_handler_3.call(select));
				select.className = "uk-select";
				select.id = "form-stacked-select";
				add_location(select, file$2, 69, 15, 2823);
				div.className = "uk-form-controls";
				add_location(div, file$2, 68, 12, 2776);
				dispose = listen(select, "change", ctx.select_change_handler_3);
			},

			m: function mount(target, anchor) {
				insert(target, label, anchor);
				insert(target, t_1, anchor);
				insert(target, div, anchor);
				append(div, select);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(select, null);
				}

				select_option(select, ctx.destination.city_id);
			},

			p: function update(changed, ctx) {
				if (changed.list_dest_city) {
					each_value_1 = ctx.list_dest_city;

					for (var i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block_1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value_1.length;
				}

				if (changed.destination) select_option(select, ctx.destination.city_id);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(label);
					detach(t_1);
					detach(div);
				}

				destroy_each(each_blocks, detaching);

				dispose();
			}
		};
	}

	// (71:18) {#each list_dest_city as city}
	function create_each_block_1(ctx) {
		var option, t_value = ctx.city.city_name, t, option_value_value;

		return {
			c: function create() {
				option = element("option");
				t = text(t_value);
				option.__value = option_value_value = ctx.city.city_id;
				option.value = option.__value;
				add_location(option, file$2, 71, 21, 2980);
			},

			m: function mount(target, anchor) {
				insert(target, option, anchor);
				append(option, t);
			},

			p: function update(changed, ctx) {
				if ((changed.list_dest_city) && t_value !== (t_value = ctx.city.city_name)) {
					set_data(t, t_value);
				}

				if ((changed.list_dest_city) && option_value_value !== (option_value_value = ctx.city.city_id)) {
					option.__value = option_value_value;
				}

				option.value = option.__value;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(option);
				}
			}
		};
	}

	// (86:6) {#if origin.city_id.length > 0 && destination.city_id.length > 0}
	function create_if_block_2(ctx) {
		var div, button, dispose;

		return {
			c: function create() {
				div = element("div");
				button = element("button");
				button.textContent = "Check";
				button.className = "uk-button uk-button-default ws-blue-btn";
				add_location(button, file$2, 87, 9, 3493);
				div.className = "uk-flex uk-flex-center";
				set_style(div, "margin", "24px");
				add_location(div, file$2, 86, 6, 3424);
				dispose = listen(button, "click", ctx.get_cost);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, button);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				dispose();
			}
		};
	}

	// (98:3) {#if display_result}
	function create_if_block$1(ctx) {
		var div, h3, t1, table, thead, tr, th0, t3, th1, t5, th2, t7, tbody;

		var each_value = ctx.result_list;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		return {
			c: function create() {
				div = element("div");
				h3 = element("h3");
				h3.textContent = "Results";
				t1 = space();
				table = element("table");
				thead = element("thead");
				tr = element("tr");
				th0 = element("th");
				th0.textContent = "Service";
				t3 = space();
				th1 = element("th");
				th1.textContent = "Cost";
				t5 = space();
				th2 = element("th");
				th2.textContent = "Est (days)";
				t7 = space();
				tbody = element("tbody");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				h3.className = "ws-title";
				add_location(h3, file$2, 99, 6, 3783);
				add_location(th0, file$2, 103, 15, 3918);
				add_location(th1, file$2, 104, 15, 3951);
				add_location(th2, file$2, 105, 15, 3981);
				add_location(tr, file$2, 102, 12, 3897);
				add_location(thead, file$2, 101, 9, 3876);
				add_location(tbody, file$2, 108, 9, 4049);
				table.className = "uk-table uk-table-striped";
				add_location(table, file$2, 100, 6, 3824);
				set_style(div, "margin-top", "12px");
				add_location(div, file$2, 98, 3, 3744);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, h3);
				append(div, t1);
				append(div, table);
				append(table, thead);
				append(thead, tr);
				append(tr, th0);
				append(tr, t3);
				append(tr, th1);
				append(tr, t5);
				append(tr, th2);
				append(table, t7);
				append(table, tbody);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(tbody, null);
				}
			},

			p: function update(changed, ctx) {
				if (changed.result_list) {
					each_value = ctx.result_list;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(tbody, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	// (110:12) {#each result_list as item}
	function create_each_block(ctx) {
		var tr, td0, t0_value = ctx.item.name, t0, t1, t2_value = ctx.item.service, t2, t3, td1, t4, t5_value = parseInt(ctx.item.cost.value).toLocaleString(), t5, t6, t7, td2, t8_value = ctx.item.cost.etd, t8;

		return {
			c: function create() {
				tr = element("tr");
				td0 = element("td");
				t0 = text(t0_value);
				t1 = text(" - ");
				t2 = text(t2_value);
				t3 = space();
				td1 = element("td");
				t4 = text("Rp. ");
				t5 = text(t5_value);
				t6 = text(",00");
				t7 = space();
				td2 = element("td");
				t8 = text(t8_value);
				add_location(td0, file$2, 111, 18, 4138);
				add_location(td1, file$2, 112, 18, 4195);
				add_location(td2, file$2, 113, 18, 4277);
				add_location(tr, file$2, 110, 15, 4114);
			},

			m: function mount(target, anchor) {
				insert(target, tr, anchor);
				append(tr, td0);
				append(td0, t0);
				append(td0, t1);
				append(td0, t2);
				append(tr, t3);
				append(tr, td1);
				append(td1, t4);
				append(td1, t5);
				append(td1, t6);
				append(tr, t7);
				append(tr, td2);
				append(td2, t8);
			},

			p: function update(changed, ctx) {
				if ((changed.result_list) && t0_value !== (t0_value = ctx.item.name)) {
					set_data(t0, t0_value);
				}

				if ((changed.result_list) && t2_value !== (t2_value = ctx.item.service)) {
					set_data(t2, t2_value);
				}

				if ((changed.result_list) && t5_value !== (t5_value = parseInt(ctx.item.cost.value).toLocaleString())) {
					set_data(t5, t5_value);
				}

				if ((changed.result_list) && t8_value !== (t8_value = ctx.item.cost.etd)) {
					set_data(t8, t8_value);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(tr);
				}
			}
		};
	}

	// (1:0) <Modal bind:show={show}>
	function create_default_slot(ctx) {
		var current_block_type_index, if_block0, t0, t1, div, span0, t3, span1, current;

		var if_block_creators = [
			create_if_block_1,
			create_else_block
		];

		var if_blocks = [];

		function select_block_type(ctx) {
			if (!ctx.loading.get_cost) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		var if_block1 = (ctx.display_result) && create_if_block$1(ctx);

		return {
			c: function create() {
				if_block0.c();
				t0 = space();
				if (if_block1) if_block1.c();
				t1 = space();
				div = element("div");
				span0 = element("span");
				span0.textContent = "Powered by";
				t3 = space();
				span1 = element("span");
				span1.textContent = "PJT-Logistik";
				span0.className = "ws-title";
				add_location(span0, file$2, 123, 6, 4495);
				set_style(span1, "font-size", "12px");
				set_style(span1, "margin-left", "12px");
				add_location(span1, file$2, 124, 6, 4544);
				div.className = "uk-flex uk-flex-right";
				set_style(div, "margin-top", "24px");
				add_location(div, file$2, 122, 3, 4426);
			},

			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert(target, t0, anchor);
				if (if_block1) if_block1.m(target, anchor);
				insert(target, t1, anchor);
				insert(target, div, anchor);
				append(div, span0);
				append(div, t3);
				append(div, span1);
				current = true;
			},

			p: function update(changed, ctx) {
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
					if_block0.o(1);
					check_outros();

					if_block0 = if_blocks[current_block_type_index];
					if (!if_block0) {
						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block0.c();
					}
					if_block0.i(1);
					if_block0.m(t0.parentNode, t0);
				}

				if (ctx.display_result) {
					if (if_block1) {
						if_block1.p(changed, ctx);
					} else {
						if_block1 = create_if_block$1(ctx);
						if_block1.c();
						if_block1.m(t1.parentNode, t1);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}
			},

			i: function intro(local) {
				if (current) return;
				if (if_block0) if_block0.i();
				current = true;
			},

			o: function outro(local) {
				if (if_block0) if_block0.o();
				current = false;
			},

			d: function destroy(detaching) {
				if_blocks[current_block_type_index].d(detaching);

				if (detaching) {
					detach(t0);
				}

				if (if_block1) if_block1.d(detaching);

				if (detaching) {
					detach(t1);
					detach(div);
				}
			}
		};
	}

	function create_fragment$2(ctx) {
		var updating_show, current;

		function modal_show_binding(value) {
			ctx.modal_show_binding.call(null, value);
			updating_show = true;
			add_flush_callback(() => updating_show = false);
		}

		let modal_props = {
			$$slots: { default: [create_default_slot] },
			$$scope: { ctx }
		};
		if (ctx.show !== void 0) {
			modal_props.show = ctx.show;
		}
		var modal = new Modal({ props: modal_props, $$inline: true });

		add_binding_callback(() => bind(modal, 'show', modal_show_binding));

		return {
			c: function create() {
				modal.$$.fragment.c();
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				mount_component(modal, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var modal_changes = {};
				if (changed.$$scope || changed.display_result || changed.result_list || changed.loading || changed.origin || changed.destination || changed.packet_weight || changed.list_dest_city || changed.list_province || changed.list_origin_city) modal_changes.$$scope = { changed, ctx };
				if (!updating_show && changed.show) {
					modal_changes.show = ctx.show;
				}
				modal.$set(modal_changes);
			},

			i: function intro(local) {
				if (current) return;
				modal.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				modal.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				modal.$destroy(detaching);
			}
		};
	}

	function get_city(province_id){
	   return fetch('/service/pjt/kota?id_provinsi=' + province_id).then((result) => result.json());
	}

	function instance$1($$self, $$props, $$invalidate) {
		

	   let { show = false } = $$props;

	   var list_province = [];
	   var list_origin_city = [];
	   var list_dest_city = [];

	   var result_list = [];

	   const loading = {
	      load_province: false,
	      load_origin_city: false,
	      load_dest_city: false,
	      get_cost: false
	   };

	   var display_result = false;

	   const origin = {
	      province_id: '',
	      city_id: ''
	   };

	   var packet_weight = 0;

	   const destination = {
	      province_id: '',
	      city_id: ''
	   };

	   function reset_origin_city(){
	      origin.city_id = ''; $$invalidate('origin', origin);

	      loading.load_origin_city = true; $$invalidate('loading', loading);
	      get_city(origin.province_id).then(result => {
	         $$invalidate('list_origin_city', list_origin_city = result.data);
	         loading.load_origin_city = false; $$invalidate('loading', loading);

	         origin.city_id = list_origin_city[0].city_id; $$invalidate('origin', origin);
	      }).catch(error => {
	         loading.load_origin_city = false; $$invalidate('loading', loading);
	         console.log(error);
	      });
	   }

	   function reset_destination_city(){
	      destination.city_id = ''; $$invalidate('destination', destination);

	      loading.load_dest_city = true; $$invalidate('loading', loading);
	      get_city(destination.province_id).then(result => {
	         $$invalidate('list_dest_city', list_dest_city = result.data);
	         loading.load_dest_city = false; $$invalidate('loading', loading);

	         destination.city_id = list_dest_city[0].city_id; $$invalidate('destination', destination);
	      }).catch(error => {
	         loading.load_dest_city = false; $$invalidate('loading', loading);
	         console.log(error);
	      });
	   }

	   function get_province_list(){
	      loading.load_province = true; $$invalidate('loading', loading);
	      fetch('/service/pjt/provinsi').then(result => {
	         return result.json();
	      }).then(result => {
	         $$invalidate('list_province', list_province = result.data);
	         loading.load_province = false; $$invalidate('loading', loading);
	      }).catch(error => {
	         console.log(error);
	      });
	   }

	   function get_cost(){
	      loading.get_cost = true; $$invalidate('loading', loading);
	      $$invalidate('display_result', display_result = false);

	      const request_body = {
	         id_kota_asal: origin.city_id,
	         id_kota_tujuan: origin.province_id,
	         berat: packet_weight
	      };

	      fetch('/service/pjt/biaya', {
	         method: 'POST',
	         headers: { 'Content-Type': 'application/json' },
	         body: JSON.stringify(request_body)
	      }).then(result => result.json()).then(result => {
	         loading.get_cost = false; $$invalidate('loading', loading);
	         $$invalidate('result_list', result_list = result.data);
	         $$invalidate('display_result', display_result = true);
	      }).catch(error => {
	         loading.get_cost = false; $$invalidate('loading', loading);
	         console.log(error);
	      });
	   }

	   onMount(() => {
	      get_province_list();
	   });

		function select_change_handler() {
			origin.province_id = select_value(this);
			$$invalidate('origin', origin);
			$$invalidate('list_province', list_province);
		}

		function select_change_handler_1() {
			origin.city_id = select_value(this);
			$$invalidate('origin', origin);
			$$invalidate('list_province', list_province);
		}

		function select_change_handler_2() {
			destination.province_id = select_value(this);
			$$invalidate('destination', destination);
			$$invalidate('list_province', list_province);
		}

		function select_change_handler_3() {
			destination.city_id = select_value(this);
			$$invalidate('destination', destination);
			$$invalidate('list_province', list_province);
		}

		function input_input_handler() {
			packet_weight = to_number(this.value);
			$$invalidate('packet_weight', packet_weight);
		}

		function modal_show_binding(value) {
			show = value;
			$$invalidate('show', show);
		}

		$$self.$set = $$props => {
			if ('show' in $$props) $$invalidate('show', show = $$props.show);
		};

		return {
			show,
			list_province,
			list_origin_city,
			list_dest_city,
			result_list,
			loading,
			display_result,
			origin,
			packet_weight,
			destination,
			reset_origin_city,
			reset_destination_city,
			get_cost,
			select_change_handler,
			select_change_handler_1,
			select_change_handler_2,
			select_change_handler_3,
			input_input_handler,
			modal_show_binding
		};
	}

	class CekOngkir extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$2, safe_not_equal, ["show"]);
		}

		get show() {
			throw new Error("<CekOngkir>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set show(value) {
			throw new Error("<CekOngkir>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/ModalKuis.svelte generated by Svelte v3.4.2 */

	const file$3 = "src/components/ModalKuis.svelte";

	// (2:3) {#if loading.get_soal}
	function create_if_block_7$1(ctx) {
		var current;

		var loading_1 = new Loading({ $$inline: true });

		return {
			c: function create() {
				loading_1.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(loading_1, target, anchor);
				current = true;
			},

			i: function intro(local) {
				if (current) return;
				loading_1.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				loading_1.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				loading_1.$destroy(detaching);
			}
		};
	}

	// (5:3) {#if list_soal.length > 0}
	function create_if_block$2(ctx) {
		var div1, h3, t0_value = ctx.list_soal[ctx.current_soal].question, t0, t1, input, t2, t3, div0, t4, t5, current, dispose;

		var if_block0 = (!ctx.display_result) && create_if_block_4$1(ctx);

		var if_block1 = (!ctx.loading.periksa && !ctx.display_result) && create_if_block_3$1(ctx);

		var if_block2 = (ctx.loading.periksa) && create_if_block_2$1(ctx);

		var if_block3 = (ctx.display_result) && create_if_block_1$1(ctx);

		return {
			c: function create() {
				div1 = element("div");
				h3 = element("h3");
				t0 = text(t0_value);
				t1 = space();
				input = element("input");
				t2 = space();
				if (if_block0) if_block0.c();
				t3 = space();
				div0 = element("div");
				if (if_block1) if_block1.c();
				t4 = space();
				if (if_block2) if_block2.c();
				t5 = space();
				if (if_block3) if_block3.c();
				h3.className = "uk-text-center";
				add_location(h3, file$3, 6, 6, 134);
				input.className = "uk-input";
				input.placeholder = "jawaban";
				add_location(input, file$3, 10, 6, 231);
				div0.className = "uk-flex uk-flex-center";
				set_style(div0, "margin-top", "24px");
				add_location(div0, file$3, 23, 6, 767);
				add_location(div1, file$3, 5, 3, 121);
				dispose = listen(input, "input", ctx.input_input_handler);
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, h3);
				append(h3, t0);
				append(div1, t1);
				append(div1, input);

				input.value = ctx.list_jawaban[ctx.current_soal];

				append(div1, t2);
				if (if_block0) if_block0.m(div1, null);
				append(div1, t3);
				append(div1, div0);
				if (if_block1) if_block1.m(div0, null);
				append(div0, t4);
				if (if_block2) if_block2.m(div0, null);
				append(div1, t5);
				if (if_block3) if_block3.m(div1, null);
				current = true;
			},

			p: function update(changed, ctx) {
				if ((!current || changed.list_soal || changed.current_soal) && t0_value !== (t0_value = ctx.list_soal[ctx.current_soal].question)) {
					set_data(t0, t0_value);
				}

				if ((changed.list_jawaban || changed.current_soal) && (input.value !== ctx.list_jawaban[ctx.current_soal])) input.value = ctx.list_jawaban[ctx.current_soal];

				if (!ctx.display_result) {
					if (if_block0) {
						if_block0.p(changed, ctx);
					} else {
						if_block0 = create_if_block_4$1(ctx);
						if_block0.c();
						if_block0.m(div1, t3);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (!ctx.loading.periksa && !ctx.display_result) {
					if (if_block1) {
						if_block1.p(changed, ctx);
					} else {
						if_block1 = create_if_block_3$1(ctx);
						if_block1.c();
						if_block1.m(div0, t4);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (ctx.loading.periksa) {
					if (!if_block2) {
						if_block2 = create_if_block_2$1(ctx);
						if_block2.c();
						if_block2.i(1);
						if_block2.m(div0, null);
					} else {
										if_block2.i(1);
					}
				} else if (if_block2) {
					group_outros();
					on_outro(() => {
						if_block2.d(1);
						if_block2 = null;
					});

					if_block2.o(1);
					check_outros();
				}

				if (ctx.display_result) {
					if (if_block3) {
						if_block3.p(changed, ctx);
					} else {
						if_block3 = create_if_block_1$1(ctx);
						if_block3.c();
						if_block3.m(div1, null);
					}
				} else if (if_block3) {
					if_block3.d(1);
					if_block3 = null;
				}
			},

			i: function intro(local) {
				if (current) return;
				if (if_block2) if_block2.i();
				current = true;
			},

			o: function outro(local) {
				if (if_block2) if_block2.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
				if (if_block2) if_block2.d();
				if (if_block3) if_block3.d();
				dispose();
			}
		};
	}

	// (13:6) {#if !display_result}
	function create_if_block_4$1(ctx) {
		var div, t;

		var if_block0 = (ctx.current_soal != 0) && create_if_block_6$1(ctx);

		var if_block1 = (ctx.current_soal != ctx.list_soal.length - 1) && create_if_block_5$1(ctx);

		return {
			c: function create() {
				div = element("div");
				if (if_block0) if_block0.c();
				t = space();
				if (if_block1) if_block1.c();
				div.className = "uk-flex uk-flex-center";
				set_style(div, "margin-top", "24px");
				add_location(div, file$3, 13, 6, 358);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				if (if_block0) if_block0.m(div, null);
				append(div, t);
				if (if_block1) if_block1.m(div, null);
			},

			p: function update(changed, ctx) {
				if (ctx.current_soal != 0) {
					if (if_block0) {
						if_block0.p(changed, ctx);
					} else {
						if_block0 = create_if_block_6$1(ctx);
						if_block0.c();
						if_block0.m(div, t);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (ctx.current_soal != ctx.list_soal.length - 1) {
					if (if_block1) {
						if_block1.p(changed, ctx);
					} else {
						if_block1 = create_if_block_5$1(ctx);
						if_block1.c();
						if_block1.m(div, null);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
			}
		};
	}

	// (15:9) {#if current_soal != 0}
	function create_if_block_6$1(ctx) {
		var button, dispose;

		return {
			c: function create() {
				button = element("button");
				button.textContent = "Sebelumnya";
				button.className = "uk-button uk-button-default";
				add_location(button, file$3, 15, 9, 465);
				dispose = listen(button, "click", ctx.prev_soal);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	// (18:9) {#if current_soal != list_soal.length - 1}
	function create_if_block_5$1(ctx) {
		var button, dispose;

		return {
			c: function create() {
				button = element("button");
				button.textContent = "Selanjutnya";
				button.className = "uk-button uk-button-default";
				add_location(button, file$3, 18, 9, 629);
				dispose = listen(button, "click", ctx.next_soal);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	// (25:9) {#if !loading.periksa && !display_result}
	function create_if_block_3$1(ctx) {
		var button, dispose;

		return {
			c: function create() {
				button = element("button");
				button.textContent = "submit";
				button.className = "uk-button uk-button-default";
				add_location(button, file$3, 25, 9, 892);
				dispose = listen(button, "click", ctx.periksa_jawaban);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	// (30:9) {#if loading.periksa}
	function create_if_block_2$1(ctx) {
		var current;

		var loading_1 = new Loading({ $$inline: true });

		return {
			c: function create() {
				loading_1.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(loading_1, target, anchor);
				current = true;
			},

			i: function intro(local) {
				if (current) return;
				loading_1.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				loading_1.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				loading_1.$destroy(detaching);
			}
		};
	}

	// (35:6) {#if display_result}
	function create_if_block_1$1(ctx) {
		var div, h3, t1, h1, t2_value = parseInt(ctx.skor), t2, t3;

		return {
			c: function create() {
				div = element("div");
				h3 = element("h3");
				h3.textContent = "Skor Kamu";
				t1 = space();
				h1 = element("h1");
				t2 = text(t2_value);
				t3 = text(" dari 100");
				h3.className = "ws-title uk-text-center";
				add_location(h3, file$3, 36, 9, 1212);
				h1.className = "uk-text-center";
				add_location(h1, file$3, 37, 9, 1273);
				div.className = "uk-width-1-1";
				set_style(div, "margin-top", "24px");
				add_location(div, file$3, 35, 6, 1149);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, h3);
				append(div, t1);
				append(div, h1);
				append(h1, t2);
				append(h1, t3);
			},

			p: function update(changed, ctx) {
				if ((changed.skor) && t2_value !== (t2_value = parseInt(ctx.skor))) {
					set_data(t2, t2_value);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (1:0) <Modal bind:show={show}>
	function create_default_slot$1(ctx) {
		var t, if_block1_anchor, current;

		var if_block0 = (ctx.loading.get_soal) && create_if_block_7$1(ctx);

		var if_block1 = (ctx.list_soal.length > 0) && create_if_block$2(ctx);

		return {
			c: function create() {
				if (if_block0) if_block0.c();
				t = space();
				if (if_block1) if_block1.c();
				if_block1_anchor = empty();
			},

			m: function mount(target, anchor) {
				if (if_block0) if_block0.m(target, anchor);
				insert(target, t, anchor);
				if (if_block1) if_block1.m(target, anchor);
				insert(target, if_block1_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.loading.get_soal) {
					if (!if_block0) {
						if_block0 = create_if_block_7$1(ctx);
						if_block0.c();
						if_block0.i(1);
						if_block0.m(t.parentNode, t);
					} else {
										if_block0.i(1);
					}
				} else if (if_block0) {
					group_outros();
					on_outro(() => {
						if_block0.d(1);
						if_block0 = null;
					});

					if_block0.o(1);
					check_outros();
				}

				if (ctx.list_soal.length > 0) {
					if (if_block1) {
						if_block1.p(changed, ctx);
						if_block1.i(1);
					} else {
						if_block1 = create_if_block$2(ctx);
						if_block1.c();
						if_block1.i(1);
						if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
					}
				} else if (if_block1) {
					group_outros();
					on_outro(() => {
						if_block1.d(1);
						if_block1 = null;
					});

					if_block1.o(1);
					check_outros();
				}
			},

			i: function intro(local) {
				if (current) return;
				if (if_block0) if_block0.i();
				if (if_block1) if_block1.i();
				current = true;
			},

			o: function outro(local) {
				if (if_block0) if_block0.o();
				if (if_block1) if_block1.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (if_block0) if_block0.d(detaching);

				if (detaching) {
					detach(t);
				}

				if (if_block1) if_block1.d(detaching);

				if (detaching) {
					detach(if_block1_anchor);
				}
			}
		};
	}

	function create_fragment$3(ctx) {
		var updating_show, current;

		function modal_show_binding(value) {
			ctx.modal_show_binding.call(null, value);
			updating_show = true;
			add_flush_callback(() => updating_show = false);
		}

		let modal_props = {
			$$slots: { default: [create_default_slot$1] },
			$$scope: { ctx }
		};
		if (ctx.show !== void 0) {
			modal_props.show = ctx.show;
		}
		var modal = new Modal({ props: modal_props, $$inline: true });

		add_binding_callback(() => bind(modal, 'show', modal_show_binding));

		return {
			c: function create() {
				modal.$$.fragment.c();
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				mount_component(modal, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var modal_changes = {};
				if (changed.$$scope || changed.list_soal || changed.display_result || changed.skor || changed.loading || changed.current_soal || changed.list_jawaban) modal_changes.$$scope = { changed, ctx };
				if (!updating_show && changed.show) {
					modal_changes.show = ctx.show;
				}
				modal.$set(modal_changes);
			},

			i: function intro(local) {
				if (current) return;
				modal.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				modal.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				modal.$destroy(detaching);
			}
		};
	}

	function instance$2($$self, $$props, $$invalidate) {
		

	   let { show = false } = $$props;
	   const loading = {
	      get_soal: false,
	      periksa: false
	   };
	   let display_result = false;

	   var list_soal = [];
	   var list_jawaban = {};
	   var current_soal = 0;
	   var skor = 0;

	   function get_soal(){
	      loading.get_soal = true; $$invalidate('loading', loading);
	      fetch('/service/kuis/list-soal').then(result => result.json()).then(result => {
	         loading.get_soal = false; $$invalidate('loading', loading);
	         $$invalidate('list_soal', list_soal = result.data);

	         for(var index in list_soal){
	            list_jawaban[index] = ''; $$invalidate('list_jawaban', list_jawaban);
	         }

	         console.log(list_jawaban);
	      }).catch(error => {
	         loading.get_soal = false; $$invalidate('loading', loading);
	         console.log(error);
	      });
	   }

	   function next_soal(){
	      if(current_soal === list_soal.length - 1){
	         return;
	      }

	      current_soal++; $$invalidate('current_soal', current_soal);
	   }

	   function prev_soal(){
	      if(current_soal === 0){
	         return;
	      }

	      current_soal--; $$invalidate('current_soal', current_soal);
	   }

	   function periksa_jawaban(){
	      var array_jawaban = [];

	      for(var key in list_jawaban){
	         array_jawaban.push(list_jawaban[key]);
	      }
	      
	      var request_body = {
	         jawaban: array_jawaban
	      };

	      loading.periksa = true; $$invalidate('loading', loading);
	      fetch('/service/kuis/periksa', {
	         method: 'POST',
	         headers: { 'Content-Type': 'application/json' },
	         body: JSON.stringify(request_body)
	      }).then(result => {
	         return result.json();
	      }).then(result => {
	         loading.periksa = false; $$invalidate('loading', loading);
	         $$invalidate('skor', skor = result.data);
	         $$invalidate('display_result', display_result = true);
	      }).catch(error => {
	         loading.periksa = false; $$invalidate('loading', loading);
	         console.log(error);
	      });
	   }

	   onMount(() => {
	      get_soal();
	   });

		function input_input_handler() {
			list_jawaban[current_soal] = this.value;
			$$invalidate('list_jawaban', list_jawaban);
			$$invalidate('current_soal', current_soal);
		}

		function modal_show_binding(value) {
			show = value;
			$$invalidate('show', show);
		}

		$$self.$set = $$props => {
			if ('show' in $$props) $$invalidate('show', show = $$props.show);
		};

		return {
			show,
			loading,
			display_result,
			list_soal,
			list_jawaban,
			current_soal,
			skor,
			next_soal,
			prev_soal,
			periksa_jawaban,
			input_input_handler,
			modal_show_binding
		};
	}

	class ModalKuis extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$3, safe_not_equal, ["show"]);
		}

		get show() {
			throw new Error("<ModalKuis>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set show(value) {
			throw new Error("<ModalKuis>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/pages/Home.svelte generated by Svelte v3.4.2 */

	const file$4 = "src/pages/Home.svelte";

	// (67:9) {#if !loading.topup && !topup_status.success && !topup_status.failed}
	function create_if_block_19(ctx) {
		var div6, div0, uk_button0, t1, div1, uk_button1, t3, div2, uk_button2, t5, div3, uk_button3, t7, div4, uk_button4, t9, div5, uk_button5, dispose;

		return {
			c: function create() {
				div6 = element("div");
				div0 = element("div");
				uk_button0 = element("uk-button");
				uk_button0.textContent = "Rp. 50,0000.00";
				t1 = space();
				div1 = element("div");
				uk_button1 = element("uk-button");
				uk_button1.textContent = "Rp. 300,0000.00";
				t3 = space();
				div2 = element("div");
				uk_button2 = element("uk-button");
				uk_button2.textContent = "Rp. 100,0000.00";
				t5 = space();
				div3 = element("div");
				uk_button3 = element("uk-button");
				uk_button3.textContent = "Rp. 500,0000.00";
				t7 = space();
				div4 = element("div");
				uk_button4 = element("uk-button");
				uk_button4.textContent = "Rp. 200,0000.00";
				t9 = space();
				div5 = element("div");
				uk_button5 = element("uk-button");
				uk_button5.textContent = "Rp. 1,000,0000.00";
				uk_button0.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button0, file$4, 69, 15, 3315);
				div0.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div0, "padding", "4px");
				add_location(div0, file$4, 68, 12, 3233);
				uk_button1.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button1, file$4, 74, 15, 3599);
				div1.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div1, "padding", "4px");
				add_location(div1, file$4, 73, 12, 3517);
				uk_button2.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button2, file$4, 79, 15, 3885);
				div2.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div2, "padding", "4px");
				add_location(div2, file$4, 78, 12, 3803);
				uk_button3.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button3, file$4, 84, 15, 4172);
				div3.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div3, "padding", "4px");
				add_location(div3, file$4, 83, 12, 4090);
				uk_button4.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button4, file$4, 89, 15, 4459);
				div4.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div4, "padding", "4px");
				add_location(div4, file$4, 88, 12, 4377);
				uk_button5.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button5, file$4, 94, 15, 4746);
				div5.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div5, "padding", "4px");
				add_location(div5, file$4, 93, 12, 4664);
				attr(div6, "uk-grid", "");
				add_location(div6, file$4, 67, 9, 3206);

				dispose = [
					listen(uk_button0, "click", ctx.click_handler_4),
					listen(uk_button1, "click", ctx.click_handler_5),
					listen(uk_button2, "click", ctx.click_handler_6),
					listen(uk_button3, "click", ctx.click_handler_7),
					listen(uk_button4, "click", ctx.click_handler_8),
					listen(uk_button5, "click", ctx.click_handler_9)
				];
			},

			m: function mount(target, anchor) {
				insert(target, div6, anchor);
				append(div6, div0);
				append(div0, uk_button0);
				append(div6, t1);
				append(div6, div1);
				append(div1, uk_button1);
				append(div6, t3);
				append(div6, div2);
				append(div2, uk_button2);
				append(div6, t5);
				append(div6, div3);
				append(div3, uk_button3);
				append(div6, t7);
				append(div6, div4);
				append(div4, uk_button4);
				append(div6, t9);
				append(div6, div5);
				append(div5, uk_button5);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div6);
				}

				run_all(dispose);
			}
		};
	}

	// (102:9) {#if loading.topup}
	function create_if_block_18(ctx) {
		var current;

		var loading_1 = new Loading({ $$inline: true });

		return {
			c: function create() {
				loading_1.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(loading_1, target, anchor);
				current = true;
			},

			i: function intro(local) {
				if (current) return;
				loading_1.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				loading_1.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				loading_1.$destroy(detaching);
			}
		};
	}

	// (107:9) {#if topup_status.success}
	function create_if_block_17(ctx) {
		var div1, div0, h3;

		return {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				h3 = element("h3");
				h3.textContent = "Topup Sucess";
				h3.className = "uk-text-success uk-text-center";
				add_location(h3, file$4, 109, 15, 5228);
				div0.className = "uk-card-body";
				add_location(div0, file$4, 108, 12, 5185);
				div1.className = "uk-card uk-card-default";
				add_location(div1, file$4, 107, 9, 5134);
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				append(div0, h3);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}
			}
		};
	}

	// (117:9) {#if topup_status.failed}
	function create_if_block_16(ctx) {
		var div1, div0, h3;

		return {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				h3 = element("h3");
				h3.textContent = "Topup Failed";
				h3.className = "uk-text-danger uk-text-center";
				add_location(h3, file$4, 119, 15, 5539);
				div0.className = "uk-card-body";
				add_location(div0, file$4, 118, 12, 5496);
				div1.className = "uk-card uk-card-default";
				add_location(div1, file$4, 117, 9, 5445);
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				append(div0, h3);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}
			}
		};
	}

	// (57:6) <Modal bind:show={modal.topup}>
	function create_default_slot_3(ctx) {
		var h4, b0, t1, div, span, b1, t3, h2, b2, t4, t5_value = ctx.account_data.str_balance, t5, t6, t7, t8, t9, t10, if_block3_anchor, current;

		var if_block0 = (!ctx.loading.topup && !ctx.topup_status.success && !ctx.topup_status.failed) && create_if_block_19(ctx);

		var if_block1 = (ctx.loading.topup) && create_if_block_18(ctx);

		var if_block2 = (ctx.topup_status.success) && create_if_block_17(ctx);

		var if_block3 = (ctx.topup_status.failed) && create_if_block_16(ctx);

		return {
			c: function create() {
				h4 = element("h4");
				b0 = element("b");
				b0.textContent = "TOP UP";
				t1 = space();
				div = element("div");
				span = element("span");
				b1 = element("b");
				b1.textContent = "Your balance:";
				t3 = space();
				h2 = element("h2");
				b2 = element("b");
				t4 = text("Rp. ");
				t5 = text(t5_value);
				t6 = text(".00");
				t7 = space();
				if (if_block0) if_block0.c();
				t8 = space();
				if (if_block1) if_block1.c();
				t9 = space();
				if (if_block2) if_block2.c();
				t10 = space();
				if (if_block3) if_block3.c();
				if_block3_anchor = empty();
				add_location(b0, file$4, 58, 12, 2896);
				h4.className = "uk-text-center";
				add_location(h4, file$4, 57, 9, 2855);
				add_location(b1, file$4, 62, 35, 3006);
				span.className = "ws-title";
				add_location(span, file$4, 62, 12, 2983);
				add_location(b2, file$4, 63, 16, 3051);
				add_location(h2, file$4, 63, 12, 3047);
				div.className = "uk-text-center";
				add_location(div, file$4, 61, 9, 2941);
			},

			m: function mount(target, anchor) {
				insert(target, h4, anchor);
				append(h4, b0);
				insert(target, t1, anchor);
				insert(target, div, anchor);
				append(div, span);
				append(span, b1);
				append(div, t3);
				append(div, h2);
				append(h2, b2);
				append(b2, t4);
				append(b2, t5);
				append(b2, t6);
				insert(target, t7, anchor);
				if (if_block0) if_block0.m(target, anchor);
				insert(target, t8, anchor);
				if (if_block1) if_block1.m(target, anchor);
				insert(target, t9, anchor);
				if (if_block2) if_block2.m(target, anchor);
				insert(target, t10, anchor);
				if (if_block3) if_block3.m(target, anchor);
				insert(target, if_block3_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if ((!current || changed.account_data) && t5_value !== (t5_value = ctx.account_data.str_balance)) {
					set_data(t5, t5_value);
				}

				if (!ctx.loading.topup && !ctx.topup_status.success && !ctx.topup_status.failed) {
					if (!if_block0) {
						if_block0 = create_if_block_19(ctx);
						if_block0.c();
						if_block0.m(t8.parentNode, t8);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (ctx.loading.topup) {
					if (!if_block1) {
						if_block1 = create_if_block_18(ctx);
						if_block1.c();
						if_block1.i(1);
						if_block1.m(t9.parentNode, t9);
					} else {
										if_block1.i(1);
					}
				} else if (if_block1) {
					group_outros();
					on_outro(() => {
						if_block1.d(1);
						if_block1 = null;
					});

					if_block1.o(1);
					check_outros();
				}

				if (ctx.topup_status.success) {
					if (!if_block2) {
						if_block2 = create_if_block_17(ctx);
						if_block2.c();
						if_block2.m(t10.parentNode, t10);
					}
				} else if (if_block2) {
					if_block2.d(1);
					if_block2 = null;
				}

				if (ctx.topup_status.failed) {
					if (!if_block3) {
						if_block3 = create_if_block_16(ctx);
						if_block3.c();
						if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
					}
				} else if (if_block3) {
					if_block3.d(1);
					if_block3 = null;
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
					detach(h4);
					detach(t1);
					detach(div);
					detach(t7);
				}

				if (if_block0) if_block0.d(detaching);

				if (detaching) {
					detach(t8);
				}

				if (if_block1) if_block1.d(detaching);

				if (detaching) {
					detach(t9);
				}

				if (if_block2) if_block2.d(detaching);

				if (detaching) {
					detach(t10);
				}

				if (if_block3) if_block3.d(detaching);

				if (detaching) {
					detach(if_block3_anchor);
				}
			}
		};
	}

	// (132:9) {#if payment.display_error}
	function create_if_block_15(ctx) {
		var div, p, t0, t1_value = ctx.payment.error_message, t1, t2;

		return {
			c: function create() {
				div = element("div");
				p = element("p");
				t0 = text("Error: ");
				t1 = text(t1_value);
				t2 = text("!");
				add_location(p, file$4, 133, 12, 5926);
				div.className = "uk-alert-danger";
				attr(div, "uk-alert", "");
				add_location(div, file$4, 132, 9, 5874);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, p);
				append(p, t0);
				append(p, t1);
				append(p, t2);
			},

			p: function update(changed, ctx) {
				if ((changed.payment) && t1_value !== (t1_value = ctx.payment.error_message)) {
					set_data(t1, t1_value);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (138:9) {#if payment.display_success}
	function create_if_block_14(ctx) {
		var div, p;

		return {
			c: function create() {
				div = element("div");
				p = element("p");
				p.textContent = "Payment success.";
				add_location(p, file$4, 139, 12, 6103);
				div.className = "uk-alert-success";
				attr(div, "uk-alert", "");
				add_location(div, file$4, 138, 9, 6050);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, p);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (155:9) {#if !payment.display_data}
	function create_if_block_13(ctx) {
		var div, h5, t1, input, t2, button, dispose;

		return {
			c: function create() {
				div = element("div");
				h5 = element("h5");
				h5.textContent = "FILL PAYMENT DETAILS";
				t1 = space();
				input = element("input");
				t2 = space();
				button = element("button");
				button.textContent = "CHECK";
				add_location(h5, file$4, 156, 12, 6561);
				input.className = "uk-input";
				input.placeholder = "enter payment code";
				add_location(input, file$4, 157, 12, 6604);
				button.className = "uk-button uk-button-default ws-blue-btn";
				set_style(button, "margin-top", "12px");
				add_location(button, file$4, 159, 12, 6703);
				div.className = "uk-text-center";
				add_location(div, file$4, 155, 9, 6519);

				dispose = [
					listen(input, "input", ctx.input_input_handler),
					listen(button, "click", ctx.do_check_payment)
				];
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, h5);
				append(div, t1);
				append(div, input);

				input.value = ctx.payment.code;

				append(div, t2);
				append(div, button);
			},

			p: function update(changed, ctx) {
				if (changed.payment && (input.value !== ctx.payment.code)) input.value = ctx.payment.code;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				run_all(dispose);
			}
		};
	}

	// (164:9) {#if payment.display_data}
	function create_if_block_8$1(ctx) {
		var div2, div1, span0, t1, h3, t2_value = ctx.payment.data.publisher, t2, t3, span1, t5, h2, t6, t7_value = ctx.Number.parseInt(ctx.payment.data.amount).toLocaleString(), t7, t8, t9, div0, t10, t11, current;

		var if_block0 = (!ctx.payment.loading_pay && !ctx.payment.complete) && create_if_block_11(ctx);

		var if_block1 = (ctx.payment.loading_pay) && create_if_block_10$1(ctx);

		var if_block2 = (ctx.payment.complete && ctx.payment.is_redirect) && create_if_block_9$1(ctx);

		return {
			c: function create() {
				div2 = element("div");
				div1 = element("div");
				span0 = element("span");
				span0.textContent = "Issued by";
				t1 = space();
				h3 = element("h3");
				t2 = text(t2_value);
				t3 = space();
				span1 = element("span");
				span1.textContent = "amount";
				t5 = space();
				h2 = element("h2");
				t6 = text("Rp. ");
				t7 = text(t7_value);
				t8 = text(",00");
				t9 = space();
				div0 = element("div");
				if (if_block0) if_block0.c();
				t10 = space();
				if (if_block1) if_block1.c();
				t11 = space();
				if (if_block2) if_block2.c();
				add_location(span0, file$4, 166, 15, 7015);
				add_location(h3, file$4, 167, 15, 7054);
				add_location(span1, file$4, 168, 15, 7104);
				add_location(h2, file$4, 169, 15, 7140);
				div0.className = "uk-align-center";
				add_location(div0, file$4, 171, 15, 7230);
				div1.className = "uk-width-1-1 uk-text-center";
				add_location(div1, file$4, 165, 12, 6957);
				div2.className = "uk-card uk-card-body";
				add_location(div2, file$4, 164, 9, 6909);
			},

			m: function mount(target, anchor) {
				insert(target, div2, anchor);
				append(div2, div1);
				append(div1, span0);
				append(div1, t1);
				append(div1, h3);
				append(h3, t2);
				append(div1, t3);
				append(div1, span1);
				append(div1, t5);
				append(div1, h2);
				append(h2, t6);
				append(h2, t7);
				append(h2, t8);
				append(div1, t9);
				append(div1, div0);
				if (if_block0) if_block0.m(div0, null);
				append(div0, t10);
				if (if_block1) if_block1.m(div0, null);
				append(div0, t11);
				if (if_block2) if_block2.m(div0, null);
				current = true;
			},

			p: function update(changed, ctx) {
				if ((!current || changed.payment) && t2_value !== (t2_value = ctx.payment.data.publisher)) {
					set_data(t2, t2_value);
				}

				if ((!current || changed.payment) && t7_value !== (t7_value = ctx.Number.parseInt(ctx.payment.data.amount).toLocaleString())) {
					set_data(t7, t7_value);
				}

				if (!ctx.payment.loading_pay && !ctx.payment.complete) {
					if (if_block0) {
						if_block0.p(changed, ctx);
					} else {
						if_block0 = create_if_block_11(ctx);
						if_block0.c();
						if_block0.m(div0, t10);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (ctx.payment.loading_pay) {
					if (!if_block1) {
						if_block1 = create_if_block_10$1(ctx);
						if_block1.c();
						if_block1.i(1);
						if_block1.m(div0, t11);
					} else {
										if_block1.i(1);
					}
				} else if (if_block1) {
					group_outros();
					on_outro(() => {
						if_block1.d(1);
						if_block1 = null;
					});

					if_block1.o(1);
					check_outros();
				}

				if (ctx.payment.complete && ctx.payment.is_redirect) {
					if (if_block2) {
						if_block2.p(changed, ctx);
					} else {
						if_block2 = create_if_block_9$1(ctx);
						if_block2.c();
						if_block2.m(div0, null);
					}
				} else if (if_block2) {
					if_block2.d(1);
					if_block2 = null;
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
					detach(div2);
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
				if (if_block2) if_block2.d();
			}
		};
	}

	// (173:18) {#if !payment.loading_pay && !payment.complete}
	function create_if_block_11(ctx) {
		var div;

		function select_block_type(ctx) {
			if (ctx.payment.data.amount < ctx.account_data.balance) return create_if_block_12;
			return create_else_block_1;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type(ctx);

		return {
			c: function create() {
				div = element("div");
				if_block.c();
				add_location(div, file$4, 173, 21, 7349);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				if_block.m(div, null);
			},

			p: function update(changed, ctx) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);
					if (if_block) {
						if_block.c();
						if_block.m(div, null);
					}
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				if_block.d();
			}
		};
	}

	// (179:24) {:else}
	function create_else_block_1(ctx) {
		var h3, t_1, button, dispose;

		return {
			c: function create() {
				h3 = element("h3");
				h3.textContent = "insufficient balance, please topup";
				t_1 = space();
				button = element("button");
				button.textContent = "TOPUP";
				h3.className = "uk-text-danger ws-title";
				add_location(h3, file$4, 179, 24, 7658);
				button.className = "uk-button uk-button-default ws-blue-btn";
				add_location(button, file$4, 180, 24, 7759);
				dispose = listen(button, "click", ctx.do_topup_from_payment);
			},

			m: function mount(target, anchor) {
				insert(target, h3, anchor);
				insert(target, t_1, anchor);
				insert(target, button, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(h3);
					detach(t_1);
					detach(button);
				}

				dispose();
			}
		};
	}

	// (175:24) {#if payment.data.amount < account_data.balance}
	function create_if_block_12(ctx) {
		var button, dispose;

		return {
			c: function create() {
				button = element("button");
				button.textContent = "PAY";
				button.className = "uk-button uk-button-default ws-blue-btn";
				add_location(button, file$4, 175, 24, 7454);
				dispose = listen(button, "click", ctx.do_payment);
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	// (187:18) {#if payment.loading_pay}
	function create_if_block_10$1(ctx) {
		var current;

		var loading_1 = new Loading({ $$inline: true });

		return {
			c: function create() {
				loading_1.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(loading_1, target, anchor);
				current = true;
			},

			i: function intro(local) {
				if (current) return;
				loading_1.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				loading_1.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				loading_1.$destroy(detaching);
			}
		};
	}

	// (190:18) {#if payment.complete && payment.is_redirect}
	function create_if_block_9$1(ctx) {
		var span, t0, t1_value = ctx.payment.timer, t1, t2;

		return {
			c: function create() {
				span = element("span");
				t0 = text("Redirect in ");
				t1 = text(t1_value);
				t2 = text("...");
				span.className = "uk-text-center";
				add_location(span, file$4, 190, 21, 8202);
			},

			m: function mount(target, anchor) {
				insert(target, span, anchor);
				append(span, t0);
				append(span, t1);
				append(span, t2);
			},

			p: function update(changed, ctx) {
				if ((changed.payment) && t1_value !== (t1_value = ctx.payment.timer)) {
					set_data(t1, t1_value);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(span);
				}
			}
		};
	}

	// (129:6) <Modal bind:show={modal.do_payment}>
	function create_default_slot_2(ctx) {
		var t0, t1, h4, b0, t3, div, span, b1, t5, h2, b2, t6, t7_value = ctx.account_data.str_balance, t7, t8, t9, t10, if_block3_anchor, current;

		var if_block0 = (ctx.payment.display_error) && create_if_block_15(ctx);

		var if_block1 = (ctx.payment.display_success) && create_if_block_14(ctx);

		var if_block2 = (!ctx.payment.display_data) && create_if_block_13(ctx);

		var if_block3 = (ctx.payment.display_data) && create_if_block_8$1(ctx);

		return {
			c: function create() {
				if (if_block0) if_block0.c();
				t0 = space();
				if (if_block1) if_block1.c();
				t1 = space();
				h4 = element("h4");
				b0 = element("b");
				b0.textContent = "DO PAYMENT";
				t3 = space();
				div = element("div");
				span = element("span");
				b1 = element("b");
				b1.textContent = "Your balance:";
				t5 = space();
				h2 = element("h2");
				b2 = element("b");
				t6 = text("Rp. ");
				t7 = text(t7_value);
				t8 = text(".00");
				t9 = space();
				if (if_block2) if_block2.c();
				t10 = space();
				if (if_block3) if_block3.c();
				if_block3_anchor = empty();
				add_location(b0, file$4, 146, 12, 6247);
				h4.className = "uk-text-center";
				add_location(h4, file$4, 145, 9, 6206);
				add_location(b1, file$4, 150, 35, 6361);
				span.className = "ws-title";
				add_location(span, file$4, 150, 12, 6338);
				add_location(b2, file$4, 151, 16, 6406);
				add_location(h2, file$4, 151, 12, 6402);
				div.className = "uk-text-center";
				add_location(div, file$4, 149, 9, 6296);
			},

			m: function mount(target, anchor) {
				if (if_block0) if_block0.m(target, anchor);
				insert(target, t0, anchor);
				if (if_block1) if_block1.m(target, anchor);
				insert(target, t1, anchor);
				insert(target, h4, anchor);
				append(h4, b0);
				insert(target, t3, anchor);
				insert(target, div, anchor);
				append(div, span);
				append(span, b1);
				append(div, t5);
				append(div, h2);
				append(h2, b2);
				append(b2, t6);
				append(b2, t7);
				append(b2, t8);
				insert(target, t9, anchor);
				if (if_block2) if_block2.m(target, anchor);
				insert(target, t10, anchor);
				if (if_block3) if_block3.m(target, anchor);
				insert(target, if_block3_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.payment.display_error) {
					if (if_block0) {
						if_block0.p(changed, ctx);
					} else {
						if_block0 = create_if_block_15(ctx);
						if_block0.c();
						if_block0.m(t0.parentNode, t0);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (ctx.payment.display_success) {
					if (!if_block1) {
						if_block1 = create_if_block_14(ctx);
						if_block1.c();
						if_block1.m(t1.parentNode, t1);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if ((!current || changed.account_data) && t7_value !== (t7_value = ctx.account_data.str_balance)) {
					set_data(t7, t7_value);
				}

				if (!ctx.payment.display_data) {
					if (if_block2) {
						if_block2.p(changed, ctx);
					} else {
						if_block2 = create_if_block_13(ctx);
						if_block2.c();
						if_block2.m(t10.parentNode, t10);
					}
				} else if (if_block2) {
					if_block2.d(1);
					if_block2 = null;
				}

				if (ctx.payment.display_data) {
					if (if_block3) {
						if_block3.p(changed, ctx);
						if_block3.i(1);
					} else {
						if_block3 = create_if_block_8$1(ctx);
						if_block3.c();
						if_block3.i(1);
						if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
					}
				} else if (if_block3) {
					group_outros();
					on_outro(() => {
						if_block3.d(1);
						if_block3 = null;
					});

					if_block3.o(1);
					check_outros();
				}
			},

			i: function intro(local) {
				if (current) return;
				if (if_block3) if_block3.i();
				current = true;
			},

			o: function outro(local) {
				if (if_block3) if_block3.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (if_block0) if_block0.d(detaching);

				if (detaching) {
					detach(t0);
				}

				if (if_block1) if_block1.d(detaching);

				if (detaching) {
					detach(t1);
					detach(h4);
					detach(t3);
					detach(div);
					detach(t9);
				}

				if (if_block2) if_block2.d(detaching);

				if (detaching) {
					detach(t10);
				}

				if (if_block3) if_block3.d(detaching);

				if (detaching) {
					detach(if_block3_anchor);
				}
			}
		};
	}

	// (211:9) {#if !loading.create_bill && !create_bill_status.success && !create_bill_status.fail}
	function create_if_block_6$2(ctx) {
		var div, h5, t1, input, t2, current_block_type_index, if_block, current, dispose;

		var if_block_creators = [
			create_if_block_7$2,
			create_else_block$1
		];

		var if_blocks = [];

		function select_block_type_1(ctx) {
			if (!ctx.loading.create_bill) return 0;
			return 1;
		}

		current_block_type_index = select_block_type_1(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		return {
			c: function create() {
				div = element("div");
				h5 = element("h5");
				h5.textContent = "FILL AMOUNT";
				t1 = space();
				input = element("input");
				t2 = space();
				if_block.c();
				add_location(h5, file$4, 212, 12, 8917);
				input.className = "uk-input uk-text-center";
				input.placeholder = "enter amount";
				attr(input, "type", "number");
				add_location(input, file$4, 213, 12, 8951);
				div.className = "uk-text-center";
				add_location(div, file$4, 211, 9, 8875);
				dispose = listen(input, "input", ctx.input_input_handler_1);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, h5);
				append(div, t1);
				append(div, input);

				input.value = ctx.create_bill_amount;

				append(div, t2);
				if_blocks[current_block_type_index].m(div, null);
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.create_bill_amount) input.value = ctx.create_bill_amount;

				var previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type_1(ctx);
				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(changed, ctx);
				} else {
					group_outros();
					on_outro(() => {
						if_blocks[previous_block_index].d(1);
						if_blocks[previous_block_index] = null;
					});
					if_block.o(1);
					check_outros();

					if_block = if_blocks[current_block_type_index];
					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}
					if_block.i(1);
					if_block.m(div, null);
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
				if (detaching) {
					detach(div);
				}

				if_blocks[current_block_type_index].d();
				dispose();
			}
		};
	}

	// (218:12) {:else}
	function create_else_block$1(ctx) {
		var current;

		var loading_1 = new Loading({ $$inline: true });

		return {
			c: function create() {
				loading_1.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(loading_1, target, anchor);
				current = true;
			},

			p: noop,

			i: function intro(local) {
				if (current) return;
				loading_1.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				loading_1.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				loading_1.$destroy(detaching);
			}
		};
	}

	// (216:12) {#if !loading.create_bill}
	function create_if_block_7$2(ctx) {
		var button, dispose;

		return {
			c: function create() {
				button = element("button");
				button.textContent = "CREATE";
				button.className = "uk-button uk-button-default ws-blue-btn";
				set_style(button, "margin-top", "12px");
				add_location(button, file$4, 216, 12, 9119);
				dispose = listen(button, "click", ctx.do_create_bill);
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

	// (224:9) {#if create_bill_status.success}
	function create_if_block_5$2(ctx) {
		var div1, div0, h5, span, t1, t2, input, dispose;

		return {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				h5 = element("h5");
				span = element("span");
				span.textContent = "Bill Created";
				t1 = text(", payment code:");
				t2 = space();
				input = element("input");
				span.className = "uk-text-success";
				add_location(span, file$4, 226, 19, 9520);
				add_location(h5, file$4, 226, 15, 9516);
				input.className = "uk-input uk-text-center";
				input.placeholder = "wallet token";
				input.disabled = true;
				add_location(input, file$4, 227, 15, 9606);
				div0.className = "uk-text-center";
				set_style(div0, "margin-top", "24px");
				add_location(div0, file$4, 225, 12, 9445);
				div1.className = "uk-text-center";
				add_location(div1, file$4, 224, 9, 9403);
				dispose = listen(input, "input", ctx.input_input_handler_2);
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				append(div0, h5);
				append(h5, span);
				append(h5, t1);
				append(div0, t2);
				append(div0, input);

				input.value = ctx.create_bill_status.payment_code;
			},

			p: function update(changed, ctx) {
				if (changed.create_bill_status && (input.value !== ctx.create_bill_status.payment_code)) input.value = ctx.create_bill_status.payment_code;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}

				dispose();
			}
		};
	}

	// (233:9) {#if create_bill_status.failed}
	function create_if_block_4$2(ctx) {
		var div1, div0, h3;

		return {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				h3 = element("h3");
				h3.textContent = "Failed to create bill";
				h3.className = "uk-text-danger uk-text-center";
				add_location(h3, file$4, 235, 15, 9928);
				div0.className = "uk-card-body";
				add_location(div0, file$4, 234, 12, 9885);
				div1.className = "uk-card uk-card-default";
				add_location(div1, file$4, 233, 9, 9834);
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				append(div0, h3);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}
			}
		};
	}

	// (201:6) <Modal bind:show={modal.publish_payment}>
	function create_default_slot_1(ctx) {
		var h4, b0, t1, div, span, b1, t3, h2, b2, t4, t5_value = ctx.account_data.str_balance, t5, t6, t7, t8, t9, if_block2_anchor, current;

		var if_block0 = (!ctx.loading.create_bill && !ctx.create_bill_status.success && !ctx.create_bill_status.fail) && create_if_block_6$2(ctx);

		var if_block1 = (ctx.create_bill_status.success) && create_if_block_5$2(ctx);

		var if_block2 = (ctx.create_bill_status.failed) && create_if_block_4$2(ctx);

		return {
			c: function create() {
				h4 = element("h4");
				b0 = element("b");
				b0.textContent = "PUBLISH BILL";
				t1 = space();
				div = element("div");
				span = element("span");
				b1 = element("b");
				b1.textContent = "Your balance:";
				t3 = space();
				h2 = element("h2");
				b2 = element("b");
				t4 = text("Rp. ");
				t5 = text(t5_value);
				t6 = text(".00");
				t7 = space();
				if (if_block0) if_block0.c();
				t8 = space();
				if (if_block1) if_block1.c();
				t9 = space();
				if (if_block2) if_block2.c();
				if_block2_anchor = empty();
				add_location(b0, file$4, 202, 12, 8543);
				h4.className = "uk-text-center";
				add_location(h4, file$4, 201, 9, 8502);
				add_location(b1, file$4, 206, 35, 8659);
				span.className = "ws-title";
				add_location(span, file$4, 206, 12, 8636);
				add_location(b2, file$4, 207, 16, 8704);
				add_location(h2, file$4, 207, 12, 8700);
				div.className = "uk-text-center";
				add_location(div, file$4, 205, 9, 8594);
			},

			m: function mount(target, anchor) {
				insert(target, h4, anchor);
				append(h4, b0);
				insert(target, t1, anchor);
				insert(target, div, anchor);
				append(div, span);
				append(span, b1);
				append(div, t3);
				append(div, h2);
				append(h2, b2);
				append(b2, t4);
				append(b2, t5);
				append(b2, t6);
				insert(target, t7, anchor);
				if (if_block0) if_block0.m(target, anchor);
				insert(target, t8, anchor);
				if (if_block1) if_block1.m(target, anchor);
				insert(target, t9, anchor);
				if (if_block2) if_block2.m(target, anchor);
				insert(target, if_block2_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if ((!current || changed.account_data) && t5_value !== (t5_value = ctx.account_data.str_balance)) {
					set_data(t5, t5_value);
				}

				if (!ctx.loading.create_bill && !ctx.create_bill_status.success && !ctx.create_bill_status.fail) {
					if (if_block0) {
						if_block0.p(changed, ctx);
						if_block0.i(1);
					} else {
						if_block0 = create_if_block_6$2(ctx);
						if_block0.c();
						if_block0.i(1);
						if_block0.m(t8.parentNode, t8);
					}
				} else if (if_block0) {
					group_outros();
					on_outro(() => {
						if_block0.d(1);
						if_block0 = null;
					});

					if_block0.o(1);
					check_outros();
				}

				if (ctx.create_bill_status.success) {
					if (if_block1) {
						if_block1.p(changed, ctx);
					} else {
						if_block1 = create_if_block_5$2(ctx);
						if_block1.c();
						if_block1.m(t9.parentNode, t9);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (ctx.create_bill_status.failed) {
					if (!if_block2) {
						if_block2 = create_if_block_4$2(ctx);
						if_block2.c();
						if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
					}
				} else if (if_block2) {
					if_block2.d(1);
					if_block2 = null;
				}
			},

			i: function intro(local) {
				if (current) return;
				if (if_block0) if_block0.i();
				current = true;
			},

			o: function outro(local) {
				if (if_block0) if_block0.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h4);
					detach(t1);
					detach(div);
					detach(t7);
				}

				if (if_block0) if_block0.d(detaching);

				if (detaching) {
					detach(t8);
				}

				if (if_block1) if_block1.d(detaching);

				if (detaching) {
					detach(t9);
				}

				if (if_block2) if_block2.d(detaching);

				if (detaching) {
					detach(if_block2_anchor);
				}
			}
		};
	}

	// (244:6) <Modal bind:show={modal.profile}>
	function create_default_slot$2(ctx) {
		var h4, b0, t1, div0, span, b1, t3, h2, b2, t4, t5_value = ctx.account_data.str_balance, t5, t6, t7, div1, h5, t9, input, dispose;

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
				t4 = text("Rp. ");
				t5 = text(t5_value);
				t6 = text(".00");
				t7 = space();
				div1 = element("div");
				h5 = element("h5");
				h5.textContent = "YOUR TOKEN";
				t9 = space();
				input = element("input");
				add_location(b0, file$4, 245, 12, 10210);
				h4.className = "uk-text-center";
				add_location(h4, file$4, 244, 9, 10169);
				add_location(b1, file$4, 249, 35, 10321);
				span.className = "ws-title";
				add_location(span, file$4, 249, 12, 10298);
				add_location(b2, file$4, 250, 16, 10366);
				add_location(h2, file$4, 250, 12, 10362);
				div0.className = "uk-text-center";
				add_location(div0, file$4, 248, 9, 10256);
				add_location(h5, file$4, 254, 12, 10483);
				input.className = "uk-input uk-text-center";
				input.placeholder = "wallet token";
				input.disabled = true;
				add_location(input, file$4, 255, 12, 10516);
				div1.className = "uk-text-center";
				add_location(div1, file$4, 253, 9, 10441);
				dispose = listen(input, "input", ctx.input_input_handler_3);
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
				append(b2, t4);
				append(b2, t5);
				append(b2, t6);
				insert(target, t7, anchor);
				insert(target, div1, anchor);
				append(div1, h5);
				append(div1, t9);
				append(div1, input);

				input.value = ctx.account_data.wallet_token;
			},

			p: function update(changed, ctx) {
				if ((changed.account_data) && t5_value !== (t5_value = ctx.account_data.str_balance)) {
					set_data(t5, t5_value);
				}

				if (changed.account_data && (input.value !== ctx.account_data.wallet_token)) input.value = ctx.account_data.wallet_token;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h4);
					detach(t1);
					detach(div0);
					detach(t7);
					detach(div1);
				}

				dispose();
			}
		};
	}

	// (314:6) {#if modal.cek_ongkir}
	function create_if_block_3$2(ctx) {
		var updating_show, current;

		function cekongkir_show_binding(value) {
			ctx.cekongkir_show_binding.call(null, value);
			updating_show = true;
			add_flush_callback(() => updating_show = false);
		}

		let cekongkir_props = {};
		if (ctx.modal.cek_ongkir !== void 0) {
			cekongkir_props.show = ctx.modal.cek_ongkir;
		}
		var cekongkir = new CekOngkir({ props: cekongkir_props, $$inline: true });

		add_binding_callback(() => bind(cekongkir, 'show', cekongkir_show_binding));

		return {
			c: function create() {
				cekongkir.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(cekongkir, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var cekongkir_changes = {};
				if (!updating_show && changed.modal) {
					cekongkir_changes.show = ctx.modal.cek_ongkir;
				}
				cekongkir.$set(cekongkir_changes);
			},

			i: function intro(local) {
				if (current) return;
				cekongkir.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				cekongkir.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				cekongkir.$destroy(detaching);
			}
		};
	}

	// (320:6) {#if modal.kuis}
	function create_if_block_2$2(ctx) {
		var updating_show, current;

		function modalkuis_show_binding(value) {
			ctx.modalkuis_show_binding.call(null, value);
			updating_show = true;
			add_flush_callback(() => updating_show = false);
		}

		let modalkuis_props = {};
		if (ctx.modal.kuis !== void 0) {
			modalkuis_props.show = ctx.modal.kuis;
		}
		var modalkuis = new ModalKuis({ props: modalkuis_props, $$inline: true });

		add_binding_callback(() => bind(modalkuis, 'show', modalkuis_show_binding));

		return {
			c: function create() {
				modalkuis.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(modalkuis, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var modalkuis_changes = {};
				if (!updating_show && changed.modal) {
					modalkuis_changes.show = ctx.modal.kuis;
				}
				modalkuis.$set(modalkuis_changes);
			},

			i: function intro(local) {
				if (current) return;
				modalkuis.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				modalkuis.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				modalkuis.$destroy(detaching);
			}
		};
	}

	// (327:9) {#if iklan.iklan_1.length > 0}
	function create_if_block_1$2(ctx) {
		var div, img, img_src_value;

		return {
			c: function create() {
				div = element("div");
				img = element("img");
				img.src = img_src_value = ctx.iklan.iklan_1;
				img.alt = "iklan";
				add_location(img, file$4, 328, 12, 14171);
				div.className = "uk-width-1-1@s uk-width-1-2@m";
				add_location(div, file$4, 327, 9, 14114);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, img);
			},

			p: function update(changed, ctx) {
				if ((changed.iklan) && img_src_value !== (img_src_value = ctx.iklan.iklan_1)) {
					img.src = img_src_value;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (332:9) {#if iklan.iklan_2.length > 0}
	function create_if_block$3(ctx) {
		var div, img, img_src_value;

		return {
			c: function create() {
				div = element("div");
				img = element("img");
				img.src = img_src_value = ctx.iklan.iklan_2;
				img.alt = "iklan";
				add_location(img, file$4, 333, 12, 14350);
				div.className = "uk-width-1-1@s uk-width-1-2@m";
				add_location(div, file$4, 332, 9, 14293);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, img);
			},

			p: function update(changed, ctx) {
				if ((changed.iklan) && img_src_value !== (img_src_value = ctx.iklan.iklan_2)) {
					img.src = img_src_value;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	function create_fragment$4(ctx) {
		var div32, div31, img0, t0, div7, div6, div5, div1, img1, t1, h30, t2, t3_value = ctx.account_data.name, t3, t4, t5, div0, span0, b0, t7, h2, b1, t8, t9_value = ctx.account_data.str_balance, t9, t10, t11, button0, t13, div4, div3, h31, t15, div2, button1, t17, button2, t19, button3, t21, div10, div8, img2, t22, div9, img3, t23, updating_show, t24, updating_show_1, t25, updating_show_2, t26, updating_show_3, t27, div28, div27, div26, div13, div12, div11, h4, t29, button4, t31, div25, h32, t33, div24, div18, div17, div16, h33, t35, div14, img4, t36, span1, t38, div15, img5, t39, span2, t41, div23, div22, div21, h34, t43, div19, img6, t44, span3, t46, div20, img7, t47, span4, t49, t50, t51, div30, t52, t53, div29, span5, t55, span6, current, dispose;

		function modal0_show_binding(value) {
			ctx.modal0_show_binding.call(null, value);
			updating_show = true;
			add_flush_callback(() => updating_show = false);
		}

		let modal0_props = {
			$$slots: { default: [create_default_slot_3] },
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
			$$slots: { default: [create_default_slot_2] },
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
			$$slots: { default: [create_default_slot_1] },
			$$scope: { ctx }
		};
		if (ctx.modal.publish_payment !== void 0) {
			modal2_props.show = ctx.modal.publish_payment;
		}
		var modal2 = new Modal({ props: modal2_props, $$inline: true });

		add_binding_callback(() => bind(modal2, 'show', modal2_show_binding));

		function modal3_show_binding(value_3) {
			ctx.modal3_show_binding.call(null, value_3);
			updating_show_3 = true;
			add_flush_callback(() => updating_show_3 = false);
		}

		let modal3_props = {
			$$slots: { default: [create_default_slot$2] },
			$$scope: { ctx }
		};
		if (ctx.modal.profile !== void 0) {
			modal3_props.show = ctx.modal.profile;
		}
		var modal3 = new Modal({ props: modal3_props, $$inline: true });

		add_binding_callback(() => bind(modal3, 'show', modal3_show_binding));

		var if_block0 = (ctx.modal.cek_ongkir) && create_if_block_3$2(ctx);

		var if_block1 = (ctx.modal.kuis) && create_if_block_2$2(ctx);

		var if_block2 = (ctx.iklan.iklan_1.length > 0) && create_if_block_1$2(ctx);

		var if_block3 = (ctx.iklan.iklan_2.length > 0) && create_if_block$3(ctx);

		return {
			c: function create() {
				div32 = element("div");
				div31 = element("div");
				img0 = element("img");
				t0 = space();
				div7 = element("div");
				div6 = element("div");
				div5 = element("div");
				div1 = element("div");
				img1 = element("img");
				t1 = space();
				h30 = element("h3");
				t2 = text("WELCOME TO ARTA, ");
				t3 = text(t3_value);
				t4 = text(" !");
				t5 = space();
				div0 = element("div");
				span0 = element("span");
				b0 = element("b");
				b0.textContent = "Your balance:";
				t7 = space();
				h2 = element("h2");
				b1 = element("b");
				t8 = text("Rp. ");
				t9 = text(t9_value);
				t10 = text(".00");
				t11 = space();
				button0 = element("button");
				button0.textContent = "MY PROFILE";
				t13 = space();
				div4 = element("div");
				div3 = element("div");
				h31 = element("h3");
				h31.textContent = "WHAT WOULD YOU LIKE TO DO?";
				t15 = space();
				div2 = element("div");
				button1 = element("button");
				button1.textContent = "TOP UP E-WALLET";
				t17 = space();
				button2 = element("button");
				button2.textContent = "DO PAYMENT";
				t19 = space();
				button3 = element("button");
				button3.textContent = "PUBLISH BILL";
				t21 = space();
				div10 = element("div");
				div8 = element("div");
				img2 = element("img");
				t22 = space();
				div9 = element("div");
				img3 = element("img");
				t23 = space();
				modal0.$$.fragment.c();
				t24 = space();
				modal1.$$.fragment.c();
				t25 = space();
				modal2.$$.fragment.c();
				t26 = space();
				modal3.$$.fragment.c();
				t27 = space();
				div28 = element("div");
				div27 = element("div");
				div26 = element("div");
				div13 = element("div");
				div12 = element("div");
				div11 = element("div");
				h4 = element("h4");
				h4.textContent = "Uji pengetahuan Nusantaramu!";
				t29 = space();
				button4 = element("button");
				button4.textContent = "Mulai";
				t31 = space();
				div25 = element("div");
				h32 = element("h3");
				h32.textContent = "ARTA PLATFORM";
				t33 = space();
				div24 = element("div");
				div18 = element("div");
				div17 = element("div");
				div16 = element("div");
				h33 = element("h3");
				h33.textContent = "Arta Logistik";
				t35 = space();
				div14 = element("div");
				img4 = element("img");
				t36 = space();
				span1 = element("span");
				span1.textContent = "CEK ONGKIR";
				t38 = space();
				div15 = element("div");
				img5 = element("img");
				t39 = space();
				span2 = element("span");
				span2.textContent = "CEK RESI";
				t41 = space();
				div23 = element("div");
				div22 = element("div");
				div21 = element("div");
				h34 = element("h3");
				h34.textContent = "Arta Ads";
				t43 = space();
				div19 = element("div");
				img6 = element("img");
				t44 = space();
				span3 = element("span");
				span3.textContent = "IKLAN.IN";
				t46 = space();
				div20 = element("div");
				img7 = element("img");
				t47 = space();
				span4 = element("span");
				span4.textContent = "IAI SEMANGAT";
				t49 = space();
				if (if_block0) if_block0.c();
				t50 = space();
				if (if_block1) if_block1.c();
				t51 = space();
				div30 = element("div");
				if (if_block2) if_block2.c();
				t52 = space();
				if (if_block3) if_block3.c();
				t53 = space();
				div29 = element("div");
				span5 = element("span");
				span5.textContent = "Ads by";
				t55 = space();
				span6 = element("span");
				span6.textContent = "Iklanin";
				img0.className = "uk-align-center";
				img0.src = "/assets/public/img/logo_arta.png";
				img0.alt = "logo";
				img0.width = "204";
				add_location(img0, file$4, 3, 6, 190);
				img1.className = "uk-align-center";
				img1.src = "/assets/public/img/account-icon.png";
				img1.width = "86";
				img1.alt = "account";
				add_location(img1, file$4, 10, 18, 505);
				h30.className = "ws-title uk-text-center";
				add_location(h30, file$4, 11, 18, 621);
				add_location(b0, file$4, 14, 44, 796);
				span0.className = "ws-title";
				add_location(span0, file$4, 14, 21, 773);
				add_location(b1, file$4, 15, 25, 850);
				add_location(h2, file$4, 15, 21, 846);
				div0.className = "uk-text-center";
				add_location(div0, file$4, 13, 18, 722);
				button0.className = "uk-align-center uk-button uk-button-default ws-blue-btn";
				add_location(button0, file$4, 18, 18, 943);
				div1.className = "uk-width-1-2@m uk-width-1-1@s";
				add_location(div1, file$4, 9, 15, 442);
				h31.className = "ws-title uk-text-center";
				add_location(h31, file$4, 26, 21, 1351);
				button1.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button1, "margin-bottom", "12px");
				add_location(button1, file$4, 28, 24, 1526);
				button2.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button2, "margin-bottom", "12px");
				add_location(button2, file$4, 31, 24, 1765);
				button3.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button3, "margin-bottom", "12px");
				add_location(button3, file$4, 34, 24, 2004);
				div2.className = "uk-align-center uk-width-1-1@s uk-width-3-5@m";
				add_location(div2, file$4, 27, 21, 1441);
				div3.className = "uk-width-1-1";
				add_location(div3, file$4, 25, 18, 1302);
				div4.className = "uk-width-1-2@m uk-width-1-1@s uk-flex uk-flex-middle";
				add_location(div4, file$4, 24, 15, 1216);
				attr(div5, "uk-grid", "");
				add_location(div5, file$4, 7, 12, 379);
				div6.className = "uk-card-body";
				add_location(div6, file$4, 6, 9, 339);
				div7.className = "uk-card uk-card-default";
				add_location(div7, file$4, 5, 6, 291);
				img2.src = "/assets/public/img/ad_arta_1.png";
				img2.alt = "ads";
				add_location(img2, file$4, 47, 12, 2508);
				div8.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div8, "padding", "12px");
				add_location(div8, file$4, 46, 9, 2428);
				img3.src = "/assets/public/img/ad_arta_2.png";
				img3.alt = "ads";
				add_location(img3, file$4, 50, 12, 2670);
				div9.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div9, "padding", "12px");
				add_location(div9, file$4, 49, 9, 2590);
				attr(div10, "uk-grid", "");
				set_style(div10, "margin-top", "24px");
				add_location(div10, file$4, 45, 6, 2378);
				h4.className = "uk-text-center";
				add_location(h4, file$4, 267, 24, 11050);
				button4.className = "uk-align-center uk-button uk-button-default ws-btn-round-2 ws-btn-green";
				add_location(button4, file$4, 268, 24, 11136);
				div11.className = "uk-card-body";
				add_location(div11, file$4, 266, 21, 10998);
				div12.className = "uk-card uk-card-default";
				add_location(div12, file$4, 265, 18, 10938);
				div13.className = "uk-width-1-3@m uk-width-1-1@s";
				add_location(div13, file$4, 264, 15, 10875);
				h32.className = "ws-title";
				add_location(h32, file$4, 273, 18, 11431);
				h33.className = "ws-title-small";
				add_location(h33, file$4, 278, 30, 11754);
				img4.src = "/assets/public/img/delivery-truck.png";
				img4.width = "32";
				img4.alt = "pjt logo";
				add_location(img4, file$4, 280, 33, 11967);
				span1.className = "ws-title";
				add_location(span1, file$4, 281, 33, 12077);
				div14.className = "uk-button uk-button-link";
				set_style(div14, "padding", "0px");
				add_location(div14, file$4, 279, 30, 11831);
				img5.src = "/assets/public/img/delivery-truck.png";
				img5.width = "32";
				img5.alt = "pjt logo";
				add_location(img5, file$4, 284, 33, 12282);
				span2.className = "ws-title";
				add_location(span2, file$4, 285, 33, 12392);
				div15.className = "uk-button uk-button-link";
				set_style(div15, "padding", "0px");
				add_location(div15, file$4, 283, 30, 12187);
				div16.className = "uk-card-body";
				add_location(div16, file$4, 277, 27, 11696);
				div17.className = "uk-card uk-card-default";
				add_location(div17, file$4, 276, 24, 11630);
				div18.className = "uk-width-1-2@m uk-width-1-1@s";
				add_location(div18, file$4, 275, 21, 11561);
				h34.className = "ws-title-small";
				add_location(h34, file$4, 293, 30, 12780);
				img6.src = "/assets/public/img/delivery-truck.png";
				img6.width = "32";
				img6.alt = "pjt logo";
				add_location(img6, file$4, 295, 33, 12947);
				span3.className = "ws-title";
				add_location(span3, file$4, 296, 33, 13057);
				div19.className = "uk-button uk-button-link";
				set_style(div19, "padding", "0px");
				add_location(div19, file$4, 294, 30, 12852);
				img7.src = "/assets/public/img/delivery-truck.png";
				img7.width = "32";
				img7.alt = "pjt logo";
				add_location(img7, file$4, 299, 33, 13260);
				span4.className = "ws-title";
				add_location(span4, file$4, 300, 33, 13370);
				div20.className = "uk-button uk-button-link";
				set_style(div20, "padding", "0px");
				add_location(div20, file$4, 298, 30, 13165);
				div21.className = "uk-card-body";
				add_location(div21, file$4, 292, 27, 12722);
				div22.className = "uk-card uk-card-default";
				add_location(div22, file$4, 291, 24, 12656);
				div23.className = "uk-width-1-2@m uk-width-1-1@s";
				add_location(div23, file$4, 290, 21, 12587);
				div24.className = "uk-width-1-1 uk-grid-match";
				attr(div24, "uk-grid", "");
				add_location(div24, file$4, 274, 18, 11490);
				div25.className = "uk-width-2-3@m uk-width-1-1@s";
				add_location(div25, file$4, 272, 15, 11368);
				attr(div26, "uk-grid", "");
				add_location(div26, file$4, 263, 12, 10845);
				div27.className = "uk-card-body";
				add_location(div27, file$4, 262, 9, 10805);
				div28.className = "uk-card uk-card-default";
				set_style(div28, "margin-top", "24px");
				add_location(div28, file$4, 261, 6, 10731);
				span5.className = "ws-title";
				add_location(span5, file$4, 337, 12, 14493);
				set_style(span6, "font-size", "12px");
				add_location(span6, file$4, 338, 12, 14543);
				div29.className = "uk-width-1-1 uk-flex uk-flex-right";
				add_location(div29, file$4, 336, 9, 14431);
				set_style(div30, "margin-bottom", "24px");
				set_style(div30, "margin-top", "24px");
				attr(div30, "uk-grid", "");
				add_location(div30, file$4, 325, 6, 14002);
				div31.className = "uk-width-2-3@m uk-width-1-1@s";
				set_style(div31, "padding", "12px");
				add_location(div31, file$4, 1, 3, 88);
				div32.className = "uk-width-1-1 uk-height-viewport uk-flex uk-flex-center uk-flex-middle";
				add_location(div32, file$4, 0, 0, 0);

				dispose = [
					listen(button0, "click", ctx.click_handler),
					listen(button1, "click", ctx.click_handler_1),
					listen(button2, "click", ctx.click_handler_2),
					listen(button3, "click", ctx.click_handler_3),
					listen(button4, "click", ctx.click_handler_10),
					listen(div14, "click", ctx.click_handler_11)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div32, anchor);
				append(div32, div31);
				append(div31, img0);
				append(div31, t0);
				append(div31, div7);
				append(div7, div6);
				append(div6, div5);
				append(div5, div1);
				append(div1, img1);
				append(div1, t1);
				append(div1, h30);
				append(h30, t2);
				append(h30, t3);
				append(h30, t4);
				append(div1, t5);
				append(div1, div0);
				append(div0, span0);
				append(span0, b0);
				append(div0, t7);
				append(div0, h2);
				append(h2, b1);
				append(b1, t8);
				append(b1, t9);
				append(b1, t10);
				append(div1, t11);
				append(div1, button0);
				append(div5, t13);
				append(div5, div4);
				append(div4, div3);
				append(div3, h31);
				append(div3, t15);
				append(div3, div2);
				append(div2, button1);
				append(div2, t17);
				append(div2, button2);
				append(div2, t19);
				append(div2, button3);
				append(div31, t21);
				append(div31, div10);
				append(div10, div8);
				append(div8, img2);
				append(div10, t22);
				append(div10, div9);
				append(div9, img3);
				append(div31, t23);
				mount_component(modal0, div31, null);
				append(div31, t24);
				mount_component(modal1, div31, null);
				append(div31, t25);
				mount_component(modal2, div31, null);
				append(div31, t26);
				mount_component(modal3, div31, null);
				append(div31, t27);
				append(div31, div28);
				append(div28, div27);
				append(div27, div26);
				append(div26, div13);
				append(div13, div12);
				append(div12, div11);
				append(div11, h4);
				append(div11, t29);
				append(div11, button4);
				append(div26, t31);
				append(div26, div25);
				append(div25, h32);
				append(div25, t33);
				append(div25, div24);
				append(div24, div18);
				append(div18, div17);
				append(div17, div16);
				append(div16, h33);
				append(div16, t35);
				append(div16, div14);
				append(div14, img4);
				append(div14, t36);
				append(div14, span1);
				append(div16, t38);
				append(div16, div15);
				append(div15, img5);
				append(div15, t39);
				append(div15, span2);
				append(div24, t41);
				append(div24, div23);
				append(div23, div22);
				append(div22, div21);
				append(div21, h34);
				append(div21, t43);
				append(div21, div19);
				append(div19, img6);
				append(div19, t44);
				append(div19, span3);
				append(div21, t46);
				append(div21, div20);
				append(div20, img7);
				append(div20, t47);
				append(div20, span4);
				append(div31, t49);
				if (if_block0) if_block0.m(div31, null);
				append(div31, t50);
				if (if_block1) if_block1.m(div31, null);
				append(div31, t51);
				append(div31, div30);
				if (if_block2) if_block2.m(div30, null);
				append(div30, t52);
				if (if_block3) if_block3.m(div30, null);
				append(div30, t53);
				append(div30, div29);
				append(div29, span5);
				append(div29, t55);
				append(div29, span6);
				current = true;
			},

			p: function update(changed, ctx) {
				if ((!current || changed.account_data) && t3_value !== (t3_value = ctx.account_data.name)) {
					set_data(t3, t3_value);
				}

				if ((!current || changed.account_data) && t9_value !== (t9_value = ctx.account_data.str_balance)) {
					set_data(t9, t9_value);
				}

				var modal0_changes = {};
				if (changed.$$scope || changed.topup_status || changed.loading || changed.account_data) modal0_changes.$$scope = { changed, ctx };
				if (!updating_show && changed.modal) {
					modal0_changes.show = ctx.modal.topup;
				}
				modal0.$set(modal0_changes);

				var modal1_changes = {};
				if (changed.$$scope || changed.payment || changed.account_data) modal1_changes.$$scope = { changed, ctx };
				if (!updating_show_1 && changed.modal) {
					modal1_changes.show = ctx.modal.do_payment;
				}
				modal1.$set(modal1_changes);

				var modal2_changes = {};
				if (changed.$$scope || changed.create_bill_status || changed.loading || changed.create_bill_amount || changed.account_data) modal2_changes.$$scope = { changed, ctx };
				if (!updating_show_2 && changed.modal) {
					modal2_changes.show = ctx.modal.publish_payment;
				}
				modal2.$set(modal2_changes);

				var modal3_changes = {};
				if (changed.$$scope || changed.account_data) modal3_changes.$$scope = { changed, ctx };
				if (!updating_show_3 && changed.modal) {
					modal3_changes.show = ctx.modal.profile;
				}
				modal3.$set(modal3_changes);

				if (ctx.modal.cek_ongkir) {
					if (if_block0) {
						if_block0.p(changed, ctx);
						if_block0.i(1);
					} else {
						if_block0 = create_if_block_3$2(ctx);
						if_block0.c();
						if_block0.i(1);
						if_block0.m(div31, t50);
					}
				} else if (if_block0) {
					group_outros();
					on_outro(() => {
						if_block0.d(1);
						if_block0 = null;
					});

					if_block0.o(1);
					check_outros();
				}

				if (ctx.modal.kuis) {
					if (if_block1) {
						if_block1.p(changed, ctx);
						if_block1.i(1);
					} else {
						if_block1 = create_if_block_2$2(ctx);
						if_block1.c();
						if_block1.i(1);
						if_block1.m(div31, t51);
					}
				} else if (if_block1) {
					group_outros();
					on_outro(() => {
						if_block1.d(1);
						if_block1 = null;
					});

					if_block1.o(1);
					check_outros();
				}

				if (ctx.iklan.iklan_1.length > 0) {
					if (if_block2) {
						if_block2.p(changed, ctx);
					} else {
						if_block2 = create_if_block_1$2(ctx);
						if_block2.c();
						if_block2.m(div30, t52);
					}
				} else if (if_block2) {
					if_block2.d(1);
					if_block2 = null;
				}

				if (ctx.iklan.iklan_2.length > 0) {
					if (if_block3) {
						if_block3.p(changed, ctx);
					} else {
						if_block3 = create_if_block$3(ctx);
						if_block3.c();
						if_block3.m(div30, t53);
					}
				} else if (if_block3) {
					if_block3.d(1);
					if_block3 = null;
				}
			},

			i: function intro(local) {
				if (current) return;
				modal0.$$.fragment.i(local);

				modal1.$$.fragment.i(local);

				modal2.$$.fragment.i(local);

				modal3.$$.fragment.i(local);

				if (if_block0) if_block0.i();
				if (if_block1) if_block1.i();
				current = true;
			},

			o: function outro(local) {
				modal0.$$.fragment.o(local);
				modal1.$$.fragment.o(local);
				modal2.$$.fragment.o(local);
				modal3.$$.fragment.o(local);
				if (if_block0) if_block0.o();
				if (if_block1) if_block1.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div32);
				}

				modal0.$destroy();

				modal1.$destroy();

				modal2.$destroy();

				modal3.$destroy();

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
				if (if_block2) if_block2.d();
				if (if_block3) if_block3.d();
				run_all(dispose);
			}
		};
	}

	function get_ads(){
	   return fetch('/service/ads/img-ads').then(result => {
	      return result.json();
	   })
	}

	function instance$3($$self, $$props, $$invalidate) {
		
	   
	   var query_param = new URLSearchParams(window.location.search);
	   var session = query_param.get('session');
	   var session_id = query_param.get('sessionId');

	   let modal = {
	      topup: false,
	      do_payment: false,
	      publish_payment: false,
	      profile: false,
	      cek_ongkir: false,
	      kuis: false
	   };

	   const account_data = {
	      name: '',
	      email: '',
	      balance: 0,
	      wallet_token: '',
	      str_balance: '0'
	   };

	   const topup_status = {
	      success: false,
	      failed: false,
	      reload: false
	   };

	   const loading = {
	      topup: false,
	      create_bill: false
	   };

	   let create_bill_amount = 0;

	   const create_bill_status = {
	      success: false,
	      fail: false,
	      payment_code: ''
	   };

	   const payment = {
	      code: '',
	      loading: false,
	      success: false,
	      display_error: false,
	      display_success: false,
	      display_data: false,
	      error_message: '',
	      data: {
	         publisher: '',
	         amount: '',
	         code: ''
	      },
	      loading_pay: false,
	      complete: false,
	      is_redirect: false,
	      redirect_url: '',
	      timer: 5
	   };

	   const iklan = {
	      iklan_1: '',
	      iklan_2: '',
	      iklan_topup: '',
	      iklan_payment: '',
	      iklan_create_bill: '' 
	   };

	   function reset_topup_status(){
	      topup_status.success = false; $$invalidate('topup_status', topup_status);
	      topup_status.failed = false; $$invalidate('topup_status', topup_status);
	   }

	   function reset_create_bill_status(){
	      create_bill_status.success = false; $$invalidate('create_bill_status', create_bill_status);
	      create_bill_status.fail = false; $$invalidate('create_bill_status', create_bill_status);
	   }

	   function reset_payment_status(){
	      payment.display_data = false; $$invalidate('payment', payment);
	      payment.display_error = false; $$invalidate('payment', payment);
	      payment.code = ''; $$invalidate('payment', payment);
	      payment.display_success = false; $$invalidate('payment', payment);
	   }

	   onMount(() => {
	      fetch('/account/data-profile?session_token=' + session).then(response => {
	         return response.json();
	      }).then(result => {
	         account_data.name = result.data.name; $$invalidate('account_data', account_data);
	         account_data.email = result.data.email; $$invalidate('account_data', account_data);
	      }).catch(error => {
	         console.log(error);
	      });

	      get_wallet_data();
	      get_action();

	      //get iklan
	      get_ads().then(result => {
	         iklan.iklan_1 = result.data.url; $$invalidate('iklan', iklan);
	      }).catch(error => {
	         console.log(error);
	      });

	      get_ads().then(result => {
	         iklan.iklan_2 = result.data.url; $$invalidate('iklan', iklan);
	      }).catch(error => {
	         console.log(error);
	      });

	      setInterval(() => {
	         //get iklan
	         get_ads().then(result => {
	            iklan.iklan_1 = result.data.url; $$invalidate('iklan', iklan);
	         }).catch(error => {
	            console.log(error);
	         });

	         get_ads().then(result => {
	            iklan.iklan_2 = result.data.url; $$invalidate('iklan', iklan);
	         }).catch(error => {
	            console.log(error);
	         });
	      }, 15000);
	   });

	   function do_topup(amount){
	      loading.topup = true; $$invalidate('loading', loading);

	      const topup_request = {
	         session_token: session,
	         jumlah: amount
	      };

	      fetch('/payment/topup', { 
	         method: 'POST',
	         headers: { 'Content-Type': 'application/json' },
	         body: JSON.stringify(topup_request)
	      }).then(response => {
	         loading.topup = false; $$invalidate('loading', loading);

	         if(response.ok === true){
	            topup_status.success = true; $$invalidate('topup_status', topup_status);

	            if(topup_status.reload){
	               window.location.reload();
	            }

	            get_wallet_data();
	         }else{
	            topup_status.failed = true; $$invalidate('topup_status', topup_status);
	         }
	      }).catch(error => {
	         loading.topup = false; $$invalidate('loading', loading);
	         topup_status.failed = true; $$invalidate('topup_status', topup_status);
	      });
	   }

	   function get_wallet_data(){
	      fetch('/account/wallet?session_token=' + session).then(response => {
	         return response.json();
	      }).then(result => {
	         account_data.balance = result.data.saldo; $$invalidate('account_data', account_data);
	         account_data.wallet_token = result.data.token; $$invalidate('account_data', account_data);
	      }).catch(error => {
	         console.log(error);
	      });
	   }

	   function do_create_bill(){
	      if(create_bill_amount === 0){
	         return;
	      }

	      const create_bill_request = {
	         token: account_data.wallet_token,
	         jumlah: create_bill_amount
	      };

	      loading.create_bill = true; $$invalidate('loading', loading);
	      fetch('/payment/create-bill', {
	         method: 'POST',
	         headers: { 'Content-Type': 'application/json' },
	         body: JSON.stringify(create_bill_request)
	      }).then(result => {
	         if(result.ok === true){
	            create_bill_status.success = true; $$invalidate('create_bill_status', create_bill_status);
	         }else{
	            create_bill_status.fail = true; $$invalidate('create_bill_status', create_bill_status);
	         }

	         loading.create_bill = false; $$invalidate('loading', loading);
	         return result.json();
	      }).then(result => {
	         if(result.success){
	            $$invalidate('create_bill_amount', create_bill_amount = 0);
	            create_bill_status.payment_code = result.data.kode; $$invalidate('create_bill_status', create_bill_status);
	         }
	      }).catch(error => {
	         create_bill_status.fail = true; $$invalidate('create_bill_status', create_bill_status);
	         loading.create_bill = false; $$invalidate('loading', loading);
	      });
	   }

	   function do_check_payment(){
	      payment.display_error = false; $$invalidate('payment', payment);

	      fetch('/payment/get-status/' + payment.code).then(result => {
	         return result.json();
	      }).then(result => {
	         if(result.success === true){
	            payment.data.amount = result.data.jumlah; $$invalidate('payment', payment);
	            payment.data.publisher = result.data.penerbit; $$invalidate('payment', payment);
	            payment.data.code = result.data.kode; $$invalidate('payment', payment);

	            payment.display_data = true; $$invalidate('payment', payment);
	         }else{
	            payment.error_message = result.message; $$invalidate('payment', payment);
	            payment.display_error = true; $$invalidate('payment', payment);
	         }
	      });
	   }

	   function do_payment(){
	      payment.display_error = false; $$invalidate('payment', payment);

	      const do_payment_request = {
	         payment_code: payment.data.code,
	         session_token: session
	      };

	      fetch('/payment/pay', {
	         method: 'POST',
	         headers: { 'Content-Type': 'application/json' },
	         body: JSON.stringify(do_payment_request)
	      }).then(result => {
	         return result.json();
	      }).then(result => {
	         if(result.success){
	            payment.display_success = true; $$invalidate('payment', payment);
	            payment.complete = true; $$invalidate('payment', payment);

	            get_wallet_data();

	            if(payment.is_redirect){
	               do_redirect();
	            }
	         }else{
	            payment.error_message = result.message; $$invalidate('payment', payment);
	            payment.display_error = true; $$invalidate('payment', payment);
	         }
	      });
	   }

	   function get_action(){
	      if(session_id === null){
	         return;
	      }

	      fetch('/app/action/' + session_id).then(result => {
	         return result.json();
	      }).then(result => {
	         if(result.success){
	            if(result.data.action === 'pay'){
	               do_action_pay(result.data.payment_code, result.data.redirect_url);
	            }
	         }
	      }).catch(error => {
	         console.log(error);
	      });
	   }

	   function do_action_pay(payment_code, redirect_url){
	      payment.code = payment_code; $$invalidate('payment', payment);
	      
	      if(redirect_url){
	         payment.is_redirect = true; $$invalidate('payment', payment);
	         payment.redirect_url = redirect_url; $$invalidate('payment', payment);
	      }

	      do_check_payment();
	      modal.do_payment = true; $$invalidate('modal', modal);
	   }

	   function do_redirect(){
	      var time = 5;
	      payment.timer = time; $$invalidate('payment', payment);
	      var timer = setInterval(interval, 1000);

	      function interval(){
	         time -= 1;
	         payment.timer = time; $$invalidate('payment', payment);

	         if(time === 0){
	            stop_timer();
	            window.location.href = payment.redirect_url;
	         }
	      }

	      function stop_timer(){
	         clearInterval(timer);
	      }
	   }

	   function do_topup_from_payment(){
	      modal.do_payment = false; $$invalidate('modal', modal);
	      modal.topup = true; $$invalidate('modal', modal);

	      topup_status.reload = true; $$invalidate('topup_status', topup_status);
	   }

		function click_handler() {
			const $$result = modal.profile = true;
			$$invalidate('modal', modal);
			return $$result;
		}

		function click_handler_1() {
			const $$result = modal.topup = true;
			$$invalidate('modal', modal);
			return $$result;
		}

		function click_handler_2() {
			const $$result = modal.do_payment = true;
			$$invalidate('modal', modal);
			return $$result;
		}

		function click_handler_3() {
			const $$result = modal.publish_payment = true;
			$$invalidate('modal', modal);
			return $$result;
		}

		function click_handler_4() {
			return do_topup(50000);
		}

		function click_handler_5() {
			return do_topup(300000);
		}

		function click_handler_6() {
			return do_topup(100000);
		}

		function click_handler_7() {
			return do_topup(500000);
		}

		function click_handler_8() {
			return do_topup(200000);
		}

		function click_handler_9() {
			return do_topup(1000000);
		}

		function modal0_show_binding(value) {
			modal.topup = value;
			$$invalidate('modal', modal);
		}

		function input_input_handler() {
			payment.code = this.value;
			$$invalidate('payment', payment);
		}

		function modal1_show_binding(value_1) {
			modal.do_payment = value_1;
			$$invalidate('modal', modal);
		}

		function input_input_handler_1() {
			create_bill_amount = to_number(this.value);
			$$invalidate('create_bill_amount', create_bill_amount);
		}

		function input_input_handler_2() {
			create_bill_status.payment_code = this.value;
			$$invalidate('create_bill_status', create_bill_status);
		}

		function modal2_show_binding(value_2) {
			modal.publish_payment = value_2;
			$$invalidate('modal', modal);
		}

		function input_input_handler_3() {
			account_data.wallet_token = this.value;
			$$invalidate('account_data', account_data);
		}

		function modal3_show_binding(value_3) {
			modal.profile = value_3;
			$$invalidate('modal', modal);
		}

		function click_handler_10() {
			const $$result = modal.kuis = true;
			$$invalidate('modal', modal);
			return $$result;
		}

		function click_handler_11() {
			const $$result = modal.cek_ongkir = true;
			$$invalidate('modal', modal);
			return $$result;
		}

		function cekongkir_show_binding(value) {
			modal.cek_ongkir = value;
			$$invalidate('modal', modal);
		}

		function modalkuis_show_binding(value) {
			modal.kuis = value;
			$$invalidate('modal', modal);
		}

		$$self.$$.update = ($$dirty = { account_data: 1, modal: 1 }) => {
			if ($$dirty.account_data) { {
	            if(account_data.balance != 0){
	               account_data.str_balance = Number.parseInt(account_data.balance).toLocaleString(); $$invalidate('account_data', account_data);
	            }
	         } }
			if ($$dirty.modal) { {
	            if(modal.topup){
	               reset_topup_status();
	            }
	      
	            if(modal.publish_payment){
	               reset_create_bill_status();
	            }
	      
	            if(modal.do_payment){
	               reset_payment_status();
	            }
	         } }
		};

		return {
			modal,
			account_data,
			topup_status,
			loading,
			create_bill_amount,
			create_bill_status,
			payment,
			iklan,
			do_topup,
			do_create_bill,
			do_check_payment,
			do_payment,
			do_topup_from_payment,
			Number,
			click_handler,
			click_handler_1,
			click_handler_2,
			click_handler_3,
			click_handler_4,
			click_handler_5,
			click_handler_6,
			click_handler_7,
			click_handler_8,
			click_handler_9,
			modal0_show_binding,
			input_input_handler,
			modal1_show_binding,
			input_input_handler_1,
			input_input_handler_2,
			modal2_show_binding,
			input_input_handler_3,
			modal3_show_binding,
			click_handler_10,
			click_handler_11,
			cekongkir_show_binding,
			modalkuis_show_binding
		};
	}

	class Home extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$4, safe_not_equal, []);
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
