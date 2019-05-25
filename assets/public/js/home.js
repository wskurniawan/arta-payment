
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

	/* src/pages/Home.svelte generated by Svelte v3.4.2 */

	const file$2 = "src/pages/Home.svelte";

	// (59:9) {#if !loading.topup && !topup_status.success && !topup_status.failed}
	function create_if_block_15(ctx) {
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
				add_location(uk_button0, file$2, 61, 15, 2953);
				div0.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div0, "padding", "4px");
				add_location(div0, file$2, 60, 12, 2871);
				uk_button1.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button1, file$2, 66, 15, 3237);
				div1.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div1, "padding", "4px");
				add_location(div1, file$2, 65, 12, 3155);
				uk_button2.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button2, file$2, 71, 15, 3523);
				div2.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div2, "padding", "4px");
				add_location(div2, file$2, 70, 12, 3441);
				uk_button3.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button3, file$2, 76, 15, 3810);
				div3.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div3, "padding", "4px");
				add_location(div3, file$2, 75, 12, 3728);
				uk_button4.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button4, file$2, 81, 15, 4097);
				div4.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div4, "padding", "4px");
				add_location(div4, file$2, 80, 12, 4015);
				uk_button5.className = "uk-button uk-button-default ws-blue-btn uk-width-1-1";
				add_location(uk_button5, file$2, 86, 15, 4384);
				div5.className = "uk-width-1-2@m uk-width-1-1@s";
				set_style(div5, "padding", "4px");
				add_location(div5, file$2, 85, 12, 4302);
				attr(div6, "uk-grid", "");
				add_location(div6, file$2, 59, 9, 2844);

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

	// (94:9) {#if loading.topup}
	function create_if_block_14(ctx) {
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

	// (99:9) {#if topup_status.success}
	function create_if_block_13(ctx) {
		var div1, div0, h3;

		return {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				h3 = element("h3");
				h3.textContent = "Topup Sucess";
				h3.className = "uk-text-success uk-text-center";
				add_location(h3, file$2, 101, 15, 4866);
				div0.className = "uk-card-body";
				add_location(div0, file$2, 100, 12, 4823);
				div1.className = "uk-card uk-card-default";
				add_location(div1, file$2, 99, 9, 4772);
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

	// (109:9) {#if topup_status.failed}
	function create_if_block_12(ctx) {
		var div1, div0, h3;

		return {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				h3 = element("h3");
				h3.textContent = "Topup Failed";
				h3.className = "uk-text-danger uk-text-center";
				add_location(h3, file$2, 111, 15, 5177);
				div0.className = "uk-card-body";
				add_location(div0, file$2, 110, 12, 5134);
				div1.className = "uk-card uk-card-default";
				add_location(div1, file$2, 109, 9, 5083);
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

	// (49:6) <Modal bind:show={modal.topup}>
	function create_default_slot_3(ctx) {
		var h4, b0, t1, div, span, b1, t3, h2, b2, t4, t5_value = ctx.account_data.str_balance, t5, t6, t7, t8, t9, t10, if_block3_anchor, current;

		var if_block0 = (!ctx.loading.topup && !ctx.topup_status.success && !ctx.topup_status.failed) && create_if_block_15(ctx);

		var if_block1 = (ctx.loading.topup) && create_if_block_14(ctx);

		var if_block2 = (ctx.topup_status.success) && create_if_block_13(ctx);

		var if_block3 = (ctx.topup_status.failed) && create_if_block_12(ctx);

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
				add_location(b0, file$2, 50, 12, 2534);
				h4.className = "uk-text-center";
				add_location(h4, file$2, 49, 9, 2493);
				add_location(b1, file$2, 54, 35, 2644);
				span.className = "ws-title";
				add_location(span, file$2, 54, 12, 2621);
				add_location(b2, file$2, 55, 16, 2689);
				add_location(h2, file$2, 55, 12, 2685);
				div.className = "uk-text-center";
				add_location(div, file$2, 53, 9, 2579);
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
						if_block0 = create_if_block_15(ctx);
						if_block0.c();
						if_block0.m(t8.parentNode, t8);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (ctx.loading.topup) {
					if (!if_block1) {
						if_block1 = create_if_block_14(ctx);
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
						if_block2 = create_if_block_13(ctx);
						if_block2.c();
						if_block2.m(t10.parentNode, t10);
					}
				} else if (if_block2) {
					if_block2.d(1);
					if_block2 = null;
				}

				if (ctx.topup_status.failed) {
					if (!if_block3) {
						if_block3 = create_if_block_12(ctx);
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

	// (124:9) {#if payment.display_error}
	function create_if_block_11(ctx) {
		var div, p, t0, t1_value = ctx.payment.error_message, t1, t2;

		return {
			c: function create() {
				div = element("div");
				p = element("p");
				t0 = text("Error: ");
				t1 = text(t1_value);
				t2 = text("!");
				add_location(p, file$2, 125, 12, 5564);
				div.className = "uk-alert-danger";
				attr(div, "uk-alert", "");
				add_location(div, file$2, 124, 9, 5512);
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

	// (130:9) {#if payment.display_success}
	function create_if_block_10(ctx) {
		var div, p;

		return {
			c: function create() {
				div = element("div");
				p = element("p");
				p.textContent = "Payment success.";
				add_location(p, file$2, 131, 12, 5741);
				div.className = "uk-alert-success";
				attr(div, "uk-alert", "");
				add_location(div, file$2, 130, 9, 5688);
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

	// (147:9) {#if !payment.display_data}
	function create_if_block_9(ctx) {
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
				add_location(h5, file$2, 148, 12, 6199);
				input.className = "uk-input";
				input.placeholder = "enter payment code";
				add_location(input, file$2, 149, 12, 6242);
				button.className = "uk-button uk-button-default ws-blue-btn";
				set_style(button, "margin-top", "12px");
				add_location(button, file$2, 151, 12, 6341);
				div.className = "uk-text-center";
				add_location(div, file$2, 147, 9, 6157);

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

	// (156:9) {#if payment.display_data}
	function create_if_block_4(ctx) {
		var div2, div1, span0, t1, h3, t2_value = ctx.payment.data.publisher, t2, t3, span1, t5, h2, t6, t7_value = ctx.Number.parseInt(ctx.payment.data.amount).toLocaleString(), t7, t8, t9, div0, t10, t11, current;

		var if_block0 = (!ctx.payment.loading_pay && !ctx.payment.complete) && create_if_block_7(ctx);

		var if_block1 = (ctx.payment.loading_pay) && create_if_block_6(ctx);

		var if_block2 = (ctx.payment.complete && ctx.payment.is_redirect) && create_if_block_5(ctx);

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
				add_location(span0, file$2, 158, 15, 6653);
				add_location(h3, file$2, 159, 15, 6692);
				add_location(span1, file$2, 160, 15, 6742);
				add_location(h2, file$2, 161, 15, 6778);
				div0.className = "uk-align-center";
				add_location(div0, file$2, 163, 15, 6868);
				div1.className = "uk-width-1-1 uk-text-center";
				add_location(div1, file$2, 157, 12, 6595);
				div2.className = "uk-card uk-card-body";
				add_location(div2, file$2, 156, 9, 6547);
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
						if_block0 = create_if_block_7(ctx);
						if_block0.c();
						if_block0.m(div0, t10);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (ctx.payment.loading_pay) {
					if (!if_block1) {
						if_block1 = create_if_block_6(ctx);
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
						if_block2 = create_if_block_5(ctx);
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

	// (165:18) {#if !payment.loading_pay && !payment.complete}
	function create_if_block_7(ctx) {
		var div;

		function select_block_type(ctx) {
			if (ctx.payment.data.amount < ctx.account_data.balance) return create_if_block_8;
			return create_else_block_1;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type(ctx);

		return {
			c: function create() {
				div = element("div");
				if_block.c();
				add_location(div, file$2, 165, 21, 6987);
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

	// (171:24) {:else}
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
				add_location(h3, file$2, 171, 24, 7296);
				button.className = "uk-button uk-button-default ws-blue-btn";
				add_location(button, file$2, 172, 24, 7397);
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

	// (167:24) {#if payment.data.amount < account_data.balance}
	function create_if_block_8(ctx) {
		var button, dispose;

		return {
			c: function create() {
				button = element("button");
				button.textContent = "PAY";
				button.className = "uk-button uk-button-default ws-blue-btn";
				add_location(button, file$2, 167, 24, 7092);
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

	// (179:18) {#if payment.loading_pay}
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

	// (182:18) {#if payment.complete && payment.is_redirect}
	function create_if_block_5(ctx) {
		var span, t0, t1_value = ctx.payment.timer, t1, t2;

		return {
			c: function create() {
				span = element("span");
				t0 = text("Redirect in ");
				t1 = text(t1_value);
				t2 = text("...");
				span.className = "uk-text-center";
				add_location(span, file$2, 182, 21, 7840);
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

	// (121:6) <Modal bind:show={modal.do_payment}>
	function create_default_slot_2(ctx) {
		var t0, t1, h4, b0, t3, div, span, b1, t5, h2, b2, t6, t7_value = ctx.account_data.str_balance, t7, t8, t9, t10, if_block3_anchor, current;

		var if_block0 = (ctx.payment.display_error) && create_if_block_11(ctx);

		var if_block1 = (ctx.payment.display_success) && create_if_block_10(ctx);

		var if_block2 = (!ctx.payment.display_data) && create_if_block_9(ctx);

		var if_block3 = (ctx.payment.display_data) && create_if_block_4(ctx);

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
				add_location(b0, file$2, 138, 12, 5885);
				h4.className = "uk-text-center";
				add_location(h4, file$2, 137, 9, 5844);
				add_location(b1, file$2, 142, 35, 5999);
				span.className = "ws-title";
				add_location(span, file$2, 142, 12, 5976);
				add_location(b2, file$2, 143, 16, 6044);
				add_location(h2, file$2, 143, 12, 6040);
				div.className = "uk-text-center";
				add_location(div, file$2, 141, 9, 5934);
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
						if_block0 = create_if_block_11(ctx);
						if_block0.c();
						if_block0.m(t0.parentNode, t0);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (ctx.payment.display_success) {
					if (!if_block1) {
						if_block1 = create_if_block_10(ctx);
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
						if_block2 = create_if_block_9(ctx);
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
						if_block3 = create_if_block_4(ctx);
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

	// (203:9) {#if !loading.create_bill && !create_bill_status.success && !create_bill_status.fail}
	function create_if_block_2(ctx) {
		var div, h5, t1, input, t2, current_block_type_index, if_block, current, dispose;

		var if_block_creators = [
			create_if_block_3,
			create_else_block
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
				add_location(h5, file$2, 204, 12, 8555);
				input.className = "uk-input uk-text-center";
				input.placeholder = "enter amount";
				attr(input, "type", "number");
				add_location(input, file$2, 205, 12, 8589);
				div.className = "uk-text-center";
				add_location(div, file$2, 203, 9, 8513);
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

	// (210:12) {:else}
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

	// (208:12) {#if !loading.create_bill}
	function create_if_block_3(ctx) {
		var button, dispose;

		return {
			c: function create() {
				button = element("button");
				button.textContent = "CREATE";
				button.className = "uk-button uk-button-default ws-blue-btn";
				set_style(button, "margin-top", "12px");
				add_location(button, file$2, 208, 12, 8757);
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

	// (216:9) {#if create_bill_status.success}
	function create_if_block_1(ctx) {
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
				add_location(span, file$2, 218, 19, 9158);
				add_location(h5, file$2, 218, 15, 9154);
				input.className = "uk-input uk-text-center";
				input.placeholder = "wallet token";
				input.disabled = true;
				add_location(input, file$2, 219, 15, 9244);
				div0.className = "uk-text-center";
				set_style(div0, "margin-top", "24px");
				add_location(div0, file$2, 217, 12, 9083);
				div1.className = "uk-text-center";
				add_location(div1, file$2, 216, 9, 9041);
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

	// (225:9) {#if create_bill_status.failed}
	function create_if_block$1(ctx) {
		var div1, div0, h3;

		return {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				h3 = element("h3");
				h3.textContent = "Failed to create bill";
				h3.className = "uk-text-danger uk-text-center";
				add_location(h3, file$2, 227, 15, 9566);
				div0.className = "uk-card-body";
				add_location(div0, file$2, 226, 12, 9523);
				div1.className = "uk-card uk-card-default";
				add_location(div1, file$2, 225, 9, 9472);
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

	// (193:6) <Modal bind:show={modal.publish_payment}>
	function create_default_slot_1(ctx) {
		var h4, b0, t1, div, span, b1, t3, h2, b2, t4, t5_value = ctx.account_data.str_balance, t5, t6, t7, t8, t9, if_block2_anchor, current;

		var if_block0 = (!ctx.loading.create_bill && !ctx.create_bill_status.success && !ctx.create_bill_status.fail) && create_if_block_2(ctx);

		var if_block1 = (ctx.create_bill_status.success) && create_if_block_1(ctx);

		var if_block2 = (ctx.create_bill_status.failed) && create_if_block$1(ctx);

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
				add_location(b0, file$2, 194, 12, 8181);
				h4.className = "uk-text-center";
				add_location(h4, file$2, 193, 9, 8140);
				add_location(b1, file$2, 198, 35, 8297);
				span.className = "ws-title";
				add_location(span, file$2, 198, 12, 8274);
				add_location(b2, file$2, 199, 16, 8342);
				add_location(h2, file$2, 199, 12, 8338);
				div.className = "uk-text-center";
				add_location(div, file$2, 197, 9, 8232);
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
						if_block0 = create_if_block_2(ctx);
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
						if_block1 = create_if_block_1(ctx);
						if_block1.c();
						if_block1.m(t9.parentNode, t9);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (ctx.create_bill_status.failed) {
					if (!if_block2) {
						if_block2 = create_if_block$1(ctx);
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

	// (236:6) <Modal bind:show={modal.profile}>
	function create_default_slot(ctx) {
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
				add_location(b0, file$2, 237, 12, 9848);
				h4.className = "uk-text-center";
				add_location(h4, file$2, 236, 9, 9807);
				add_location(b1, file$2, 241, 35, 9959);
				span.className = "ws-title";
				add_location(span, file$2, 241, 12, 9936);
				add_location(b2, file$2, 242, 16, 10004);
				add_location(h2, file$2, 242, 12, 10000);
				div0.className = "uk-text-center";
				add_location(div0, file$2, 240, 9, 9894);
				add_location(h5, file$2, 246, 12, 10121);
				input.className = "uk-input uk-text-center";
				input.placeholder = "wallet token";
				input.disabled = true;
				add_location(input, file$2, 247, 12, 10154);
				div1.className = "uk-text-center";
				add_location(div1, file$2, 245, 9, 10079);
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

	function create_fragment$2(ctx) {
		var div9, div8, img0, t0, div7, div6, div5, div1, img1, t1, h30, t2, t3_value = ctx.account_data.name, t3, t4, t5, div0, span, b0, t7, h2, b1, t8, t9_value = ctx.account_data.str_balance, t9, t10, t11, button0, t13, div4, div3, h31, t15, div2, button1, t17, button2, t19, button3, t21, updating_show, t22, updating_show_1, t23, updating_show_2, t24, updating_show_3, current, dispose;

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
			$$slots: { default: [create_default_slot] },
			$$scope: { ctx }
		};
		if (ctx.modal.profile !== void 0) {
			modal3_props.show = ctx.modal.profile;
		}
		var modal3 = new Modal({ props: modal3_props, $$inline: true });

		add_binding_callback(() => bind(modal3, 'show', modal3_show_binding));

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
				t2 = text("WELCOME TO ARTA, ");
				t3 = text(t3_value);
				t4 = text(" !");
				t5 = space();
				div0 = element("div");
				span = element("span");
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
				modal0.$$.fragment.c();
				t22 = space();
				modal1.$$.fragment.c();
				t23 = space();
				modal2.$$.fragment.c();
				t24 = space();
				modal3.$$.fragment.c();
				img0.className = "uk-align-center";
				img0.src = "/assets/public/img/logo_arta.png";
				img0.alt = "logo";
				img0.width = "204";
				add_location(img0, file$2, 3, 6, 190);
				img1.className = "uk-align-center";
				img1.src = "/assets/public/img/account-icon.png";
				img1.width = "86";
				img1.alt = "account";
				add_location(img1, file$2, 10, 18, 513);
				h30.className = "ws-title uk-text-center";
				add_location(h30, file$2, 11, 18, 629);
				add_location(b0, file$2, 14, 44, 804);
				span.className = "ws-title";
				add_location(span, file$2, 14, 21, 781);
				add_location(b1, file$2, 15, 25, 858);
				add_location(h2, file$2, 15, 21, 854);
				div0.className = "uk-text-center";
				add_location(div0, file$2, 13, 18, 730);
				button0.className = "uk-align-center uk-button uk-button-default ws-blue-btn";
				add_location(button0, file$2, 18, 18, 951);
				div1.className = "uk-width-1-2@m uk-width-1-1@s";
				add_location(div1, file$2, 9, 15, 450);
				h31.className = "ws-title uk-text-center";
				add_location(h31, file$2, 26, 21, 1359);
				button1.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button1, "margin-bottom", "12px");
				add_location(button1, file$2, 28, 24, 1534);
				button2.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button2, "margin-bottom", "12px");
				add_location(button2, file$2, 31, 24, 1773);
				button3.className = "uk-width-1-1 ws-blue-btn uk-button uk-button-default";
				set_style(button3, "margin-bottom", "12px");
				add_location(button3, file$2, 34, 24, 2012);
				div2.className = "uk-align-center uk-width-1-1@s uk-width-3-5@m";
				add_location(div2, file$2, 27, 21, 1449);
				div3.className = "uk-width-1-1";
				add_location(div3, file$2, 25, 18, 1310);
				div4.className = "uk-width-1-2@m uk-width-1-1@s uk-flex uk-flex-middle";
				add_location(div4, file$2, 24, 15, 1224);
				div5.className = "uk-flex";
				add_location(div5, file$2, 7, 12, 379);
				div6.className = "uk-card-body";
				add_location(div6, file$2, 6, 9, 339);
				div7.className = "uk-card uk-card-default";
				add_location(div7, file$2, 5, 6, 291);
				div8.className = "uk-width-2-3@m uk-width-1-1@s";
				set_style(div8, "padding", "12px");
				add_location(div8, file$2, 1, 3, 88);
				div9.className = "uk-width-1-1 uk-height-viewport uk-flex uk-flex-center uk-flex-middle";
				add_location(div9, file$2, 0, 0, 0);

				dispose = [
					listen(button0, "click", ctx.click_handler),
					listen(button1, "click", ctx.click_handler_1),
					listen(button2, "click", ctx.click_handler_2),
					listen(button3, "click", ctx.click_handler_3)
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
				append(h30, t2);
				append(h30, t3);
				append(h30, t4);
				append(div1, t5);
				append(div1, div0);
				append(div0, span);
				append(span, b0);
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
				append(div8, t21);
				mount_component(modal0, div8, null);
				append(div8, t22);
				mount_component(modal1, div8, null);
				append(div8, t23);
				mount_component(modal2, div8, null);
				append(div8, t24);
				mount_component(modal3, div8, null);
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
			},

			i: function intro(local) {
				if (current) return;
				modal0.$$.fragment.i(local);

				modal1.$$.fragment.i(local);

				modal2.$$.fragment.i(local);

				modal3.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				modal0.$$.fragment.o(local);
				modal1.$$.fragment.o(local);
				modal2.$$.fragment.o(local);
				modal3.$$.fragment.o(local);
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

				run_all(dispose);
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		
	   
	   var query_param = new URLSearchParams(window.location.search);
	   var session = query_param.get('session');
	   var session_id = query_param.get('sessionId');

	   let modal = {
	      topup: false,
	      do_payment: false,
	      publish_payment: false,
	      profile: false
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
	      if(session_id.length === 0){
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
			modal3_show_binding
		};
	}

	class Home extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$2, safe_not_equal, []);
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
