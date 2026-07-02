//#region src/index.ts
var e = "root";
function t(e, t) {
	return {
		perspective: t?.perspective ?? 900,
		perspectiveOrigin: t?.perspectiveOrigin ?? {
			x: e.width / 2,
			y: e.height / 2
		}
	};
}
function n(e) {
	return e.map((e) => ({
		...e,
		line: {
			a: { ...e.line.a },
			b: { ...e.line.b }
		}
	}));
}
function r(e) {
	return [
		{
			x: 0,
			y: 0
		},
		{
			x: e.width,
			y: 0
		},
		{
			x: e.width,
			y: e.height
		},
		{
			x: 0,
			y: e.height
		}
	];
}
function i(e, t) {
	let n = t.b.x - t.a.x;
	return (t.b.y - t.a.y) * (e.x - t.a.x) - n * (e.y - t.a.y);
}
function a(e, t, n) {
	let r = (e) => i(e, t), a = (e) => n === 1 ? r(e) >= -1e-9 : r(e) <= 1e-9, s = (e, t) => {
		let n = r(e), i = r(t), a = Math.abs(n - i) < 1e-9 ? 0 : n / (n - i);
		return {
			x: e.x + (t.x - e.x) * a,
			y: e.y + (t.y - e.y) * a
		};
	}, c = [];
	for (let t = 0; t < e.length; t += 1) {
		let n = e[t], r = e[(t + e.length - 1) % e.length], i = a(n), o = a(r);
		i ? (o || c.push(s(r, n)), c.push(n)) : o && c.push(s(r, n));
	}
	return o(c);
}
function o(e) {
	let t = [];
	for (let n of e) {
		let e = t.at(-1);
		(!e || Math.abs(e.x - n.x) > 1e-6 || Math.abs(e.y - n.y) > 1e-6) && t.push(s(n));
	}
	if (t.length > 1) {
		let e = t[0], n = t.at(-1);
		Math.abs(e.x - n.x) < 1e-6 && Math.abs(e.y - n.y) < 1e-6 && t.pop();
	}
	return t;
}
function s(e) {
	return {
		x: Math.abs(e.x) < 1e-9 ? 0 : Number(e.x.toFixed(6)),
		y: Math.abs(e.y) < 1e-9 ? 0 : Number(e.y.toFixed(6))
	};
}
function c() {
	return [
		1,
		0,
		0,
		0,
		0,
		1,
		0,
		0,
		0,
		0,
		1,
		0,
		0,
		0,
		0,
		1
	];
}
function l(e, t, n) {
	return [
		1,
		0,
		0,
		e,
		0,
		1,
		0,
		t,
		0,
		0,
		1,
		n,
		0,
		0,
		0,
		1
	];
}
function u(e, t) {
	let n = Math.hypot(e.x, e.y, e.z) || 1, r = e.x / n, i = e.y / n, a = e.z / n, o = t * Math.PI / 180, s = Math.cos(o), c = Math.sin(o), l = 1 - s;
	return [
		l * r * r + s,
		l * r * i - c * a,
		l * r * a + c * i,
		0,
		l * r * i + c * a,
		l * i * i + s,
		l * i * a - c * r,
		0,
		l * r * a - c * i,
		l * i * a + c * r,
		l * a * a + s,
		0,
		0,
		0,
		0,
		1
	];
}
function d(e, t) {
	let n = Array.from({ length: 16 }, () => 0);
	for (let r = 0; r < 4; r += 1) for (let i = 0; i < 4; i += 1) n[r * 4 + i] = e[r * 4 + 0] * t[i + 0] + e[r * 4 + 1] * t[i + 4] + e[r * 4 + 2] * t[i + 8] + e[r * 4 + 3] * t[i + 12];
	return n.map((e) => Math.abs(e) < 1e-12 ? 0 : Number(e.toFixed(12)));
}
function f(e, t) {
	let n = e[0] * t.x + e[1] * t.y + e[2] * t.z + e[3], r = e[4] * t.x + e[5] * t.y + e[6] * t.z + e[7], i = e[8] * t.x + e[9] * t.y + e[10] * t.z + e[11], a = e[12] * t.x + e[13] * t.y + e[14] * t.z + e[15];
	return {
		x: n / (a || 1),
		y: r / (a || 1),
		z: i / (a || 1)
	};
}
function p(e) {
	return `matrix3d(${[
		0,
		4,
		8,
		12,
		1,
		5,
		9,
		13,
		2,
		6,
		10,
		14,
		3,
		7,
		11,
		15
	].map((t) => m(e[t])).join(", ")})`;
}
function m(e) {
	return String(Math.abs(e) < 1e-12 ? 0 : Number(e.toFixed(12)));
}
function ee(e, t) {
	let n = {
		x: e.b.x - e.a.x,
		y: e.b.y - e.a.y,
		z: 0
	};
	return d(d(l(e.a.x, e.a.y, 0), u(n, t)), l(-e.a.x, -e.a.y, 0));
}
function h(t) {
	let n = { [e]: {
		id: e,
		parentId: null,
		polygon: r(t.paper),
		projectedPolygon: [],
		hinge: null,
		angleDeg: 0,
		sourceOpId: null,
		children: [],
		localMatrix: c(),
		worldMatrix: c(),
		depth: 0,
		valid: !0
	} }, i = {};
	for (let e of t.foldOps) {
		if (e.disabled) continue;
		let t = n[e.targetNodeId];
		if (!t) {
			i[e.id] = `Missing target node: ${e.targetNodeId}`;
			continue;
		}
		let r = a(t.polygon, e.line, e.movingSide), o = a(t.polygon, e.line, e.movingSide === 1 ? -1 : 1);
		if (r.length < 3 || o.length < 3) {
			i[e.id] = "Fold line does not split target polygon";
			continue;
		}
		t.polygon = o, t.children.push(e.childNodeId);
		let s = ee(e.line, e.angleDeg);
		n[e.childNodeId] = {
			id: e.childNodeId,
			parentId: t.id,
			polygon: r,
			projectedPolygon: [],
			hinge: e.line,
			angleDeg: e.angleDeg,
			sourceOpId: e.id,
			children: [],
			localMatrix: s,
			worldMatrix: d(t.worldMatrix, s),
			depth: t.depth + 1,
			valid: !0
		};
	}
	for (let e of Object.values(n)) e.projectedPolygon = ie(e);
	return {
		rootId: e,
		nodes: n,
		renderOrder: Object.values(n).sort((e, t) => e.depth - t.depth).map((e) => e.id),
		invalidOps: i
	};
}
function g(e) {
	return `polygon(${e.map((e) => `${e.x}px ${e.y}px`).join(", ")})`;
}
function te(e, t) {
	if (t <= 0 || e.length === 0) return g(e);
	let n = e.reduce((t, n) => ({
		x: t.x + n.x / e.length,
		y: t.y + n.y / e.length
	}), {
		x: 0,
		y: 0
	});
	return g(e.map((e) => {
		let r = e.x - n.x, i = e.y - n.y, a = Math.hypot(r, i);
		return a === 0 ? e : {
			x: e.x + r / a * t,
			y: e.y + i / a * t
		};
	}));
}
function ne(e, t, n) {
	let r = (e.y - t.y) * (n.x - t.x) - (e.x - t.x) * (n.y - t.y);
	if (Math.abs(r) > 1e-6) return !1;
	let i = (e.x - t.x) * (n.x - t.x) + (e.y - t.y) * (n.y - t.y);
	return i < -1e-6 ? !1 : i <= (n.x - t.x) ** 2 + (n.y - t.y) ** 2 + 1e-6;
}
function re(e, t) {
	let n = !1;
	for (let r = 0, i = t.length - 1; r < t.length; i = r, r += 1) {
		let a = t[r], o = t[i];
		if (ne(e, o, a)) return !0;
		a.y > e.y != o.y > e.y && e.x < (o.x - a.x) * (e.y - a.y) / (o.y - a.y || 1e-12) + a.x && (n = !n);
	}
	return n;
}
function ie(e) {
	return e.polygon.map((t) => {
		let n = f(e.worldMatrix, {
			x: t.x,
			y: t.y,
			z: 0
		});
		return s({
			x: n.x,
			y: n.y
		});
	});
}
function ae(e, t, n, r) {
	let i = {
		x: n.x - t.x,
		y: n.y - t.y
	}, a = {
		x: r.x - t.x,
		y: r.y - t.y
	}, o = {
		x: e.x - t.x,
		y: e.y - t.y
	}, s = i.x * i.x + i.y * i.y, c = i.x * a.x + i.y * a.y, l = a.x * a.x + a.y * a.y, u = o.x * i.x + o.y * i.y, d = o.x * a.x + o.y * a.y, f = s * l - c * c;
	if (Math.abs(f) < 1e-9) return null;
	let p = (l * u - c * d) / f, m = (s * d - c * u) / f;
	return [
		1 - p - m,
		p,
		m
	];
}
function oe(e) {
	return e.every((e) => e >= -1e-6 && e <= 1.000001);
}
function se(e, t) {
	let n = t.projectedPolygon.length > 0 ? t.projectedPolygon : ie(t);
	for (let r = 1; r < n.length - 1; r += 1) {
		let i = ae(e, n[0], n[r], n[r + 1]);
		if (!i || !oe(i)) continue;
		let a = t.polygon[0], o = t.polygon[r], s = t.polygon[r + 1];
		return {
			x: a.x * i[0] + o.x * i[1] + s.x * i[2],
			y: a.y * i[0] + o.y * i[1] + s.y * i[2]
		};
	}
	return e;
}
function ce(e, t) {
	for (let n of [...t.renderOrder].reverse()) {
		let r = t.nodes[n];
		if (re(e, r.projectedPolygon)) return {
			nodeId: n,
			localPoint: se(e, r)
		};
	}
	return null;
}
function _(e, t) {
	return e.renderOrder.map((n) => {
		let r = e.nodes[n];
		return {
			nodeId: n,
			polygon: r.polygon,
			clipPath: g(r.polygon),
			transform: p(r.worldMatrix),
			backgroundPosition: "0px 0px",
			backgroundSize: `${t.width}px ${t.height}px`
		};
	});
}
function le(e) {
	let r = t(e.paper, e.camera), i = h({
		paper: e.paper,
		camera: r,
		foldOps: n(e.foldOps),
		controls: {}
	});
	return {
		mode: "baked-view",
		paper: e.paper,
		camera: r,
		snapshot: e.snapshot,
		pieces: _(i, e.paper)
	};
}
var v = class {
	rootElement;
	snapshot = null;
	constructor(e) {
		this.rootElement = e;
	}
	setSnapshot(e) {
		this.snapshot?.revoke?.(), this.snapshot = e;
	}
	renderPieces(e, t, n) {
		if (this.snapshot) {
			this.rootElement.innerHTML = "", this.rootElement.style.position = "relative", this.rootElement.style.width = `${t.width}px`, this.rootElement.style.height = `${t.height}px`, this.rootElement.style.transformStyle = "preserve-3d";
			for (let t of e) {
				let e = document.createElement("div");
				e.className = "ori-fold-node", e.dataset.oriNodeId = t.nodeId, e.style.position = "absolute", e.style.inset = "0", e.style.transformOrigin = "0 0", e.style.transformStyle = "preserve-3d", e.style.pointerEvents = "none", e.style.transform = t.transform;
				let r = document.createElement("div");
				r.className = "ori-fold-paint", r.style.position = "absolute", r.style.inset = "0", r.style.pointerEvents = "none", r.style.backfaceVisibility = "visible", r.style.backgroundImage = `url("${this.snapshot.url}")`, r.style.backgroundPosition = t.backgroundPosition, r.style.backgroundSize = t.backgroundSize, r.style.backgroundRepeat = "no-repeat", r.style.clipPath = t.clipPath, r.dataset.oriBaked = String(n), e.appendChild(r), this.rootElement.appendChild(e);
			}
		}
	}
}, ue = class {
	nextId = 1;
	keyByElement = /* @__PURE__ */ new WeakMap();
	assign(e) {
		this.ensureKey(e);
		let t = e.querySelectorAll("*");
		for (let e of t) this.ensureKey(e);
	}
	ensureKey(e) {
		let t = this.keyByElement.get(e) ?? e.dataset.foldKey;
		if (t) return this.keyByElement.set(e, t), e.dataset.foldKey = t, t;
		let n = `fold_el_${this.nextId++}`;
		return this.keyByElement.set(e, n), e.dataset.foldKey = n, n;
	}
	getKey(e) {
		return this.keyByElement.get(e) ?? e.dataset.foldKey;
	}
}, y = class {
	sourceRoot;
	keyRegistry;
	rootElement;
	fragments = /* @__PURE__ */ new Map();
	constructor(e, t, n) {
		this.sourceRoot = t, this.keyRegistry = n, this.rootElement = e;
	}
	renderPieces(e, t) {
		this.keyRegistry.assign(this.sourceRoot), this.rootElement.style.position = "relative", this.rootElement.style.width = `${t.width}px`, this.rootElement.style.height = `${t.height}px`, this.rootElement.style.transformStyle = "preserve-3d";
		let n = /* @__PURE__ */ new Set();
		for (let t of e) {
			n.add(t.nodeId);
			let e = this.ensureFragment(t.nodeId);
			e.fragmentEl.dataset.oriNodeId = t.nodeId, e.fragmentEl.style.transform = t.transform, e.clipEl.style.clipPath = te(t.polygon, 2.5), this.rootElement.appendChild(e.fragmentEl);
		}
		for (let [e, t] of this.fragments) n.has(e) || (t.fragmentEl.remove(), this.fragments.delete(e));
	}
	syncSourceMutation() {
		for (let [e, t] of this.fragments) {
			let n = this.createMirrorRoot();
			t.mirrorRoot.replaceWith(n.root), t.mirrorRoot = n.root, t.keyToCloneEl = n.map, this.fragments.set(e, t);
		}
	}
	setPseudoState(e) {
		for (let t of this.fragments.values()) {
			for (let n of t.keyToCloneEl.values()) e.hover !== void 0 && delete n.dataset.foldHover, e.active !== void 0 && delete n.dataset.foldActive, e.focus !== void 0 && delete n.dataset.foldFocus, e.focusVisible !== void 0 && delete n.dataset.foldFocusVisible;
			if (!e.key) continue;
			let n = t.keyToCloneEl.get(e.key);
			n && (e.hover && (n.dataset.foldHover = "true"), e.active && (n.dataset.foldActive = "true"), e.focus && (n.dataset.foldFocus = "true"), e.focusVisible && (n.dataset.foldFocusVisible = "true"));
		}
	}
	mirrorFormValues() {
		let e = this.sourceRoot.querySelectorAll("input, textarea, select");
		for (let t of e) {
			let e = this.keyRegistry.getKey(t);
			if (e) for (let n of this.fragments.values()) {
				let r = n.keyToCloneEl.get(e);
				r instanceof HTMLInputElement && t instanceof HTMLInputElement ? (r.value = t.value, r.checked = t.checked) : r instanceof HTMLTextAreaElement && t instanceof HTMLTextAreaElement ? r.value = t.value : r instanceof HTMLSelectElement && t instanceof HTMLSelectElement && (r.selectedIndex = t.selectedIndex);
			}
		}
	}
	ensureFragment(e) {
		let t = this.fragments.get(e);
		if (t) return t;
		let n = document.createElement("div");
		n.className = "ori-live-fragment ori-fold-node", n.style.position = "absolute", n.style.inset = "0", n.style.transformOrigin = "0 0", n.style.transformStyle = "preserve-3d", n.style.pointerEvents = "none", n.style.overflow = "visible";
		let r = document.createElement("div");
		r.className = "ori-live-clip", r.style.position = "absolute", r.style.inset = "0", r.style.pointerEvents = "none", r.style.backfaceVisibility = "visible";
		let i = this.createMirrorRoot();
		r.appendChild(i.root), n.appendChild(r);
		let a = {
			fragmentEl: n,
			clipEl: r,
			mirrorRoot: i.root,
			keyToCloneEl: i.map
		};
		return this.fragments.set(e, a), a;
	}
	createMirrorRoot() {
		let e = this.sourceRoot.cloneNode(!0);
		return e.classList.add("ori-live-mirror"), e.setAttribute("aria-hidden", "true"), e.setAttribute("inert", ""), e.style.pointerEvents = "none", e.style.userSelect = "none", fe(e), {
			root: e,
			map: de(e)
		};
	}
};
function de(e) {
	let t = /* @__PURE__ */ new Map(), n = e.dataset.foldKey;
	n && t.set(n, e);
	for (let n of e.querySelectorAll("[data-fold-key]")) {
		let e = n.dataset.foldKey;
		e && t.set(e, n);
	}
	return t;
}
function fe(e) {
	e.id && (e.dataset.foldOriginalId = e.id, e.removeAttribute("id"));
	for (let t of e.querySelectorAll("[id]")) t.dataset.foldOriginalId = t.id, t.removeAttribute("id");
}
var pe = class {
	sourceRoot;
	constructor(e) {
		this.sourceRoot = e;
	}
	elementFromLocalPoint(e) {
		let t = Array.from(this.sourceRoot.querySelectorAll("*")).reverse();
		for (let n of t) {
			let t = me(n);
			if (t && e.x >= t.x && e.x <= t.x + t.width && e.y >= t.y && e.y <= t.y + t.height) return n;
		}
		return this.sourceRoot;
	}
	dispose() {}
};
function me(e) {
	let t = getComputedStyle(e), n = b(e.style.left || t.left), r = b(e.style.top || t.top), i = b(e.style.width || t.width), a = b(e.style.height || t.height);
	if (i > 0 && a > 0) return {
		x: n,
		y: r,
		width: i,
		height: a
	};
	let o = e.getBoundingClientRect();
	return o.width > 0 && o.height > 0 ? {
		x: o.left,
		y: o.top,
		width: o.width,
		height: o.height
	} : null;
}
function b(e) {
	let t = Number.parseFloat(e);
	return Number.isFinite(t) ? t : 0;
}
var x = class {
	snapshot;
	constructor(e) {
		this.snapshot = e;
	}
	async capture() {
		return this.snapshot;
	}
}, he = class {
	name = "ButtonAdapter";
	match(e) {
		return e instanceof HTMLButtonElement || e instanceof HTMLInputElement && [
			"button",
			"submit",
			"checkbox",
			"radio"
		].includes(e.type);
	}
	pointerUp(e) {
		return e.sourceTarget.click(), !0;
	}
}, ge = class {
	name = "AnchorAdapter";
	match(e) {
		return e instanceof HTMLAnchorElement;
	}
	pointerUp(e) {
		return e.sourceTarget.click(), !0;
	}
}, _e = class {
	name = "TextInputProxyAdapter";
	match(e) {
		return e instanceof HTMLInputElement && [
			"text",
			"search",
			"email",
			"url",
			"tel",
			"password"
		].includes(e.type);
	}
	pointerUp(e) {
		let t = e.sourceTarget, n = ve(t);
		if (!n) return !1;
		let r = t.cloneNode(!1);
		r.removeAttribute("id"), r.classList.add("ori-input-proxy"), r.value = t.value;
		let i = me(t);
		r.style.position = "absolute", r.style.left = `${i?.x ?? 0}px`, r.style.top = `${i?.y ?? 0}px`, r.style.width = `${i?.width ?? t.getBoundingClientRect().width}px`, r.style.height = `${i?.height ?? t.getBoundingClientRect().height}px`, r.style.pointerEvents = "auto", n.replaceChildren(r);
		let a = () => {
			t.value = r.value, t.dispatchEvent(new Event("input", { bubbles: !0 }));
		};
		return r.addEventListener("input", a), r.addEventListener("blur", () => {
			a(), t.dispatchEvent(new Event("change", { bubbles: !0 }));
		}, { once: !0 }), r.focus(), r.setSelectionRange?.(r.value.length, r.value.length), !0;
	}
};
function ve(e) {
	return e.closest(".ori-source-layer")?.parentElement?.querySelector(":scope > .ori-activation-layer") ?? null;
}
function ye(e, t) {
	let n = typeof PointerEvent == "function" ? PointerEvent : Event;
	e.dispatchEvent(new n(t, { bubbles: !0 }));
}
var be = class {
	options;
	mode = "static-view";
	state;
	tree;
	renderer;
	constructor(e) {
		this.options = e, this.state = {
			paper: e.paper,
			camera: t(e.paper, e.camera),
			foldOps: n(e.foldOps),
			controls: {}
		}, this.tree = h(this.state), S(e.host, "static-view", this.state.camera), this.renderer = new v(C(e.host, "ori-visual-layer")), this.renderer.setSnapshot(e.snapshot);
	}
	async mount() {
		this.render();
	}
	render() {
		this.renderer.renderPieces(_(this.tree, this.state.paper), this.state.paper, !1);
	}
	setAngle(e, t) {
		let n = this.state.foldOps.find((t) => t.id === e);
		return n ? (n.angleDeg = t, this.tree = h(this.state), this.render(), !0) : !1;
	}
	dispose() {
		this.options.host.innerHTML = "";
	}
}, xe = class {
	options;
	mode = "baked-view";
	renderer;
	constructor(e) {
		this.options = e, S(e.host, "baked-view", e.manifest.camera), e.host.dataset.oriBaked = "true", this.renderer = new v(C(e.host, "ori-visual-layer")), this.renderer.setSnapshot(e.manifest.snapshot);
	}
	async mount() {
		this.render();
	}
	render() {
		this.renderer.renderPieces(this.options.manifest.pieces, this.options.manifest.paper, !0);
	}
	setAngle() {
		return !1;
	}
	dispose() {
		this.options.host.innerHTML = "";
	}
}, Se = class {
	options;
	mode = "interactive-bridge";
	state;
	tree;
	source;
	renderer;
	keyRegistry = new ue();
	adapters;
	interactionLayer;
	snapshot = null;
	constructor(e) {
		this.options = e, this.state = {
			paper: e.paper,
			camera: t(e.paper, e.camera),
			foldOps: n(e.foldOps ?? []),
			controls: {}
		}, this.tree = h(this.state), this.adapters = [
			...e.adapters ?? [],
			new _e(),
			new he(),
			new ge()
		], this.source = new pe(e.sourceRoot), S(e.host, "interactive-bridge", this.state.camera), C(e.host, "ori-source-layer").appendChild(e.sourceRoot);
		let r = C(e.host, "ori-visual-layer");
		this.renderer = e.visual?.backend === "live-mirror" ? new y(r, e.sourceRoot, this.keyRegistry) : new v(r), this.interactionLayer = C(e.host, "ori-interaction-layer"), C(e.host, "ori-activation-layer");
	}
	onLayerPointer = (e) => {
		let t = this.options.host.getBoundingClientRect();
		this.bridgePointer({
			clientX: e.clientX - t.left,
			clientY: e.clientY - t.top,
			type: e.type
		});
	};
	async mount() {
		this.snapshot = await this.options.snapshotProvider.capture(this.options.sourceRoot, this.state.paper), this.renderer instanceof v && this.renderer.setSnapshot(this.snapshot), this.render(), this.interactionLayer.addEventListener("pointerdown", this.onLayerPointer), this.interactionLayer.addEventListener("pointermove", this.onLayerPointer), this.interactionLayer.addEventListener("pointerup", this.onLayerPointer);
	}
	render() {
		!this.snapshot && this.renderer instanceof v || (this.renderer.renderPieces(_(this.tree, this.state.paper), this.state.paper, !1), this.renderer instanceof y && this.renderer.mirrorFormValues());
	}
	setAngle(e, t) {
		let n = this.state.foldOps.find((t) => t.id === e);
		return n ? (n.angleDeg = t, this.tree = h(this.state), this.render(), !0) : !1;
	}
	setMode(e) {
		this.options.host.dataset.oriMode = e;
	}
	bridgePointer(e) {
		let t = ce({
			x: e.clientX,
			y: e.clientY
		}, this.tree);
		if (!t) return !1;
		let n = this.source.elementFromLocalPoint(t.localPoint);
		if (!n) return !1;
		let r = {
			originalEvent: e,
			hit: t,
			sourcePoint: t.localPoint,
			sourceTarget: n,
			elementId: n.dataset.oriElementId
		};
		this.syncLivePseudoState(e.type, n);
		let i = e.type === "pointerdown" ? "pointerDown" : e.type === "pointermove" ? "pointerMove" : e.type === "pointerup" || e.type === "click" ? "pointerUp" : void 0;
		if (i) for (let e of this.adapters) {
			let t = e[i];
			if (e.match(n) && t?.call(e, r)) return !0;
		}
		return ye(n, e.type), !0;
	}
	syncLivePseudoState(e, t) {
		if (!(this.renderer instanceof y)) return;
		let n = this.options.visual?.pseudoStates;
		if (!n) return;
		let r = this.keyRegistry.ensureKey(t);
		e === "pointermove" && n.hover && this.renderer.setPseudoState({
			key: r,
			hover: !0
		}), e === "pointerdown" && n.active && this.renderer.setPseudoState({
			key: r,
			active: !0
		}), (e === "pointerup" || e === "click") && n.active && this.renderer.setPseudoState({ active: !1 });
	}
	dispose() {
		this.interactionLayer.removeEventListener("pointerdown", this.onLayerPointer), this.interactionLayer.removeEventListener("pointermove", this.onLayerPointer), this.interactionLayer.removeEventListener("pointerup", this.onLayerPointer), this.source.dispose(), this.snapshot?.revoke?.(), this.options.host.innerHTML = "";
	}
};
function S(e, t, n) {
	e.dataset.oriMode = t, e.style.position = e.style.position || "relative", e.style.perspective = `${n.perspective}px`, e.style.perspectiveOrigin = `${n.perspectiveOrigin.x}px ${n.perspectiveOrigin.y}px`, e.style.transformStyle = "preserve-3d";
}
function C(e, t) {
	let n = e.querySelector(`:scope > .${t}`);
	if (n) return n;
	let r = document.createElement("div");
	return r.className = t, r.style.position = "absolute", r.style.inset = "0", (t === "ori-visual-layer" || t === "ori-activation-layer") && (r.style.transformStyle = "preserve-3d"), (t === "ori-visual-layer" || t === "ori-activation-layer") && (r.style.pointerEvents = "none"), e.appendChild(r), r;
}
function w(e) {
	return e.mode === "static-view" ? new be(e) : e.mode === "baked-view" ? new xe(e) : new Se(e);
}
//#endregion
//#region demo/main.ts
var T = document.querySelector("#target"), E = document.querySelector("#toggle"), D = document.querySelector("#saveBtn"), O = document.querySelector("#nameInput"), k = document.querySelector("#copyInstall"), A = document.querySelector("#installCommand"), j = document.querySelector("#foldStage"), M = document.querySelector("#activeFoldName"), N = document.querySelector("#angleValue"), Ce = document.querySelector("#angleDial"), we = document.querySelector("#angleHand"), Te = document.querySelector("#creaseTools"), Ee = document.querySelector("#liveMirrorTarget"), De = document.querySelector("#squareFoldTarget"), Oe = document.querySelector("#complexDomTarget");
if (!T || !E || !D || !O || !k || !A || !j || !M || !N || !Ce || !we || !Te || !Ee || !De || !Oe) throw Error("Demo DOM is missing required elements");
var P = j, ke = M, Ae = N, F = Ce, je = we, Me = Te, I = Ee, Ne = De, Pe = Oe, L = T, R = D, z = O, B = k, Fe = A;
B.addEventListener("click", async () => {
	let e = Fe.textContent?.trim() || "npm install orikata";
	try {
		await navigator.clipboard?.writeText(e);
	} catch {
		let t = document.createElement("textarea");
		t.value = e, t.style.position = "fixed", t.style.opacity = "0", document.body.appendChild(t), t.select(), document.execCommand("copy"), t.remove();
	}
	B.textContent = "copied", window.setTimeout(() => {
		B.textContent = "copy";
	}, 1100);
});
function Ie(e) {
	L.dataset.inputValue = e, Y();
}
L.addEventListener("focusin", (e) => {
	e.target.classList?.contains("ori-input-proxy") && (L.dataset.inputActive = "true");
}), L.addEventListener("focusout", (e) => {
	e.target.classList?.contains("ori-input-proxy") && delete L.dataset.inputActive;
});
var Le;
R.addEventListener("click", () => {
	window.clearTimeout(Le), R.textContent = "Saved", Y(), Le = window.setTimeout(() => {
		R.textContent = "Save", Y();
	}, 620);
}), z.addEventListener("input", () => {
	Ie(z.value);
});
var Re = [{
	id: "center-valley",
	targetNodeId: e,
	childNodeId: "right-panel",
	line: {
		a: {
			x: 210,
			y: 0
		},
		b: {
			x: 210,
			y: 220
		}
	},
	movingSide: 1,
	angleDeg: -60
}, {
	id: "corner-mountain",
	targetNodeId: "right-panel",
	childNodeId: "upper-corner-flap",
	line: {
		a: {
			x: 300,
			y: 0
		},
		b: {
			x: 420,
			y: 80
		}
	},
	movingSide: 1,
	angleDeg: 48
}], V = {
	"center-valley": -60,
	"corner-mountain": 48
}, ze = {
	"center-valley": "center valley",
	"corner-mountain": "corner mountain"
}, H = "corner-mountain";
function U(e, t) {
	V[e] = Math.max(-85, Math.min(85, Math.round(t))), Q?.setAngle(e, V[e]), G(), P.dataset.activeFold = H, P.dataset.centerAngle = String(V["center-valley"]), P.dataset.cornerAngle = String(V["corner-mountain"]), Ae.textContent = `${V[H]}°`, F.setAttribute("aria-valuenow", String(V[H])), je.style.transform = `rotate(${V[H]}deg)`;
}
function W(e, t) {
	for (let n of L.querySelectorAll("[data-fold-candidate], .crease-tool-layer[data-tool-id]")) (n.dataset.foldCandidate === e || n.dataset.toolId === e) && (n.dataset.state = t);
}
var Be = [{
	id: "center-valley",
	nodeId: e,
	guide: {
		x1: 210,
		y1: 0,
		x2: 210,
		y2: 220
	},
	hot: {
		x1: 210,
		y1: 0,
		x2: 210,
		y2: 220
	}
}, {
	id: "corner-mountain",
	nodeId: "right-panel",
	guide: {
		x1: 300,
		y1: 0,
		x2: 420,
		y2: 80
	},
	hot: {
		x1: 300,
		y1: 0,
		x2: 420,
		y2: 80
	}
}];
function Ve(e, t) {
	let n = document.createElementNS("http://www.w3.org/2000/svg", "line");
	n.setAttribute("class", t);
	for (let [t, r] of Object.entries(e)) n.setAttribute(t, String(r));
	return n;
}
function G() {
	Me.remove();
	for (let e of L.querySelectorAll(":scope > .crease-tool-layer")) e.remove();
	for (let e of Be) {
		let t = L.querySelector(`[data-ori-node-id="${e.nodeId}"]`);
		if (!t) continue;
		let n = document.createElement("div");
		n.className = "crease-tool-layer", n.dataset.toolNode = e.nodeId, n.dataset.toolId = e.id, n.dataset.state = e.id === H ? "selected" : "idle", n.style.transform = t.style.transform || getComputedStyle(t).transform;
		let r = document.createElement("button");
		r.type = "button", r.className = `crease-hotspot ${e.id === "center-valley" ? "center" : "corner"}`, r.dataset.foldCandidate = e.id, r.dataset.state = e.id === H ? "selected" : "idle", r.setAttribute("aria-label", `select ${ze[e.id]} crease`), r.addEventListener("mouseenter", () => {
			e.id !== H && W(e.id, "hover");
		}), r.addEventListener("mouseleave", () => {
			e.id !== H && W(e.id, "idle");
		}), r.addEventListener("click", (t) => {
			t.stopPropagation(), He(e.id);
		});
		let i = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		i.setAttribute("class", "fold-tool-layer"), i.setAttribute("viewBox", "0 0 420 220"), i.setAttribute("aria-hidden", "true"), i.appendChild(Ve(e.guide, "candidate-guide")), i.appendChild(Ve(e.hot, "candidate-line")), n.appendChild(r), n.appendChild(i), L.appendChild(n);
	}
}
function He(e) {
	H = e, ke.textContent = ze[e] ?? e;
	for (let t of Be) W(t.id, t.id === e ? "selected" : "idle");
	U(e, V[e] ?? 0);
}
function Ue(e) {
	let t = F.getBoundingClientRect(), n = t.left + t.width / 2, r = t.top + t.height / 2, i = Math.atan2(e.clientY - r, e.clientX - n) * 180 / Math.PI;
	return Math.max(-85, Math.min(85, Math.round(i)));
}
function K(e) {
	U(H, Ue(e));
}
F.addEventListener("pointerdown", (e) => {
	F.setPointerCapture(e.pointerId), K(e);
}), F.addEventListener("pointermove", (e) => {
	F.hasPointerCapture(e.pointerId) && K(e);
}), F.addEventListener("click", (e) => K(e)), F.addEventListener("keydown", (e) => {
	e.key !== "ArrowLeft" && e.key !== "ArrowRight" || (e.preventDefault(), U(H, V[H] + (e.key === "ArrowRight" ? 5 : -5)));
});
function q(e) {
	return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function We(e, t) {
	let n = q(e || "\xA0"), r = q(t || "Save");
	return `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220" viewBox="0 0 420 220">
  <defs>
    <pattern id="asanoha" width="36" height="31.176" patternUnits="userSpaceOnUse">
      <path d="M18 0v31.176M0 15.588h36M0 15.588 18 0l18 15.588-18 15.588zM0 15.588 18 31.176M36 15.588 18 31.176M0 15.588 18 0M36 15.588 18 0" fill="none" stroke="#334137" stroke-opacity="0.16" stroke-width="0.9"/>
    </pattern>
    <filter id="bleed" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.048" numOctaves="3" seed="7" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.13"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" mode="multiply"/>
    </filter>
  </defs>
  <rect width="420" height="220" fill="#efe3cb"/>
  <rect width="420" height="220" fill="url(#asanoha)"/>
  <path d="M0 0h420v220H0z" fill="none" stroke="#2b2f2a" stroke-opacity="0.22"/>
  <path d="M210 0v220" stroke="#2b2f2a" stroke-opacity="0.22" stroke-width="1.1" stroke-dasharray="6 8"/>
  <path d="M300 0 420 80" stroke="#b65f45" stroke-opacity="0.5" stroke-width="1.2" stroke-dasharray="5 7"/>
  <g filter="url(#bleed)">
    <circle cx="84" cy="86" r="40" fill="none" stroke="#1f2420" stroke-opacity="0.16" stroke-width="12"/>
    <text x="32" y="58" font-family="Hiragino Mincho ProN, Yu Mincho, Georgia, serif" font-size="28" fill="#1f2420">Washi form</text>
    <text x="34" y="91" font-family="system-ui, sans-serif" font-size="13" fill="#5f5a51">one real DOM</text>
    <text x="34" y="111" font-family="system-ui, sans-serif" font-size="13" fill="#5f5a51">folded like paper</text>
    <path d="M270 112h100" stroke="#1f2420" stroke-opacity=".42" stroke-width="1"/>
    <text x="282" y="102" font-family="system-ui, sans-serif" font-size="13" fill="#1f2420">${n}</text>
    <rect x="270" y="132" width="100" height="36" fill="${t === "Saved" ? "#b65f45" : "#2b2f2a"}" fill-opacity="${t === "Saved" ? "0.86" : "1"}"/>
    <text x="320" y="155" text-anchor="middle" font-family="Hiragino Mincho ProN, Yu Mincho, Georgia, serif" font-size="13" fill="#f7f1e4">${r}</text>
    <circle cx="385" cy="32" r="18" fill="#b65f45" fill-opacity="0.18"/>
  </g>
</svg>`;
}
var J = {
	id: "washi-asanoha-card",
	width: 420,
	height: 220,
	url: `data:image/svg+xml,${encodeURIComponent(We(z.value, R.textContent || "Save"))}`
};
function Y() {
	J.url = `data:image/svg+xml,${encodeURIComponent(We(z.value, R.textContent || "Save"))}`, Q.setAngle("corner-mountain", V["corner-mountain"]);
}
function X(e) {
	return `data:image/svg+xml,${encodeURIComponent(e)}`;
}
function Ge() {
	return "\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"260\" height=\"260\" viewBox=\"0 0 260 260\">\n  <defs>\n    <pattern id=\"squareAsanoha\" width=\"40\" height=\"34.64\" patternUnits=\"userSpaceOnUse\">\n      <path d=\"M20 0v34.64M0 17.32h40M0 17.32 20 0l20 17.32-20 17.32zM0 17.32 20 34.64M40 17.32 20 34.64M0 17.32 20 0M40 17.32 20 0\" fill=\"none\" stroke=\"#314037\" stroke-opacity=\"0.14\" stroke-width=\"1\"/>\n    </pattern>\n    <filter id=\"squarePaper\" x=\"-8%\" y=\"-8%\" width=\"116%\" height=\"116%\">\n      <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.016 0.05\" numOctaves=\"3\" seed=\"21\" result=\"noise\"/>\n      <feComponentTransfer><feFuncA type=\"table\" tableValues=\"0 0.1\"/></feComponentTransfer>\n      <feBlend in=\"SourceGraphic\" mode=\"multiply\"/>\n    </filter>\n  </defs>\n  <rect width=\"260\" height=\"260\" fill=\"#efe3cb\"/>\n  <rect width=\"260\" height=\"260\" fill=\"url(#squareAsanoha)\"/>\n  <g filter=\"url(#squarePaper)\">\n    <circle cx=\"130\" cy=\"126\" r=\"52\" fill=\"none\" stroke=\"#1f2420\" stroke-opacity=\"0.17\" stroke-width=\"17\"/>\n    <path d=\"M66 130h128M130 66v128\" stroke=\"#1f2420\" stroke-opacity=\"0.22\" stroke-width=\"1.2\"/>\n    <text x=\"130\" y=\"125\" text-anchor=\"middle\" font-family=\"Hiragino Mincho ProN, Yu Mincho, Georgia, serif\" font-size=\"22\" fill=\"#1f2420\">四隅</text>\n    <text x=\"130\" y=\"150\" text-anchor=\"middle\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#5f5a51\">corner collapse</text>\n    <circle cx=\"54\" cy=\"54\" r=\"12\" fill=\"#b65f45\" fill-opacity=\"0.32\"/>\n    <circle cx=\"206\" cy=\"54\" r=\"12\" fill=\"#b65f45\" fill-opacity=\"0.32\"/>\n    <circle cx=\"206\" cy=\"206\" r=\"12\" fill=\"#b65f45\" fill-opacity=\"0.32\"/>\n    <circle cx=\"54\" cy=\"206\" r=\"12\" fill=\"#b65f45\" fill-opacity=\"0.32\"/>\n  </g>\n  <path d=\"M-10 80 80 -10M180 -10 270 80M270 180 180 270M80 270 -10 180\" stroke=\"#766f64\" stroke-opacity=\"0.42\" stroke-dasharray=\"6 8\"/>\n  <path d=\"M0 130h260\" stroke=\"#2b2f2a\" stroke-opacity=\"0.28\" stroke-dasharray=\"7 9\"/>\n</svg>";
}
function Ke() {
	return `
<svg xmlns="http://www.w3.org/2000/svg" width="340" height="220" viewBox="0 0 340 220">
  <defs>
    <linearGradient id="complexWash" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#f3ead8"/><stop offset="1" stop-color="#e7d8be"/>
    </linearGradient>
    <pattern id="complexGrid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0v24" fill="none" stroke="#2b2f2a" stroke-opacity="0.045"/>
    </pattern>
  </defs>
  <rect width="340" height="220" fill="url(#complexWash)"/>
  <rect width="340" height="220" fill="url(#complexGrid)"/>
  <text x="20" y="32" font-family="Hiragino Mincho ProN, Yu Mincho, Georgia, serif" font-size="24" fill="#1f2420">Signal garden</text>
  <text x="244" y="31" font-family="system-ui" font-size="11" fill="#766f64">complex DOM texture</text>
  ${[
		"<rect x=\"20\" y=\"54\" width=\"86\" height=\"58\" rx=\"8\" fill=\"#f8f1e5\" stroke=\"#2b2f2a\" stroke-opacity=\"0.12\"/><text x=\"34\" y=\"78\" font-family=\"system-ui\" font-size=\"10\" fill=\"#766f64\">queue</text><path d=\"M34 94h48\" stroke=\"#b65f45\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M34 104h32\" stroke=\"#2b2f2a\" stroke-opacity=\".28\" stroke-width=\"3\" stroke-linecap=\"round\"/>",
		"<rect x=\"126\" y=\"44\" width=\"88\" height=\"78\" rx=\"8\" fill=\"#f8f1e5\" stroke=\"#2b2f2a\" stroke-opacity=\"0.12\"/><circle cx=\"154\" cy=\"82\" r=\"18\" fill=\"none\" stroke=\"#b65f45\" stroke-width=\"7\" stroke-opacity=\".65\"/><path d=\"M184 66v36M196 76v26\" stroke=\"#2b2f2a\" stroke-opacity=\".24\" stroke-width=\"6\" stroke-linecap=\"round\"/>",
		"<rect x=\"234\" y=\"58\" width=\"84\" height=\"52\" rx=\"8\" fill=\"#f8f1e5\" stroke=\"#2b2f2a\" stroke-opacity=\"0.12\"/><path d=\"M250 92 266 76l16 10 20-22\" fill=\"none\" stroke=\"#b65f45\" stroke-width=\"3\"/><circle cx=\"250\" cy=\"92\" r=\"3\" fill=\"#b65f45\"/><circle cx=\"302\" cy=\"64\" r=\"3\" fill=\"#b65f45\"/>",
		"<rect x=\"24\" y=\"142\" width=\"290\" height=\"48\" rx=\"9\" fill=\"#f8f1e5\" stroke=\"#2b2f2a\" stroke-opacity=\"0.12\"/><circle cx=\"50\" cy=\"166\" r=\"12\" fill=\"#2b2f2a\" fill-opacity=\".18\"/><path d=\"M76 157h80M76 174h54M178 157h58M178 174h106\" stroke=\"#2b2f2a\" stroke-opacity=\".24\" stroke-width=\"4\" stroke-linecap=\"round\"/>"
	].join("")}
  <path d="M113.33 0v220M226.67 0v220" stroke="#766f64" stroke-opacity="0.36" stroke-dasharray="7 9"/>
</svg>`;
}
function qe(e, t, n = "idle") {
	let r = e.split("\n").slice(0, t === "baked" ? 7 : 6).map((e, t) => `<text x="16" y="${23 + t * 14}" font-family="SF Mono, SFMono-Regular, Menlo, Consolas, monospace" font-size="10.4" fill="#252922">${q(e)}</text>`).join(""), i = t === "interactive" ? "#b65f45" : t === "baked" ? "#766f64" : "#2b2f2a", a = t === "interactive" ? "#766f64" : i, o = t === "interactive" ? n === "clicked" ? "Clicked" : "Tap" : t === "baked" ? "Frozen" : "View";
	return `
<svg xmlns="http://www.w3.org/2000/svg" width="248" height="148" viewBox="0 0 248 148">
  <defs>
    <pattern id="kozo" width="22" height="22" patternUnits="userSpaceOnUse">
      <path d="M0 11h22M11 0v22" stroke="#2b2f2a" stroke-opacity="0.055" stroke-width="1"/>
    </pattern>
    <filter id="paperNoise" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018 0.06" numOctaves="3" seed="11" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.1"/></feComponentTransfer>
      <feBlend in="SourceGraphic" mode="multiply"/>
    </filter>
  </defs>
  <rect width="248" height="148" fill="#f3ead8"/>
  <rect width="248" height="148" fill="url(#kozo)"/>
  <path d="M88 0v148" stroke="${a}" stroke-opacity="0.42" stroke-width="1.4" stroke-dasharray="5 7"/>
  <g filter="url(#paperNoise)">${r}</g>
  ${t === "interactive" ? `<rect x="52" y="96" width="72" height="28" fill="${i}"/><text x="88" y="114" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#f7f1e4">${o}</text>` : `<text x="194" y="114" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="${i}">${o}</text>`}
</svg>`;
}
async function Je() {
	let t = w({
		mode: "static-view",
		host: Ne,
		paper: {
			width: 260,
			height: 260
		},
		snapshot: {
			id: "square-collapse",
			width: 260,
			height: 260,
			url: X(Ge())
		},
		foldOps: [
			{
				id: "corner-tl",
				targetNodeId: e,
				childNodeId: "corner-tl-panel",
				line: {
					a: {
						x: -10,
						y: 80
					},
					b: {
						x: 80,
						y: -10
					}
				},
				movingSide: 1,
				angleDeg: 58
			},
			{
				id: "corner-tr",
				targetNodeId: e,
				childNodeId: "corner-tr-panel",
				line: {
					a: {
						x: 180,
						y: -10
					},
					b: {
						x: 270,
						y: 80
					}
				},
				movingSide: 1,
				angleDeg: 58
			},
			{
				id: "corner-br",
				targetNodeId: e,
				childNodeId: "corner-br-panel",
				line: {
					a: {
						x: 270,
						y: 180
					},
					b: {
						x: 180,
						y: 270
					}
				},
				movingSide: 1,
				angleDeg: 58
			},
			{
				id: "corner-bl",
				targetNodeId: e,
				childNodeId: "corner-bl-panel",
				line: {
					a: {
						x: 80,
						y: 270
					},
					b: {
						x: -10,
						y: 180
					}
				},
				movingSide: 1,
				angleDeg: 58
			},
			{
				id: "square-mid-up",
				targetNodeId: e,
				childNodeId: "square-top-half",
				line: {
					a: {
						x: 0,
						y: 130
					},
					b: {
						x: 260,
						y: 130
					}
				},
				movingSide: -1,
				angleDeg: -44
			}
		]
	});
	await t.mount(), Ne.dataset.rendered = "true";
	let n = w({
		mode: "static-view",
		host: Pe,
		paper: {
			width: 340,
			height: 220
		},
		snapshot: {
			id: "complex-dom-graphic",
			width: 340,
			height: 220,
			url: X(Ke())
		},
		foldOps: [{
			id: "complex-left-fold",
			targetNodeId: e,
			childNodeId: "complex-mid-panel",
			line: {
				a: {
					x: 113.33,
					y: 0
				},
				b: {
					x: 113.33,
					y: 220
				}
			},
			movingSide: 1,
			angleDeg: -34
		}, {
			id: "complex-right-fold",
			targetNodeId: "complex-mid-panel",
			childNodeId: "complex-right-panel",
			line: {
				a: {
					x: 226.67,
					y: 0
				},
				b: {
					x: 226.67,
					y: 220
				}
			},
			movingSide: 1,
			angleDeg: 38
		}]
	});
	await n.mount(), Pe.dataset.rendered = "true";
	let r = performance.now(), i = (e) => {
		let a = (Math.sin((e - r) / 1300) + 1) / 2, o = a * a * (3 - 2 * a), s = 12 + o * 54, c = -8 - o * 42;
		for (let e of [
			"corner-tl",
			"corner-tr",
			"corner-br",
			"corner-bl"
		]) t.setAngle(e, s);
		t.setAngle("square-mid-up", c), n.setAngle("complex-left-fold", -12 - o * 34), n.setAngle("complex-right-fold", 12 + o * 34), requestAnimationFrame(i);
	};
	requestAnimationFrame(i);
}
async function Ye() {
	let t = I.querySelector(".live-card-source");
	t && (await w({
		mode: "interactive-bridge",
		host: I,
		sourceRoot: t,
		paper: {
			width: 300,
			height: 144
		},
		foldOps: [{
			id: "live-first-third-fold",
			targetNodeId: e,
			childNodeId: "live-right-panel",
			line: {
				a: {
					x: 100,
					y: 0
				},
				b: {
					x: 100,
					y: 144
				}
			},
			movingSide: 1,
			angleDeg: -45
		}, {
			id: "live-second-third-fold",
			targetNodeId: "live-right-panel",
			childNodeId: "live-last-third-panel",
			line: {
				a: {
					x: 200,
					y: 0
				},
				b: {
					x: 200,
					y: 144
				}
			},
			movingSide: 1,
			angleDeg: 45
		}],
		snapshotProvider: new x({
			id: "live-mirror-unused-snapshot",
			width: 300,
			height: 144,
			url: ""
		}),
		visual: {
			backend: "live-mirror",
			pseudoStates: {
				hover: !0,
				active: !0
			}
		}
	}).mount(), I.dataset.liveMirrorReady = "true");
}
var Z = [{
	id: "code-button-fold",
	targetNodeId: e,
	childNodeId: "code-right-panel",
	line: {
		a: {
			x: 88,
			y: 0
		},
		b: {
			x: 88,
			y: 148
		}
	},
	movingSide: 1,
	angleDeg: -45
}];
async function Xe() {
	let e = Array.from(document.querySelectorAll("[data-code-fold]"));
	await Promise.all(e.map(async (e, t) => {
		let n = e.dataset.exampleMode || "static", r = e.querySelector(".code-fold-source"), i = r?.textContent?.trim() || "", a = (r = e.dataset.bridgeStatus || "idle") => ({
			id: `code-example-${n}-${t}`,
			width: 248,
			height: 148,
			url: `data:image/svg+xml,${encodeURIComponent(qe(i, n, r))}`
		});
		if (n === "interactive") {
			let t = a(), n = new x(t), i = e.querySelector("[data-example-action]");
			i?.addEventListener("click", () => {
				e.dataset.bridgeStatus = "clicked", t.url = a("clicked").url, o.setAngle("code-button-fold", -45);
			});
			let o = w({
				mode: "interactive-bridge",
				host: e,
				sourceRoot: r,
				paper: {
					width: 248,
					height: 148
				},
				foldOps: Z,
				snapshotProvider: n
			});
			e.addEventListener("pointerup", (t) => {
				let n = e.getBoundingClientRect(), r = t.clientX - n.left, a = t.clientY - n.top;
				r >= 0 && r <= 124 && a >= 0 && a <= 148 && i?.click();
			}), await o.mount();
		} else if (n === "baked") {
			let t = w({
				mode: "baked-view",
				host: e,
				manifest: le({
					paper: {
						width: 248,
						height: 148
					},
					snapshot: a(),
					foldOps: Z
				})
			});
			await t.mount(), e.dataset.bakedAngleMutable = String(t.setAngle("code-button-fold", 0));
		} else await w({
			mode: "static-view",
			host: e,
			paper: {
				width: 248,
				height: 148
			},
			snapshot: a(),
			foldOps: Z
		}).mount();
		e.dataset.rendered = "true";
	}));
}
var Q = w({
	mode: "interactive-bridge",
	host: T,
	sourceRoot: T.querySelector(".card-source"),
	paper: {
		width: 420,
		height: 220
	},
	foldOps: Re,
	snapshotProvider: new x(J)
}), $ = !0;
await Q.mount(), Ie(z.value), await Ye(), await Je(), await Xe(), Ze();
function Ze() {
	let e = performance.now();
	P.dataset.intro = "folding", delete P.dataset.toolsReady;
	let t = (n) => {
		let r = Math.min(1, (n - e) / 950), i = 1 - (1 - r) ** 3, a = Math.round(-60 + 60 * i);
		if (V["center-valley"] = a, Q.setAngle("center-valley", a), P.dataset.centerAngle = String(a), r < 1) {
			requestAnimationFrame(t);
			return;
		}
		V["center-valley"] = 0, Q.setAngle("center-valley", 0), P.dataset.centerAngle = "0", P.dataset.toolsReady = "true", delete P.dataset.intro, G();
	};
	requestAnimationFrame(t);
}
E.addEventListener("click", () => {
	$ = !$, V["center-valley"] = 0, V["corner-mountain"] = $ ? 48 : 0, Q.setAngle("center-valley", V["center-valley"]), Q.setAngle("corner-mountain", V["corner-mountain"]), G(), U(H, V[H]);
});
//#endregion

//# sourceMappingURL=main.js.map