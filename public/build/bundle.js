
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.43.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Tailwindcss.svelte generated by Svelte v3.43.2 */

    function create_fragment$e(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Tailwindcss', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tailwindcss> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Tailwindcss extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tailwindcss",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.43.2 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (251:0) {:else}
    function create_else_block$6(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$6(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$6, create_else_block$6];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\routes\Home.svelte generated by Svelte v3.43.2 */

    const file$c = "src\\routes\\Home.svelte";

    function create_fragment$c(ctx) {
    	let main;
    	let div11;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let section;
    	let div10;
    	let div4;
    	let div2;
    	let div1;
    	let t1;
    	let div3;
    	let h1;
    	let t3;
    	let p0;
    	let t5;
    	let div9;
    	let div6;
    	let div5;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let h20;
    	let t8;
    	let p1;
    	let t10;
    	let a0;
    	let t11;
    	let svg0;
    	let path0;
    	let t12;
    	let div8;
    	let div7;
    	let img2;
    	let img2_src_value;
    	let t13;
    	let h21;
    	let t15;
    	let p2;
    	let t17;
    	let a1;
    	let t18;
    	let svg1;
    	let path1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div11 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			section = element("section");
    			div10 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			t1 = space();
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Cracow's Car Rental Leader";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit, amet consectetur adipisicing\r\n                            elit. Laudantium ab laboriosam ratione ipsam\r\n                            pariatur neque commodi possimus harum quibusdam\r\n                            cupiditate quisquam, facere, corporis maiores\r\n                            architecto illum vitae dolores nostrum excepturi!";
    			t5 = space();
    			div9 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			img1 = element("img");
    			t6 = space();
    			h20 = element("h2");
    			h20.textContent = "Cars Catalog";
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing\r\n                            elit. Aperiam veniam ad accusantium nobis,\r\n                            consequatur a quam tempore ullam quisquam iure,\r\n                            nulla, officiis labore hic laboriosam fugit\r\n                            assumenda ducimus expedita eligendi?";
    			t10 = space();
    			a0 = element("a");
    			t11 = text("Learn More\r\n                            ");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t12 = space();
    			div8 = element("div");
    			div7 = element("div");
    			img2 = element("img");
    			t13 = space();
    			h21 = element("h2");
    			h21.textContent = "Terms and conditions";
    			t15 = space();
    			p2 = element("p");
    			p2.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing\r\n                            elit. Quisquam error eius laborum consectetur autem\r\n                            neque delectus illum, ut qui maxime aliquam facere,\r\n                            tempora modi debitis quaerat dolorum eveniet\r\n                            doloremque tempore?";
    			t17 = space();
    			a1 = element("a");
    			t18 = text("Learn More\r\n                            ");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			attr_dev(img0, "alt", "content");
    			attr_dev(img0, "class", "rounded-lg object-cover object-center h-full 2xl:w-3/5 w-3/4");
    			if (!src_url_equal(img0.src, img0_src_value = "img/cooper.png")) attr_dev(img0, "src", img0_src_value);
    			add_location(img0, file$c, 8, 12, 206);
    			attr_dev(div0, "class", "md:h-64 h-44 2xl:h-96 w-full mt-10 overflow-hidden flex justify-center items-center");
    			add_location(div0, file$c, 5, 8, 72);
    			attr_dev(div1, "class", "w-24 h-full bg-indigo-500");
    			add_location(div1, file$c, 18, 24, 650);
    			attr_dev(div2, "class", "h-1 bg-gray-800 rounded overflow-hidden");
    			add_location(div2, file$c, 17, 20, 571);
    			attr_dev(h1, "class", "sm:w-2/5 text-white font-medium title-font text-2xl mb-2 sm:mb-0");
    			add_location(h1, file$c, 21, 24, 827);
    			attr_dev(p0, "class", "sm:w-3/5 leading-relaxed text-base sm:pl-10 pl-0");
    			add_location(p0, file$c, 26, 24, 1072);
    			attr_dev(div3, "class", "flex flex-wrap sm:flex-row flex-col py-6 mb-12");
    			add_location(div3, file$c, 20, 20, 741);
    			attr_dev(div4, "class", "flex flex-col");
    			add_location(div4, file$c, 16, 16, 522);
    			attr_dev(img1, "alt", "content");
    			attr_dev(img1, "class", "rounded-lg object-cover object-center h-full w-full");
    			if (!src_url_equal(img1.src, img1_src_value = "img/car-collage.png")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$c, 40, 28, 1879);
    			attr_dev(div5, "class", "h-64 overflow-hidden");
    			add_location(div5, file$c, 39, 24, 1815);
    			attr_dev(h20, "class", "text-xl font-medium title-font text-white mt-5");
    			add_location(h20, file$c, 46, 24, 2172);
    			attr_dev(p1, "class", "text-base leading-relaxed mt-2");
    			add_location(p1, file$c, 51, 24, 2385);
    			attr_dev(path0, "d", "M5 12h14M12 5l7 7-7 7");
    			add_location(path0, file$c, 69, 32, 3416);
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "stroke", "currentColor");
    			attr_dev(svg0, "stroke-linecap", "round");
    			attr_dev(svg0, "stroke-linejoin", "round");
    			attr_dev(svg0, "stroke-width", "2");
    			attr_dev(svg0, "class", "w-4 h-4 ml-2");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			add_location(svg0, file$c, 60, 28, 2977);
    			attr_dev(a0, "class", "inline-flex items-center mt-3 svelte-hfw24l");
    			attr_dev(a0, "href", ".#/Cars");
    			add_location(a0, file$c, 58, 24, 2851);
    			attr_dev(div6, "class", "p-4 md:w-1/2 sm:mb-0 mb-6");
    			add_location(div6, file$c, 38, 20, 1750);
    			attr_dev(img2, "alt", "content");
    			attr_dev(img2, "class", "rounded-lg object-cover object-center h-full w-full");
    			if (!src_url_equal(img2.src, img2_src_value = "img/handnote.png")) attr_dev(img2, "src", img2_src_value);
    			add_location(img2, file$c, 75, 28, 3695);
    			attr_dev(div7, "class", "h-64 overflow-hidden");
    			add_location(div7, file$c, 74, 24, 3631);
    			attr_dev(h21, "class", "text-xl font-medium title-font text-white mt-5");
    			add_location(h21, file$c, 81, 24, 3985);
    			attr_dev(p2, "class", "text-base leading-relaxed mt-2");
    			add_location(p2, file$c, 86, 24, 4206);
    			attr_dev(path1, "d", "M5 12h14M12 5l7 7-7 7");
    			add_location(path1, file$c, 106, 32, 5309);
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "stroke", "currentColor");
    			attr_dev(svg1, "stroke-linecap", "round");
    			attr_dev(svg1, "stroke-linejoin", "round");
    			attr_dev(svg1, "stroke-width", "2");
    			attr_dev(svg1, "class", "w-4 h-4 ml-2");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			add_location(svg1, file$c, 97, 28, 4870);
    			attr_dev(a1, "class", "text-indigo-400 inline-flex items-center mt-3 svelte-hfw24l");
    			attr_dev(a1, "href", ".#/Terms");
    			add_location(a1, file$c, 93, 24, 4669);
    			attr_dev(div8, "class", "p-4 md:w-1/2 sm:mb-0 mb-6");
    			add_location(div8, file$c, 73, 20, 3566);
    			attr_dev(div9, "class", "flex flex-wrap sm:-m-4 -mx-4 -mb-10 -mt-4");
    			add_location(div9, file$c, 37, 16, 1673);
    			attr_dev(div10, "class", "container px-5 py-24 mx-auto");
    			add_location(div10, file$c, 15, 12, 462);
    			attr_dev(section, "class", "text-gray-400 body-font");
    			add_location(section, file$c, 14, 8, 407);
    			attr_dev(div11, "class", "flex flex-col");
    			add_location(div11, file$c, 4, 4, 35);
    			add_location(main, file$c, 3, 0, 23);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div11);
    			append_dev(div11, div0);
    			append_dev(div0, img0);
    			append_dev(div11, t0);
    			append_dev(div11, section);
    			append_dev(section, div10);
    			append_dev(div10, div4);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, h1);
    			append_dev(div3, t3);
    			append_dev(div3, p0);
    			append_dev(div10, t5);
    			append_dev(div10, div9);
    			append_dev(div9, div6);
    			append_dev(div6, div5);
    			append_dev(div5, img1);
    			append_dev(div6, t6);
    			append_dev(div6, h20);
    			append_dev(div6, t8);
    			append_dev(div6, p1);
    			append_dev(div6, t10);
    			append_dev(div6, a0);
    			append_dev(a0, t11);
    			append_dev(a0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div9, t12);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, img2);
    			append_dev(div8, t13);
    			append_dev(div8, h21);
    			append_dev(div8, t15);
    			append_dev(div8, p2);
    			append_dev(div8, t17);
    			append_dev(div8, a1);
    			append_dev(a1, t18);
    			append_dev(a1, svg1);
    			append_dev(svg1, path1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    async function getSession(action, username) {
        let formData = new FormData();
        formData.append("action", action);
        formData.append("username", username);
        const res = await fetch("./backend/setSession.php", {
            method: "POST",
            body: formData,
        });
        const data = await res.text();
        return data
    }

    /* src\routes\Login.svelte generated by Svelte v3.43.2 */
    const file$b = "src\\routes\\Login.svelte";

    // (75:12) {:else}
    function create_else_block$5(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Log in";
    			attr_dev(button, "class", "text-white bg-indigo-500 border-0 py-2 px-8 rounded text-lg");
    			button.disabled = true;
    			add_location(button, file$b, 75, 16, 2991);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(75:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (70:12) {#if !logged}
    function create_if_block$5(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Log in";
    			attr_dev(button, "class", "text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg");
    			add_location(button, file$b, 70, 16, 2761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(70:12) {#if !logged}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let main;
    	let form;
    	let div2;
    	let h2;
    	let t1;
    	let h5;
    	let t2;
    	let t3;
    	let div0;
    	let label0;
    	let t5;
    	let input0;
    	let t6;
    	let div1;
    	let label1;
    	let t8;
    	let input1;
    	let t9;
    	let t10;
    	let p;
    	let t11;
    	let a;
    	let span;
    	let t13;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*logged*/ ctx[0]) return create_if_block$5;
    		return create_else_block$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			form = element("form");
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Log In!";
    			t1 = space();
    			h5 = element("h5");
    			t2 = text(/*error*/ ctx[1]);
    			t3 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Username";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			if_block.c();
    			t10 = space();
    			p = element("p");
    			t11 = text("Don't have an account? ");
    			a = element("a");
    			span = element("span");
    			span.textContent = "Join now";
    			t13 = text("!");
    			attr_dev(h2, "class", "text-white text-xl font-medium title-font mb-5");
    			add_location(h2, file$b, 41, 12, 1251);
    			attr_dev(h5, "class", "text-nord11 text-base font-medium title-font mb-5");
    			add_location(h5, file$b, 44, 12, 1368);
    			attr_dev(label0, "for", "username");
    			attr_dev(label0, "class", "leading-7 text-sm text-gray-400");
    			add_location(label0, file$b, 48, 16, 1533);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "username");
    			attr_dev(input0, "name", "username");
    			attr_dev(input0, "class", "w-full bg-gray-600 bg-opacity-20 focus:bg-transparent focus:ring-2 focus:ring-indigo-900 rounded border border-gray-600 focus:border-indigo-500 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out svelte-8heew7");
    			add_location(input0, file$b, 51, 16, 1669);
    			attr_dev(div0, "class", "relative mb-4");
    			add_location(div0, file$b, 47, 12, 1488);
    			attr_dev(label1, "for", "password");
    			attr_dev(label1, "class", "leading-7 text-sm text-gray-400");
    			add_location(label1, file$b, 59, 16, 2152);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "name", "password");
    			attr_dev(input1, "class", "w-full bg-gray-600 bg-opacity-20 focus:bg-transparent focus:ring-2 focus:ring-indigo-900 rounded border border-gray-600 focus:border-indigo-500 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out svelte-8heew7");
    			add_location(input1, file$b, 62, 16, 2288);
    			attr_dev(div1, "class", "relative mb-4");
    			add_location(div1, file$b, 58, 12, 2107);
    			attr_dev(span, "class", "text-nord8");
    			add_location(span, file$b, 84, 21, 3377);
    			attr_dev(a, "href", ".#/register");
    			add_location(a, file$b, 83, 43, 3333);
    			attr_dev(p, "class", "text-xs mt-3 flex justify-center items-center w-full");
    			add_location(p, file$b, 82, 12, 3224);
    			attr_dev(div2, "class", "lg:w-2/6 md:w-1/2 bg-gray-800 bg-opacity-50 rounded-lg p-8 flex flex-col w-full mt-10 md:mt-0");
    			add_location(div2, file$b, 38, 8, 1107);
    			attr_dev(form, "class", "flex justify-center items-center text-nord6 mt-20");
    			add_location(form, file$b, 34, 4, 988);
    			attr_dev(main, "class", "");
    			add_location(main, file$b, 33, 0, 967);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, form);
    			append_dev(form, div2);
    			append_dev(div2, h2);
    			append_dev(div2, t1);
    			append_dev(div2, h5);
    			append_dev(h5, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t5);
    			append_dev(div0, input0);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t8);
    			append_dev(div1, input1);
    			append_dev(div2, t9);
    			if_block.m(div2, null);
    			append_dev(div2, t10);
    			append_dev(div2, p);
    			append_dev(p, t11);
    			append_dev(p, a);
    			append_dev(a, span);
    			append_dev(p, t13);

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", /*onSubmit*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*error*/ 2) set_data_dev(t2, /*error*/ ctx[1]);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div2, t10);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	let logged;
    	let error = "";

    	const onSubmit = async e => {
    		e.preventDefault();
    		const username = e.target["username"].value;
    		const password = e.target["password"].value;
    		let formData = new FormData();
    		formData.append("username", username);
    		formData.append("password", password);
    		const res = await fetch("./backend/login.php", { method: "POST", body: formData });
    		const data = await res.text();

    		if (data) {
    			await getSession("setUser", username);
    			document.location.href = "./";
    		} else {
    			$$invalidate(1, error = "User doesn't exist!");
    		}
    	};

    	const isLogged = async () => {
    		await getSession("getUser") === ""
    		? $$invalidate(0, logged = false)
    		: $$invalidate(0, logged = true);
    	};

    	isLogged();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getSession,
    		logged,
    		error,
    		onSubmit,
    		isLogged
    	});

    	$$self.$inject_state = $$props => {
    		if ('logged' in $$props) $$invalidate(0, logged = $$props.logged);
    		if ('error' in $$props) $$invalidate(1, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [logged, error, onSubmit];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    async function doesExist$1(username) {
        let formData = new FormData();
        formData.append("username", username);
        const res = await fetch("./backend/doesExist.php", {
            method: "POST",
            body: formData,
        });
        const data = await res.text();
        return data ? true : false;
    }

    /* src\routes\Register.svelte generated by Svelte v3.43.2 */
    const file$a = "src\\routes\\Register.svelte";

    function create_fragment$a(ctx) {
    	let main;
    	let form;
    	let div3;
    	let h2;
    	let t1;
    	let h5;
    	let t2;
    	let t3;
    	let div0;
    	let label0;
    	let t5;
    	let input0;
    	let t6;
    	let div1;
    	let label1;
    	let t8;
    	let input1;
    	let t9;
    	let div2;
    	let label2;
    	let t11;
    	let input2;
    	let t12;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			form = element("form");
    			div3 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Join now!";
    			t1 = space();
    			h5 = element("h5");
    			t2 = text(/*error*/ ctx[0]);
    			t3 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Username";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Confirm Password";
    			t11 = space();
    			input2 = element("input");
    			t12 = space();
    			button = element("button");
    			button.textContent = "Register";
    			attr_dev(h2, "class", "text-white text-xl font-medium title-font mb-5");
    			add_location(h2, file$a, 41, 12, 1495);
    			attr_dev(h5, "class", "text-nord11 text-base font-medium title-font mb-5");
    			add_location(h5, file$a, 44, 12, 1614);
    			attr_dev(label0, "for", "username");
    			attr_dev(label0, "class", "leading-7 text-sm text-gray-400");
    			add_location(label0, file$a, 48, 16, 1779);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "username");
    			attr_dev(input0, "name", "username");
    			attr_dev(input0, "class", "w-full bg-gray-600 bg-opacity-20 focus:bg-transparent focus:ring-2 focus:ring-indigo-900 rounded border border-gray-600 focus:border-indigo-500 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out svelte-8heew7");
    			add_location(input0, file$a, 51, 16, 1915);
    			attr_dev(div0, "class", "relative mb-4");
    			add_location(div0, file$a, 47, 12, 1734);
    			attr_dev(label1, "for", "password");
    			attr_dev(label1, "class", "leading-7 text-sm text-gray-400");
    			add_location(label1, file$a, 59, 16, 2398);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "name", "password");
    			attr_dev(input1, "class", "w-full bg-gray-600 bg-opacity-20 focus:bg-transparent focus:ring-2 focus:ring-indigo-900 rounded border border-gray-600 focus:border-indigo-500 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out svelte-8heew7");
    			add_location(input1, file$a, 62, 16, 2534);
    			attr_dev(div1, "class", "relative mb-4");
    			add_location(div1, file$a, 58, 12, 2353);
    			attr_dev(label2, "for", "confirm-password");
    			attr_dev(label2, "class", "leading-7 text-sm text-gray-400");
    			add_location(label2, file$a, 70, 16, 3021);
    			attr_dev(input2, "type", "password");
    			attr_dev(input2, "id", "confirmPassword");
    			attr_dev(input2, "name", "confirm-password");
    			attr_dev(input2, "class", "w-full bg-gray-600 bg-opacity-20 focus:bg-transparent focus:ring-2 focus:ring-indigo-900 rounded border border-gray-600 focus:border-indigo-500 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out svelte-8heew7");
    			add_location(input2, file$a, 76, 16, 3233);
    			attr_dev(div2, "class", "relative mb-4");
    			add_location(div2, file$a, 69, 12, 2976);
    			attr_dev(button, "class", "text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg");
    			add_location(button, file$a, 83, 12, 3690);
    			attr_dev(div3, "class", "lg:w-2/6 md:w-1/2 bg-gray-800 bg-opacity-50 rounded-lg p-8 flex flex-col w-full mt-10 md:mt-0");
    			add_location(div3, file$a, 38, 8, 1351);
    			attr_dev(form, "class", "flex justify-center items-center text-nord6 mt-20");
    			add_location(form, file$a, 34, 4, 1232);
    			attr_dev(main, "class", "");
    			add_location(main, file$a, 33, 0, 1211);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, form);
    			append_dev(form, div3);
    			append_dev(div3, h2);
    			append_dev(div3, t1);
    			append_dev(div3, h5);
    			append_dev(h5, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t5);
    			append_dev(div0, input0);
    			append_dev(div3, t6);
    			append_dev(div3, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t8);
    			append_dev(div1, input1);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t11);
    			append_dev(div2, input2);
    			append_dev(div3, t12);
    			append_dev(div3, button);

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", /*onSubmit*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*error*/ 1) set_data_dev(t2, /*error*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Register', slots, []);
    	let error = "";

    	const onSubmit = async e => {
    		e.preventDefault();
    		const username = e.target["username"].value;
    		const password = e.target["password"].value;
    		const confirmPassword = e.target["confirmPassword"].value;

    		if (password !== confirmPassword) {
    			$$invalidate(0, error = "The given passwords do not match!");
    		} else if (password.length < 8) {
    			$$invalidate(0, error = "The given password is too short!");
    		} else if (await doesExist$1(username)) {
    			$$invalidate(0, error = "User already exists!");
    		} else {
    			let formData = new FormData();
    			formData.append("username", username);
    			formData.append("password", password);
    			const res = await fetch("./backend/register.php", { method: "POST", body: formData });
    			const data = await res.text();

    			data === "added"
    			? document.location.href = "#/login"
    			: $$invalidate(0, error = "An error occured while registering! Please try again!");
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Register> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ doesExist: doesExist$1, error, onSubmit });

    	$$self.$inject_state = $$props => {
    		if ('error' in $$props) $$invalidate(0, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [error, onSubmit];
    }

    class Register extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Register",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\routes\NotFound.svelte generated by Svelte v3.43.2 */

    const file$9 = "src\\routes\\NotFound.svelte";

    function create_fragment$9(ctx) {
    	let main;
    	let h10;
    	let t1;
    	let h11;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h10 = element("h1");
    			h10.textContent = "404";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "Page not found!";
    			attr_dev(h10, "class", "w-screen flex justify-center items-center mt-20 text-8xl font-bold text-nord11");
    			add_location(h10, file$9, 4, 4, 35);
    			attr_dev(h11, "class", "w-screen flex justify-center items-center mt-20 text-2xl text-nord11");
    			add_location(h11, file$9, 9, 4, 171);
    			add_location(main, file$9, 3, 0, 23);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h10);
    			append_dev(main, t1);
    			append_dev(main, h11);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NotFound', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    async function checkId(username) {
        let formData = new FormData();
        formData.append("username", username);
        const res = await fetch("./backend/checkId.php", {
            method: "POST",
            body: formData,
        });
        const data = await res.text();
        return data;
    }

    async function getReservations() {
        const users = await fetch("./backend/getUsers.php", {
            method: "GET"
        });
        const userData = await users.json();
        const cars = await fetch("./backend/getCars.php", {
            method: "GET"
        });
        const carData = await cars.json();
        const reservations = await fetch("./backend/getReservations.php", {
            method: "GET",
        });
        const reservationsData = await reservations.json();

        const reservationsArray = reservationsData.map(reservation => {
            let modifiedReservation = reservation;
            userData.forEach(user => {
                if (user.id === reservation.userId) modifiedReservation = { ...modifiedReservation, userName: user.username };
            });
            carData.forEach(car => {
                if (car.id === reservation.carId) modifiedReservation = { ...modifiedReservation, carName: `${car.mark} ${car.model}` };
            });
            return modifiedReservation
        });

        return reservationsArray
    }

    async function handleReservation(carId, username, startTime, endTime) {
        const userId = await checkId(username);
        let formData = new FormData();
        formData.append("carId", carId);
        formData.append("userId", userId);
        formData.append("startTime", startTime);
        formData.append("endTime", endTime);
        const res = await fetch("./backend/handleReservation.php", {
            method: "POST",
            body: formData,
        });
        const data = await res.text();
        return data
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var sweetalert2_all = createCommonjsModule(function (module, exports) {
    /*!
    * sweetalert2 v11.1.9
    * Released under the MIT License.
    */
    (function (global, factory) {
      module.exports = factory() ;
    }(commonjsGlobal, function () {
      const DismissReason = Object.freeze({
        cancel: 'cancel',
        backdrop: 'backdrop',
        close: 'close',
        esc: 'esc',
        timer: 'timer'
      });

      const consolePrefix = 'SweetAlert2:';
      /**
       * Filter the unique values into a new array
       * @param arr
       */

      const uniqueArray = arr => {
        const result = [];

        for (let i = 0; i < arr.length; i++) {
          if (result.indexOf(arr[i]) === -1) {
            result.push(arr[i]);
          }
        }

        return result;
      };
      /**
       * Capitalize the first letter of a string
       * @param str
       */

      const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);
      /**
       * Convert NodeList to Array
       * @param nodeList
       */

      const toArray = nodeList => Array.prototype.slice.call(nodeList);
      /**
       * Standardise console warnings
       * @param message
       */

      const warn = message => {
        console.warn("".concat(consolePrefix, " ").concat(typeof message === 'object' ? message.join(' ') : message));
      };
      /**
       * Standardise console errors
       * @param message
       */

      const error = message => {
        console.error("".concat(consolePrefix, " ").concat(message));
      };
      /**
       * Private global state for `warnOnce`
       * @type {Array}
       * @private
       */

      const previousWarnOnceMessages = [];
      /**
       * Show a console warning, but only if it hasn't already been shown
       * @param message
       */

      const warnOnce = message => {
        if (!previousWarnOnceMessages.includes(message)) {
          previousWarnOnceMessages.push(message);
          warn(message);
        }
      };
      /**
       * Show a one-time console warning about deprecated params/methods
       */

      const warnAboutDeprecation = (deprecatedParam, useInstead) => {
        warnOnce("\"".concat(deprecatedParam, "\" is deprecated and will be removed in the next major release. Please use \"").concat(useInstead, "\" instead."));
      };
      /**
       * If `arg` is a function, call it (with no arguments or context) and return the result.
       * Otherwise, just pass the value through
       * @param arg
       */

      const callIfFunction = arg => typeof arg === 'function' ? arg() : arg;
      const hasToPromiseFn = arg => arg && typeof arg.toPromise === 'function';
      const asPromise = arg => hasToPromiseFn(arg) ? arg.toPromise() : Promise.resolve(arg);
      const isPromise = arg => arg && Promise.resolve(arg) === arg;

      const isJqueryElement = elem => typeof elem === 'object' && elem.jquery;

      const isElement = elem => elem instanceof Element || isJqueryElement(elem);

      const argsToParams = args => {
        const params = {};

        if (typeof args[0] === 'object' && !isElement(args[0])) {
          Object.assign(params, args[0]);
        } else {
          ['title', 'html', 'icon'].forEach((name, index) => {
            const arg = args[index];

            if (typeof arg === 'string' || isElement(arg)) {
              params[name] = arg;
            } else if (arg !== undefined) {
              error("Unexpected type of ".concat(name, "! Expected \"string\" or \"Element\", got ").concat(typeof arg));
            }
          });
        }

        return params;
      };

      const swalPrefix = 'swal2-';
      const prefix = items => {
        const result = {};

        for (const i in items) {
          result[items[i]] = swalPrefix + items[i];
        }

        return result;
      };
      const swalClasses = prefix(['container', 'shown', 'height-auto', 'iosfix', 'popup', 'modal', 'no-backdrop', 'no-transition', 'toast', 'toast-shown', 'show', 'hide', 'close', 'title', 'html-container', 'actions', 'confirm', 'deny', 'cancel', 'default-outline', 'footer', 'icon', 'icon-content', 'image', 'input', 'file', 'range', 'select', 'radio', 'checkbox', 'label', 'textarea', 'inputerror', 'input-label', 'validation-message', 'progress-steps', 'active-progress-step', 'progress-step', 'progress-step-line', 'loader', 'loading', 'styled', 'top', 'top-start', 'top-end', 'top-left', 'top-right', 'center', 'center-start', 'center-end', 'center-left', 'center-right', 'bottom', 'bottom-start', 'bottom-end', 'bottom-left', 'bottom-right', 'grow-row', 'grow-column', 'grow-fullscreen', 'rtl', 'timer-progress-bar', 'timer-progress-bar-container', 'scrollbar-measure', 'icon-success', 'icon-warning', 'icon-info', 'icon-question', 'icon-error']);
      const iconTypes = prefix(['success', 'warning', 'info', 'question', 'error']);

      const getContainer = () => document.body.querySelector(".".concat(swalClasses.container));
      const elementBySelector = selectorString => {
        const container = getContainer();
        return container ? container.querySelector(selectorString) : null;
      };

      const elementByClass = className => {
        return elementBySelector(".".concat(className));
      };

      const getPopup = () => elementByClass(swalClasses.popup);
      const getIcon = () => elementByClass(swalClasses.icon);
      const getTitle = () => elementByClass(swalClasses.title);
      const getHtmlContainer = () => elementByClass(swalClasses['html-container']);
      const getImage = () => elementByClass(swalClasses.image);
      const getProgressSteps = () => elementByClass(swalClasses['progress-steps']);
      const getValidationMessage = () => elementByClass(swalClasses['validation-message']);
      const getConfirmButton = () => elementBySelector(".".concat(swalClasses.actions, " .").concat(swalClasses.confirm));
      const getDenyButton = () => elementBySelector(".".concat(swalClasses.actions, " .").concat(swalClasses.deny));
      const getInputLabel = () => elementByClass(swalClasses['input-label']);
      const getLoader = () => elementBySelector(".".concat(swalClasses.loader));
      const getCancelButton = () => elementBySelector(".".concat(swalClasses.actions, " .").concat(swalClasses.cancel));
      const getActions = () => elementByClass(swalClasses.actions);
      const getFooter = () => elementByClass(swalClasses.footer);
      const getTimerProgressBar = () => elementByClass(swalClasses['timer-progress-bar']);
      const getCloseButton = () => elementByClass(swalClasses.close); // https://github.com/jkup/focusable/blob/master/index.js

      const focusable = "\n  a[href],\n  area[href],\n  input:not([disabled]),\n  select:not([disabled]),\n  textarea:not([disabled]),\n  button:not([disabled]),\n  iframe,\n  object,\n  embed,\n  [tabindex=\"0\"],\n  [contenteditable],\n  audio[controls],\n  video[controls],\n  summary\n";
      const getFocusableElements = () => {
        const focusableElementsWithTabindex = toArray(getPopup().querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])')) // sort according to tabindex
        .sort((a, b) => {
          a = parseInt(a.getAttribute('tabindex'));
          b = parseInt(b.getAttribute('tabindex'));

          if (a > b) {
            return 1;
          } else if (a < b) {
            return -1;
          }

          return 0;
        });
        const otherFocusableElements = toArray(getPopup().querySelectorAll(focusable)).filter(el => el.getAttribute('tabindex') !== '-1');
        return uniqueArray(focusableElementsWithTabindex.concat(otherFocusableElements)).filter(el => isVisible(el));
      };
      const isModal = () => {
        return !isToast() && !document.body.classList.contains(swalClasses['no-backdrop']);
      };
      const isToast = () => {
        return document.body.classList.contains(swalClasses['toast-shown']);
      };
      const isLoading = () => {
        return getPopup().hasAttribute('data-loading');
      };

      const states = {
        previousBodyPadding: null
      };
      const setInnerHtml = (elem, html) => {
        // #1926
        elem.textContent = '';

        if (html) {
          const parser = new DOMParser();
          const parsed = parser.parseFromString(html, "text/html");
          toArray(parsed.querySelector('head').childNodes).forEach(child => {
            elem.appendChild(child);
          });
          toArray(parsed.querySelector('body').childNodes).forEach(child => {
            elem.appendChild(child);
          });
        }
      };
      const hasClass = (elem, className) => {
        if (!className) {
          return false;
        }

        const classList = className.split(/\s+/);

        for (let i = 0; i < classList.length; i++) {
          if (!elem.classList.contains(classList[i])) {
            return false;
          }
        }

        return true;
      };

      const removeCustomClasses = (elem, params) => {
        toArray(elem.classList).forEach(className => {
          if (!Object.values(swalClasses).includes(className) && !Object.values(iconTypes).includes(className) && !Object.values(params.showClass).includes(className)) {
            elem.classList.remove(className);
          }
        });
      };

      const applyCustomClass = (elem, params, className) => {
        removeCustomClasses(elem, params);

        if (params.customClass && params.customClass[className]) {
          if (typeof params.customClass[className] !== 'string' && !params.customClass[className].forEach) {
            return warn("Invalid type of customClass.".concat(className, "! Expected string or iterable object, got \"").concat(typeof params.customClass[className], "\""));
          }

          addClass(elem, params.customClass[className]);
        }
      };
      const getInput = (popup, inputType) => {
        if (!inputType) {
          return null;
        }

        switch (inputType) {
          case 'select':
          case 'textarea':
          case 'file':
            return getChildByClass(popup, swalClasses[inputType]);

          case 'checkbox':
            return popup.querySelector(".".concat(swalClasses.checkbox, " input"));

          case 'radio':
            return popup.querySelector(".".concat(swalClasses.radio, " input:checked")) || popup.querySelector(".".concat(swalClasses.radio, " input:first-child"));

          case 'range':
            return popup.querySelector(".".concat(swalClasses.range, " input"));

          default:
            return getChildByClass(popup, swalClasses.input);
        }
      };
      const focusInput = input => {
        input.focus(); // place cursor at end of text in text input

        if (input.type !== 'file') {
          // http://stackoverflow.com/a/2345915
          const val = input.value;
          input.value = '';
          input.value = val;
        }
      };
      const toggleClass = (target, classList, condition) => {
        if (!target || !classList) {
          return;
        }

        if (typeof classList === 'string') {
          classList = classList.split(/\s+/).filter(Boolean);
        }

        classList.forEach(className => {
          if (target.forEach) {
            target.forEach(elem => {
              condition ? elem.classList.add(className) : elem.classList.remove(className);
            });
          } else {
            condition ? target.classList.add(className) : target.classList.remove(className);
          }
        });
      };
      const addClass = (target, classList) => {
        toggleClass(target, classList, true);
      };
      const removeClass = (target, classList) => {
        toggleClass(target, classList, false);
      };
      const getChildByClass = (elem, className) => {
        for (let i = 0; i < elem.childNodes.length; i++) {
          if (hasClass(elem.childNodes[i], className)) {
            return elem.childNodes[i];
          }
        }
      };
      const applyNumericalStyle = (elem, property, value) => {
        if (value === "".concat(parseInt(value))) {
          value = parseInt(value);
        }

        if (value || parseInt(value) === 0) {
          elem.style[property] = typeof value === 'number' ? "".concat(value, "px") : value;
        } else {
          elem.style.removeProperty(property);
        }
      };
      const show = (elem, display = 'flex') => {
        elem.style.display = display;
      };
      const hide = elem => {
        elem.style.display = 'none';
      };
      const setStyle = (parent, selector, property, value) => {
        const el = parent.querySelector(selector);

        if (el) {
          el.style[property] = value;
        }
      };
      const toggle = (elem, condition, display) => {
        condition ? show(elem, display) : hide(elem);
      }; // borrowed from jquery $(elem).is(':visible') implementation

      const isVisible = elem => !!(elem && (elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length));
      const allButtonsAreHidden = () => !isVisible(getConfirmButton()) && !isVisible(getDenyButton()) && !isVisible(getCancelButton());
      const isScrollable = elem => !!(elem.scrollHeight > elem.clientHeight); // borrowed from https://stackoverflow.com/a/46352119

      const hasCssAnimation = elem => {
        const style = window.getComputedStyle(elem);
        const animDuration = parseFloat(style.getPropertyValue('animation-duration') || '0');
        const transDuration = parseFloat(style.getPropertyValue('transition-duration') || '0');
        return animDuration > 0 || transDuration > 0;
      };
      const animateTimerProgressBar = (timer, reset = false) => {
        const timerProgressBar = getTimerProgressBar();

        if (isVisible(timerProgressBar)) {
          if (reset) {
            timerProgressBar.style.transition = 'none';
            timerProgressBar.style.width = '100%';
          }

          setTimeout(() => {
            timerProgressBar.style.transition = "width ".concat(timer / 1000, "s linear");
            timerProgressBar.style.width = '0%';
          }, 10);
        }
      };
      const stopTimerProgressBar = () => {
        const timerProgressBar = getTimerProgressBar();
        const timerProgressBarWidth = parseInt(window.getComputedStyle(timerProgressBar).width);
        timerProgressBar.style.removeProperty('transition');
        timerProgressBar.style.width = '100%';
        const timerProgressBarFullWidth = parseInt(window.getComputedStyle(timerProgressBar).width);
        const timerProgressBarPercent = parseInt(timerProgressBarWidth / timerProgressBarFullWidth * 100);
        timerProgressBar.style.removeProperty('transition');
        timerProgressBar.style.width = "".concat(timerProgressBarPercent, "%");
      };

      // Detect Node env
      const isNodeEnv = () => typeof window === 'undefined' || typeof document === 'undefined';

      const sweetHTML = "\n <div aria-labelledby=\"".concat(swalClasses.title, "\" aria-describedby=\"").concat(swalClasses['html-container'], "\" class=\"").concat(swalClasses.popup, "\" tabindex=\"-1\">\n   <button type=\"button\" class=\"").concat(swalClasses.close, "\"></button>\n   <ul class=\"").concat(swalClasses['progress-steps'], "\"></ul>\n   <div class=\"").concat(swalClasses.icon, "\"></div>\n   <img class=\"").concat(swalClasses.image, "\" />\n   <h2 class=\"").concat(swalClasses.title, "\" id=\"").concat(swalClasses.title, "\"></h2>\n   <div class=\"").concat(swalClasses['html-container'], "\" id=\"").concat(swalClasses['html-container'], "\"></div>\n   <input class=\"").concat(swalClasses.input, "\" />\n   <input type=\"file\" class=\"").concat(swalClasses.file, "\" />\n   <div class=\"").concat(swalClasses.range, "\">\n     <input type=\"range\" />\n     <output></output>\n   </div>\n   <select class=\"").concat(swalClasses.select, "\"></select>\n   <div class=\"").concat(swalClasses.radio, "\"></div>\n   <label for=\"").concat(swalClasses.checkbox, "\" class=\"").concat(swalClasses.checkbox, "\">\n     <input type=\"checkbox\" />\n     <span class=\"").concat(swalClasses.label, "\"></span>\n   </label>\n   <textarea class=\"").concat(swalClasses.textarea, "\"></textarea>\n   <div class=\"").concat(swalClasses['validation-message'], "\" id=\"").concat(swalClasses['validation-message'], "\"></div>\n   <div class=\"").concat(swalClasses.actions, "\">\n     <div class=\"").concat(swalClasses.loader, "\"></div>\n     <button type=\"button\" class=\"").concat(swalClasses.confirm, "\"></button>\n     <button type=\"button\" class=\"").concat(swalClasses.deny, "\"></button>\n     <button type=\"button\" class=\"").concat(swalClasses.cancel, "\"></button>\n   </div>\n   <div class=\"").concat(swalClasses.footer, "\"></div>\n   <div class=\"").concat(swalClasses['timer-progress-bar-container'], "\">\n     <div class=\"").concat(swalClasses['timer-progress-bar'], "\"></div>\n   </div>\n </div>\n").replace(/(^|\n)\s*/g, '');

      const resetOldContainer = () => {
        const oldContainer = getContainer();

        if (!oldContainer) {
          return false;
        }

        oldContainer.remove();
        removeClass([document.documentElement, document.body], [swalClasses['no-backdrop'], swalClasses['toast-shown'], swalClasses['has-column']]);
        return true;
      };

      const resetValidationMessage = () => {
        if (Swal.isVisible()) {
          Swal.resetValidationMessage();
        }
      };

      const addInputChangeListeners = () => {
        const popup = getPopup();
        const input = getChildByClass(popup, swalClasses.input);
        const file = getChildByClass(popup, swalClasses.file);
        const range = popup.querySelector(".".concat(swalClasses.range, " input"));
        const rangeOutput = popup.querySelector(".".concat(swalClasses.range, " output"));
        const select = getChildByClass(popup, swalClasses.select);
        const checkbox = popup.querySelector(".".concat(swalClasses.checkbox, " input"));
        const textarea = getChildByClass(popup, swalClasses.textarea);
        input.oninput = resetValidationMessage;
        file.onchange = resetValidationMessage;
        select.onchange = resetValidationMessage;
        checkbox.onchange = resetValidationMessage;
        textarea.oninput = resetValidationMessage;

        range.oninput = () => {
          resetValidationMessage();
          rangeOutput.value = range.value;
        };

        range.onchange = () => {
          resetValidationMessage();
          range.nextSibling.value = range.value;
        };
      };

      const getTarget = target => typeof target === 'string' ? document.querySelector(target) : target;

      const setupAccessibility = params => {
        const popup = getPopup();
        popup.setAttribute('role', params.toast ? 'alert' : 'dialog');
        popup.setAttribute('aria-live', params.toast ? 'polite' : 'assertive');

        if (!params.toast) {
          popup.setAttribute('aria-modal', 'true');
        }
      };

      const setupRTL = targetElement => {
        if (window.getComputedStyle(targetElement).direction === 'rtl') {
          addClass(getContainer(), swalClasses.rtl);
        }
      };
      /*
       * Add modal + backdrop to DOM
       */


      const init = params => {
        // Clean up the old popup container if it exists
        const oldContainerExisted = resetOldContainer();
        /* istanbul ignore if */

        if (isNodeEnv()) {
          error('SweetAlert2 requires document to initialize');
          return;
        }

        const container = document.createElement('div');
        container.className = swalClasses.container;

        if (oldContainerExisted) {
          addClass(container, swalClasses['no-transition']);
        }

        setInnerHtml(container, sweetHTML);
        const targetElement = getTarget(params.target);
        targetElement.appendChild(container);
        setupAccessibility(params);
        setupRTL(targetElement);
        addInputChangeListeners();
      };

      const parseHtmlToContainer = (param, target) => {
        // DOM element
        if (param instanceof HTMLElement) {
          target.appendChild(param); // Object
        } else if (typeof param === 'object') {
          handleObject(param, target); // Plain string
        } else if (param) {
          setInnerHtml(target, param);
        }
      };

      const handleObject = (param, target) => {
        // JQuery element(s)
        if (param.jquery) {
          handleJqueryElem(target, param); // For other objects use their string representation
        } else {
          setInnerHtml(target, param.toString());
        }
      };

      const handleJqueryElem = (target, elem) => {
        target.textContent = '';

        if (0 in elem) {
          for (let i = 0; (i in elem); i++) {
            target.appendChild(elem[i].cloneNode(true));
          }
        } else {
          target.appendChild(elem.cloneNode(true));
        }
      };

      const animationEndEvent = (() => {
        // Prevent run in Node env

        /* istanbul ignore if */
        if (isNodeEnv()) {
          return false;
        }

        const testEl = document.createElement('div');
        const transEndEventNames = {
          WebkitAnimation: 'webkitAnimationEnd',
          OAnimation: 'oAnimationEnd oanimationend',
          animation: 'animationend'
        };

        for (const i in transEndEventNames) {
          if (Object.prototype.hasOwnProperty.call(transEndEventNames, i) && typeof testEl.style[i] !== 'undefined') {
            return transEndEventNames[i];
          }
        }

        return false;
      })();

      // https://github.com/twbs/bootstrap/blob/master/js/src/modal.js

      const measureScrollbar = () => {
        const scrollDiv = document.createElement('div');
        scrollDiv.className = swalClasses['scrollbar-measure'];
        document.body.appendChild(scrollDiv);
        const scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
        return scrollbarWidth;
      };

      const renderActions = (instance, params) => {
        const actions = getActions();
        const loader = getLoader();
        const confirmButton = getConfirmButton();
        const denyButton = getDenyButton();
        const cancelButton = getCancelButton(); // Actions (buttons) wrapper

        if (!params.showConfirmButton && !params.showDenyButton && !params.showCancelButton) {
          hide(actions);
        } else {
          show(actions);
        } // Custom class


        applyCustomClass(actions, params, 'actions'); // Render buttons

        renderButton(confirmButton, 'confirm', params);
        renderButton(denyButton, 'deny', params);
        renderButton(cancelButton, 'cancel', params);
        handleButtonsStyling(confirmButton, denyButton, cancelButton, params);

        if (params.reverseButtons) {
          actions.insertBefore(cancelButton, loader);
          actions.insertBefore(denyButton, loader);
          actions.insertBefore(confirmButton, loader);
        } // Loader


        setInnerHtml(loader, params.loaderHtml);
        applyCustomClass(loader, params, 'loader');
      };

      function handleButtonsStyling(confirmButton, denyButton, cancelButton, params) {
        if (!params.buttonsStyling) {
          return removeClass([confirmButton, denyButton, cancelButton], swalClasses.styled);
        }

        addClass([confirmButton, denyButton, cancelButton], swalClasses.styled); // Buttons background colors

        if (params.confirmButtonColor) {
          confirmButton.style.backgroundColor = params.confirmButtonColor;
          addClass(confirmButton, swalClasses['default-outline']);
        }

        if (params.denyButtonColor) {
          denyButton.style.backgroundColor = params.denyButtonColor;
          addClass(denyButton, swalClasses['default-outline']);
        }

        if (params.cancelButtonColor) {
          cancelButton.style.backgroundColor = params.cancelButtonColor;
          addClass(cancelButton, swalClasses['default-outline']);
        }
      }

      function renderButton(button, buttonType, params) {
        toggle(button, params["show".concat(capitalizeFirstLetter(buttonType), "Button")], 'inline-block');
        setInnerHtml(button, params["".concat(buttonType, "ButtonText")]); // Set caption text

        button.setAttribute('aria-label', params["".concat(buttonType, "ButtonAriaLabel")]); // ARIA label
        // Add buttons custom classes

        button.className = swalClasses[buttonType];
        applyCustomClass(button, params, "".concat(buttonType, "Button"));
        addClass(button, params["".concat(buttonType, "ButtonClass")]);
      }

      function handleBackdropParam(container, backdrop) {
        if (typeof backdrop === 'string') {
          container.style.background = backdrop;
        } else if (!backdrop) {
          addClass([document.documentElement, document.body], swalClasses['no-backdrop']);
        }
      }

      function handlePositionParam(container, position) {
        if (position in swalClasses) {
          addClass(container, swalClasses[position]);
        } else {
          warn('The "position" parameter is not valid, defaulting to "center"');
          addClass(container, swalClasses.center);
        }
      }

      function handleGrowParam(container, grow) {
        if (grow && typeof grow === 'string') {
          const growClass = "grow-".concat(grow);

          if (growClass in swalClasses) {
            addClass(container, swalClasses[growClass]);
          }
        }
      }

      const renderContainer = (instance, params) => {
        const container = getContainer();

        if (!container) {
          return;
        }

        handleBackdropParam(container, params.backdrop);
        handlePositionParam(container, params.position);
        handleGrowParam(container, params.grow); // Custom class

        applyCustomClass(container, params, 'container');
      };

      /**
       * This module containts `WeakMap`s for each effectively-"private  property" that a `Swal` has.
       * For example, to set the private property "foo" of `this` to "bar", you can `privateProps.foo.set(this, 'bar')`
       * This is the approach that Babel will probably take to implement private methods/fields
       *   https://github.com/tc39/proposal-private-methods
       *   https://github.com/babel/babel/pull/7555
       * Once we have the changes from that PR in Babel, and our core class fits reasonable in *one module*
       *   then we can use that language feature.
       */
      var privateProps = {
        awaitingPromise: new WeakMap(),
        promise: new WeakMap(),
        innerParams: new WeakMap(),
        domCache: new WeakMap()
      };

      const inputTypes = ['input', 'file', 'range', 'select', 'radio', 'checkbox', 'textarea'];
      const renderInput = (instance, params) => {
        const popup = getPopup();
        const innerParams = privateProps.innerParams.get(instance);
        const rerender = !innerParams || params.input !== innerParams.input;
        inputTypes.forEach(inputType => {
          const inputClass = swalClasses[inputType];
          const inputContainer = getChildByClass(popup, inputClass); // set attributes

          setAttributes(inputType, params.inputAttributes); // set class

          inputContainer.className = inputClass;

          if (rerender) {
            hide(inputContainer);
          }
        });

        if (params.input) {
          if (rerender) {
            showInput(params);
          } // set custom class


          setCustomClass(params);
        }
      };

      const showInput = params => {
        if (!renderInputType[params.input]) {
          return error("Unexpected type of input! Expected \"text\", \"email\", \"password\", \"number\", \"tel\", \"select\", \"radio\", \"checkbox\", \"textarea\", \"file\" or \"url\", got \"".concat(params.input, "\""));
        }

        const inputContainer = getInputContainer(params.input);
        const input = renderInputType[params.input](inputContainer, params);
        show(input); // input autofocus

        setTimeout(() => {
          focusInput(input);
        });
      };

      const removeAttributes = input => {
        for (let i = 0; i < input.attributes.length; i++) {
          const attrName = input.attributes[i].name;

          if (!['type', 'value', 'style'].includes(attrName)) {
            input.removeAttribute(attrName);
          }
        }
      };

      const setAttributes = (inputType, inputAttributes) => {
        const input = getInput(getPopup(), inputType);

        if (!input) {
          return;
        }

        removeAttributes(input);

        for (const attr in inputAttributes) {
          input.setAttribute(attr, inputAttributes[attr]);
        }
      };

      const setCustomClass = params => {
        const inputContainer = getInputContainer(params.input);

        if (params.customClass) {
          addClass(inputContainer, params.customClass.input);
        }
      };

      const setInputPlaceholder = (input, params) => {
        if (!input.placeholder || params.inputPlaceholder) {
          input.placeholder = params.inputPlaceholder;
        }
      };

      const setInputLabel = (input, prependTo, params) => {
        if (params.inputLabel) {
          input.id = swalClasses.input;
          const label = document.createElement('label');
          const labelClass = swalClasses['input-label'];
          label.setAttribute('for', input.id);
          label.className = labelClass;
          addClass(label, params.customClass.inputLabel);
          label.innerText = params.inputLabel;
          prependTo.insertAdjacentElement('beforebegin', label);
        }
      };

      const getInputContainer = inputType => {
        const inputClass = swalClasses[inputType] ? swalClasses[inputType] : swalClasses.input;
        return getChildByClass(getPopup(), inputClass);
      };

      const renderInputType = {};

      renderInputType.text = renderInputType.email = renderInputType.password = renderInputType.number = renderInputType.tel = renderInputType.url = (input, params) => {
        if (typeof params.inputValue === 'string' || typeof params.inputValue === 'number') {
          input.value = params.inputValue;
        } else if (!isPromise(params.inputValue)) {
          warn("Unexpected type of inputValue! Expected \"string\", \"number\" or \"Promise\", got \"".concat(typeof params.inputValue, "\""));
        }

        setInputLabel(input, input, params);
        setInputPlaceholder(input, params);
        input.type = params.input;
        return input;
      };

      renderInputType.file = (input, params) => {
        setInputLabel(input, input, params);
        setInputPlaceholder(input, params);
        return input;
      };

      renderInputType.range = (range, params) => {
        const rangeInput = range.querySelector('input');
        const rangeOutput = range.querySelector('output');
        rangeInput.value = params.inputValue;
        rangeInput.type = params.input;
        rangeOutput.value = params.inputValue;
        setInputLabel(rangeInput, range, params);
        return range;
      };

      renderInputType.select = (select, params) => {
        select.textContent = '';

        if (params.inputPlaceholder) {
          const placeholder = document.createElement('option');
          setInnerHtml(placeholder, params.inputPlaceholder);
          placeholder.value = '';
          placeholder.disabled = true;
          placeholder.selected = true;
          select.appendChild(placeholder);
        }

        setInputLabel(select, select, params);
        return select;
      };

      renderInputType.radio = radio => {
        radio.textContent = '';
        return radio;
      };

      renderInputType.checkbox = (checkboxContainer, params) => {
        const checkbox = getInput(getPopup(), 'checkbox');
        checkbox.value = 1;
        checkbox.id = swalClasses.checkbox;
        checkbox.checked = Boolean(params.inputValue);
        const label = checkboxContainer.querySelector('span');
        setInnerHtml(label, params.inputPlaceholder);
        return checkboxContainer;
      };

      renderInputType.textarea = (textarea, params) => {
        textarea.value = params.inputValue;
        setInputPlaceholder(textarea, params);
        setInputLabel(textarea, textarea, params);

        const getMargin = el => parseInt(window.getComputedStyle(el).marginLeft) + parseInt(window.getComputedStyle(el).marginRight);

        setTimeout(() => {
          // #2291
          if ('MutationObserver' in window) {
            // #1699
            const initialPopupWidth = parseInt(window.getComputedStyle(getPopup()).width);

            const textareaResizeHandler = () => {
              const textareaWidth = textarea.offsetWidth + getMargin(textarea);

              if (textareaWidth > initialPopupWidth) {
                getPopup().style.width = "".concat(textareaWidth, "px");
              } else {
                getPopup().style.width = null;
              }
            };

            new MutationObserver(textareaResizeHandler).observe(textarea, {
              attributes: true,
              attributeFilter: ['style']
            });
          }
        });
        return textarea;
      };

      const renderContent = (instance, params) => {
        const htmlContainer = getHtmlContainer();
        applyCustomClass(htmlContainer, params, 'htmlContainer'); // Content as HTML

        if (params.html) {
          parseHtmlToContainer(params.html, htmlContainer);
          show(htmlContainer, 'block'); // Content as plain text
        } else if (params.text) {
          htmlContainer.textContent = params.text;
          show(htmlContainer, 'block'); // No content
        } else {
          hide(htmlContainer);
        }

        renderInput(instance, params);
      };

      const renderFooter = (instance, params) => {
        const footer = getFooter();
        toggle(footer, params.footer);

        if (params.footer) {
          parseHtmlToContainer(params.footer, footer);
        } // Custom class


        applyCustomClass(footer, params, 'footer');
      };

      const renderCloseButton = (instance, params) => {
        const closeButton = getCloseButton();
        setInnerHtml(closeButton, params.closeButtonHtml); // Custom class

        applyCustomClass(closeButton, params, 'closeButton');
        toggle(closeButton, params.showCloseButton);
        closeButton.setAttribute('aria-label', params.closeButtonAriaLabel);
      };

      const renderIcon = (instance, params) => {
        const innerParams = privateProps.innerParams.get(instance);
        const icon = getIcon(); // if the given icon already rendered, apply the styling without re-rendering the icon

        if (innerParams && params.icon === innerParams.icon) {
          // Custom or default content
          setContent(icon, params);
          applyStyles(icon, params);
          return;
        }

        if (!params.icon && !params.iconHtml) {
          return hide(icon);
        }

        if (params.icon && Object.keys(iconTypes).indexOf(params.icon) === -1) {
          error("Unknown icon! Expected \"success\", \"error\", \"warning\", \"info\" or \"question\", got \"".concat(params.icon, "\""));
          return hide(icon);
        }

        show(icon); // Custom or default content

        setContent(icon, params);
        applyStyles(icon, params); // Animate icon

        addClass(icon, params.showClass.icon);
      };

      const applyStyles = (icon, params) => {
        for (const iconType in iconTypes) {
          if (params.icon !== iconType) {
            removeClass(icon, iconTypes[iconType]);
          }
        }

        addClass(icon, iconTypes[params.icon]); // Icon color

        setColor(icon, params); // Success icon background color

        adjustSuccessIconBackgoundColor(); // Custom class

        applyCustomClass(icon, params, 'icon');
      }; // Adjust success icon background color to match the popup background color


      const adjustSuccessIconBackgoundColor = () => {
        const popup = getPopup();
        const popupBackgroundColor = window.getComputedStyle(popup).getPropertyValue('background-color');
        const successIconParts = popup.querySelectorAll('[class^=swal2-success-circular-line], .swal2-success-fix');

        for (let i = 0; i < successIconParts.length; i++) {
          successIconParts[i].style.backgroundColor = popupBackgroundColor;
        }
      };

      const setContent = (icon, params) => {
        icon.textContent = '';

        if (params.iconHtml) {
          setInnerHtml(icon, iconContent(params.iconHtml));
        } else if (params.icon === 'success') {
          setInnerHtml(icon, "\n      <div class=\"swal2-success-circular-line-left\"></div>\n      <span class=\"swal2-success-line-tip\"></span> <span class=\"swal2-success-line-long\"></span>\n      <div class=\"swal2-success-ring\"></div> <div class=\"swal2-success-fix\"></div>\n      <div class=\"swal2-success-circular-line-right\"></div>\n    ");
        } else if (params.icon === 'error') {
          setInnerHtml(icon, "\n      <span class=\"swal2-x-mark\">\n        <span class=\"swal2-x-mark-line-left\"></span>\n        <span class=\"swal2-x-mark-line-right\"></span>\n      </span>\n    ");
        } else {
          const defaultIconHtml = {
            question: '?',
            warning: '!',
            info: 'i'
          };
          setInnerHtml(icon, iconContent(defaultIconHtml[params.icon]));
        }
      };

      const setColor = (icon, params) => {
        if (!params.iconColor) {
          return;
        }

        icon.style.color = params.iconColor;
        icon.style.borderColor = params.iconColor;

        for (const sel of ['.swal2-success-line-tip', '.swal2-success-line-long', '.swal2-x-mark-line-left', '.swal2-x-mark-line-right']) {
          setStyle(icon, sel, 'backgroundColor', params.iconColor);
        }

        setStyle(icon, '.swal2-success-ring', 'borderColor', params.iconColor);
      };

      const iconContent = content => "<div class=\"".concat(swalClasses['icon-content'], "\">").concat(content, "</div>");

      const renderImage = (instance, params) => {
        const image = getImage();

        if (!params.imageUrl) {
          return hide(image);
        }

        show(image, ''); // Src, alt

        image.setAttribute('src', params.imageUrl);
        image.setAttribute('alt', params.imageAlt); // Width, height

        applyNumericalStyle(image, 'width', params.imageWidth);
        applyNumericalStyle(image, 'height', params.imageHeight); // Class

        image.className = swalClasses.image;
        applyCustomClass(image, params, 'image');
      };

      const createStepElement = step => {
        const stepEl = document.createElement('li');
        addClass(stepEl, swalClasses['progress-step']);
        setInnerHtml(stepEl, step);
        return stepEl;
      };

      const createLineElement = params => {
        const lineEl = document.createElement('li');
        addClass(lineEl, swalClasses['progress-step-line']);

        if (params.progressStepsDistance) {
          lineEl.style.width = params.progressStepsDistance;
        }

        return lineEl;
      };

      const renderProgressSteps = (instance, params) => {
        const progressStepsContainer = getProgressSteps();

        if (!params.progressSteps || params.progressSteps.length === 0) {
          return hide(progressStepsContainer);
        }

        show(progressStepsContainer);
        progressStepsContainer.textContent = '';

        if (params.currentProgressStep >= params.progressSteps.length) {
          warn('Invalid currentProgressStep parameter, it should be less than progressSteps.length ' + '(currentProgressStep like JS arrays starts from 0)');
        }

        params.progressSteps.forEach((step, index) => {
          const stepEl = createStepElement(step);
          progressStepsContainer.appendChild(stepEl);

          if (index === params.currentProgressStep) {
            addClass(stepEl, swalClasses['active-progress-step']);
          }

          if (index !== params.progressSteps.length - 1) {
            const lineEl = createLineElement(params);
            progressStepsContainer.appendChild(lineEl);
          }
        });
      };

      const renderTitle = (instance, params) => {
        const title = getTitle();
        toggle(title, params.title || params.titleText, 'block');

        if (params.title) {
          parseHtmlToContainer(params.title, title);
        }

        if (params.titleText) {
          title.innerText = params.titleText;
        } // Custom class


        applyCustomClass(title, params, 'title');
      };

      const renderPopup = (instance, params) => {
        const container = getContainer();
        const popup = getPopup(); // Width

        if (params.toast) {
          // #2170
          applyNumericalStyle(container, 'width', params.width);
          popup.style.width = '100%';
          popup.insertBefore(getLoader(), getIcon());
        } else {
          applyNumericalStyle(popup, 'width', params.width);
        } // Padding


        applyNumericalStyle(popup, 'padding', params.padding); // Background

        if (params.background) {
          popup.style.background = params.background;
        }

        hide(getValidationMessage()); // Classes

        addClasses(popup, params);
      };

      const addClasses = (popup, params) => {
        // Default Class + showClass when updating Swal.update({})
        popup.className = "".concat(swalClasses.popup, " ").concat(isVisible(popup) ? params.showClass.popup : '');

        if (params.toast) {
          addClass([document.documentElement, document.body], swalClasses['toast-shown']);
          addClass(popup, swalClasses.toast);
        } else {
          addClass(popup, swalClasses.modal);
        } // Custom class


        applyCustomClass(popup, params, 'popup');

        if (typeof params.customClass === 'string') {
          addClass(popup, params.customClass);
        } // Icon class (#1842)


        if (params.icon) {
          addClass(popup, swalClasses["icon-".concat(params.icon)]);
        }
      };

      const render = (instance, params) => {
        renderPopup(instance, params);
        renderContainer(instance, params);
        renderProgressSteps(instance, params);
        renderIcon(instance, params);
        renderImage(instance, params);
        renderTitle(instance, params);
        renderCloseButton(instance, params);
        renderContent(instance, params);
        renderActions(instance, params);
        renderFooter(instance, params);

        if (typeof params.didRender === 'function') {
          params.didRender(getPopup());
        }
      };

      /*
       * Global function to determine if SweetAlert2 popup is shown
       */

      const isVisible$1 = () => {
        return isVisible(getPopup());
      };
      /*
       * Global function to click 'Confirm' button
       */

      const clickConfirm = () => getConfirmButton() && getConfirmButton().click();
      /*
       * Global function to click 'Deny' button
       */

      const clickDeny = () => getDenyButton() && getDenyButton().click();
      /*
       * Global function to click 'Cancel' button
       */

      const clickCancel = () => getCancelButton() && getCancelButton().click();

      function fire(...args) {
        const Swal = this;
        return new Swal(...args);
      }

      /**
       * Returns an extended version of `Swal` containing `params` as defaults.
       * Useful for reusing Swal configuration.
       *
       * For example:
       *
       * Before:
       * const textPromptOptions = { input: 'text', showCancelButton: true }
       * const {value: firstName} = await Swal.fire({ ...textPromptOptions, title: 'What is your first name?' })
       * const {value: lastName} = await Swal.fire({ ...textPromptOptions, title: 'What is your last name?' })
       *
       * After:
       * const TextPrompt = Swal.mixin({ input: 'text', showCancelButton: true })
       * const {value: firstName} = await TextPrompt('What is your first name?')
       * const {value: lastName} = await TextPrompt('What is your last name?')
       *
       * @param mixinParams
       */
      function mixin(mixinParams) {
        class MixinSwal extends this {
          _main(params, priorityMixinParams) {
            return super._main(params, Object.assign({}, mixinParams, priorityMixinParams));
          }

        }

        return MixinSwal;
      }

      /**
       * Shows loader (spinner), this is useful with AJAX requests.
       * By default the loader be shown instead of the "Confirm" button.
       */

      const showLoading = buttonToReplace => {
        let popup = getPopup();

        if (!popup) {
          Swal.fire();
        }

        popup = getPopup();
        const loader = getLoader();

        if (isToast()) {
          hide(getIcon());
        } else {
          replaceButton(popup, buttonToReplace);
        }

        show(loader);
        popup.setAttribute('data-loading', true);
        popup.setAttribute('aria-busy', true);
        popup.focus();
      };

      const replaceButton = (popup, buttonToReplace) => {
        const actions = getActions();
        const loader = getLoader();

        if (!buttonToReplace && isVisible(getConfirmButton())) {
          buttonToReplace = getConfirmButton();
        }

        show(actions);

        if (buttonToReplace) {
          hide(buttonToReplace);
          loader.setAttribute('data-button-to-replace', buttonToReplace.className);
        }

        loader.parentNode.insertBefore(loader, buttonToReplace);
        addClass([popup, actions], swalClasses.loading);
      };

      const RESTORE_FOCUS_TIMEOUT = 100;

      const globalState = {};

      const focusPreviousActiveElement = () => {
        if (globalState.previousActiveElement && globalState.previousActiveElement.focus) {
          globalState.previousActiveElement.focus();
          globalState.previousActiveElement = null;
        } else if (document.body) {
          document.body.focus();
        }
      }; // Restore previous active (focused) element


      const restoreActiveElement = returnFocus => {
        return new Promise(resolve => {
          if (!returnFocus) {
            return resolve();
          }

          const x = window.scrollX;
          const y = window.scrollY;
          globalState.restoreFocusTimeout = setTimeout(() => {
            focusPreviousActiveElement();
            resolve();
          }, RESTORE_FOCUS_TIMEOUT); // issues/900

          window.scrollTo(x, y);
        });
      };

      /**
       * If `timer` parameter is set, returns number of milliseconds of timer remained.
       * Otherwise, returns undefined.
       */

      const getTimerLeft = () => {
        return globalState.timeout && globalState.timeout.getTimerLeft();
      };
      /**
       * Stop timer. Returns number of milliseconds of timer remained.
       * If `timer` parameter isn't set, returns undefined.
       */

      const stopTimer = () => {
        if (globalState.timeout) {
          stopTimerProgressBar();
          return globalState.timeout.stop();
        }
      };
      /**
       * Resume timer. Returns number of milliseconds of timer remained.
       * If `timer` parameter isn't set, returns undefined.
       */

      const resumeTimer = () => {
        if (globalState.timeout) {
          const remaining = globalState.timeout.start();
          animateTimerProgressBar(remaining);
          return remaining;
        }
      };
      /**
       * Resume timer. Returns number of milliseconds of timer remained.
       * If `timer` parameter isn't set, returns undefined.
       */

      const toggleTimer = () => {
        const timer = globalState.timeout;
        return timer && (timer.running ? stopTimer() : resumeTimer());
      };
      /**
       * Increase timer. Returns number of milliseconds of an updated timer.
       * If `timer` parameter isn't set, returns undefined.
       */

      const increaseTimer = n => {
        if (globalState.timeout) {
          const remaining = globalState.timeout.increase(n);
          animateTimerProgressBar(remaining, true);
          return remaining;
        }
      };
      /**
       * Check if timer is running. Returns true if timer is running
       * or false if timer is paused or stopped.
       * If `timer` parameter isn't set, returns undefined
       */

      const isTimerRunning = () => {
        return globalState.timeout && globalState.timeout.isRunning();
      };

      let bodyClickListenerAdded = false;
      const clickHandlers = {};
      function bindClickHandler(attr = 'data-swal-template') {
        clickHandlers[attr] = this;

        if (!bodyClickListenerAdded) {
          document.body.addEventListener('click', bodyClickListener);
          bodyClickListenerAdded = true;
        }
      }

      const bodyClickListener = event => {
        for (let el = event.target; el && el !== document; el = el.parentNode) {
          for (const attr in clickHandlers) {
            const template = el.getAttribute(attr);

            if (template) {
              clickHandlers[attr].fire({
                template
              });
              return;
            }
          }
        }
      };

      const defaultParams = {
        title: '',
        titleText: '',
        text: '',
        html: '',
        footer: '',
        icon: undefined,
        iconColor: undefined,
        iconHtml: undefined,
        template: undefined,
        toast: false,
        showClass: {
          popup: 'swal2-show',
          backdrop: 'swal2-backdrop-show',
          icon: 'swal2-icon-show'
        },
        hideClass: {
          popup: 'swal2-hide',
          backdrop: 'swal2-backdrop-hide',
          icon: 'swal2-icon-hide'
        },
        customClass: {},
        target: 'body',
        backdrop: true,
        heightAuto: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
        allowEnterKey: true,
        stopKeydownPropagation: true,
        keydownListenerCapture: false,
        showConfirmButton: true,
        showDenyButton: false,
        showCancelButton: false,
        preConfirm: undefined,
        preDeny: undefined,
        confirmButtonText: 'OK',
        confirmButtonAriaLabel: '',
        confirmButtonColor: undefined,
        denyButtonText: 'No',
        denyButtonAriaLabel: '',
        denyButtonColor: undefined,
        cancelButtonText: 'Cancel',
        cancelButtonAriaLabel: '',
        cancelButtonColor: undefined,
        buttonsStyling: true,
        reverseButtons: false,
        focusConfirm: true,
        focusDeny: false,
        focusCancel: false,
        returnFocus: true,
        showCloseButton: false,
        closeButtonHtml: '&times;',
        closeButtonAriaLabel: 'Close this dialog',
        loaderHtml: '',
        showLoaderOnConfirm: false,
        showLoaderOnDeny: false,
        imageUrl: undefined,
        imageWidth: undefined,
        imageHeight: undefined,
        imageAlt: '',
        timer: undefined,
        timerProgressBar: false,
        width: undefined,
        padding: undefined,
        background: undefined,
        input: undefined,
        inputPlaceholder: '',
        inputLabel: '',
        inputValue: '',
        inputOptions: {},
        inputAutoTrim: true,
        inputAttributes: {},
        inputValidator: undefined,
        returnInputValueOnDeny: false,
        validationMessage: undefined,
        grow: false,
        position: 'center',
        progressSteps: [],
        currentProgressStep: undefined,
        progressStepsDistance: undefined,
        willOpen: undefined,
        didOpen: undefined,
        didRender: undefined,
        willClose: undefined,
        didClose: undefined,
        didDestroy: undefined,
        scrollbarPadding: true
      };
      const updatableParams = ['allowEscapeKey', 'allowOutsideClick', 'background', 'buttonsStyling', 'cancelButtonAriaLabel', 'cancelButtonColor', 'cancelButtonText', 'closeButtonAriaLabel', 'closeButtonHtml', 'confirmButtonAriaLabel', 'confirmButtonColor', 'confirmButtonText', 'currentProgressStep', 'customClass', 'denyButtonAriaLabel', 'denyButtonColor', 'denyButtonText', 'didClose', 'didDestroy', 'footer', 'hideClass', 'html', 'icon', 'iconColor', 'iconHtml', 'imageAlt', 'imageHeight', 'imageUrl', 'imageWidth', 'preConfirm', 'preDeny', 'progressSteps', 'returnFocus', 'reverseButtons', 'showCancelButton', 'showCloseButton', 'showConfirmButton', 'showDenyButton', 'text', 'title', 'titleText', 'willClose'];
      const deprecatedParams = {};
      const toastIncompatibleParams = ['allowOutsideClick', 'allowEnterKey', 'backdrop', 'focusConfirm', 'focusDeny', 'focusCancel', 'returnFocus', 'heightAuto', 'keydownListenerCapture'];
      /**
       * Is valid parameter
       * @param {String} paramName
       */

      const isValidParameter = paramName => {
        return Object.prototype.hasOwnProperty.call(defaultParams, paramName);
      };
      /**
       * Is valid parameter for Swal.update() method
       * @param {String} paramName
       */

      const isUpdatableParameter = paramName => {
        return updatableParams.indexOf(paramName) !== -1;
      };
      /**
       * Is deprecated parameter
       * @param {String} paramName
       */

      const isDeprecatedParameter = paramName => {
        return deprecatedParams[paramName];
      };

      const checkIfParamIsValid = param => {
        if (!isValidParameter(param)) {
          warn("Unknown parameter \"".concat(param, "\""));
        }
      };

      const checkIfToastParamIsValid = param => {
        if (toastIncompatibleParams.includes(param)) {
          warn("The parameter \"".concat(param, "\" is incompatible with toasts"));
        }
      };

      const checkIfParamIsDeprecated = param => {
        if (isDeprecatedParameter(param)) {
          warnAboutDeprecation(param, isDeprecatedParameter(param));
        }
      };
      /**
       * Show relevant warnings for given params
       *
       * @param params
       */


      const showWarningsForParams = params => {
        if (!params.backdrop && params.allowOutsideClick) {
          warn('"allowOutsideClick" parameter requires `backdrop` parameter to be set to `true`');
        }

        for (const param in params) {
          checkIfParamIsValid(param);

          if (params.toast) {
            checkIfToastParamIsValid(param);
          }

          checkIfParamIsDeprecated(param);
        }
      };



      var staticMethods = /*#__PURE__*/Object.freeze({
        isValidParameter: isValidParameter,
        isUpdatableParameter: isUpdatableParameter,
        isDeprecatedParameter: isDeprecatedParameter,
        argsToParams: argsToParams,
        isVisible: isVisible$1,
        clickConfirm: clickConfirm,
        clickDeny: clickDeny,
        clickCancel: clickCancel,
        getContainer: getContainer,
        getPopup: getPopup,
        getTitle: getTitle,
        getHtmlContainer: getHtmlContainer,
        getImage: getImage,
        getIcon: getIcon,
        getInputLabel: getInputLabel,
        getCloseButton: getCloseButton,
        getActions: getActions,
        getConfirmButton: getConfirmButton,
        getDenyButton: getDenyButton,
        getCancelButton: getCancelButton,
        getLoader: getLoader,
        getFooter: getFooter,
        getTimerProgressBar: getTimerProgressBar,
        getFocusableElements: getFocusableElements,
        getValidationMessage: getValidationMessage,
        isLoading: isLoading,
        fire: fire,
        mixin: mixin,
        showLoading: showLoading,
        enableLoading: showLoading,
        getTimerLeft: getTimerLeft,
        stopTimer: stopTimer,
        resumeTimer: resumeTimer,
        toggleTimer: toggleTimer,
        increaseTimer: increaseTimer,
        isTimerRunning: isTimerRunning,
        bindClickHandler: bindClickHandler
      });

      /**
       * Hides loader and shows back the button which was hidden by .showLoading()
       */

      function hideLoading() {
        // do nothing if popup is closed
        const innerParams = privateProps.innerParams.get(this);

        if (!innerParams) {
          return;
        }

        const domCache = privateProps.domCache.get(this);
        hide(domCache.loader);

        if (isToast()) {
          if (innerParams.icon) {
            show(getIcon());
          }
        } else {
          showRelatedButton(domCache);
        }

        removeClass([domCache.popup, domCache.actions], swalClasses.loading);
        domCache.popup.removeAttribute('aria-busy');
        domCache.popup.removeAttribute('data-loading');
        domCache.confirmButton.disabled = false;
        domCache.denyButton.disabled = false;
        domCache.cancelButton.disabled = false;
      }

      const showRelatedButton = domCache => {
        const buttonToReplace = domCache.popup.getElementsByClassName(domCache.loader.getAttribute('data-button-to-replace'));

        if (buttonToReplace.length) {
          show(buttonToReplace[0], 'inline-block');
        } else if (allButtonsAreHidden()) {
          hide(domCache.actions);
        }
      };

      function getInput$1(instance) {
        const innerParams = privateProps.innerParams.get(instance || this);
        const domCache = privateProps.domCache.get(instance || this);

        if (!domCache) {
          return null;
        }

        return getInput(domCache.popup, innerParams.input);
      }

      const fixScrollbar = () => {
        // for queues, do not do this more than once
        if (states.previousBodyPadding !== null) {
          return;
        } // if the body has overflow


        if (document.body.scrollHeight > window.innerHeight) {
          // add padding so the content doesn't shift after removal of scrollbar
          states.previousBodyPadding = parseInt(window.getComputedStyle(document.body).getPropertyValue('padding-right'));
          document.body.style.paddingRight = "".concat(states.previousBodyPadding + measureScrollbar(), "px");
        }
      };
      const undoScrollbar = () => {
        if (states.previousBodyPadding !== null) {
          document.body.style.paddingRight = "".concat(states.previousBodyPadding, "px");
          states.previousBodyPadding = null;
        }
      };

      /* istanbul ignore file */

      const iOSfix = () => {
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

        if (iOS && !hasClass(document.body, swalClasses.iosfix)) {
          const offset = document.body.scrollTop;
          document.body.style.top = "".concat(offset * -1, "px");
          addClass(document.body, swalClasses.iosfix);
          lockBodyScroll();
          addBottomPaddingForTallPopups(); // #1948
        }
      };

      const addBottomPaddingForTallPopups = () => {
        const safari = !navigator.userAgent.match(/(CriOS|FxiOS|EdgiOS|YaBrowser|UCBrowser)/i);

        if (safari) {
          const bottomPanelHeight = 44;

          if (getPopup().scrollHeight > window.innerHeight - bottomPanelHeight) {
            getContainer().style.paddingBottom = "".concat(bottomPanelHeight, "px");
          }
        }
      };

      const lockBodyScroll = () => {
        // #1246
        const container = getContainer();
        let preventTouchMove;

        container.ontouchstart = e => {
          preventTouchMove = shouldPreventTouchMove(e);
        };

        container.ontouchmove = e => {
          if (preventTouchMove) {
            e.preventDefault();
            e.stopPropagation();
          }
        };
      };

      const shouldPreventTouchMove = event => {
        const target = event.target;
        const container = getContainer();

        if (isStylys(event) || isZoom(event)) {
          return false;
        }

        if (target === container) {
          return true;
        }

        if (!isScrollable(container) && target.tagName !== 'INPUT' && // #1603
        target.tagName !== 'TEXTAREA' && // #2266
        !(isScrollable(getHtmlContainer()) && // #1944
        getHtmlContainer().contains(target))) {
          return true;
        }

        return false;
      };

      const isStylys = event => {
        // #1786
        return event.touches && event.touches.length && event.touches[0].touchType === 'stylus';
      };

      const isZoom = event => {
        // #1891
        return event.touches && event.touches.length > 1;
      };

      const undoIOSfix = () => {
        if (hasClass(document.body, swalClasses.iosfix)) {
          const offset = parseInt(document.body.style.top, 10);
          removeClass(document.body, swalClasses.iosfix);
          document.body.style.top = '';
          document.body.scrollTop = offset * -1;
        }
      };

      // Adding aria-hidden="true" to elements outside of the active modal dialog ensures that
      // elements not within the active modal dialog will not be surfaced if a user opens a screen
      // reader’s list of elements (headings, form controls, landmarks, etc.) in the document.

      const setAriaHidden = () => {
        const bodyChildren = toArray(document.body.children);
        bodyChildren.forEach(el => {
          if (el === getContainer() || el.contains(getContainer())) {
            return;
          }

          if (el.hasAttribute('aria-hidden')) {
            el.setAttribute('data-previous-aria-hidden', el.getAttribute('aria-hidden'));
          }

          el.setAttribute('aria-hidden', 'true');
        });
      };
      const unsetAriaHidden = () => {
        const bodyChildren = toArray(document.body.children);
        bodyChildren.forEach(el => {
          if (el.hasAttribute('data-previous-aria-hidden')) {
            el.setAttribute('aria-hidden', el.getAttribute('data-previous-aria-hidden'));
            el.removeAttribute('data-previous-aria-hidden');
          } else {
            el.removeAttribute('aria-hidden');
          }
        });
      };

      /**
       * This module containts `WeakMap`s for each effectively-"private  property" that a `Swal` has.
       * For example, to set the private property "foo" of `this` to "bar", you can `privateProps.foo.set(this, 'bar')`
       * This is the approach that Babel will probably take to implement private methods/fields
       *   https://github.com/tc39/proposal-private-methods
       *   https://github.com/babel/babel/pull/7555
       * Once we have the changes from that PR in Babel, and our core class fits reasonable in *one module*
       *   then we can use that language feature.
       */
      var privateMethods = {
        swalPromiseResolve: new WeakMap(),
        swalPromiseReject: new WeakMap()
      };

      /*
       * Instance method to close sweetAlert
       */

      function removePopupAndResetState(instance, container, returnFocus, didClose) {
        if (isToast()) {
          triggerDidCloseAndDispose(instance, didClose);
        } else {
          restoreActiveElement(returnFocus).then(() => triggerDidCloseAndDispose(instance, didClose));
          globalState.keydownTarget.removeEventListener('keydown', globalState.keydownHandler, {
            capture: globalState.keydownListenerCapture
          });
          globalState.keydownHandlerAdded = false;
        }

        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent); // workaround for #2088
        // for some reason removing the container in Safari will scroll the document to bottom

        if (isSafari) {
          container.setAttribute('style', 'display:none !important');
          container.removeAttribute('class');
          container.innerHTML = '';
        } else {
          container.remove();
        }

        if (isModal()) {
          undoScrollbar();
          undoIOSfix();
          unsetAriaHidden();
        }

        removeBodyClasses();
      }

      function removeBodyClasses() {
        removeClass([document.documentElement, document.body], [swalClasses.shown, swalClasses['height-auto'], swalClasses['no-backdrop'], swalClasses['toast-shown']]);
      }

      function close(resolveValue) {
        resolveValue = prepareResolveValue(resolveValue);
        const swalPromiseResolve = privateMethods.swalPromiseResolve.get(this);
        const didClose = triggerClosePopup(this);

        if (this.isAwaitingPromise()) {
          // A swal awaiting for a promise (after a click on Confirm or Deny) cannot be dismissed anymore #2335
          if (!resolveValue.isDismissed) {
            handleAwaitingPromise(this);
            swalPromiseResolve(resolveValue);
          }
        } else if (didClose) {
          // Resolve Swal promise
          swalPromiseResolve(resolveValue);
        }
      }
      function isAwaitingPromise() {
        return !!privateProps.awaitingPromise.get(this);
      }

      const triggerClosePopup = instance => {
        const popup = getPopup();

        if (!popup) {
          return false;
        }

        const innerParams = privateProps.innerParams.get(instance);

        if (!innerParams || hasClass(popup, innerParams.hideClass.popup)) {
          return false;
        }

        removeClass(popup, innerParams.showClass.popup);
        addClass(popup, innerParams.hideClass.popup);
        const backdrop = getContainer();
        removeClass(backdrop, innerParams.showClass.backdrop);
        addClass(backdrop, innerParams.hideClass.backdrop);
        handlePopupAnimation(instance, popup, innerParams);
        return true;
      };

      function rejectPromise(error) {
        const rejectPromise = privateMethods.swalPromiseReject.get(this);
        handleAwaitingPromise(this);

        if (rejectPromise) {
          // Reject Swal promise
          rejectPromise(error);
        }
      }

      const handleAwaitingPromise = instance => {
        if (instance.isAwaitingPromise()) {
          privateProps.awaitingPromise.delete(instance); // The instance might have been previously partly destroyed, we must resume the destroy process in this case #2335

          if (!privateProps.innerParams.get(instance)) {
            instance._destroy();
          }
        }
      };

      const prepareResolveValue = resolveValue => {
        // When user calls Swal.close()
        if (typeof resolveValue === 'undefined') {
          return {
            isConfirmed: false,
            isDenied: false,
            isDismissed: true
          };
        }

        return Object.assign({
          isConfirmed: false,
          isDenied: false,
          isDismissed: false
        }, resolveValue);
      };

      const handlePopupAnimation = (instance, popup, innerParams) => {
        const container = getContainer(); // If animation is supported, animate

        const animationIsSupported = animationEndEvent && hasCssAnimation(popup);

        if (typeof innerParams.willClose === 'function') {
          innerParams.willClose(popup);
        }

        if (animationIsSupported) {
          animatePopup(instance, popup, container, innerParams.returnFocus, innerParams.didClose);
        } else {
          // Otherwise, remove immediately
          removePopupAndResetState(instance, container, innerParams.returnFocus, innerParams.didClose);
        }
      };

      const animatePopup = (instance, popup, container, returnFocus, didClose) => {
        globalState.swalCloseEventFinishedCallback = removePopupAndResetState.bind(null, instance, container, returnFocus, didClose);
        popup.addEventListener(animationEndEvent, function (e) {
          if (e.target === popup) {
            globalState.swalCloseEventFinishedCallback();
            delete globalState.swalCloseEventFinishedCallback;
          }
        });
      };

      const triggerDidCloseAndDispose = (instance, didClose) => {
        setTimeout(() => {
          if (typeof didClose === 'function') {
            didClose.bind(instance.params)();
          }

          instance._destroy();
        });
      };

      function setButtonsDisabled(instance, buttons, disabled) {
        const domCache = privateProps.domCache.get(instance);
        buttons.forEach(button => {
          domCache[button].disabled = disabled;
        });
      }

      function setInputDisabled(input, disabled) {
        if (!input) {
          return false;
        }

        if (input.type === 'radio') {
          const radiosContainer = input.parentNode.parentNode;
          const radios = radiosContainer.querySelectorAll('input');

          for (let i = 0; i < radios.length; i++) {
            radios[i].disabled = disabled;
          }
        } else {
          input.disabled = disabled;
        }
      }

      function enableButtons() {
        setButtonsDisabled(this, ['confirmButton', 'denyButton', 'cancelButton'], false);
      }
      function disableButtons() {
        setButtonsDisabled(this, ['confirmButton', 'denyButton', 'cancelButton'], true);
      }
      function enableInput() {
        return setInputDisabled(this.getInput(), false);
      }
      function disableInput() {
        return setInputDisabled(this.getInput(), true);
      }

      function showValidationMessage(error) {
        const domCache = privateProps.domCache.get(this);
        const params = privateProps.innerParams.get(this);
        setInnerHtml(domCache.validationMessage, error);
        domCache.validationMessage.className = swalClasses['validation-message'];

        if (params.customClass && params.customClass.validationMessage) {
          addClass(domCache.validationMessage, params.customClass.validationMessage);
        }

        show(domCache.validationMessage);
        const input = this.getInput();

        if (input) {
          input.setAttribute('aria-invalid', true);
          input.setAttribute('aria-describedby', swalClasses['validation-message']);
          focusInput(input);
          addClass(input, swalClasses.inputerror);
        }
      } // Hide block with validation message

      function resetValidationMessage$1() {
        const domCache = privateProps.domCache.get(this);

        if (domCache.validationMessage) {
          hide(domCache.validationMessage);
        }

        const input = this.getInput();

        if (input) {
          input.removeAttribute('aria-invalid');
          input.removeAttribute('aria-describedby');
          removeClass(input, swalClasses.inputerror);
        }
      }

      function getProgressSteps$1() {
        const domCache = privateProps.domCache.get(this);
        return domCache.progressSteps;
      }

      class Timer {
        constructor(callback, delay) {
          this.callback = callback;
          this.remaining = delay;
          this.running = false;
          this.start();
        }

        start() {
          if (!this.running) {
            this.running = true;
            this.started = new Date();
            this.id = setTimeout(this.callback, this.remaining);
          }

          return this.remaining;
        }

        stop() {
          if (this.running) {
            this.running = false;
            clearTimeout(this.id);
            this.remaining -= new Date() - this.started;
          }

          return this.remaining;
        }

        increase(n) {
          const running = this.running;

          if (running) {
            this.stop();
          }

          this.remaining += n;

          if (running) {
            this.start();
          }

          return this.remaining;
        }

        getTimerLeft() {
          if (this.running) {
            this.stop();
            this.start();
          }

          return this.remaining;
        }

        isRunning() {
          return this.running;
        }

      }

      var defaultInputValidators = {
        email: (string, validationMessage) => {
          return /^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9-]{2,24}$/.test(string) ? Promise.resolve() : Promise.resolve(validationMessage || 'Invalid email address');
        },
        url: (string, validationMessage) => {
          // taken from https://stackoverflow.com/a/3809435 with a small change from #1306 and #2013
          return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-z]{2,63}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)$/.test(string) ? Promise.resolve() : Promise.resolve(validationMessage || 'Invalid URL');
        }
      };

      function setDefaultInputValidators(params) {
        // Use default `inputValidator` for supported input types if not provided
        if (!params.inputValidator) {
          Object.keys(defaultInputValidators).forEach(key => {
            if (params.input === key) {
              params.inputValidator = defaultInputValidators[key];
            }
          });
        }
      }

      function validateCustomTargetElement(params) {
        // Determine if the custom target element is valid
        if (!params.target || typeof params.target === 'string' && !document.querySelector(params.target) || typeof params.target !== 'string' && !params.target.appendChild) {
          warn('Target parameter is not valid, defaulting to "body"');
          params.target = 'body';
        }
      }
      /**
       * Set type, text and actions on popup
       *
       * @param params
       * @returns {boolean}
       */


      function setParameters(params) {
        setDefaultInputValidators(params); // showLoaderOnConfirm && preConfirm

        if (params.showLoaderOnConfirm && !params.preConfirm) {
          warn('showLoaderOnConfirm is set to true, but preConfirm is not defined.\n' + 'showLoaderOnConfirm should be used together with preConfirm, see usage example:\n' + 'https://sweetalert2.github.io/#ajax-request');
        }

        validateCustomTargetElement(params); // Replace newlines with <br> in title

        if (typeof params.title === 'string') {
          params.title = params.title.split('\n').join('<br />');
        }

        init(params);
      }

      const swalStringParams = ['swal-title', 'swal-html', 'swal-footer'];
      const getTemplateParams = params => {
        const template = typeof params.template === 'string' ? document.querySelector(params.template) : params.template;

        if (!template) {
          return {};
        }

        const templateContent = template.content;
        showWarningsForElements(templateContent);
        const result = Object.assign(getSwalParams(templateContent), getSwalButtons(templateContent), getSwalImage(templateContent), getSwalIcon(templateContent), getSwalInput(templateContent), getSwalStringParams(templateContent, swalStringParams));
        return result;
      };

      const getSwalParams = templateContent => {
        const result = {};
        toArray(templateContent.querySelectorAll('swal-param')).forEach(param => {
          showWarningsForAttributes(param, ['name', 'value']);
          const paramName = param.getAttribute('name');
          let value = param.getAttribute('value');

          if (typeof defaultParams[paramName] === 'boolean' && value === 'false') {
            value = false;
          }

          if (typeof defaultParams[paramName] === 'object') {
            value = JSON.parse(value);
          }

          result[paramName] = value;
        });
        return result;
      };

      const getSwalButtons = templateContent => {
        const result = {};
        toArray(templateContent.querySelectorAll('swal-button')).forEach(button => {
          showWarningsForAttributes(button, ['type', 'color', 'aria-label']);
          const type = button.getAttribute('type');
          result["".concat(type, "ButtonText")] = button.innerHTML;
          result["show".concat(capitalizeFirstLetter(type), "Button")] = true;

          if (button.hasAttribute('color')) {
            result["".concat(type, "ButtonColor")] = button.getAttribute('color');
          }

          if (button.hasAttribute('aria-label')) {
            result["".concat(type, "ButtonAriaLabel")] = button.getAttribute('aria-label');
          }
        });
        return result;
      };

      const getSwalImage = templateContent => {
        const result = {};
        const image = templateContent.querySelector('swal-image');

        if (image) {
          showWarningsForAttributes(image, ['src', 'width', 'height', 'alt']);

          if (image.hasAttribute('src')) {
            result.imageUrl = image.getAttribute('src');
          }

          if (image.hasAttribute('width')) {
            result.imageWidth = image.getAttribute('width');
          }

          if (image.hasAttribute('height')) {
            result.imageHeight = image.getAttribute('height');
          }

          if (image.hasAttribute('alt')) {
            result.imageAlt = image.getAttribute('alt');
          }
        }

        return result;
      };

      const getSwalIcon = templateContent => {
        const result = {};
        const icon = templateContent.querySelector('swal-icon');

        if (icon) {
          showWarningsForAttributes(icon, ['type', 'color']);

          if (icon.hasAttribute('type')) {
            result.icon = icon.getAttribute('type');
          }

          if (icon.hasAttribute('color')) {
            result.iconColor = icon.getAttribute('color');
          }

          result.iconHtml = icon.innerHTML;
        }

        return result;
      };

      const getSwalInput = templateContent => {
        const result = {};
        const input = templateContent.querySelector('swal-input');

        if (input) {
          showWarningsForAttributes(input, ['type', 'label', 'placeholder', 'value']);
          result.input = input.getAttribute('type') || 'text';

          if (input.hasAttribute('label')) {
            result.inputLabel = input.getAttribute('label');
          }

          if (input.hasAttribute('placeholder')) {
            result.inputPlaceholder = input.getAttribute('placeholder');
          }

          if (input.hasAttribute('value')) {
            result.inputValue = input.getAttribute('value');
          }
        }

        const inputOptions = templateContent.querySelectorAll('swal-input-option');

        if (inputOptions.length) {
          result.inputOptions = {};
          toArray(inputOptions).forEach(option => {
            showWarningsForAttributes(option, ['value']);
            const optionValue = option.getAttribute('value');
            const optionName = option.innerHTML;
            result.inputOptions[optionValue] = optionName;
          });
        }

        return result;
      };

      const getSwalStringParams = (templateContent, paramNames) => {
        const result = {};

        for (const i in paramNames) {
          const paramName = paramNames[i];
          const tag = templateContent.querySelector(paramName);

          if (tag) {
            showWarningsForAttributes(tag, []);
            result[paramName.replace(/^swal-/, '')] = tag.innerHTML.trim();
          }
        }

        return result;
      };

      const showWarningsForElements = template => {
        const allowedElements = swalStringParams.concat(['swal-param', 'swal-button', 'swal-image', 'swal-icon', 'swal-input', 'swal-input-option']);
        toArray(template.children).forEach(el => {
          const tagName = el.tagName.toLowerCase();

          if (allowedElements.indexOf(tagName) === -1) {
            warn("Unrecognized element <".concat(tagName, ">"));
          }
        });
      };

      const showWarningsForAttributes = (el, allowedAttributes) => {
        toArray(el.attributes).forEach(attribute => {
          if (allowedAttributes.indexOf(attribute.name) === -1) {
            warn(["Unrecognized attribute \"".concat(attribute.name, "\" on <").concat(el.tagName.toLowerCase(), ">."), "".concat(allowedAttributes.length ? "Allowed attributes are: ".concat(allowedAttributes.join(', ')) : 'To set the value, use HTML within the element.')]);
          }
        });
      };

      const SHOW_CLASS_TIMEOUT = 10;
      /**
       * Open popup, add necessary classes and styles, fix scrollbar
       *
       * @param params
       */

      const openPopup = params => {
        const container = getContainer();
        const popup = getPopup();

        if (typeof params.willOpen === 'function') {
          params.willOpen(popup);
        }

        const bodyStyles = window.getComputedStyle(document.body);
        const initialBodyOverflow = bodyStyles.overflowY;
        addClasses$1(container, popup, params); // scrolling is 'hidden' until animation is done, after that 'auto'

        setTimeout(() => {
          setScrollingVisibility(container, popup);
        }, SHOW_CLASS_TIMEOUT);

        if (isModal()) {
          fixScrollContainer(container, params.scrollbarPadding, initialBodyOverflow);
          setAriaHidden();
        }

        if (!isToast() && !globalState.previousActiveElement) {
          globalState.previousActiveElement = document.activeElement;
        }

        if (typeof params.didOpen === 'function') {
          setTimeout(() => params.didOpen(popup));
        }

        removeClass(container, swalClasses['no-transition']);
      };

      const swalOpenAnimationFinished = event => {
        const popup = getPopup();

        if (event.target !== popup) {
          return;
        }

        const container = getContainer();
        popup.removeEventListener(animationEndEvent, swalOpenAnimationFinished);
        container.style.overflowY = 'auto';
      };

      const setScrollingVisibility = (container, popup) => {
        if (animationEndEvent && hasCssAnimation(popup)) {
          container.style.overflowY = 'hidden';
          popup.addEventListener(animationEndEvent, swalOpenAnimationFinished);
        } else {
          container.style.overflowY = 'auto';
        }
      };

      const fixScrollContainer = (container, scrollbarPadding, initialBodyOverflow) => {
        iOSfix();

        if (scrollbarPadding && initialBodyOverflow !== 'hidden') {
          fixScrollbar();
        } // sweetalert2/issues/1247


        setTimeout(() => {
          container.scrollTop = 0;
        });
      };

      const addClasses$1 = (container, popup, params) => {
        addClass(container, params.showClass.backdrop); // the workaround with setting/unsetting opacity is needed for #2019 and 2059

        popup.style.setProperty('opacity', '0', 'important');
        show(popup, 'grid');
        setTimeout(() => {
          // Animate popup right after showing it
          addClass(popup, params.showClass.popup); // and remove the opacity workaround

          popup.style.removeProperty('opacity');
        }, SHOW_CLASS_TIMEOUT); // 10ms in order to fix #2062

        addClass([document.documentElement, document.body], swalClasses.shown);

        if (params.heightAuto && params.backdrop && !params.toast) {
          addClass([document.documentElement, document.body], swalClasses['height-auto']);
        }
      };

      const handleInputOptionsAndValue = (instance, params) => {
        if (params.input === 'select' || params.input === 'radio') {
          handleInputOptions(instance, params);
        } else if (['text', 'email', 'number', 'tel', 'textarea'].includes(params.input) && (hasToPromiseFn(params.inputValue) || isPromise(params.inputValue))) {
          showLoading(getConfirmButton());
          handleInputValue(instance, params);
        }
      };
      const getInputValue = (instance, innerParams) => {
        const input = instance.getInput();

        if (!input) {
          return null;
        }

        switch (innerParams.input) {
          case 'checkbox':
            return getCheckboxValue(input);

          case 'radio':
            return getRadioValue(input);

          case 'file':
            return getFileValue(input);

          default:
            return innerParams.inputAutoTrim ? input.value.trim() : input.value;
        }
      };

      const getCheckboxValue = input => input.checked ? 1 : 0;

      const getRadioValue = input => input.checked ? input.value : null;

      const getFileValue = input => input.files.length ? input.getAttribute('multiple') !== null ? input.files : input.files[0] : null;

      const handleInputOptions = (instance, params) => {
        const popup = getPopup();

        const processInputOptions = inputOptions => populateInputOptions[params.input](popup, formatInputOptions(inputOptions), params);

        if (hasToPromiseFn(params.inputOptions) || isPromise(params.inputOptions)) {
          showLoading(getConfirmButton());
          asPromise(params.inputOptions).then(inputOptions => {
            instance.hideLoading();
            processInputOptions(inputOptions);
          });
        } else if (typeof params.inputOptions === 'object') {
          processInputOptions(params.inputOptions);
        } else {
          error("Unexpected type of inputOptions! Expected object, Map or Promise, got ".concat(typeof params.inputOptions));
        }
      };

      const handleInputValue = (instance, params) => {
        const input = instance.getInput();
        hide(input);
        asPromise(params.inputValue).then(inputValue => {
          input.value = params.input === 'number' ? parseFloat(inputValue) || 0 : "".concat(inputValue);
          show(input);
          input.focus();
          instance.hideLoading();
        }).catch(err => {
          error("Error in inputValue promise: ".concat(err));
          input.value = '';
          show(input);
          input.focus();
          instance.hideLoading();
        });
      };

      const populateInputOptions = {
        select: (popup, inputOptions, params) => {
          const select = getChildByClass(popup, swalClasses.select);

          const renderOption = (parent, optionLabel, optionValue) => {
            const option = document.createElement('option');
            option.value = optionValue;
            setInnerHtml(option, optionLabel);
            option.selected = isSelected(optionValue, params.inputValue);
            parent.appendChild(option);
          };

          inputOptions.forEach(inputOption => {
            const optionValue = inputOption[0];
            const optionLabel = inputOption[1]; // <optgroup> spec:
            // https://www.w3.org/TR/html401/interact/forms.html#h-17.6
            // "...all OPTGROUP elements must be specified directly within a SELECT element (i.e., groups may not be nested)..."
            // check whether this is a <optgroup>

            if (Array.isArray(optionLabel)) {
              // if it is an array, then it is an <optgroup>
              const optgroup = document.createElement('optgroup');
              optgroup.label = optionValue;
              optgroup.disabled = false; // not configurable for now

              select.appendChild(optgroup);
              optionLabel.forEach(o => renderOption(optgroup, o[1], o[0]));
            } else {
              // case of <option>
              renderOption(select, optionLabel, optionValue);
            }
          });
          select.focus();
        },
        radio: (popup, inputOptions, params) => {
          const radio = getChildByClass(popup, swalClasses.radio);
          inputOptions.forEach(inputOption => {
            const radioValue = inputOption[0];
            const radioLabel = inputOption[1];
            const radioInput = document.createElement('input');
            const radioLabelElement = document.createElement('label');
            radioInput.type = 'radio';
            radioInput.name = swalClasses.radio;
            radioInput.value = radioValue;

            if (isSelected(radioValue, params.inputValue)) {
              radioInput.checked = true;
            }

            const label = document.createElement('span');
            setInnerHtml(label, radioLabel);
            label.className = swalClasses.label;
            radioLabelElement.appendChild(radioInput);
            radioLabelElement.appendChild(label);
            radio.appendChild(radioLabelElement);
          });
          const radios = radio.querySelectorAll('input');

          if (radios.length) {
            radios[0].focus();
          }
        }
      };
      /**
       * Converts `inputOptions` into an array of `[value, label]`s
       * @param inputOptions
       */

      const formatInputOptions = inputOptions => {
        const result = [];

        if (typeof Map !== 'undefined' && inputOptions instanceof Map) {
          inputOptions.forEach((value, key) => {
            let valueFormatted = value;

            if (typeof valueFormatted === 'object') {
              // case of <optgroup>
              valueFormatted = formatInputOptions(valueFormatted);
            }

            result.push([key, valueFormatted]);
          });
        } else {
          Object.keys(inputOptions).forEach(key => {
            let valueFormatted = inputOptions[key];

            if (typeof valueFormatted === 'object') {
              // case of <optgroup>
              valueFormatted = formatInputOptions(valueFormatted);
            }

            result.push([key, valueFormatted]);
          });
        }

        return result;
      };

      const isSelected = (optionValue, inputValue) => {
        return inputValue && inputValue.toString() === optionValue.toString();
      };

      const handleConfirmButtonClick = instance => {
        const innerParams = privateProps.innerParams.get(instance);
        instance.disableButtons();

        if (innerParams.input) {
          handleConfirmOrDenyWithInput(instance, 'confirm');
        } else {
          confirm(instance, true);
        }
      };
      const handleDenyButtonClick = instance => {
        const innerParams = privateProps.innerParams.get(instance);
        instance.disableButtons();

        if (innerParams.returnInputValueOnDeny) {
          handleConfirmOrDenyWithInput(instance, 'deny');
        } else {
          deny(instance, false);
        }
      };
      const handleCancelButtonClick = (instance, dismissWith) => {
        instance.disableButtons();
        dismissWith(DismissReason.cancel);
      };

      const handleConfirmOrDenyWithInput = (instance, type
      /* 'confirm' | 'deny' */
      ) => {
        const innerParams = privateProps.innerParams.get(instance);
        const inputValue = getInputValue(instance, innerParams);

        if (innerParams.inputValidator) {
          handleInputValidator(instance, inputValue, type);
        } else if (!instance.getInput().checkValidity()) {
          instance.enableButtons();
          instance.showValidationMessage(innerParams.validationMessage);
        } else if (type === 'deny') {
          deny(instance, inputValue);
        } else {
          confirm(instance, inputValue);
        }
      };

      const handleInputValidator = (instance, inputValue, type
      /* 'confirm' | 'deny' */
      ) => {
        const innerParams = privateProps.innerParams.get(instance);
        instance.disableInput();
        const validationPromise = Promise.resolve().then(() => asPromise(innerParams.inputValidator(inputValue, innerParams.validationMessage)));
        validationPromise.then(validationMessage => {
          instance.enableButtons();
          instance.enableInput();

          if (validationMessage) {
            instance.showValidationMessage(validationMessage);
          } else if (type === 'deny') {
            deny(instance, inputValue);
          } else {
            confirm(instance, inputValue);
          }
        });
      };

      const deny = (instance, value) => {
        const innerParams = privateProps.innerParams.get(instance || undefined);

        if (innerParams.showLoaderOnDeny) {
          showLoading(getDenyButton());
        }

        if (innerParams.preDeny) {
          privateProps.awaitingPromise.set(instance || undefined, true); // Flagging the instance as awaiting a promise so it's own promise's reject/resolve methods doesnt get destroyed until the result from this preDeny's promise is received

          const preDenyPromise = Promise.resolve().then(() => asPromise(innerParams.preDeny(value, innerParams.validationMessage)));
          preDenyPromise.then(preDenyValue => {
            if (preDenyValue === false) {
              instance.hideLoading();
            } else {
              instance.closePopup({
                isDenied: true,
                value: typeof preDenyValue === 'undefined' ? value : preDenyValue
              });
            }
          }).catch(error$$1 => rejectWith(instance || undefined, error$$1));
        } else {
          instance.closePopup({
            isDenied: true,
            value
          });
        }
      };

      const succeedWith = (instance, value) => {
        instance.closePopup({
          isConfirmed: true,
          value
        });
      };

      const rejectWith = (instance, error$$1) => {
        instance.rejectPromise(error$$1);
      };

      const confirm = (instance, value) => {
        const innerParams = privateProps.innerParams.get(instance || undefined);

        if (innerParams.showLoaderOnConfirm) {
          showLoading();
        }

        if (innerParams.preConfirm) {
          instance.resetValidationMessage();
          privateProps.awaitingPromise.set(instance || undefined, true); // Flagging the instance as awaiting a promise so it's own promise's reject/resolve methods doesnt get destroyed until the result from this preConfirm's promise is received

          const preConfirmPromise = Promise.resolve().then(() => asPromise(innerParams.preConfirm(value, innerParams.validationMessage)));
          preConfirmPromise.then(preConfirmValue => {
            if (isVisible(getValidationMessage()) || preConfirmValue === false) {
              instance.hideLoading();
            } else {
              succeedWith(instance, typeof preConfirmValue === 'undefined' ? value : preConfirmValue);
            }
          }).catch(error$$1 => rejectWith(instance || undefined, error$$1));
        } else {
          succeedWith(instance, value);
        }
      };

      const addKeydownHandler = (instance, globalState, innerParams, dismissWith) => {
        if (globalState.keydownTarget && globalState.keydownHandlerAdded) {
          globalState.keydownTarget.removeEventListener('keydown', globalState.keydownHandler, {
            capture: globalState.keydownListenerCapture
          });
          globalState.keydownHandlerAdded = false;
        }

        if (!innerParams.toast) {
          globalState.keydownHandler = e => keydownHandler(instance, e, dismissWith);

          globalState.keydownTarget = innerParams.keydownListenerCapture ? window : getPopup();
          globalState.keydownListenerCapture = innerParams.keydownListenerCapture;
          globalState.keydownTarget.addEventListener('keydown', globalState.keydownHandler, {
            capture: globalState.keydownListenerCapture
          });
          globalState.keydownHandlerAdded = true;
        }
      }; // Focus handling

      const setFocus = (innerParams, index, increment) => {
        const focusableElements = getFocusableElements(); // search for visible elements and select the next possible match

        if (focusableElements.length) {
          index = index + increment; // rollover to first item

          if (index === focusableElements.length) {
            index = 0; // go to last item
          } else if (index === -1) {
            index = focusableElements.length - 1;
          }

          return focusableElements[index].focus();
        } // no visible focusable elements, focus the popup


        getPopup().focus();
      };
      const arrowKeysNextButton = ['ArrowRight', 'ArrowDown'];
      const arrowKeysPreviousButton = ['ArrowLeft', 'ArrowUp'];

      const keydownHandler = (instance, e, dismissWith) => {
        const innerParams = privateProps.innerParams.get(instance);

        if (!innerParams) {
          return; // This instance has already been destroyed
        }

        if (innerParams.stopKeydownPropagation) {
          e.stopPropagation();
        } // ENTER


        if (e.key === 'Enter') {
          handleEnter(instance, e, innerParams); // TAB
        } else if (e.key === 'Tab') {
          handleTab(e, innerParams); // ARROWS - switch focus between buttons
        } else if ([...arrowKeysNextButton, ...arrowKeysPreviousButton].includes(e.key)) {
          handleArrows(e.key); // ESC
        } else if (e.key === 'Escape') {
          handleEsc(e, innerParams, dismissWith);
        }
      };

      const handleEnter = (instance, e, innerParams) => {
        // #720 #721
        if (e.isComposing) {
          return;
        }

        if (e.target && instance.getInput() && e.target.outerHTML === instance.getInput().outerHTML) {
          if (['textarea', 'file'].includes(innerParams.input)) {
            return; // do not submit
          }

          clickConfirm();
          e.preventDefault();
        }
      };

      const handleTab = (e, innerParams) => {
        const targetElement = e.target;
        const focusableElements = getFocusableElements();
        let btnIndex = -1;

        for (let i = 0; i < focusableElements.length; i++) {
          if (targetElement === focusableElements[i]) {
            btnIndex = i;
            break;
          }
        }

        if (!e.shiftKey) {
          // Cycle to the next button
          setFocus(innerParams, btnIndex, 1);
        } else {
          // Cycle to the prev button
          setFocus(innerParams, btnIndex, -1);
        }

        e.stopPropagation();
        e.preventDefault();
      };

      const handleArrows = key => {
        const confirmButton = getConfirmButton();
        const denyButton = getDenyButton();
        const cancelButton = getCancelButton();

        if (![confirmButton, denyButton, cancelButton].includes(document.activeElement)) {
          return;
        }

        const sibling = arrowKeysNextButton.includes(key) ? 'nextElementSibling' : 'previousElementSibling';
        const buttonToFocus = document.activeElement[sibling];

        if (buttonToFocus) {
          buttonToFocus.focus();
        }
      };

      const handleEsc = (e, innerParams, dismissWith) => {
        if (callIfFunction(innerParams.allowEscapeKey)) {
          e.preventDefault();
          dismissWith(DismissReason.esc);
        }
      };

      const handlePopupClick = (instance, domCache, dismissWith) => {
        const innerParams = privateProps.innerParams.get(instance);

        if (innerParams.toast) {
          handleToastClick(instance, domCache, dismissWith);
        } else {
          // Ignore click events that had mousedown on the popup but mouseup on the container
          // This can happen when the user drags a slider
          handleModalMousedown(domCache); // Ignore click events that had mousedown on the container but mouseup on the popup

          handleContainerMousedown(domCache);
          handleModalClick(instance, domCache, dismissWith);
        }
      };

      const handleToastClick = (instance, domCache, dismissWith) => {
        // Closing toast by internal click
        domCache.popup.onclick = () => {
          const innerParams = privateProps.innerParams.get(instance);

          if (innerParams.showConfirmButton || innerParams.showDenyButton || innerParams.showCancelButton || innerParams.showCloseButton || innerParams.timer || innerParams.input) {
            return;
          }

          dismissWith(DismissReason.close);
        };
      };

      let ignoreOutsideClick = false;

      const handleModalMousedown = domCache => {
        domCache.popup.onmousedown = () => {
          domCache.container.onmouseup = function (e) {
            domCache.container.onmouseup = undefined; // We only check if the mouseup target is the container because usually it doesn't
            // have any other direct children aside of the popup

            if (e.target === domCache.container) {
              ignoreOutsideClick = true;
            }
          };
        };
      };

      const handleContainerMousedown = domCache => {
        domCache.container.onmousedown = () => {
          domCache.popup.onmouseup = function (e) {
            domCache.popup.onmouseup = undefined; // We also need to check if the mouseup target is a child of the popup

            if (e.target === domCache.popup || domCache.popup.contains(e.target)) {
              ignoreOutsideClick = true;
            }
          };
        };
      };

      const handleModalClick = (instance, domCache, dismissWith) => {
        domCache.container.onclick = e => {
          const innerParams = privateProps.innerParams.get(instance);

          if (ignoreOutsideClick) {
            ignoreOutsideClick = false;
            return;
          }

          if (e.target === domCache.container && callIfFunction(innerParams.allowOutsideClick)) {
            dismissWith(DismissReason.backdrop);
          }
        };
      };

      function _main(userParams, mixinParams = {}) {
        showWarningsForParams(Object.assign({}, mixinParams, userParams));

        if (globalState.currentInstance) {
          globalState.currentInstance._destroy();

          if (isModal()) {
            unsetAriaHidden();
          }
        }

        globalState.currentInstance = this;
        const innerParams = prepareParams(userParams, mixinParams);
        setParameters(innerParams);
        Object.freeze(innerParams); // clear the previous timer

        if (globalState.timeout) {
          globalState.timeout.stop();
          delete globalState.timeout;
        } // clear the restore focus timeout


        clearTimeout(globalState.restoreFocusTimeout);
        const domCache = populateDomCache(this);
        render(this, innerParams);
        privateProps.innerParams.set(this, innerParams);
        return swalPromise(this, domCache, innerParams);
      }

      const prepareParams = (userParams, mixinParams) => {
        const templateParams = getTemplateParams(userParams);
        const params = Object.assign({}, defaultParams, mixinParams, templateParams, userParams); // precedence is described in #2131

        params.showClass = Object.assign({}, defaultParams.showClass, params.showClass);
        params.hideClass = Object.assign({}, defaultParams.hideClass, params.hideClass);
        return params;
      };

      const swalPromise = (instance, domCache, innerParams) => {
        return new Promise((resolve, reject) => {
          // functions to handle all closings/dismissals
          const dismissWith = dismiss => {
            instance.closePopup({
              isDismissed: true,
              dismiss
            });
          };

          privateMethods.swalPromiseResolve.set(instance, resolve);
          privateMethods.swalPromiseReject.set(instance, reject);

          domCache.confirmButton.onclick = () => handleConfirmButtonClick(instance);

          domCache.denyButton.onclick = () => handleDenyButtonClick(instance);

          domCache.cancelButton.onclick = () => handleCancelButtonClick(instance, dismissWith);

          domCache.closeButton.onclick = () => dismissWith(DismissReason.close);

          handlePopupClick(instance, domCache, dismissWith);
          addKeydownHandler(instance, globalState, innerParams, dismissWith);
          handleInputOptionsAndValue(instance, innerParams);
          openPopup(innerParams);
          setupTimer(globalState, innerParams, dismissWith);
          initFocus(domCache, innerParams); // Scroll container to top on open (#1247, #1946)

          setTimeout(() => {
            domCache.container.scrollTop = 0;
          });
        });
      };

      const populateDomCache = instance => {
        const domCache = {
          popup: getPopup(),
          container: getContainer(),
          actions: getActions(),
          confirmButton: getConfirmButton(),
          denyButton: getDenyButton(),
          cancelButton: getCancelButton(),
          loader: getLoader(),
          closeButton: getCloseButton(),
          validationMessage: getValidationMessage(),
          progressSteps: getProgressSteps()
        };
        privateProps.domCache.set(instance, domCache);
        return domCache;
      };

      const setupTimer = (globalState$$1, innerParams, dismissWith) => {
        const timerProgressBar = getTimerProgressBar();
        hide(timerProgressBar);

        if (innerParams.timer) {
          globalState$$1.timeout = new Timer(() => {
            dismissWith('timer');
            delete globalState$$1.timeout;
          }, innerParams.timer);

          if (innerParams.timerProgressBar) {
            show(timerProgressBar);
            setTimeout(() => {
              if (globalState$$1.timeout && globalState$$1.timeout.running) {
                // timer can be already stopped or unset at this point
                animateTimerProgressBar(innerParams.timer);
              }
            });
          }
        }
      };

      const initFocus = (domCache, innerParams) => {
        if (innerParams.toast) {
          return;
        }

        if (!callIfFunction(innerParams.allowEnterKey)) {
          return blurActiveElement();
        }

        if (!focusButton(domCache, innerParams)) {
          setFocus(innerParams, -1, 1);
        }
      };

      const focusButton = (domCache, innerParams) => {
        if (innerParams.focusDeny && isVisible(domCache.denyButton)) {
          domCache.denyButton.focus();
          return true;
        }

        if (innerParams.focusCancel && isVisible(domCache.cancelButton)) {
          domCache.cancelButton.focus();
          return true;
        }

        if (innerParams.focusConfirm && isVisible(domCache.confirmButton)) {
          domCache.confirmButton.focus();
          return true;
        }

        return false;
      };

      const blurActiveElement = () => {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
      };

      /**
       * Updates popup parameters.
       */

      function update(params) {
        const popup = getPopup();
        const innerParams = privateProps.innerParams.get(this);

        if (!popup || hasClass(popup, innerParams.hideClass.popup)) {
          return warn("You're trying to update the closed or closing popup, that won't work. Use the update() method in preConfirm parameter or show a new popup.");
        }

        const validUpdatableParams = {}; // assign valid params from `params` to `defaults`

        Object.keys(params).forEach(param => {
          if (Swal.isUpdatableParameter(param)) {
            validUpdatableParams[param] = params[param];
          } else {
            warn("Invalid parameter to update: \"".concat(param, "\". Updatable params are listed here: https://github.com/sweetalert2/sweetalert2/blob/master/src/utils/params.js\n\nIf you think this parameter should be updatable, request it here: https://github.com/sweetalert2/sweetalert2/issues/new?template=02_feature_request.md"));
          }
        });
        const updatedParams = Object.assign({}, innerParams, validUpdatableParams);
        render(this, updatedParams);
        privateProps.innerParams.set(this, updatedParams);
        Object.defineProperties(this, {
          params: {
            value: Object.assign({}, this.params, params),
            writable: false,
            enumerable: true
          }
        });
      }

      function _destroy() {
        const domCache = privateProps.domCache.get(this);
        const innerParams = privateProps.innerParams.get(this);

        if (!innerParams) {
          disposeWeakMaps(this); // The WeakMaps might have been partly destroyed, we must recall it to dispose any remaining weakmaps #2335

          return; // This instance has already been destroyed
        } // Check if there is another Swal closing


        if (domCache.popup && globalState.swalCloseEventFinishedCallback) {
          globalState.swalCloseEventFinishedCallback();
          delete globalState.swalCloseEventFinishedCallback;
        } // Check if there is a swal disposal defer timer


        if (globalState.deferDisposalTimer) {
          clearTimeout(globalState.deferDisposalTimer);
          delete globalState.deferDisposalTimer;
        }

        if (typeof innerParams.didDestroy === 'function') {
          innerParams.didDestroy();
        }

        disposeSwal(this);
      }

      const disposeSwal = instance => {
        disposeWeakMaps(instance); // Unset this.params so GC will dispose it (#1569)

        delete instance.params; // Unset globalState props so GC will dispose globalState (#1569)

        delete globalState.keydownHandler;
        delete globalState.keydownTarget; // Unset currentInstance

        delete globalState.currentInstance;
      };

      const disposeWeakMaps = instance => {
        // If the current instance is awaiting a promise result, we keep the privateMethods to call them once the promise result is retreived #2335
        if (instance.isAwaitingPromise()) {
          unsetWeakMaps(privateProps, instance);
          privateProps.awaitingPromise.set(instance, true);
        } else {
          unsetWeakMaps(privateMethods, instance);
          unsetWeakMaps(privateProps, instance);
        }
      };

      const unsetWeakMaps = (obj, instance) => {
        for (const i in obj) {
          obj[i].delete(instance);
        }
      };



      var instanceMethods = /*#__PURE__*/Object.freeze({
        hideLoading: hideLoading,
        disableLoading: hideLoading,
        getInput: getInput$1,
        close: close,
        isAwaitingPromise: isAwaitingPromise,
        rejectPromise: rejectPromise,
        closePopup: close,
        closeModal: close,
        closeToast: close,
        enableButtons: enableButtons,
        disableButtons: disableButtons,
        enableInput: enableInput,
        disableInput: disableInput,
        showValidationMessage: showValidationMessage,
        resetValidationMessage: resetValidationMessage$1,
        getProgressSteps: getProgressSteps$1,
        _main: _main,
        update: update,
        _destroy: _destroy
      });

      let currentInstance;

      class SweetAlert {
        constructor(...args) {
          // Prevent run in Node env
          if (typeof window === 'undefined') {
            return;
          }

          currentInstance = this;
          const outerParams = Object.freeze(this.constructor.argsToParams(args));
          Object.defineProperties(this, {
            params: {
              value: outerParams,
              writable: false,
              enumerable: true,
              configurable: true
            }
          });

          const promise = this._main(this.params);

          privateProps.promise.set(this, promise);
        } // `catch` cannot be the name of a module export, so we define our thenable methods here instead


        then(onFulfilled) {
          const promise = privateProps.promise.get(this);
          return promise.then(onFulfilled);
        }

        finally(onFinally) {
          const promise = privateProps.promise.get(this);
          return promise.finally(onFinally);
        }

      } // Assign instance methods from src/instanceMethods/*.js to prototype


      Object.assign(SweetAlert.prototype, instanceMethods); // Assign static methods from src/staticMethods/*.js to constructor

      Object.assign(SweetAlert, staticMethods); // Proxy to instance methods to constructor, for now, for backwards compatibility

      Object.keys(instanceMethods).forEach(key => {
        SweetAlert[key] = function (...args) {
          if (currentInstance) {
            return currentInstance[key](...args);
          }
        };
      });
      SweetAlert.DismissReason = DismissReason;
      SweetAlert.version = '11.1.9';

      const Swal = SweetAlert;
      Swal.default = Swal;

      return Swal;

    }));
    if (typeof commonjsGlobal !== 'undefined' && commonjsGlobal.Sweetalert2){  commonjsGlobal.swal = commonjsGlobal.sweetAlert = commonjsGlobal.Swal = commonjsGlobal.SweetAlert = commonjsGlobal.Sweetalert2;}

    "undefined"!=typeof document&&function(e,t){var n=e.createElement("style");if(e.getElementsByTagName("head")[0].appendChild(n),n.styleSheet)n.styleSheet.disabled||(n.styleSheet.cssText=t);else try{n.innerHTML=t;}catch(e){n.innerText=t;}}(document,".swal2-popup.swal2-toast{box-sizing:border-box;grid-column:1/4!important;grid-row:1/4!important;grid-template-columns:1fr 99fr 1fr;padding:1em;overflow-y:hidden;background:#fff;box-shadow:0 0 1px rgba(0,0,0,.075),0 1px 2px rgba(0,0,0,.075),1px 2px 4px rgba(0,0,0,.075),1px 3px 8px rgba(0,0,0,.075),2px 4px 16px rgba(0,0,0,.075);pointer-events:all}.swal2-popup.swal2-toast>*{grid-column:2}.swal2-popup.swal2-toast .swal2-title{margin:.5em 1em;padding:0;font-size:1em;text-align:initial}.swal2-popup.swal2-toast .swal2-loading{justify-content:center}.swal2-popup.swal2-toast .swal2-input{height:2em;margin:.5em;font-size:1em}.swal2-popup.swal2-toast .swal2-validation-message{font-size:1em}.swal2-popup.swal2-toast .swal2-footer{margin:.5em 0 0;padding:.5em 0 0;font-size:.8em}.swal2-popup.swal2-toast .swal2-close{grid-column:3/3;grid-row:1/99;align-self:center;width:.8em;height:.8em;margin:0;font-size:2em}.swal2-popup.swal2-toast .swal2-html-container{margin:.5em 1em;padding:0;font-size:1em;text-align:initial}.swal2-popup.swal2-toast .swal2-html-container:empty{padding:0}.swal2-popup.swal2-toast .swal2-loader{grid-column:1;grid-row:1/99;align-self:center;width:2em;height:2em;margin:.25em}.swal2-popup.swal2-toast .swal2-icon{grid-column:1;grid-row:1/99;align-self:center;width:2em;min-width:2em;height:2em;margin:0 .5em 0 0}.swal2-popup.swal2-toast .swal2-icon .swal2-icon-content{display:flex;align-items:center;font-size:1.8em;font-weight:700}.swal2-popup.swal2-toast .swal2-icon.swal2-success .swal2-success-ring{width:2em;height:2em}.swal2-popup.swal2-toast .swal2-icon.swal2-error [class^=swal2-x-mark-line]{top:.875em;width:1.375em}.swal2-popup.swal2-toast .swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=left]{left:.3125em}.swal2-popup.swal2-toast .swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=right]{right:.3125em}.swal2-popup.swal2-toast .swal2-actions{justify-content:flex-start;height:auto;margin:0;margin-top:.5em;padding:0 .5em}.swal2-popup.swal2-toast .swal2-styled{margin:.25em .5em;padding:.4em .6em;font-size:1em}.swal2-popup.swal2-toast .swal2-success{border-color:#a5dc86}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-circular-line]{position:absolute;width:1.6em;height:3em;transform:rotate(45deg);border-radius:50%}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-circular-line][class$=left]{top:-.8em;left:-.5em;transform:rotate(-45deg);transform-origin:2em 2em;border-radius:4em 0 0 4em}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-circular-line][class$=right]{top:-.25em;left:.9375em;transform-origin:0 1.5em;border-radius:0 4em 4em 0}.swal2-popup.swal2-toast .swal2-success .swal2-success-ring{width:2em;height:2em}.swal2-popup.swal2-toast .swal2-success .swal2-success-fix{top:0;left:.4375em;width:.4375em;height:2.6875em}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-line]{height:.3125em}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-line][class$=tip]{top:1.125em;left:.1875em;width:.75em}.swal2-popup.swal2-toast .swal2-success [class^=swal2-success-line][class$=long]{top:.9375em;right:.1875em;width:1.375em}.swal2-popup.swal2-toast .swal2-success.swal2-icon-show .swal2-success-line-tip{-webkit-animation:swal2-toast-animate-success-line-tip .75s;animation:swal2-toast-animate-success-line-tip .75s}.swal2-popup.swal2-toast .swal2-success.swal2-icon-show .swal2-success-line-long{-webkit-animation:swal2-toast-animate-success-line-long .75s;animation:swal2-toast-animate-success-line-long .75s}.swal2-popup.swal2-toast.swal2-show{-webkit-animation:swal2-toast-show .5s;animation:swal2-toast-show .5s}.swal2-popup.swal2-toast.swal2-hide{-webkit-animation:swal2-toast-hide .1s forwards;animation:swal2-toast-hide .1s forwards}.swal2-container{display:grid;position:fixed;z-index:1060;top:0;right:0;bottom:0;left:0;box-sizing:border-box;grid-template-areas:\"top-start     top            top-end\" \"center-start  center         center-end\" \"bottom-start  bottom-center  bottom-end\";grid-template-rows:minmax(-webkit-min-content,auto) minmax(-webkit-min-content,auto) minmax(-webkit-min-content,auto);grid-template-rows:minmax(min-content,auto) minmax(min-content,auto) minmax(min-content,auto);height:100%;padding:.625em;overflow-x:hidden;transition:background-color .1s;-webkit-overflow-scrolling:touch}.swal2-container.swal2-backdrop-show,.swal2-container.swal2-noanimation{background:rgba(0,0,0,.4)}.swal2-container.swal2-backdrop-hide{background:0 0!important}.swal2-container.swal2-bottom-start,.swal2-container.swal2-center-start,.swal2-container.swal2-top-start{grid-template-columns:minmax(0,1fr) auto auto}.swal2-container.swal2-bottom,.swal2-container.swal2-center,.swal2-container.swal2-top{grid-template-columns:auto minmax(0,1fr) auto}.swal2-container.swal2-bottom-end,.swal2-container.swal2-center-end,.swal2-container.swal2-top-end{grid-template-columns:auto auto minmax(0,1fr)}.swal2-container.swal2-top-start>.swal2-popup{align-self:start}.swal2-container.swal2-top>.swal2-popup{grid-column:2;align-self:start;justify-self:center}.swal2-container.swal2-top-end>.swal2-popup,.swal2-container.swal2-top-right>.swal2-popup{grid-column:3;align-self:start;justify-self:end}.swal2-container.swal2-center-left>.swal2-popup,.swal2-container.swal2-center-start>.swal2-popup{grid-row:2;align-self:center}.swal2-container.swal2-center>.swal2-popup{grid-column:2;grid-row:2;align-self:center;justify-self:center}.swal2-container.swal2-center-end>.swal2-popup,.swal2-container.swal2-center-right>.swal2-popup{grid-column:3;grid-row:2;align-self:center;justify-self:end}.swal2-container.swal2-bottom-left>.swal2-popup,.swal2-container.swal2-bottom-start>.swal2-popup{grid-column:1;grid-row:3;align-self:end}.swal2-container.swal2-bottom>.swal2-popup{grid-column:2;grid-row:3;justify-self:center;align-self:end}.swal2-container.swal2-bottom-end>.swal2-popup,.swal2-container.swal2-bottom-right>.swal2-popup{grid-column:3;grid-row:3;align-self:end;justify-self:end}.swal2-container.swal2-grow-fullscreen>.swal2-popup,.swal2-container.swal2-grow-row>.swal2-popup{grid-column:1/4;width:100%}.swal2-container.swal2-grow-column>.swal2-popup,.swal2-container.swal2-grow-fullscreen>.swal2-popup{grid-row:1/4;align-self:stretch}.swal2-container.swal2-no-transition{transition:none!important}.swal2-popup{display:none;position:relative;box-sizing:border-box;grid-template-columns:minmax(0,100%);width:32em;max-width:100%;padding:0 0 1.25em;border:none;border-radius:5px;background:#fff;color:#545454;font-family:inherit;font-size:1rem}.swal2-popup:focus{outline:0}.swal2-popup.swal2-loading{overflow-y:hidden}.swal2-title{position:relative;max-width:100%;margin:0;padding:.8em 1em 0;color:#595959;font-size:1.875em;font-weight:600;text-align:center;text-transform:none;word-wrap:break-word}.swal2-actions{display:flex;z-index:1;box-sizing:border-box;flex-wrap:wrap;align-items:center;justify-content:center;width:auto;margin:1.25em auto 0;padding:0}.swal2-actions:not(.swal2-loading) .swal2-styled[disabled]{opacity:.4}.swal2-actions:not(.swal2-loading) .swal2-styled:hover{background-image:linear-gradient(rgba(0,0,0,.1),rgba(0,0,0,.1))}.swal2-actions:not(.swal2-loading) .swal2-styled:active{background-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.2))}.swal2-loader{display:none;align-items:center;justify-content:center;width:2.2em;height:2.2em;margin:0 1.875em;-webkit-animation:swal2-rotate-loading 1.5s linear 0s infinite normal;animation:swal2-rotate-loading 1.5s linear 0s infinite normal;border-width:.25em;border-style:solid;border-radius:100%;border-color:#2778c4 transparent #2778c4 transparent}.swal2-styled{margin:.3125em;padding:.625em 1.1em;transition:box-shadow .1s;box-shadow:0 0 0 3px transparent;font-weight:500}.swal2-styled:not([disabled]){cursor:pointer}.swal2-styled.swal2-confirm{border:0;border-radius:.25em;background:initial;background-color:#7367f0;color:#fff;font-size:1em}.swal2-styled.swal2-confirm:focus{box-shadow:0 0 0 3px rgba(115,103,240,.5)}.swal2-styled.swal2-deny{border:0;border-radius:.25em;background:initial;background-color:#ea5455;color:#fff;font-size:1em}.swal2-styled.swal2-deny:focus{box-shadow:0 0 0 3px rgba(234,84,85,.5)}.swal2-styled.swal2-cancel{border:0;border-radius:.25em;background:initial;background-color:#6e7d88;color:#fff;font-size:1em}.swal2-styled.swal2-cancel:focus{box-shadow:0 0 0 3px rgba(110,125,136,.5)}.swal2-styled.swal2-default-outline:focus{box-shadow:0 0 0 3px rgba(100,150,200,.5)}.swal2-styled:focus{outline:0}.swal2-styled::-moz-focus-inner{border:0}.swal2-footer{justify-content:center;margin:1em 0 0;padding:1em 1em 0;border-top:1px solid #eee;color:#545454;font-size:1em}.swal2-timer-progress-bar-container{position:absolute;right:0;bottom:0;left:0;grid-column:auto!important;height:.25em;overflow:hidden;border-bottom-right-radius:5px;border-bottom-left-radius:5px}.swal2-timer-progress-bar{width:100%;height:.25em;background:rgba(0,0,0,.2)}.swal2-image{max-width:100%;margin:2em auto 1em}.swal2-close{z-index:2;align-items:center;justify-content:center;width:1.2em;height:1.2em;margin-top:0;margin-right:0;margin-bottom:-1.2em;padding:0;overflow:hidden;transition:color .1s,box-shadow .1s;border:none;border-radius:5px;background:0 0;color:#ccc;font-family:serif;font-family:monospace;font-size:2.5em;cursor:pointer;justify-self:end}.swal2-close:hover{transform:none;background:0 0;color:#f27474}.swal2-close:focus{outline:0;box-shadow:inset 0 0 0 3px rgba(100,150,200,.5)}.swal2-close::-moz-focus-inner{border:0}.swal2-html-container{z-index:1;justify-content:center;margin:1em 1.6em .3em;padding:0;overflow:auto;color:#545454;font-size:1.125em;font-weight:400;line-height:normal;text-align:center;word-wrap:break-word;word-break:break-word}.swal2-checkbox,.swal2-file,.swal2-input,.swal2-radio,.swal2-select,.swal2-textarea{margin:1em 2em 0}.swal2-file,.swal2-input,.swal2-textarea{box-sizing:border-box;width:auto;transition:border-color .1s,box-shadow .1s;border:1px solid #d9d9d9;border-radius:.1875em;background:inherit;box-shadow:inset 0 1px 1px rgba(0,0,0,.06),0 0 0 3px transparent;color:inherit;font-size:1.125em}.swal2-file.swal2-inputerror,.swal2-input.swal2-inputerror,.swal2-textarea.swal2-inputerror{border-color:#f27474!important;box-shadow:0 0 2px #f27474!important}.swal2-file:focus,.swal2-input:focus,.swal2-textarea:focus{border:1px solid #b4dbed;outline:0;box-shadow:inset 0 1px 1px rgba(0,0,0,.06),0 0 0 3px rgba(100,150,200,.5)}.swal2-file::-moz-placeholder,.swal2-input::-moz-placeholder,.swal2-textarea::-moz-placeholder{color:#ccc}.swal2-file:-ms-input-placeholder,.swal2-input:-ms-input-placeholder,.swal2-textarea:-ms-input-placeholder{color:#ccc}.swal2-file::placeholder,.swal2-input::placeholder,.swal2-textarea::placeholder{color:#ccc}.swal2-range{margin:1em 2em 0;background:#fff}.swal2-range input{width:80%}.swal2-range output{width:20%;color:inherit;font-weight:600;text-align:center}.swal2-range input,.swal2-range output{height:2.625em;padding:0;font-size:1.125em;line-height:2.625em}.swal2-input{height:2.625em;padding:0 .75em}.swal2-file{width:75%;margin-right:auto;margin-left:auto;background:inherit;font-size:1.125em}.swal2-textarea{height:6.75em;padding:.75em}.swal2-select{min-width:50%;max-width:100%;padding:.375em .625em;background:inherit;color:inherit;font-size:1.125em}.swal2-checkbox,.swal2-radio{align-items:center;justify-content:center;background:#fff;color:inherit}.swal2-checkbox label,.swal2-radio label{margin:0 .6em;font-size:1.125em}.swal2-checkbox input,.swal2-radio input{flex-shrink:0;margin:0 .4em}.swal2-input-label{display:flex;justify-content:center;margin:1em auto 0}.swal2-validation-message{align-items:center;justify-content:center;margin:1em 0 0;padding:.625em;overflow:hidden;background:#f0f0f0;color:#666;font-size:1em;font-weight:300}.swal2-validation-message::before{content:\"!\";display:inline-block;width:1.5em;min-width:1.5em;height:1.5em;margin:0 .625em;border-radius:50%;background-color:#f27474;color:#fff;font-weight:600;line-height:1.5em;text-align:center}.swal2-icon{position:relative;box-sizing:content-box;justify-content:center;width:5em;height:5em;margin:2.5em auto .6em;border:.25em solid transparent;border-radius:50%;border-color:#000;font-family:inherit;line-height:5em;cursor:default;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.swal2-icon .swal2-icon-content{display:flex;align-items:center;font-size:3.75em}.swal2-icon.swal2-error{border-color:#f27474;color:#f27474}.swal2-icon.swal2-error .swal2-x-mark{position:relative;flex-grow:1}.swal2-icon.swal2-error [class^=swal2-x-mark-line]{display:block;position:absolute;top:2.3125em;width:2.9375em;height:.3125em;border-radius:.125em;background-color:#f27474}.swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=left]{left:1.0625em;transform:rotate(45deg)}.swal2-icon.swal2-error [class^=swal2-x-mark-line][class$=right]{right:1em;transform:rotate(-45deg)}.swal2-icon.swal2-error.swal2-icon-show{-webkit-animation:swal2-animate-error-icon .5s;animation:swal2-animate-error-icon .5s}.swal2-icon.swal2-error.swal2-icon-show .swal2-x-mark{-webkit-animation:swal2-animate-error-x-mark .5s;animation:swal2-animate-error-x-mark .5s}.swal2-icon.swal2-warning{border-color:#facea8;color:#f8bb86}.swal2-icon.swal2-info{border-color:#9de0f6;color:#3fc3ee}.swal2-icon.swal2-question{border-color:#c9dae1;color:#87adbd}.swal2-icon.swal2-success{border-color:#a5dc86;color:#a5dc86}.swal2-icon.swal2-success [class^=swal2-success-circular-line]{position:absolute;width:3.75em;height:7.5em;transform:rotate(45deg);border-radius:50%}.swal2-icon.swal2-success [class^=swal2-success-circular-line][class$=left]{top:-.4375em;left:-2.0635em;transform:rotate(-45deg);transform-origin:3.75em 3.75em;border-radius:7.5em 0 0 7.5em}.swal2-icon.swal2-success [class^=swal2-success-circular-line][class$=right]{top:-.6875em;left:1.875em;transform:rotate(-45deg);transform-origin:0 3.75em;border-radius:0 7.5em 7.5em 0}.swal2-icon.swal2-success .swal2-success-ring{position:absolute;z-index:2;top:-.25em;left:-.25em;box-sizing:content-box;width:100%;height:100%;border:.25em solid rgba(165,220,134,.3);border-radius:50%}.swal2-icon.swal2-success .swal2-success-fix{position:absolute;z-index:1;top:.5em;left:1.625em;width:.4375em;height:5.625em;transform:rotate(-45deg)}.swal2-icon.swal2-success [class^=swal2-success-line]{display:block;position:absolute;z-index:2;height:.3125em;border-radius:.125em;background-color:#a5dc86}.swal2-icon.swal2-success [class^=swal2-success-line][class$=tip]{top:2.875em;left:.8125em;width:1.5625em;transform:rotate(45deg)}.swal2-icon.swal2-success [class^=swal2-success-line][class$=long]{top:2.375em;right:.5em;width:2.9375em;transform:rotate(-45deg)}.swal2-icon.swal2-success.swal2-icon-show .swal2-success-line-tip{-webkit-animation:swal2-animate-success-line-tip .75s;animation:swal2-animate-success-line-tip .75s}.swal2-icon.swal2-success.swal2-icon-show .swal2-success-line-long{-webkit-animation:swal2-animate-success-line-long .75s;animation:swal2-animate-success-line-long .75s}.swal2-icon.swal2-success.swal2-icon-show .swal2-success-circular-line-right{-webkit-animation:swal2-rotate-success-circular-line 4.25s ease-in;animation:swal2-rotate-success-circular-line 4.25s ease-in}.swal2-progress-steps{flex-wrap:wrap;align-items:center;max-width:100%;margin:1.25em auto;padding:0;background:inherit;font-weight:600}.swal2-progress-steps li{display:inline-block;position:relative}.swal2-progress-steps .swal2-progress-step{z-index:20;flex-shrink:0;width:2em;height:2em;border-radius:2em;background:#2778c4;color:#fff;line-height:2em;text-align:center}.swal2-progress-steps .swal2-progress-step.swal2-active-progress-step{background:#2778c4}.swal2-progress-steps .swal2-progress-step.swal2-active-progress-step~.swal2-progress-step{background:#add8e6;color:#fff}.swal2-progress-steps .swal2-progress-step.swal2-active-progress-step~.swal2-progress-step-line{background:#add8e6}.swal2-progress-steps .swal2-progress-step-line{z-index:10;flex-shrink:0;width:2.5em;height:.4em;margin:0 -1px;background:#2778c4}[class^=swal2]{-webkit-tap-highlight-color:transparent}.swal2-show{-webkit-animation:swal2-show .3s;animation:swal2-show .3s}.swal2-hide{-webkit-animation:swal2-hide .15s forwards;animation:swal2-hide .15s forwards}.swal2-noanimation{transition:none}.swal2-scrollbar-measure{position:absolute;top:-9999px;width:50px;height:50px;overflow:scroll}.swal2-rtl .swal2-close{margin-right:initial;margin-left:0}.swal2-rtl .swal2-timer-progress-bar{right:0;left:auto}@-webkit-keyframes swal2-toast-show{0%{transform:translateY(-.625em) rotateZ(2deg)}33%{transform:translateY(0) rotateZ(-2deg)}66%{transform:translateY(.3125em) rotateZ(2deg)}100%{transform:translateY(0) rotateZ(0)}}@keyframes swal2-toast-show{0%{transform:translateY(-.625em) rotateZ(2deg)}33%{transform:translateY(0) rotateZ(-2deg)}66%{transform:translateY(.3125em) rotateZ(2deg)}100%{transform:translateY(0) rotateZ(0)}}@-webkit-keyframes swal2-toast-hide{100%{transform:rotateZ(1deg);opacity:0}}@keyframes swal2-toast-hide{100%{transform:rotateZ(1deg);opacity:0}}@-webkit-keyframes swal2-toast-animate-success-line-tip{0%{top:.5625em;left:.0625em;width:0}54%{top:.125em;left:.125em;width:0}70%{top:.625em;left:-.25em;width:1.625em}84%{top:1.0625em;left:.75em;width:.5em}100%{top:1.125em;left:.1875em;width:.75em}}@keyframes swal2-toast-animate-success-line-tip{0%{top:.5625em;left:.0625em;width:0}54%{top:.125em;left:.125em;width:0}70%{top:.625em;left:-.25em;width:1.625em}84%{top:1.0625em;left:.75em;width:.5em}100%{top:1.125em;left:.1875em;width:.75em}}@-webkit-keyframes swal2-toast-animate-success-line-long{0%{top:1.625em;right:1.375em;width:0}65%{top:1.25em;right:.9375em;width:0}84%{top:.9375em;right:0;width:1.125em}100%{top:.9375em;right:.1875em;width:1.375em}}@keyframes swal2-toast-animate-success-line-long{0%{top:1.625em;right:1.375em;width:0}65%{top:1.25em;right:.9375em;width:0}84%{top:.9375em;right:0;width:1.125em}100%{top:.9375em;right:.1875em;width:1.375em}}@-webkit-keyframes swal2-show{0%{transform:scale(.7)}45%{transform:scale(1.05)}80%{transform:scale(.95)}100%{transform:scale(1)}}@keyframes swal2-show{0%{transform:scale(.7)}45%{transform:scale(1.05)}80%{transform:scale(.95)}100%{transform:scale(1)}}@-webkit-keyframes swal2-hide{0%{transform:scale(1);opacity:1}100%{transform:scale(.5);opacity:0}}@keyframes swal2-hide{0%{transform:scale(1);opacity:1}100%{transform:scale(.5);opacity:0}}@-webkit-keyframes swal2-animate-success-line-tip{0%{top:1.1875em;left:.0625em;width:0}54%{top:1.0625em;left:.125em;width:0}70%{top:2.1875em;left:-.375em;width:3.125em}84%{top:3em;left:1.3125em;width:1.0625em}100%{top:2.8125em;left:.8125em;width:1.5625em}}@keyframes swal2-animate-success-line-tip{0%{top:1.1875em;left:.0625em;width:0}54%{top:1.0625em;left:.125em;width:0}70%{top:2.1875em;left:-.375em;width:3.125em}84%{top:3em;left:1.3125em;width:1.0625em}100%{top:2.8125em;left:.8125em;width:1.5625em}}@-webkit-keyframes swal2-animate-success-line-long{0%{top:3.375em;right:2.875em;width:0}65%{top:3.375em;right:2.875em;width:0}84%{top:2.1875em;right:0;width:3.4375em}100%{top:2.375em;right:.5em;width:2.9375em}}@keyframes swal2-animate-success-line-long{0%{top:3.375em;right:2.875em;width:0}65%{top:3.375em;right:2.875em;width:0}84%{top:2.1875em;right:0;width:3.4375em}100%{top:2.375em;right:.5em;width:2.9375em}}@-webkit-keyframes swal2-rotate-success-circular-line{0%{transform:rotate(-45deg)}5%{transform:rotate(-45deg)}12%{transform:rotate(-405deg)}100%{transform:rotate(-405deg)}}@keyframes swal2-rotate-success-circular-line{0%{transform:rotate(-45deg)}5%{transform:rotate(-45deg)}12%{transform:rotate(-405deg)}100%{transform:rotate(-405deg)}}@-webkit-keyframes swal2-animate-error-x-mark{0%{margin-top:1.625em;transform:scale(.4);opacity:0}50%{margin-top:1.625em;transform:scale(.4);opacity:0}80%{margin-top:-.375em;transform:scale(1.15)}100%{margin-top:0;transform:scale(1);opacity:1}}@keyframes swal2-animate-error-x-mark{0%{margin-top:1.625em;transform:scale(.4);opacity:0}50%{margin-top:1.625em;transform:scale(.4);opacity:0}80%{margin-top:-.375em;transform:scale(1.15)}100%{margin-top:0;transform:scale(1);opacity:1}}@-webkit-keyframes swal2-animate-error-icon{0%{transform:rotateX(100deg);opacity:0}100%{transform:rotateX(0);opacity:1}}@keyframes swal2-animate-error-icon{0%{transform:rotateX(100deg);opacity:0}100%{transform:rotateX(0);opacity:1}}@-webkit-keyframes swal2-rotate-loading{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}@keyframes swal2-rotate-loading{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown){overflow:hidden}body.swal2-height-auto{height:auto!important}body.swal2-no-backdrop .swal2-container{background-color:transparent!important;pointer-events:none}body.swal2-no-backdrop .swal2-container .swal2-popup{pointer-events:all}body.swal2-no-backdrop .swal2-container .swal2-modal{box-shadow:0 0 10px rgba(0,0,0,.4)}@media print{body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown){overflow-y:scroll!important}body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown)>[aria-hidden=true]{display:none}body.swal2-shown:not(.swal2-no-backdrop):not(.swal2-toast-shown) .swal2-container{position:static!important}}body.swal2-toast-shown .swal2-container{box-sizing:border-box;width:360px;max-width:100%;background-color:transparent;pointer-events:none}body.swal2-toast-shown .swal2-container.swal2-top{top:0;right:auto;bottom:auto;left:50%;transform:translateX(-50%)}body.swal2-toast-shown .swal2-container.swal2-top-end,body.swal2-toast-shown .swal2-container.swal2-top-right{top:0;right:0;bottom:auto;left:auto}body.swal2-toast-shown .swal2-container.swal2-top-left,body.swal2-toast-shown .swal2-container.swal2-top-start{top:0;right:auto;bottom:auto;left:0}body.swal2-toast-shown .swal2-container.swal2-center-left,body.swal2-toast-shown .swal2-container.swal2-center-start{top:50%;right:auto;bottom:auto;left:0;transform:translateY(-50%)}body.swal2-toast-shown .swal2-container.swal2-center{top:50%;right:auto;bottom:auto;left:50%;transform:translate(-50%,-50%)}body.swal2-toast-shown .swal2-container.swal2-center-end,body.swal2-toast-shown .swal2-container.swal2-center-right{top:50%;right:0;bottom:auto;left:auto;transform:translateY(-50%)}body.swal2-toast-shown .swal2-container.swal2-bottom-left,body.swal2-toast-shown .swal2-container.swal2-bottom-start{top:auto;right:auto;bottom:0;left:0}body.swal2-toast-shown .swal2-container.swal2-bottom{top:auto;right:auto;bottom:0;left:50%;transform:translateX(-50%)}body.swal2-toast-shown .swal2-container.swal2-bottom-end,body.swal2-toast-shown .swal2-container.swal2-bottom-right{top:auto;right:0;bottom:0;left:auto}");
    });

    /* src\components\Car.svelte generated by Svelte v3.43.2 */
    const file$8 = "src\\components\\Car.svelte";

    function create_fragment$8(ctx) {
    	let main;
    	let div4;
    	let a;
    	let img;
    	let img_src_value;
    	let t0;
    	let div3;
    	let h3;
    	let t1_value = /*car*/ ctx[0].mark + "";
    	let t1;
    	let t2;
    	let h2;
    	let t3_value = /*car*/ ctx[0].model + "";
    	let t3;
    	let t4;
    	let p0;
    	let span0;
    	let t6;
    	let t7_value = /*car*/ ctx[0].prod_year + "";
    	let t7;
    	let t8;
    	let p1;
    	let span1;
    	let t10;
    	let t11_value = /*car*/ ctx[0].mileage + "";
    	let t11;
    	let t12;
    	let p2;
    	let span2;
    	let t14;
    	let t15_value = /*car*/ ctx[0].fuel + "";
    	let t15;
    	let t16;
    	let p3;
    	let span3;
    	let t18;
    	let t19_value = /*car*/ ctx[0].color + "";
    	let t19;
    	let t20;
    	let p4;
    	let span4;
    	let t22;
    	let t23_value = /*car*/ ctx[0].price * /*daysCount*/ ctx[6] + "";
    	let t23;
    	let t24;
    	let t25;
    	let form;
    	let div2;
    	let div0;
    	let label0;
    	let t27;
    	let input0;
    	let t28;
    	let div1;
    	let label1;
    	let t30;
    	let input1;
    	let t31;
    	let input2;
    	let t32;
    	let p5;
    	let svg;
    	let path;
    	let t33;
    	let t34;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div4 = element("div");
    			a = element("a");
    			img = element("img");
    			t0 = space();
    			div3 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(t3_value);
    			t4 = space();
    			p0 = element("p");
    			span0 = element("span");
    			span0.textContent = "Production Year:";
    			t6 = space();
    			t7 = text(t7_value);
    			t8 = space();
    			p1 = element("p");
    			span1 = element("span");
    			span1.textContent = "Mileage:";
    			t10 = space();
    			t11 = text(t11_value);
    			t12 = space();
    			p2 = element("p");
    			span2 = element("span");
    			span2.textContent = "Fuel:";
    			t14 = space();
    			t15 = text(t15_value);
    			t16 = space();
    			p3 = element("p");
    			span3 = element("span");
    			span3.textContent = "Color:";
    			t18 = space();
    			t19 = text(t19_value);
    			t20 = space();
    			p4 = element("p");
    			span4 = element("span");
    			span4.textContent = "Rent price:";
    			t22 = space();
    			t23 = text(t23_value);
    			t24 = text(" zł");
    			t25 = space();
    			form = element("form");
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "From:";
    			t27 = space();
    			input0 = element("input");
    			t28 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "To:";
    			t30 = space();
    			input1 = element("input");
    			t31 = space();
    			input2 = element("input");
    			t32 = space();
    			p5 = element("p");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t33 = space();
    			t34 = text(/*queue*/ ctx[2]);
    			attr_dev(img, "alt", "ecommerce");
    			attr_dev(img, "class", "object-cover object-center w-full h-full block");
    			if (!src_url_equal(img.src, img_src_value = "img/cars/" + /*car*/ ctx[0].image)) attr_dev(img, "src", img_src_value);
    			add_location(img, file$8, 120, 12, 3754);
    			attr_dev(a, "class", "block h-48 rounded-lg overflow-hidden");
    			add_location(a, file$8, 119, 8, 3691);
    			attr_dev(h3, "class", "text-nord15 tracking-widest title-font mb-1");
    			add_location(h3, file$8, 127, 12, 3979);
    			attr_dev(h2, "class", "text-white text-small title-font text-lg font-medium");
    			add_location(h2, file$8, 130, 12, 4096);
    			add_location(span0, file$8, 134, 16, 4286);
    			attr_dev(p0, "class", "mt-1 flex text-xs justify-between");
    			add_location(p0, file$8, 133, 12, 4223);
    			add_location(span1, file$8, 138, 16, 4443);
    			attr_dev(p1, "class", "mt-1 flex text-xs justify-between");
    			add_location(p1, file$8, 137, 12, 4380);
    			add_location(span2, file$8, 142, 16, 4590);
    			attr_dev(p2, "class", "mt-1 flex text-xs justify-between");
    			add_location(p2, file$8, 141, 12, 4527);
    			add_location(span3, file$8, 146, 16, 4731);
    			attr_dev(p3, "class", "mt-1 flex text-xs justify-between");
    			add_location(p3, file$8, 145, 12, 4668);
    			add_location(span4, file$8, 150, 16, 4874);
    			attr_dev(p4, "class", "mt-1 flex text-xs justify-between");
    			add_location(p4, file$8, 149, 12, 4811);
    			attr_dev(label0, "for", "start-date");
    			attr_dev(label0, "class", "text-xs");
    			add_location(label0, file$8, 159, 24, 5238);
    			attr_dev(input0, "type", "date");
    			input0.value = /*startDate*/ ctx[4];
    			attr_dev(input0, "name", "start-date");
    			attr_dev(input0, "class", "outline-none text-xs select-none border-none rounded-lg px-2 bg-nord3 focus:shadow-outline");
    			add_location(input0, file$8, 160, 24, 5317);
    			attr_dev(div0, "class", "flex-col mb-2");
    			add_location(div0, file$8, 158, 20, 5185);
    			attr_dev(label1, "for", "start-date");
    			attr_dev(label1, "class", "text-xs");
    			add_location(label1, file$8, 172, 24, 5919);
    			attr_dev(input1, "type", "date");
    			input1.value = /*endDate*/ ctx[5];
    			attr_dev(input1, "name", "end-date");
    			attr_dev(input1, "class", "text-xs outline-none select-none border-none rounded-lg px-2 bg-nord3 focus:shadow-outline");
    			add_location(input1, file$8, 173, 24, 5996);
    			attr_dev(div1, "class", "flex-col ");
    			add_location(div1, file$8, 171, 20, 5870);
    			attr_dev(div2, "class", "flex justify-between flex-wrap");
    			add_location(div2, file$8, 157, 16, 5119);
    			attr_dev(input2, "type", "submit");
    			input2.value = /*buttonText*/ ctx[3];
    			input2.disabled = /*isReservated*/ ctx[1];
    			attr_dev(input2, "class", "svelte-uzaqvr");
    			toggle_class(input2, "active", !/*isReservated*/ ctx[1]);
    			toggle_class(input2, "inactive", /*isReservated*/ ctx[1]);
    			add_location(input2, file$8, 185, 16, 6563);
    			attr_dev(form, "class", "mt-5 flex flex-col text-white text-medium");
    			add_location(form, file$8, 153, 12, 4974);
    			attr_dev(path, "d", "M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z");
    			add_location(path, file$8, 201, 21, 7170);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "16");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "#EBCB8B");
    			attr_dev(svg, "class", "mx-1");
    			add_location(svg, file$8, 194, 16, 6911);
    			attr_dev(p5, "class", "mt-1 flex text-xs justify-end italic");
    			add_location(p5, file$8, 193, 12, 6845);
    			attr_dev(div3, "class", "mt-4");
    			add_location(div3, file$8, 126, 8, 3947);
    			attr_dev(div4, "class", "p-4 bg-nord0 rounded-lg");
    			add_location(div4, file$8, 118, 4, 3644);
    			add_location(main, file$8, 117, 0, 3632);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div4);
    			append_dev(div4, a);
    			append_dev(a, img);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, h3);
    			append_dev(h3, t1);
    			append_dev(div3, t2);
    			append_dev(div3, h2);
    			append_dev(h2, t3);
    			append_dev(div3, t4);
    			append_dev(div3, p0);
    			append_dev(p0, span0);
    			append_dev(p0, t6);
    			append_dev(p0, t7);
    			append_dev(div3, t8);
    			append_dev(div3, p1);
    			append_dev(p1, span1);
    			append_dev(p1, t10);
    			append_dev(p1, t11);
    			append_dev(div3, t12);
    			append_dev(div3, p2);
    			append_dev(p2, span2);
    			append_dev(p2, t14);
    			append_dev(p2, t15);
    			append_dev(div3, t16);
    			append_dev(div3, p3);
    			append_dev(p3, span3);
    			append_dev(p3, t18);
    			append_dev(p3, t19);
    			append_dev(div3, t20);
    			append_dev(div3, p4);
    			append_dev(p4, span4);
    			append_dev(p4, t22);
    			append_dev(p4, t23);
    			append_dev(p4, t24);
    			append_dev(div3, t25);
    			append_dev(div3, form);
    			append_dev(form, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t27);
    			append_dev(div0, input0);
    			append_dev(div2, t28);
    			append_dev(div2, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t30);
    			append_dev(div1, input1);
    			append_dev(form, t31);
    			append_dev(form, input2);
    			append_dev(div3, t32);
    			append_dev(div3, p5);
    			append_dev(p5, svg);
    			append_dev(svg, path);
    			append_dev(p5, t33);
    			append_dev(p5, t34);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*change_handler*/ ctx[9], false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[10], false, false, false),
    					listen_dev(form, "submit", /*submitRent*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*car*/ 1 && !src_url_equal(img.src, img_src_value = "img/cars/" + /*car*/ ctx[0].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*car*/ 1 && t1_value !== (t1_value = /*car*/ ctx[0].mark + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*car*/ 1 && t3_value !== (t3_value = /*car*/ ctx[0].model + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*car*/ 1 && t7_value !== (t7_value = /*car*/ ctx[0].prod_year + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*car*/ 1 && t11_value !== (t11_value = /*car*/ ctx[0].mileage + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*car*/ 1 && t15_value !== (t15_value = /*car*/ ctx[0].fuel + "")) set_data_dev(t15, t15_value);
    			if (dirty & /*car*/ 1 && t19_value !== (t19_value = /*car*/ ctx[0].color + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*car, daysCount*/ 65 && t23_value !== (t23_value = /*car*/ ctx[0].price * /*daysCount*/ ctx[6] + "")) set_data_dev(t23, t23_value);

    			if (dirty & /*startDate*/ 16) {
    				prop_dev(input0, "value", /*startDate*/ ctx[4]);
    			}

    			if (dirty & /*endDate*/ 32) {
    				prop_dev(input1, "value", /*endDate*/ ctx[5]);
    			}

    			if (dirty & /*buttonText*/ 8) {
    				prop_dev(input2, "value", /*buttonText*/ ctx[3]);
    			}

    			if (dirty & /*isReservated*/ 2) {
    				prop_dev(input2, "disabled", /*isReservated*/ ctx[1]);
    			}

    			if (dirty & /*isReservated*/ 2) {
    				toggle_class(input2, "active", !/*isReservated*/ ctx[1]);
    			}

    			if (dirty & /*isReservated*/ 2) {
    				toggle_class(input2, "inactive", /*isReservated*/ ctx[1]);
    			}

    			if (dirty & /*queue*/ 4) set_data_dev(t34, /*queue*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Car', slots, []);
    	let { car } = $$props;
    	let date = new Date();
    	let isReservated = false;
    	let queue = 0;
    	let buttonText = "Rent";

    	const checkReservation = async () => {
    		const userId = await checkId(await getSession("getUser"));
    		const res = await getReservations();

    		await res.forEach(reservation => {
    			if (reservation.userId === userId && reservation.carId === car.id) {
    				$$invalidate(1, isReservated = true);
    				$$invalidate(3, buttonText = "Pending");
    			}

    			if (reservation.carId === car.id) {
    				$$invalidate(2, queue++, queue);
    			}
    		});
    	};

    	checkReservation();
    	let startDate = date.toISOString().split("T")[0];
    	let endDate = date.toISOString().split("T")[0];
    	let daysCount = 1;

    	const countDays = (start, end) => {
    		const date1 = new Date(start);
    		const date2 = new Date(end);
    		const difference = (date2 - date1) / (1000 * 3600 * 24) + 1;

    		if (difference < 0) {
    			const Toast = sweetalert2_all.mixin({
    				toast: true,
    				position: "top-end",
    				showConfirmButton: false,
    				timer: 3000,
    				timerProgressBar: true
    			});

    			Toast.fire({
    				icon: "error",
    				title: "Please choose correct dates!"
    			});
    		} else {
    			$$invalidate(6, daysCount = difference);
    		}
    	};

    	const submitRent = async e => {
    		e.preventDefault();
    		const startDate = e.target["start-date"].value;
    		const endDate = e.target["end-date"].value;

    		if (startDate > endDate) {
    			const Toast = sweetalert2_all.mixin({
    				toast: true,
    				position: "top-end",
    				showConfirmButton: false,
    				timer: 3000,
    				timerProgressBar: true
    			});

    			Toast.fire({
    				icon: "error",
    				title: "Please choose correct dates!"
    			});

    			return;
    		}

    		if (await getSession("getUser") === "") {
    			window.location.href = ".#/login";
    			return;
    		}

    		const reservate = await handleReservation(car.id, await getSession("getUser"), startDate, endDate);

    		if (reservate === "added") {
    			$$invalidate(3, buttonText = "Pending");
    			$$invalidate(1, isReservated = true);
    			$$invalidate(2, queue = 0);
    			await checkReservation();

    			const Toast = sweetalert2_all.mixin({
    				toast: true,
    				position: "top-end",
    				showConfirmButton: false,
    				timer: 3000,
    				timerProgressBar: true
    			});

    			Toast.fire({
    				icon: "success",
    				title: "Car has been reserved!"
    			});
    		} else {
    			const Toast = sweetalert2_all.mixin({
    				toast: true,
    				position: "top-end",
    				showConfirmButton: false,
    				timer: 3000,
    				timerProgressBar: true
    			});

    			Toast.fire({
    				icon: "error",
    				title: "An error occurred while reservating car!"
    			});
    		}
    	};

    	const writable_props = ['car'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Car> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => {
    		$$invalidate(4, startDate = e.target.value);
    		countDays(startDate, endDate);
    	};

    	const change_handler_1 = e => {
    		$$invalidate(5, endDate = e.target.value);
    		countDays(startDate, endDate);
    	};

    	$$self.$$set = $$props => {
    		if ('car' in $$props) $$invalidate(0, car = $$props.car);
    	};

    	$$self.$capture_state = () => ({
    		getSession,
    		checkId,
    		getReservations,
    		handleReservation,
    		Swal: sweetalert2_all,
    		car,
    		date,
    		isReservated,
    		queue,
    		buttonText,
    		checkReservation,
    		startDate,
    		endDate,
    		daysCount,
    		countDays,
    		submitRent
    	});

    	$$self.$inject_state = $$props => {
    		if ('car' in $$props) $$invalidate(0, car = $$props.car);
    		if ('date' in $$props) date = $$props.date;
    		if ('isReservated' in $$props) $$invalidate(1, isReservated = $$props.isReservated);
    		if ('queue' in $$props) $$invalidate(2, queue = $$props.queue);
    		if ('buttonText' in $$props) $$invalidate(3, buttonText = $$props.buttonText);
    		if ('startDate' in $$props) $$invalidate(4, startDate = $$props.startDate);
    		if ('endDate' in $$props) $$invalidate(5, endDate = $$props.endDate);
    		if ('daysCount' in $$props) $$invalidate(6, daysCount = $$props.daysCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		car,
    		isReservated,
    		queue,
    		buttonText,
    		startDate,
    		endDate,
    		daysCount,
    		countDays,
    		submitRent,
    		change_handler,
    		change_handler_1
    	];
    }

    class Car extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { car: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Car",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*car*/ ctx[0] === undefined && !('car' in props)) {
    			console.warn("<Car> was created without expected prop 'car'");
    		}
    	}

    	get car() {
    		throw new Error("<Car>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set car(value) {
    		throw new Error("<Car>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let storeCars = writable([]);

    async function load$1() {
        const res = await fetch("./backend/getCars.php", {
            method: "GET"
        });
        const data = await res.json();
        storeCars.set(data);
    }

    load$1();

    /* src\routes\Cars.svelte generated by Svelte v3.43.2 */
    const file$7 = "src\\routes\\Cars.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (90:8) {#if dropdown}
    function create_if_block_5(ctx) {
    	let form;
    	let t0;
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block_1,
    		value: 11
    	};

    	handle_promise(/*getOptions*/ ctx[3](), info);

    	const block = {
    		c: function create() {
    			form = element("form");
    			info.block.c();
    			t0 = space();
    			div = element("div");
    			button = element("button");
    			button.textContent = "Filter";
    			attr_dev(button, "class", "text-white mt-4 h-1/2 w-full bg-indigo-500 border-0 focus:outline-none hover:bg-indigo-600 rounded text-md");
    			add_location(button, file$7, 124, 20, 4757);
    			attr_dev(div, "class", "w-full flex items-center");
    			add_location(div, file$7, 123, 16, 4697);
    			attr_dev(form, "class", "grid md:grid-cols-5 grid-cols-3 gap-4 mx-4 mt-2");
    			add_location(form, file$7, 90, 12, 2968);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			info.block.m(form, info.anchor = null);
    			info.mount = () => form;
    			info.anchor = t0;
    			append_dev(form, t0);
    			append_dev(form, div);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", /*submitFilter*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			info.block.d();
    			info.token = null;
    			info = null;
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(90:8) {#if dropdown}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>      import Car from "../components/Car.svelte";      import { storeCars }
    function create_catch_block_1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(1:0) <script>      import Car from \\\"../components/Car.svelte\\\";      import { storeCars }",
    		ctx
    	});

    	return block;
    }

    // (95:50)                       {#each options as option}
    function create_then_block_1(ctx) {
    	let each_1_anchor;
    	let each_value_2 = /*options*/ ctx[11];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*getOptions*/ 8) {
    				each_value_2 = /*options*/ ctx[11];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_1.name,
    		type: "then",
    		source: "(95:50)                       {#each options as option}",
    		ctx
    	});

    	return block;
    }

    // (102:28) {#if option.category !== "Price"}
    function create_if_block_6(ctx) {
    	let select;
    	let option;
    	let each_value_3 = /*option*/ ctx[12].items;
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");
    			option = element("option");
    			option.textContent = "All";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			option.__value = "all";
    			option.value = option.__value;
    			attr_dev(option, "class", "flex items-center justify-center");
    			add_location(option, file$7, 106, 36, 3874);
    			attr_dev(select, "name", /*option*/ ctx[12].category.toLowerCase());
    			attr_dev(select, "class", "h-10 px-3 pr-6 text-justify text-nord6 outline-none border-none rounded-lg bg-nord0 focus:shadow-outline");
    			add_location(select, file$7, 102, 32, 3570);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*getOptions*/ 8) {
    				each_value_3 = /*option*/ ctx[12].items;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
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
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(102:28) {#if option.category !== \\\"Price\\\"}",
    		ctx
    	});

    	return block;
    }

    // (112:36) {#each option.items as value}
    function create_each_block_3(ctx) {
    	let option;
    	let t_value = /*value*/ ctx[15] + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*value*/ ctx[15];
    			option.value = option.__value;
    			attr_dev(option, "class", "flex items-center justify-center");
    			add_location(option, file$7, 112, 40, 4218);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(112:36) {#each option.items as value}",
    		ctx
    	});

    	return block;
    }

    // (96:20) {#each options as option}
    function create_each_block_2(ctx) {
    	let div;
    	let label;
    	let t0_value = /*option*/ ctx[12].category + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let if_block = /*option*/ ctx[12].category !== "Price" && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = text(t0_value);
    			t1 = text(":");
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			attr_dev(label, "for", /*option*/ ctx[12].category.toLowerCase());
    			attr_dev(label, "class", "text-sm");
    			add_location(label, file$7, 97, 28, 3292);
    			attr_dev(div, "class", "flex flex-col w-full");
    			add_location(div, file$7, 96, 24, 3228);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(div, t2);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (/*option*/ ctx[12].category !== "Price") if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(96:20) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>      import Car from "../components/Car.svelte";      import { storeCars }
    function create_pending_block_1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(1:0) <script>      import Car from \\\"../components/Car.svelte\\\";      import { storeCars }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>      import Car from "../components/Car.svelte";      import { storeCars }
    function create_catch_block$3(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$3.name,
    		type: "catch",
    		source: "(1:0) <script>      import Car from \\\"../components/Car.svelte\\\";      import { storeCars }",
    		ctx
    	});

    	return block;
    }

    // (135:4) {:then}
    function create_then_block$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_if_block_1$3, create_if_block_3$1, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$storeCars*/ ctx[2].length === 0) return 0;
    		if (!/*filteredCars*/ ctx[0]) return 1;
    		if (/*filteredCars*/ ctx[0].length === 0) return 2;
    		return 3;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$3.name,
    		type: "then",
    		source: "(135:4) {:then}",
    		ctx
    	});

    	return block;
    }

    // (162:8) {:else}
    function create_else_block$4(ctx) {
    	let div;
    	let current;
    	let each_value_1 = /*filteredCars*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "w-full p-4 text-nord6 grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4");
    			add_location(div, file$7, 162, 12, 6289);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filteredCars*/ 1) {
    				each_value_1 = /*filteredCars*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(162:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (153:44) 
    function create_if_block_3$1(ctx) {
    	let div;
    	let h10;
    	let t1;
    	let h11;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h10 = element("h1");
    			h10.textContent = "No vehicle available!";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "Unfortunately, you have to change your desires 🐒";
    			attr_dev(h10, "class", "text-nord6 text-4xl bold mt-10");
    			add_location(h10, file$7, 154, 16, 5974);
    			attr_dev(h11, "class", "text-nord6 text-2xl bold mt-10");
    			add_location(h11, file$7, 157, 16, 6101);
    			attr_dev(div, "class", "flex flex-col justify-center items-center");
    			add_location(div, file$7, 153, 12, 5901);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h10);
    			append_dev(div, t1);
    			append_dev(div, h11);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(153:44) ",
    		ctx
    	});

    	return block;
    }

    // (143:32) 
    function create_if_block_1$3(ctx) {
    	let div;
    	let current;
    	let each_value = /*$storeCars*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "w-full p-4 text-nord6 grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4");
    			add_location(div, file$7, 143, 12, 5507);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$storeCars*/ 4) {
    				each_value = /*$storeCars*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(143:32) ",
    		ctx
    	});

    	return block;
    }

    // (136:8) {#if $storeCars.length === 0}
    function create_if_block$4(ctx) {
    	let div;
    	let h10;
    	let t1;
    	let h11;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h10 = element("h1");
    			h10.textContent = "No vehicle available!";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "Check later 🦧";
    			attr_dev(h10, "class", "text-nord6 text-4xl bold mt-10");
    			add_location(h10, file$7, 137, 16, 5250);
    			attr_dev(h11, "class", "text-nord6 text-2xl bold mt-10");
    			add_location(h11, file$7, 140, 16, 5377);
    			attr_dev(div, "class", "flex flex-col justify-center items-center");
    			add_location(div, file$7, 136, 12, 5177);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h10);
    			append_dev(div, t1);
    			append_dev(div, h11);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(136:8) {#if $storeCars.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (167:20) {#if car.in_use === "0"}
    function create_if_block_4(ctx) {
    	let car;
    	let current;

    	car = new Car({
    			props: { car: /*car*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(car.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(car, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const car_changes = {};
    			if (dirty & /*filteredCars*/ 1) car_changes.car = /*car*/ ctx[6];
    			car.$set(car_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(car.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(car.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(car, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(167:20) {#if car.in_use === \\\"0\\\"}",
    		ctx
    	});

    	return block;
    }

    // (166:16) {#each filteredCars as car}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*car*/ ctx[6].in_use === "0" && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*car*/ ctx[6].in_use === "0") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*filteredCars*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(166:16) {#each filteredCars as car}",
    		ctx
    	});

    	return block;
    }

    // (148:20) {#if car.in_use === "0"}
    function create_if_block_2$2(ctx) {
    	let car;
    	let current;

    	car = new Car({
    			props: { car: /*car*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(car.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(car, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const car_changes = {};
    			if (dirty & /*$storeCars*/ 4) car_changes.car = /*car*/ ctx[6];
    			car.$set(car_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(car.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(car.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(car, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(148:20) {#if car.in_use === \\\"0\\\"}",
    		ctx
    	});

    	return block;
    }

    // (147:16) {#each $storeCars as car}
    function create_each_block$4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*car*/ ctx[6].in_use === "0" && create_if_block_2$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*car*/ ctx[6].in_use === "0") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$storeCars*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(147:16) {#each $storeCars as car}",
    		ctx
    	});

    	return block;
    }

    // (133:23)           <h1>Waiting for cars to load...</h1>      {:then}
    function create_pending_block$3(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Waiting for cars to load...";
    			add_location(h1, file$7, 133, 8, 5075);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$3.name,
    		type: "pending",
    		source: "(133:23)           <h1>Waiting for cars to load...</h1>      {:then}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let div;
    	let svg;
    	let path;
    	let t0;
    	let t1;
    	let promise;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*dropdown*/ ctx[1] && create_if_block_5(ctx);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$3,
    		then: create_then_block$3,
    		catch: create_catch_block$3,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*$storeCars*/ ctx[2], info);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			info.block.c();
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4");
    			add_location(path, file$7, 82, 12, 2621);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-6 w-6 ml-auto mr-10 cursor-pointer transition-all hover:h-8 hover:w-8");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$7, 74, 8, 2325);
    			attr_dev(div, "class", "mt-10 text-nord6 w-full flex-col select-none");
    			add_location(div, file$7, 73, 4, 2257);
    			add_location(main, file$7, 72, 0, 2245);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, svg);
    			append_dev(svg, path);
    			append_dev(div, t0);
    			if (if_block) if_block.m(div, null);
    			append_dev(main, t1);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = null;
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", /*showMenu*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (/*dropdown*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			info.ctx = ctx;

    			if (dirty & /*$storeCars*/ 4 && promise !== (promise = /*$storeCars*/ ctx[2]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			info.block.d();
    			info.token = null;
    			info = null;
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $storeCars;
    	validate_store(storeCars, 'storeCars');
    	component_subscribe($$self, storeCars, $$value => $$invalidate(2, $storeCars = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Cars', slots, []);
    	let filteredCars;
    	let dropdown = false;
    	window.scroll({ top: 0, left: 0, behavior: "smooth" });

    	const getOptions = async () => {
    		const marks = new Set(await $storeCars.map(car => {
    				return car.mark;
    			}));

    		const years = new Set(await $storeCars.map(car => {
    				return car.prod_year;
    			}));

    		const fuels = new Set(await $storeCars.map(car => {
    				return car.fuel;
    			}));

    		const colors = new Set(await $storeCars.map(car => {
    				return car.color;
    			}));

    		return [
    			{
    				category: "Mark",
    				items: Array.from(marks).sort()
    			},
    			{
    				category: "Production",
    				items: Array.from(years).sort()
    			},
    			{
    				category: "Fuel",
    				items: Array.from(fuels).sort()
    			},
    			{
    				category: "Colors",
    				items: Array.from(colors)
    			}
    		];
    	};

    	const showMenu = async () => {
    		$$invalidate(1, dropdown = !dropdown);
    	};

    	const submitFilter = async e => {
    		e.preventDefault();
    		const mark = e.target["mark"].value;
    		const prodYear = e.target["production"].value;
    		const fuel = e.target["fuel"].value;
    		const color = e.target["colors"].value;
    		$$invalidate(0, filteredCars = await $storeCars);

    		$$invalidate(0, filteredCars = filteredCars.filter(car => {
    			if (mark === "all") return car;
    			if (car.mark === mark) return car;
    		}));

    		$$invalidate(0, filteredCars = filteredCars.filter(car => {
    			if (prodYear === "all") return car;
    			if (car.prod_year === prodYear) return car;
    		}));

    		$$invalidate(0, filteredCars = filteredCars.filter(car => {
    			if (fuel === "all") return car;
    			if (car.fuel === fuel) return car;
    		}));

    		$$invalidate(0, filteredCars = filteredCars.filter(car => {
    			if (color === "all") return car;
    			if (car.color === color) return car;
    		}));
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Cars> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Car,
    		storeCars,
    		filteredCars,
    		dropdown,
    		getOptions,
    		showMenu,
    		submitFilter,
    		$storeCars
    	});

    	$$self.$inject_state = $$props => {
    		if ('filteredCars' in $$props) $$invalidate(0, filteredCars = $$props.filteredCars);
    		if ('dropdown' in $$props) $$invalidate(1, dropdown = $$props.dropdown);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [filteredCars, dropdown, $storeCars, getOptions, showMenu, submitFilter];
    }

    class Cars extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cars",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    let storeUsers = writable([]);

    async function load() {
        const res = await fetch("./backend/getUsers.php", {
            method: "GET"
        });
        const data = await res.json();
        storeUsers.set(data);
    }

    load();

    async function checkRank(username) {
        let formData = new FormData();
        formData.append("username", username);
        const res = await fetch("./backend/checkRank.php", {
            method: "POST",
            body: formData,
        });
        const data = await res.text();
        return data;
    }

    /* src\routes\Users.svelte generated by Svelte v3.43.2 */
    const file$6 = "src\\routes\\Users.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>      import { storeUsers }
    function create_catch_block$2(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(1:0) <script>      import { storeUsers }",
    		ctx
    	});

    	return block;
    }

    // (73:4) {:then}
    function create_then_block$2(ctx) {
    	let table;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let each_value = /*$storeUsers*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			th0 = element("th");
    			th0.textContent = "Username";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Rank";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "class", "py-4");
    			add_location(th0, file$6, 74, 12, 2406);
    			attr_dev(th1, "class", "py-4");
    			add_location(th1, file$6, 75, 12, 2450);
    			attr_dev(table, "class", "text-nord6 w-3/4");
    			add_location(table, file$6, 73, 8, 2360);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, th0);
    			append_dev(table, t1);
    			append_dev(table, th1);
    			append_dev(table, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$storeUsers, changeData, currentUser*/ 7) {
    				each_value = /*$storeUsers*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(73:4) {:then}",
    		ctx
    	});

    	return block;
    }

    // (90:20) {:else}
    function create_else_block$3(ctx) {
    	let td;
    	let p;

    	function select_block_type_1(ctx, dirty) {
    		if (/*currentUser*/ ctx[0] === "administrator") return create_if_block_1$2;
    		return create_else_block_1$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			td = element("td");
    			p = element("p");
    			if_block.c();
    			attr_dev(p, "class", "flex justify-center items-center");
    			add_location(p, file$6, 91, 28, 3208);
    			attr_dev(td, "class", "border-b-2 border-nord0 py-4");
    			add_location(td, file$6, 90, 24, 3137);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, p);
    			if_block.m(p, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(p, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(90:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (84:20) {#if user.rank === "administrator"}
    function create_if_block$3(ctx) {
    	let td;
    	let p;
    	let t_value = /*user*/ ctx[5].rank + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "flex justify-center items-center");
    			add_location(p, file$6, 85, 28, 2928);
    			attr_dev(td, "class", "border-b-2 border-nord0 py-4");
    			add_location(td, file$6, 84, 24, 2857);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$storeUsers*/ 2 && t_value !== (t_value = /*user*/ ctx[5].rank + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(84:20) {#if user.rank === \\\"administrator\\\"}",
    		ctx
    	});

    	return block;
    }

    // (123:32) {:else}
    function create_else_block_1$2(ctx) {
    	let t_value = /*user*/ ctx[5].rank + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$storeUsers*/ 2 && t_value !== (t_value = /*user*/ ctx[5].rank + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$2.name,
    		type: "else",
    		source: "(123:32) {:else}",
    		ctx
    	});

    	return block;
    }

    // (93:32) {#if currentUser === "administrator"}
    function create_if_block_1$2(ctx) {
    	let select;
    	let if_block0_anchor;
    	let mounted;
    	let dispose;
    	let if_block0 = /*user*/ ctx[5].rank === "moderator" && create_if_block_3(ctx);
    	let if_block1 = /*user*/ ctx[5].rank === "client" && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			select = element("select");
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			if (if_block1) if_block1.c();
    			attr_dev(select, "class", "w-1/3 h-10 pl-3 pr-6 text-justify text-nord6 outline-none border-none rounded-lg bg-nord0 focus:shadow-outline");
    			attr_dev(select, "id", "grid-state");
    			add_location(select, file$6, 93, 36, 3361);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			if (if_block0) if_block0.m(select, null);
    			append_dev(select, if_block0_anchor);
    			if (if_block1) if_block1.m(select, null);

    			if (!mounted) {
    				dispose = listen_dev(
    					select,
    					"change",
    					function () {
    						if (is_function(/*changeData*/ ctx[2](/*user*/ ctx[5].username, this))) /*changeData*/ ctx[2](/*user*/ ctx[5].username, this).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*user*/ ctx[5].rank === "moderator") {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(select, if_block0_anchor);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*user*/ ctx[5].rank === "client") {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					if_block1.m(select, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(93:32) {#if currentUser === \\\"administrator\\\"}",
    		ctx
    	});

    	return block;
    }

    // (102:40) {#if user.rank === "moderator"}
    function create_if_block_3(ctx) {
    	let option0;
    	let option1;

    	const block = {
    		c: function create() {
    			option0 = element("option");
    			option0.textContent = "moderator";
    			option1 = element("option");
    			option1.textContent = "client";
    			option0.__value = "moderator";
    			option0.value = option0.__value;
    			attr_dev(option0, "class", "flex items-center justify-center");
    			option0.selected = true;
    			add_location(option0, file$6, 102, 44, 3961);
    			option1.__value = "client";
    			option1.value = option1.__value;
    			attr_dev(option1, "class", "flex items-center justify-center");
    			add_location(option1, file$6, 107, 44, 4294);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option0, anchor);
    			insert_dev(target, option1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option0);
    			if (detaching) detach_dev(option1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(102:40) {#if user.rank === \\\"moderator\\\"}",
    		ctx
    	});

    	return block;
    }

    // (114:40) {#if user.rank === "client"}
    function create_if_block_2$1(ctx) {
    	let option0;
    	let option1;

    	const block = {
    		c: function create() {
    			option0 = element("option");
    			option0.textContent = "moderator";
    			option1 = element("option");
    			option1.textContent = "client";
    			option0.__value = "moderator";
    			option0.value = option0.__value;
    			add_location(option0, file$6, 114, 44, 4730);
    			option1.__value = "client";
    			option1.value = option1.__value;
    			option1.selected = true;
    			add_location(option1, file$6, 117, 44, 4916);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option0, anchor);
    			insert_dev(target, option1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option0);
    			if (detaching) detach_dev(option1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(114:40) {#if user.rank === \\\"client\\\"}",
    		ctx
    	});

    	return block;
    }

    // (77:12) {#each $storeUsers as user}
    function create_each_block$3(ctx) {
    	let tr;
    	let td;
    	let p;
    	let t0_value = /*user*/ ctx[5].username + "";
    	let t0;
    	let t1;
    	let t2;

    	function select_block_type(ctx, dirty) {
    		if (/*user*/ ctx[5].rank === "administrator") return create_if_block$3;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			attr_dev(p, "class", "flex justify-center items-center");
    			add_location(p, file$6, 79, 24, 2628);
    			attr_dev(td, "class", "border-b-2 border-nord0 py-4");
    			add_location(td, file$6, 78, 20, 2561);
    			add_location(tr, file$6, 77, 16, 2535);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, p);
    			append_dev(p, t0);
    			append_dev(tr, t1);
    			if_block.m(tr, null);
    			append_dev(tr, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$storeUsers*/ 2 && t0_value !== (t0_value = /*user*/ ctx[5].username + "")) set_data_dev(t0, t0_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(tr, t2);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(77:12) {#each $storeUsers as user}",
    		ctx
    	});

    	return block;
    }

    // (71:24)           <h1 class="text-nord11">Waiting for data</h1>      {:then}
    function create_pending_block$2(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Waiting for data";
    			attr_dev(h1, "class", "text-nord11");
    			add_location(h1, file$6, 71, 8, 2292);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(71:24)           <h1 class=\\\"text-nord11\\\">Waiting for data</h1>      {:then}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2
    	};

    	handle_promise(promise = /*$storeUsers*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			main = element("main");
    			info.block.c();
    			attr_dev(main, "class", "mt-10 flex justify-center items-center");
    			add_location(main, file$6, 69, 0, 2203);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$storeUsers*/ 2 && promise !== (promise = /*$storeUsers*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $storeUsers;
    	validate_store(storeUsers, 'storeUsers');
    	component_subscribe($$self, storeUsers, $$value => $$invalidate(1, $storeUsers = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Users', slots, []);
    	let logged;
    	let currentUser;

    	const checkIfClient = async () => {
    		logged = await getSession("getUser");
    		if (await checkRank(logged) === "client") window.location.href = "./";
    		$$invalidate(0, currentUser = await checkRank(logged));
    	};

    	checkIfClient();

    	const changeData = async (username, e) => {
    		let formData = new FormData();
    		formData.append("username", username);
    		formData.append("rank", e.value);

    		try {
    			const res = await fetch("./backend/changeRank.php", { method: "POST", body: formData });
    			const data = await res.text();

    			if (data === "added") {
    				const Toast = sweetalert2_all.mixin({
    					toast: true,
    					position: "top-end",
    					showConfirmButton: false,
    					timer: 3000,
    					timerProgressBar: true
    				});

    				Toast.fire({
    					icon: "success",
    					title: "Rank changed successfully"
    				});
    			} else {
    				const Toast = sweetalert2_all.mixin({
    					toast: true,
    					position: "top-end",
    					showConfirmButton: false,
    					timer: 3000,
    					timerProgressBar: true
    				});

    				Toast.fire({
    					icon: "error",
    					title: "Something went wrong!"
    				});
    			}
    		} catch {
    			const Toast = sweetalert2_all.mixin({
    				toast: true,
    				position: "top-end",
    				showConfirmButton: false,
    				timer: 3000,
    				timerProgressBar: true
    			});

    			Toast.fire({
    				icon: "error",
    				title: "Something went wrong!"
    			});
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Users> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		storeUsers,
    		getSession,
    		checkRank,
    		Swal: sweetalert2_all,
    		logged,
    		currentUser,
    		checkIfClient,
    		changeData,
    		$storeUsers
    	});

    	$$self.$inject_state = $$props => {
    		if ('logged' in $$props) logged = $$props.logged;
    		if ('currentUser' in $$props) $$invalidate(0, currentUser = $$props.currentUser);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentUser, $storeUsers, changeData];
    }

    class Users extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Users",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    async function handleApplication(userId, carId, action) {
        let formData = new FormData();
        formData.append("userId", userId);
        formData.append("carId", carId);
        if (action === "update") {
            const res = await fetch("./backend/handleApplication.php", {
                method: "POST",
                body: formData,
            });
            const data = await res.text();
            return data
        }
        else if (action === "remove") {
            const res = await fetch("./backend/removeReservation.php", {
                method: "POST",
                body: formData,
            });
            const data = await res.text();
            return data
        }
        else if (action === "delete") {
            const res = await fetch("./backend/destroyReservation.php", {
                method: "POST",
                body: formData,
            });
            const data = await res.text();
            return data
        }
    }

    /* src\routes\Reservations.svelte generated by Svelte v3.43.2 */
    const file$5 = "src\\routes\\Reservations.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>      import getReservations from "../services/getReservations";      import handleApplication from "../services/handleApplication";      import getSession from "../services/getSession";        window.scroll({          top: 0,          left: 0,          behavior: "smooth",      }
    function create_catch_block$1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <script>      import getReservations from \\\"../services/getReservations\\\";      import handleApplication from \\\"../services/handleApplication\\\";      import getSession from \\\"../services/getSession\\\";        window.scroll({          top: 0,          left: 0,          behavior: \\\"smooth\\\",      }",
    		ctx
    	});

    	return block;
    }

    // (31:4) {:then items}
    function create_then_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*items*/ ctx[3].length === 0) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(31:4) {:then items}",
    		ctx
    	});

    	return block;
    }

    // (41:8) {:else}
    function create_else_block$2(ctx) {
    	let table;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let each_value = /*items*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			th0 = element("th");
    			th0.textContent = "Car 🏎️";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Rent Time 📅";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Status ⌛";
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "class", "py-4");
    			add_location(th0, file$5, 42, 16, 1420);
    			attr_dev(th1, "class", "py-4");
    			add_location(th1, file$5, 43, 16, 1467);
    			attr_dev(th2, "class", "py-4");
    			add_location(th2, file$5, 44, 16, 1520);
    			attr_dev(table, "class", "w-3/4");
    			add_location(table, file$5, 41, 12, 1381);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, th0);
    			append_dev(table, t1);
    			append_dev(table, th1);
    			append_dev(table, t3);
    			append_dev(table, th2);
    			append_dev(table, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*undoReservation, handleData*/ 3) {
    				each_value = /*items*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(41:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:8) {#if items.length === 0}
    function create_if_block$2(ctx) {
    	let div;
    	let h10;
    	let t1;
    	let h11;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h10 = element("h1");
    			h10.textContent = "No vehicles booked!";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "Try renting now 👻";
    			attr_dev(h10, "class", "text-nord6 text-4xl bold mt-10");
    			add_location(h10, file$5, 33, 16, 1099);
    			attr_dev(h11, "class", "text-nord6 text-2xl bold mt-10");
    			add_location(h11, file$5, 36, 16, 1224);
    			attr_dev(div, "class", "flex flex-col justify-center items-center");
    			add_location(div, file$5, 32, 12, 1026);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h10);
    			append_dev(div, t1);
    			append_dev(div, h11);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(32:8) {#if items.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (65:28) {:else}
    function create_else_block_1$1(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t2;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "active";
    			t1 = space();
    			p1 = element("p");
    			t2 = text("get QR Code");
    			attr_dev(p0, "class", "flex justify-center items-center text-nord14");
    			add_location(p0, file$5, 65, 32, 2616);
    			attr_dev(p1, "class", "flex justify-center items-center text-nord5 cursor-pointer hover:underline");
    			attr_dev(p1, "onclick", "window.open('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + /*reservation*/ ctx[4].userName + /*reservation*/ ctx[4].carName + /*reservation*/ ctx[4].id + "','targetWindow', 'toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=550px, height=550px, top=25px left=120px'); return false;");
    			add_location(p1, file$5, 70, 32, 2859);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(65:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (59:28) {#if reservation.status === "0"}
    function create_if_block_1$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "pending";
    			attr_dev(p, "class", "flex justify-center items-center text-nord13");
    			add_location(p, file$5, 59, 32, 2335);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(59:28) {#if reservation.status === \\\"0\\\"}",
    		ctx
    	});

    	return block;
    }

    // (46:16) {#each items as reservation}
    function create_each_block$2(ctx) {
    	let tr;
    	let td0;
    	let p0;
    	let t0_value = /*reservation*/ ctx[4].carName + "";
    	let t0;
    	let t1;
    	let td1;
    	let p1;
    	let t2_value = /*reservation*/ ctx[4].rent_start + "";
    	let t2;
    	let t3;
    	let t4_value = /*reservation*/ ctx[4].rent_end + "";
    	let t4;
    	let t5;
    	let td2;
    	let t6;
    	let td3;
    	let p2;
    	let button;
    	let t8;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*reservation*/ ctx[4].status === "0") return create_if_block_1$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*reservation*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = text(" / ");
    			t4 = text(t4_value);
    			t5 = space();
    			td2 = element("td");
    			if_block.c();
    			t6 = space();
    			td3 = element("td");
    			p2 = element("p");
    			button = element("button");
    			button.textContent = "Cancel";
    			t8 = space();
    			attr_dev(p0, "class", "flex justify-center items-center");
    			add_location(p0, file$5, 48, 28, 1719);
    			attr_dev(td0, "class", "border-b-2 border-nord0 py-4");
    			add_location(td0, file$5, 47, 24, 1648);
    			attr_dev(p1, "class", "flex justify-center items-center");
    			add_location(p1, file$5, 53, 28, 1980);
    			attr_dev(td1, "class", "border-b-2 border-nord0 py-4");
    			add_location(td1, file$5, 52, 24, 1909);
    			attr_dev(td2, "class", "border-b-2 border-nord0 py-4");
    			add_location(td2, file$5, 57, 24, 2198);
    			attr_dev(button, "class", "text-white bg-nord11 border-0 flex justify-center py-1 w-2/3 px-2 focus:outline-none rounded sm:text-md text-sm");
    			add_location(button, file$5, 80, 32, 3687);
    			attr_dev(p2, "class", "flex justify-center items-center");
    			add_location(p2, file$5, 79, 28, 3609);
    			attr_dev(td3, "class", "border-b-2 border-nord0 py-4");
    			add_location(td3, file$5, 78, 24, 3538);
    			add_location(tr, file$5, 46, 20, 1618);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, p0);
    			append_dev(p0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, p1);
    			append_dev(p1, t2);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			if_block.m(td2, null);
    			append_dev(tr, t6);
    			append_dev(tr, td3);
    			append_dev(td3, p2);
    			append_dev(p2, button);
    			append_dev(tr, t8);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(46:16) {#each items as reservation}",
    		ctx
    	});

    	return block;
    }

    // (29:25)           <h1>Waiting...</h1>      {:then items}
    function create_pending_block$1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Waiting...";
    			add_location(h1, file$5, 29, 8, 940);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(29:25)           <h1>Waiting...</h1>      {:then items}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 3
    	};

    	handle_promise(/*handleData*/ ctx[0](), info);

    	const block = {
    		c: function create() {
    			main = element("main");
    			info.block.c();
    			attr_dev(main, "class", "mt-10 text-nord6 flex justify-center select-none");
    			add_location(main, file$5, 27, 0, 840);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Reservations', slots, []);
    	window.scroll({ top: 0, left: 0, behavior: "smooth" });

    	const handleData = async () => {
    		const user = await getSession("getUser");
    		const res = await getReservations();

    		const data = await res.filter(reservation => {
    			if (reservation.userName === user) return reservation;
    		});

    		return data;
    	};

    	const undoReservation = async (userId, carId) => {
    		const res = await handleApplication(userId, carId, "delete");
    		const data = await res;
    		if (data === "deleted") window.location.reload();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Reservations> was created with unknown prop '${key}'`);
    	});

    	const click_handler = reservation => undoReservation(reservation.userId, reservation.carId);

    	$$self.$capture_state = () => ({
    		getReservations,
    		handleApplication,
    		getSession,
    		handleData,
    		undoReservation
    	});

    	return [handleData, undoReservation, click_handler];
    }

    class Reservations extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Reservations",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    async function doesExist(id, newTime) {
        let formData = new FormData();
        formData.append("id", id);
        formData.append("newTime", newTime);
        const res = await fetch("./backend/changeTime.php", {
            method: "POST",
            body: formData,
        });
        const data = await res.text();
        return data;
    }

    /* src\routes\Applications.svelte generated by Svelte v3.43.2 */
    const file$4 = "src\\routes\\Applications.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>      import getReservations from "../services/getReservations";      import handleApplication from "../services/handleApplication";      import changeTime from "../services/changeTime";      import Swal from "sweetalert2";        window.scroll({          top: 0,          left: 0,          behavior: "smooth",      }
    function create_catch_block(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>      import getReservations from \\\"../services/getReservations\\\";      import handleApplication from \\\"../services/handleApplication\\\";      import changeTime from \\\"../services/changeTime\\\";      import Swal from \\\"sweetalert2\\\";        window.scroll({          top: 0,          left: 0,          behavior: \\\"smooth\\\",      }",
    		ctx
    	});

    	return block;
    }

    // (96:4) {:then items}
    function create_then_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*items*/ ctx[11].length === 0) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(96:4) {:then items}",
    		ctx
    	});

    	return block;
    }

    // (106:8) {:else}
    function create_else_block$1(ctx) {
    	let table;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let p0;
    	let t7;
    	let p1;
    	let t9;
    	let each_value = /*items*/ ctx[11];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			th0 = element("th");
    			th0.textContent = "Username 😎";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Car 🏎️";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Rent Time 📅";
    			t5 = space();
    			th3 = element("th");
    			p0 = element("p");
    			p0.textContent = "Modify Time";
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "(± days) ✂️";
    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "class", "py-4");
    			add_location(th0, file$4, 107, 16, 3559);
    			attr_dev(th1, "class", "py-4");
    			add_location(th1, file$4, 108, 16, 3610);
    			attr_dev(th2, "class", "py-4");
    			add_location(th2, file$4, 109, 16, 3657);
    			add_location(p0, file$4, 111, 20, 3775);
    			add_location(p1, file$4, 112, 20, 3815);
    			attr_dev(th3, "class", "py-4 flex flex-col items-center");
    			add_location(th3, file$4, 110, 16, 3709);
    			attr_dev(table, "class", "w-3/4");
    			add_location(table, file$4, 106, 12, 3520);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, th0);
    			append_dev(table, t1);
    			append_dev(table, th1);
    			append_dev(table, t3);
    			append_dev(table, th2);
    			append_dev(table, t5);
    			append_dev(table, th3);
    			append_dev(th3, p0);
    			append_dev(th3, t7);
    			append_dev(th3, p1);
    			append_dev(table, t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*refuseReservation, reservationData, changeApplicationStatus, undoReservation, shortenRent*/ 31) {
    				each_value = /*items*/ ctx[11];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(106:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (97:8) {#if items.length === 0}
    function create_if_block$1(ctx) {
    	let div;
    	let h10;
    	let t1;
    	let h11;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h10 = element("h1");
    			h10.textContent = "No vehicle requests!";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "Just wait for clients 🦍";
    			attr_dev(h10, "class", "text-nord6 text-4xl bold mt-10");
    			add_location(h10, file$4, 98, 16, 3231);
    			attr_dev(h11, "class", "text-nord6 text-2xl bold mt-10");
    			add_location(h11, file$4, 101, 16, 3357);
    			attr_dev(div, "class", "flex flex-col justify-center items-center");
    			add_location(div, file$4, 97, 12, 3158);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h10);
    			append_dev(div, t1);
    			append_dev(div, h11);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(97:8) {#if items.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (159:32) {:else}
    function create_else_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "pending";
    			attr_dev(p, "class", "italic");
    			add_location(p, file$4, 159, 36, 6573);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(159:32) {:else}",
    		ctx
    	});

    	return block;
    }

    // (134:32) {#if reservation.status === "1"}
    function create_if_block_2(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*reservation*/ ctx[12]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[6](/*reservation*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "+";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "-";
    			attr_dev(button0, "class", "text-white mx-1 bg-green-500 flex justify-center border-0 px-2 focus:outline-none hover:bg-green-600 rounded sm:text-md text-sm");
    			add_location(button0, file$4, 134, 36, 4987);
    			attr_dev(button1, "class", "text-white mx-1 bg-red-500 flex justify-center border-0 px-2 focus:outline-none hover:bg-red-600 rounded sm:text-md text-sm");
    			add_location(button1, file$4, 146, 36, 5761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(134:32) {#if reservation.status === \\\"1\\\"}",
    		ctx
    	});

    	return block;
    }

    // (177:32) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[8](/*reservation*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Undo";
    			attr_dev(button, "class", "text-white bg-nord11 flex justify-center border-0 py-1 w-2/3 px-2 focus:outline-none rounded sm:text-md text-sm");
    			add_location(button, file$4, 177, 36, 7667);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(177:32) {:else}",
    		ctx
    	});

    	return block;
    }

    // (166:32) {#if reservation.status === "0"}
    function create_if_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[7](/*reservation*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Accept";
    			attr_dev(button, "class", "text-white bg-green-500 flex justify-center border-0 py-1 w-2/3 px-2 focus:outline-none hover:bg-green-600 rounded sm:text-md text-sm");
    			add_location(button, file$4, 166, 36, 6953);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(166:32) {#if reservation.status === \\\"0\\\"}",
    		ctx
    	});

    	return block;
    }

    // (115:16) {#each items as reservation}
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let p0;
    	let t0_value = /*reservation*/ ctx[12].userName + "";
    	let t0;
    	let t1;
    	let td1;
    	let p1;
    	let t2_value = /*reservation*/ ctx[12].carName + "";
    	let t2;
    	let t3;
    	let td2;
    	let p2;
    	let t4_value = /*reservation*/ ctx[12].rent_start + "";
    	let t4;
    	let t5;
    	let t6_value = /*reservation*/ ctx[12].rent_end + "";
    	let t6;
    	let t7;
    	let td3;
    	let div;
    	let t8;
    	let td4;
    	let p3;
    	let t9;
    	let td5;
    	let p4;
    	let button;
    	let t11;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*reservation*/ ctx[12].status === "1") return create_if_block_2;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*reservation*/ ctx[12].status === "0") return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type_1 = select_block_type_2(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[9](/*reservation*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			p2 = element("p");
    			t4 = text(t4_value);
    			t5 = text(" / ");
    			t6 = text(t6_value);
    			t7 = space();
    			td3 = element("td");
    			div = element("div");
    			if_block0.c();
    			t8 = space();
    			td4 = element("td");
    			p3 = element("p");
    			if_block1.c();
    			t9 = space();
    			td5 = element("td");
    			p4 = element("p");
    			button = element("button");
    			button.textContent = "Cancel";
    			t11 = space();
    			attr_dev(p0, "class", "flex justify-center items-center");
    			add_location(p0, file$4, 117, 28, 4025);
    			attr_dev(td0, "class", "border-b-2 border-nord0 py-4");
    			add_location(td0, file$4, 116, 24, 3954);
    			attr_dev(p1, "class", "flex justify-center items-center");
    			add_location(p1, file$4, 122, 28, 4287);
    			attr_dev(td1, "class", "border-b-2 border-nord0 py-4");
    			add_location(td1, file$4, 121, 24, 4216);
    			attr_dev(p2, "class", "flex justify-center items-center");
    			add_location(p2, file$4, 127, 28, 4548);
    			attr_dev(td2, "class", "border-b-2 border-nord0 py-4");
    			add_location(td2, file$4, 126, 24, 4477);
    			attr_dev(div, "class", "flex justify-center items-center");
    			add_location(div, file$4, 132, 28, 4837);
    			attr_dev(td3, "class", "border-b-2 border-nord0 py-4");
    			add_location(td3, file$4, 131, 24, 4766);
    			attr_dev(p3, "class", "flex justify-center items-center");
    			add_location(p3, file$4, 164, 28, 6805);
    			attr_dev(td4, "class", "border-b-2 border-nord0 py-4");
    			add_location(td4, file$4, 163, 24, 6734);
    			attr_dev(button, "class", "text-white bg-nord11 border-0 flex justify-center py-1 w-2/3 px-2 focus:outline-none rounded sm:text-md text-sm");
    			add_location(button, file$4, 192, 32, 8549);
    			attr_dev(p4, "class", "flex justify-center items-center");
    			add_location(p4, file$4, 191, 28, 8471);
    			attr_dev(td5, "class", "border-b-2 border-nord0 py-4");
    			add_location(td5, file$4, 190, 24, 8400);
    			add_location(tr, file$4, 115, 20, 3924);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, p0);
    			append_dev(p0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, p1);
    			append_dev(p1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, p2);
    			append_dev(p2, t4);
    			append_dev(p2, t5);
    			append_dev(p2, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			append_dev(td3, div);
    			if_block0.m(div, null);
    			append_dev(tr, t8);
    			append_dev(tr, td4);
    			append_dev(td4, p3);
    			if_block1.m(p3, null);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, p4);
    			append_dev(p4, button);
    			append_dev(tr, t11);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_4, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*reservationData*/ 1 && t0_value !== (t0_value = /*reservation*/ ctx[12].userName + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*reservationData*/ 1 && t2_value !== (t2_value = /*reservation*/ ctx[12].carName + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*reservationData*/ 1 && t4_value !== (t4_value = /*reservation*/ ctx[12].rent_start + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*reservationData*/ 1 && t6_value !== (t6_value = /*reservation*/ ctx[12].rent_end + "")) set_data_dev(t6, t6_value);

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_2(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(p3, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if_block0.d();
    			if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(115:16) {#each items as reservation}",
    		ctx
    	});

    	return block;
    }

    // (94:28)           <h1>Waiting...</h1>      {:then items}
    function create_pending_block(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Waiting...";
    			add_location(h1, file$4, 94, 8, 3072);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(94:28)           <h1>Waiting...</h1>      {:then items}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 11
    	};

    	handle_promise(promise = /*reservationData*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			main = element("main");
    			info.block.c();
    			attr_dev(main, "class", "mt-10 text-nord6 flex justify-center select-none");
    			add_location(main, file$4, 92, 0, 2969);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*reservationData*/ 1 && promise !== (promise = /*reservationData*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Applications', slots, []);
    	window.scroll({ top: 0, left: 0, behavior: "smooth" });
    	let reservationData;

    	const handleData = async () => {
    		const res = await getReservations();
    		const data = await res.sort((a, b) => a.carName.localeCompare(b.carName));
    		return data;
    	};

    	reservationData = handleData();

    	const changeApplicationStatus = async (userId, carId) => {
    		const res = await handleApplication(userId, carId, "update");
    		const data = await res;
    		if (data === "added") window.location.reload();
    	};

    	const undoReservation = async (userId, carId) => {
    		const res = await handleApplication(userId, carId, "remove");
    		const data = await res;
    		if (data === "removed") window.location.reload();
    	};

    	const refuseReservation = async (userId, carId) => {
    		const res = await handleApplication(userId, carId, "delete");
    		const data = await res;
    		if (data === "deleted") window.location.reload();
    	};

    	const shortenRent = async (time, startDate, endDate, resId) => {
    		let start = new Date(startDate);
    		let modifiedDate = new Date(endDate);
    		modifiedDate.setDate(modifiedDate.getDate() + time);

    		if (modifiedDate < start) {
    			const Toast = sweetalert2_all.mixin({
    				toast: true,
    				position: "top-end",
    				showConfirmButton: false,
    				timer: 1500,
    				timerProgressBar: true
    			});

    			Toast.fire({
    				icon: "error",
    				title: "The number of days cannot be reduced!"
    			});

    			return;
    		}

    		const res = await doesExist(resId, modifiedDate.toISOString().split("T")[0]);

    		if (res === "changed") {
    			$$invalidate(0, reservationData = handleData());

    			const Toast = sweetalert2_all.mixin({
    				toast: true,
    				position: "top-end",
    				showConfirmButton: false,
    				timer: 1500,
    				timerProgressBar: true
    			});

    			Toast.fire({
    				icon: "success",
    				title: "Time changed successfully"
    			});
    		} else {
    			const Toast = sweetalert2_all.mixin({
    				toast: true,
    				position: "top-end",
    				showConfirmButton: false,
    				timer: 1500,
    				timerProgressBar: true
    			});

    			Toast.fire({
    				icon: "error",
    				title: "Something went wrong!"
    			});
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Applications> was created with unknown prop '${key}'`);
    	});

    	const click_handler = reservation => shortenRent(1, reservation.rent_start, reservation.rent_end, reservation.id);
    	const click_handler_1 = reservation => shortenRent(-1, reservation.rent_start, reservation.rent_end, reservation.id);
    	const click_handler_2 = reservation => changeApplicationStatus(reservation.userId, reservation.carId);
    	const click_handler_3 = reservation => undoReservation(reservation.userId, reservation.carId);
    	const click_handler_4 = reservation => refuseReservation(reservation.userId, reservation.carId);

    	$$self.$capture_state = () => ({
    		getReservations,
    		handleApplication,
    		changeTime: doesExist,
    		Swal: sweetalert2_all,
    		reservationData,
    		handleData,
    		changeApplicationStatus,
    		undoReservation,
    		refuseReservation,
    		shortenRent
    	});

    	$$self.$inject_state = $$props => {
    		if ('reservationData' in $$props) $$invalidate(0, reservationData = $$props.reservationData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		reservationData,
    		changeApplicationStatus,
    		undoReservation,
    		refuseReservation,
    		shortenRent,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class Applications extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Applications",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\routes\Terms.svelte generated by Svelte v3.43.2 */

    const file$3 = "src\\routes\\Terms.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			main = element("main");
    			iframe = element("iframe");
    			if (!src_url_equal(iframe.src, iframe_src_value = "./lorem-ipsum.pdf")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			add_location(iframe, file$3, 4, 4, 63);
    			attr_dev(main, "class", "w-full h-full mt-10");
    			add_location(main, file$3, 3, 0, 23);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, iframe);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Terms', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Terms> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Terms extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Terms",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\Header.svelte generated by Svelte v3.43.2 */
    const file$2 = "src\\components\\Header.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (55:16) {#each headerLinks as link}
    function create_each_block(ctx) {
    	let a;
    	let t_value = /*link*/ ctx[4] + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "mr-5 hover:text-gray-900 svelte-vebgse");
    			attr_dev(a, "href", a_href_value = ".#/" + /*link*/ ctx[4]);
    			add_location(a, file$2, 55, 20, 2945);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*headerLinks*/ 1 && t_value !== (t_value = /*link*/ ctx[4] + "")) set_data_dev(t, t_value);

    			if (dirty & /*headerLinks*/ 1 && a_href_value !== (a_href_value = ".#/" + /*link*/ ctx[4])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(55:16) {#each headerLinks as link}",
    		ctx
    	});

    	return block;
    }

    // (78:12) {:else}
    function create_else_block(ctx) {
    	let button;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			p = element("p");
    			p.textContent = "Logout";
    			attr_dev(p, "class", "svelte-vebgse");
    			add_location(p, file$2, 82, 20, 4126);
    			attr_dev(button, "class", "inline-flex items-center bg-nord11 border-0 py-1 px-3 focus:outline-none rounded text-base mt-4 md:mt-0");
    			add_location(button, file$2, 78, 16, 3902);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, p);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*logoutUser*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(78:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:12) {#if logged === ""}
    function create_if_block(ctx) {
    	let button;
    	let a;
    	let t1;
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			button = element("button");
    			a = element("a");
    			a.textContent = "Login";
    			t1 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(a, "href", "#/login");
    			attr_dev(a, "class", "svelte-vebgse");
    			add_location(a, file$2, 64, 20, 3357);
    			attr_dev(path, "d", "M5 12h14M12 5l7 7-7 7");
    			add_location(path, file$2, 74, 24, 3774);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "class", "w-4 h-4 ml-1");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$2, 65, 20, 3407);
    			attr_dev(button, "class", "inline-flex items-center bg-indigo-500 border-0 py-1 px-3 focus:outline-none hover:bg-indigo-400 rounded text-base mt-4 md:mt-0");
    			add_location(button, file$2, 61, 16, 3152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, a);
    			append_dev(button, t1);
    			append_dev(button, svg);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(61:12) {#if logged === \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let header;
    	let div;
    	let a;
    	let svg;
    	let path;
    	let t0;
    	let span;
    	let t2;
    	let nav;
    	let t3;
    	let each_value = /*headerLinks*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*logged*/ ctx[1] === "") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			header = element("header");
    			div = element("div");
    			a = element("a");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			span = element("span");
    			span.textContent = "McQueen Cars";
    			t2 = space();
    			nav = element("nav");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			if_block.c();
    			attr_dev(path, "d", "M23.5 7c.276 0 .5.224.5.5v.511c0 .793-.926.989-1.616.989l-1.086-2h2.202zm-1.441 3.506c.639 1.186.946 2.252.946 3.666 0 1.37-.397 2.533-1.005 3.981v1.847c0 .552-.448 1-1 1h-1.5c-.552 0-1-.448-1-1v-1h-13v1c0 .552-.448 1-1 1h-1.5c-.552 0-1-.448-1-1v-1.847c-.608-1.448-1.005-2.611-1.005-3.981 0-1.414.307-2.48.946-3.666.829-1.537 1.851-3.453 2.93-5.252.828-1.382 1.262-1.707 2.278-1.889 1.532-.275 2.918-.365 4.851-.365s3.319.09 4.851.365c1.016.182 1.45.507 2.278 1.889 1.079 1.799 2.101 3.715 2.93 5.252zm-16.059 2.994c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5 1.5-.672 1.5-1.5zm10 1c0-.276-.224-.5-.5-.5h-7c-.276 0-.5.224-.5.5s.224.5.5.5h7c.276 0 .5-.224.5-.5zm2.941-5.527s-.74-1.826-1.631-3.142c-.202-.298-.515-.502-.869-.566-1.511-.272-2.835-.359-4.441-.359s-2.93.087-4.441.359c-.354.063-.667.267-.869.566-.891 1.315-1.631 3.142-1.631 3.142 1.64.313 4.309.497 6.941.497s5.301-.184 6.941-.497zm2.059 4.527c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5 1.5-.672 1.5-1.5zm-18.298-6.5h-2.202c-.276 0-.5.224-.5.5v.511c0 .793.926.989 1.616.989l1.086-2z");
    			add_location(path, file$2, 45, 20, 1519);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "class", "w-10 h-10 text-white p-2 bg-indigo-500 rounded-full");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$2, 39, 16, 1255);
    			attr_dev(span, "class", "ml-3 text-xl");
    			add_location(span, file$2, 49, 16, 2692);
    			attr_dev(a, "class", "flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0 svelte-vebgse");
    			attr_dev(a, "href", "./");
    			add_location(a, file$2, 35, 12, 1100);
    			attr_dev(nav, "class", "md:ml-auto flex flex-wrap items-center text-base justify-center");
    			add_location(nav, file$2, 51, 12, 2770);
    			attr_dev(div, "class", "container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center");
    			add_location(div, file$2, 32, 8, 979);
    			attr_dev(header, "class", "text-gray-600 bg-nord1 body-font");
    			add_location(header, file$2, 31, 4, 920);
    			attr_dev(main, "class", "svelte-vebgse");
    			add_location(main, file$2, 30, 0, 908);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, header);
    			append_dev(header, div);
    			append_dev(div, a);
    			append_dev(a, svg);
    			append_dev(svg, path);
    			append_dev(a, t0);
    			append_dev(a, span);
    			append_dev(div, t2);
    			append_dev(div, nav);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(nav, null);
    			}

    			append_dev(div, t3);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*headerLinks*/ 1) {
    				each_value = /*headerLinks*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(nav, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);

    	const logoutUser = async () => {
    		await getSession("logoutUser");
    		window.location.href = "./";
    	};

    	let headerLinks = [];
    	let logged;

    	const setHeader = async () => {
    		$$invalidate(1, logged = await getSession("getUser"));
    		if (logged === "") $$invalidate(0, headerLinks = ["Cars"]);

    		switch (await checkRank(logged)) {
    			case "administrator":
    				$$invalidate(0, headerLinks = ["Users", "Cars", "Reservations", "Applications"]);
    				break;
    			case "moderator":
    				$$invalidate(0, headerLinks = ["Users", "Cars", "Reservations", "Applications"]);
    				break;
    			case "client":
    				$$invalidate(0, headerLinks = ["Cars", "Reservations"]);
    				break;
    		}
    	};

    	setHeader();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		checkRank,
    		getSession,
    		logoutUser,
    		headerLinks,
    		logged,
    		setHeader
    	});

    	$$self.$inject_state = $$props => {
    		if ('headerLinks' in $$props) $$invalidate(0, headerLinks = $$props.headerLinks);
    		if ('logged' in $$props) $$invalidate(1, logged = $$props.logged);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [headerLinks, logged, logoutUser];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Footer.svelte generated by Svelte v3.43.2 */

    const file$1 = "src\\components\\Footer.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div1;
    	let div0;
    	let p;
    	let t0;
    	let a0;
    	let t2;
    	let span;
    	let a1;
    	let svg0;
    	let path0;
    	let t3;
    	let a2;
    	let svg1;
    	let path1;
    	let t4;
    	let a3;
    	let svg2;
    	let rect;
    	let path2;
    	let t5;
    	let a4;
    	let svg3;
    	let path3;
    	let circle;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text("© 2021 McQueenCars —\r\n                ");
    			a0 = element("a");
    			a0.textContent = "@LeBulbasaur";
    			t2 = space();
    			span = element("span");
    			a1 = element("a");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t3 = space();
    			a2 = element("a");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t4 = space();
    			a3 = element("a");
    			svg2 = svg_element("svg");
    			rect = svg_element("rect");
    			path2 = svg_element("path");
    			t5 = space();
    			a4 = element("a");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			circle = svg_element("circle");
    			attr_dev(a0, "href", "https://github.com/LeBulbasaur");
    			attr_dev(a0, "rel", "noopener noreferrer");
    			attr_dev(a0, "class", "text-gray-500 ml-1 svelte-1x1bin0");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$1, 5, 16, 261);
    			attr_dev(p, "class", "text-gray-400 text-sm text-center sm:text-left");
    			add_location(p, file$1, 3, 12, 147);
    			attr_dev(path0, "d", "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z");
    			add_location(path0, file$1, 27, 24, 1145);
    			attr_dev(svg0, "fill", "currentColor");
    			attr_dev(svg0, "stroke-linecap", "round");
    			attr_dev(svg0, "stroke-linejoin", "round");
    			attr_dev(svg0, "stroke-width", "2");
    			attr_dev(svg0, "class", "w-5 h-5");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			add_location(svg0, file$1, 19, 20, 822);
    			attr_dev(a1, "class", "text-gray-400 svelte-1x1bin0");
    			attr_dev(a1, "href", "https://www.facebook.com/profile.php?id=100012331628700");
    			add_location(a1, file$1, 15, 16, 652);
    			attr_dev(path1, "d", "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z");
    			add_location(path1, file$1, 44, 24, 1818);
    			attr_dev(svg1, "fill", "currentColor");
    			attr_dev(svg1, "stroke-linecap", "round");
    			attr_dev(svg1, "stroke-linejoin", "round");
    			attr_dev(svg1, "stroke-width", "2");
    			attr_dev(svg1, "class", "w-5 h-5");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			add_location(svg1, file$1, 36, 20, 1495);
    			attr_dev(a2, "class", "ml-3 text-gray-400 svelte-1x1bin0");
    			attr_dev(a2, "href", "https://twitter.com/AntoniZaremba");
    			add_location(a2, file$1, 32, 16, 1342);
    			attr_dev(rect, "width", "20");
    			attr_dev(rect, "height", "20");
    			attr_dev(rect, "x", "2");
    			attr_dev(rect, "y", "2");
    			attr_dev(rect, "rx", "5");
    			attr_dev(rect, "ry", "5");
    			add_location(rect, file$1, 62, 24, 2639);
    			attr_dev(path2, "d", "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01");
    			add_location(path2, file$1, 70, 24, 2921);
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "stroke", "currentColor");
    			attr_dev(svg2, "stroke-linecap", "round");
    			attr_dev(svg2, "stroke-linejoin", "round");
    			attr_dev(svg2, "stroke-width", "2");
    			attr_dev(svg2, "class", "w-5 h-5");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			add_location(svg2, file$1, 53, 20, 2277);
    			attr_dev(a3, "class", "ml-3 text-gray-400 svelte-1x1bin0");
    			attr_dev(a3, "href", "https://www.instagram.com/owocowa_alpaka/");
    			add_location(a3, file$1, 49, 16, 2116);
    			attr_dev(path3, "stroke", "none");
    			attr_dev(path3, "d", "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z");
    			add_location(path3, file$1, 85, 24, 3560);
    			attr_dev(circle, "cx", "4");
    			attr_dev(circle, "cy", "4");
    			attr_dev(circle, "r", "2");
    			attr_dev(circle, "stroke", "none");
    			add_location(circle, file$1, 89, 24, 3780);
    			attr_dev(svg3, "fill", "currentColor");
    			attr_dev(svg3, "stroke", "currentColor");
    			attr_dev(svg3, "stroke-linecap", "round");
    			attr_dev(svg3, "stroke-linejoin", "round");
    			attr_dev(svg3, "stroke-width", "0");
    			attr_dev(svg3, "class", "w-5 h-5");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			add_location(svg3, file$1, 76, 20, 3190);
    			attr_dev(a4, "class", "ml-3 text-gray-400 svelte-1x1bin0");
    			attr_dev(a4, "href", "http://corndog.io/");
    			add_location(a4, file$1, 75, 16, 3112);
    			attr_dev(span, "class", "inline-flex sm:ml-auto sm:mt-0 mt-2 justify-center sm:justify-start");
    			add_location(span, file$1, 12, 12, 521);
    			attr_dev(div0, "class", "container mx-auto py-4 flex flex-wrap flex-col sm:flex-row");
    			add_location(div0, file$1, 2, 8, 61);
    			attr_dev(div1, "class", "bg-gray-800 bg-opacity-75");
    			add_location(div1, file$1, 1, 4, 12);
    			attr_dev(main, "class", "svelte-1x1bin0");
    			add_location(main, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(p, a0);
    			append_dev(div0, t2);
    			append_dev(div0, span);
    			append_dev(span, a1);
    			append_dev(a1, svg0);
    			append_dev(svg0, path0);
    			append_dev(span, t3);
    			append_dev(span, a2);
    			append_dev(a2, svg1);
    			append_dev(svg1, path1);
    			append_dev(span, t4);
    			append_dev(span, a3);
    			append_dev(a3, svg2);
    			append_dev(svg2, rect);
    			append_dev(svg2, path2);
    			append_dev(span, t5);
    			append_dev(span, a4);
    			append_dev(a4, svg3);
    			append_dev(svg3, path3);
    			append_dev(svg3, circle);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.43.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let tailwindcss;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let router;
    	let t2;
    	let footer;
    	let current;
    	tailwindcss = new Tailwindcss({ $$inline: true });
    	header = new Header({ $$inline: true });

    	router = new Router({
    			props: {
    				routes: {
    					"/": Home,
    					"/login": Login,
    					"/register": Register,
    					"/users": Users,
    					"/cars": Cars,
    					"/reservations": Reservations,
    					"/applications": Applications,
    					"/terms": Terms,
    					"*": NotFound
    				}
    			},
    			$$inline: true
    		});

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(tailwindcss.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(router.$$.fragment);
    			t2 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(main, "class", "flex flex-col justify-between h-screen pt-32 md:pt-12 svelte-94kv5k");
    			add_location(main, file, 17, 0, 658);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tailwindcss, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			mount_component(router, main, null);
    			append_dev(main, t2);
    			mount_component(footer, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tailwindcss.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tailwindcss.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tailwindcss, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(router);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Tailwindcss,
    		Router,
    		Home,
    		Login,
    		Register,
    		NotFound,
    		Cars,
    		Users,
    		Reservations,
    		Applications,
    		Terms,
    		Header,
    		Footer
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
