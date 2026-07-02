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
	let t = e[0], n = e[1], r = e[2], i = e[4], a = e[5], o = e[6], s = e[8], c = e[9], l = e[10], u = e[3], d = e[7], f = e[11];
	return [
		t,
		i,
		s,
		-(t * u + i * d + s * f),
		n,
		a,
		c,
		-(n * u + a * d + c * f),
		r,
		o,
		l,
		-(r * u + o * d + l * f),
		0,
		0,
		0,
		1
	].map((e) => Math.abs(e) < 1e-12 ? 0 : Number(e.toFixed(12)));
}
function m(e) {
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
	].map((t) => h(e[t])).join(", ")})`;
}
function h(e) {
	return String(Math.abs(e) < 1e-12 ? 0 : Number(e.toFixed(12)));
}
function g(e, t) {
	let n = {
		x: e.b.x - e.a.x,
		y: e.b.y - e.a.y,
		z: 0
	};
	return d(d(l(e.a.x, e.a.y, 0), u(n, t)), l(-e.a.x, -e.a.y, 0));
}
function _(t) {
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
		let s = g(e.line, e.angleDeg);
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
	for (let e of Object.values(n)) e.projectedPolygon = x(e);
	return {
		rootId: e,
		nodes: n,
		renderOrder: Object.values(n).sort((e, t) => e.depth - t.depth).map((e) => e.id),
		invalidOps: i
	};
}
function v(e) {
	return `polygon(${e.map((e) => `${e.x}px ${e.y}px`).join(", ")})`;
}
function y(e, t, n) {
	let r = (e.y - t.y) * (n.x - t.x) - (e.x - t.x) * (n.y - t.y);
	if (Math.abs(r) > 1e-6) return !1;
	let i = (e.x - t.x) * (n.x - t.x) + (e.y - t.y) * (n.y - t.y);
	return i < -1e-6 ? !1 : i <= (n.x - t.x) ** 2 + (n.y - t.y) ** 2 + 1e-6;
}
function b(e, t) {
	let n = !1;
	for (let r = 0, i = t.length - 1; r < t.length; i = r, r += 1) {
		let a = t[r], o = t[i];
		if (y(e, o, a)) return !0;
		a.y > e.y != o.y > e.y && e.x < (o.x - a.x) * (e.y - a.y) / (o.y - a.y || 1e-12) + a.x && (n = !n);
	}
	return n;
}
function x(e) {
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
function S(e, t, n, r) {
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
function C(e) {
	return e.every((e) => e >= -1e-6 && e <= 1.000001);
}
function w(e, t) {
	let n = t.projectedPolygon.length > 0 ? t.projectedPolygon : x(t);
	for (let r = 1; r < n.length - 1; r += 1) {
		let i = S(e, n[0], n[r], n[r + 1]);
		if (!i || !C(i)) continue;
		let a = t.polygon[0], o = t.polygon[r], s = t.polygon[r + 1];
		return {
			x: a.x * i[0] + o.x * i[1] + s.x * i[2],
			y: a.y * i[0] + o.y * i[1] + s.y * i[2]
		};
	}
	return e;
}
function T(e, t) {
	for (let n of [...t.renderOrder].reverse()) {
		let r = t.nodes[n];
		if (b(e, r.projectedPolygon)) return {
			nodeId: n,
			localPoint: w(e, r)
		};
	}
	return null;
}
function E(e, t) {
	return e.renderOrder.map((n) => {
		let r = e.nodes[n];
		return {
			nodeId: n,
			polygon: r.polygon,
			clipPath: v(r.polygon),
			transform: m(r.worldMatrix),
			backgroundPosition: "0px 0px",
			backgroundSize: `${t.width}px ${t.height}px`
		};
	});
}
function D(e) {
	let r = t(e.paper, e.camera), i = _({
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
		pieces: E(i, e.paper)
	};
}
var O = class {
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
}, k = class {
	sourceRoot;
	constructor(e) {
		this.sourceRoot = e;
	}
	elementFromLocalPoint(e) {
		let t = Array.from(this.sourceRoot.querySelectorAll("*")).reverse();
		for (let n of t) {
			let t = A(n);
			if (t && e.x >= t.x && e.x <= t.x + t.width && e.y >= t.y && e.y <= t.y + t.height) return n;
		}
		return this.sourceRoot;
	}
	dispose() {}
};
function A(e) {
	let t = getComputedStyle(e), n = j(e.style.left || t.left), r = j(e.style.top || t.top), i = j(e.style.width || t.width), a = j(e.style.height || t.height);
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
function j(e) {
	let t = Number.parseFloat(e);
	return Number.isFinite(t) ? t : 0;
}
var M = class {
	snapshot;
	constructor(e) {
		this.snapshot = e;
	}
	async capture() {
		return this.snapshot;
	}
}, N = class {
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
}, P = class {
	name = "AnchorAdapter";
	match(e) {
		return e instanceof HTMLAnchorElement;
	}
	pointerUp(e) {
		return e.sourceTarget.click(), !0;
	}
}, F = class {
	name = "PointerSyntheticAdapter";
	match() {
		return !0;
	}
	pointerDown(e) {
		return R(e.sourceTarget, "pointerdown"), !0;
	}
	pointerMove(e) {
		return R(e.sourceTarget, "pointermove"), !0;
	}
	pointerUp(e) {
		return R(e.sourceTarget, "pointerup"), !0;
	}
}, I = class {
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
		let t = e.sourceTarget, n = L(t);
		if (!n) return !1;
		let r = t.cloneNode(!1);
		r.removeAttribute("id"), r.classList.add("ori-input-proxy"), r.value = t.value, r.style.position = "absolute", r.style.left = t.style.left || "0px", r.style.top = t.style.top || "0px", r.style.width = t.style.width || `${t.getBoundingClientRect().width}px`, r.style.height = t.style.height || `${t.getBoundingClientRect().height}px`, r.style.pointerEvents = "auto", n.replaceChildren(r);
		let i = () => {
			t.value = r.value, t.dispatchEvent(new Event("input", { bubbles: !0 }));
		};
		return r.addEventListener("input", i), r.addEventListener("blur", () => {
			i(), t.dispatchEvent(new Event("change", { bubbles: !0 }));
		}, { once: !0 }), r.focus(), r.setSelectionRange?.(r.value.length, r.value.length), !0;
	}
};
function L(e) {
	return e.closest(".ori-source-layer")?.parentElement?.querySelector(":scope > .ori-activation-layer") ?? null;
}
function R(e, t) {
	let n = typeof PointerEvent == "function" ? PointerEvent : Event;
	e.dispatchEvent(new n(t, { bubbles: !0 }));
}
var z = class {
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
		}, this.tree = _(this.state), H(e.host, "static-view", this.state.camera), this.renderer = new O(U(e.host, "ori-visual-layer")), this.renderer.setSnapshot(e.snapshot);
	}
	async mount() {
		this.render();
	}
	render() {
		this.renderer.renderPieces(E(this.tree, this.state.paper), this.state.paper, !1);
	}
	setAngle(e, t) {
		let n = this.state.foldOps.find((t) => t.id === e);
		return n ? (n.angleDeg = t, this.tree = _(this.state), this.render(), !0) : !1;
	}
	dispose() {
		this.options.host.innerHTML = "";
	}
}, B = class {
	options;
	mode = "baked-view";
	renderer;
	constructor(e) {
		this.options = e, H(e.host, "baked-view", e.manifest.camera), e.host.dataset.oriBaked = "true", this.renderer = new O(U(e.host, "ori-visual-layer")), this.renderer.setSnapshot(e.manifest.snapshot);
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
}, V = class {
	options;
	mode = "interactive-bridge";
	state;
	tree;
	source;
	renderer;
	adapters;
	interactionLayer;
	snapshot = null;
	constructor(e) {
		this.options = e, this.state = {
			paper: e.paper,
			camera: t(e.paper, e.camera),
			foldOps: n(e.foldOps ?? []),
			controls: {}
		}, this.tree = _(this.state), this.adapters = [
			...e.adapters ?? [],
			new I(),
			new N(),
			new P()
		], this.source = new k(e.sourceRoot), H(e.host, "interactive-bridge", this.state.camera), U(e.host, "ori-source-layer").appendChild(e.sourceRoot), this.renderer = new O(U(e.host, "ori-visual-layer")), this.interactionLayer = U(e.host, "ori-interaction-layer"), U(e.host, "ori-activation-layer");
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
		this.snapshot = await this.options.snapshotProvider.capture(this.options.sourceRoot, this.state.paper), this.renderer.setSnapshot(this.snapshot), this.render(), this.interactionLayer.addEventListener("pointerdown", this.onLayerPointer), this.interactionLayer.addEventListener("pointermove", this.onLayerPointer), this.interactionLayer.addEventListener("pointerup", this.onLayerPointer);
	}
	render() {
		this.snapshot && this.renderer.renderPieces(E(this.tree, this.state.paper), this.state.paper, !1);
	}
	setAngle(e, t) {
		let n = this.state.foldOps.find((t) => t.id === e);
		return n ? (n.angleDeg = t, this.tree = _(this.state), this.render(), !0) : !1;
	}
	setMode(e) {
		this.options.host.dataset.oriMode = e;
	}
	bridgePointer(e) {
		let t = T({
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
		}, i = e.type === "pointerdown" ? "pointerDown" : e.type === "pointermove" ? "pointerMove" : e.type === "pointerup" || e.type === "click" ? "pointerUp" : void 0;
		if (i) for (let e of this.adapters) {
			let t = e[i];
			if (e.match(n) && t?.call(e, r)) return !0;
		}
		return R(n, e.type), !0;
	}
	dispose() {
		this.interactionLayer.removeEventListener("pointerdown", this.onLayerPointer), this.interactionLayer.removeEventListener("pointermove", this.onLayerPointer), this.interactionLayer.removeEventListener("pointerup", this.onLayerPointer), this.source.dispose(), this.snapshot?.revoke?.(), this.options.host.innerHTML = "";
	}
};
function H(e, t, n) {
	e.dataset.oriMode = t, e.style.position = e.style.position || "relative", e.style.perspective = `${n.perspective}px`, e.style.perspectiveOrigin = `${n.perspectiveOrigin.x}px ${n.perspectiveOrigin.y}px`, e.style.transformStyle = "preserve-3d";
}
function U(e, t) {
	let n = e.querySelector(`:scope > .${t}`);
	if (n) return n;
	let r = document.createElement("div");
	return r.className = t, r.style.position = "absolute", r.style.inset = "0", (t === "ori-visual-layer" || t === "ori-activation-layer") && (r.style.transformStyle = "preserve-3d"), (t === "ori-visual-layer" || t === "ori-activation-layer") && (r.style.pointerEvents = "none"), e.appendChild(r), r;
}
function W(e) {
	return e.mode === "static-view" ? new z(e) : e.mode === "baked-view" ? new B(e) : new V(e);
}
var G = {
	segments: 6,
	axis: "y",
	angle: 0,
	perspective: "900px",
	hideOriginal: !1
};
function K(e = {}) {
	let t = {
		...G,
		...e
	};
	return {
		segments: Math.max(1, Math.floor(t.segments)),
		axis: t.axis,
		angle: t.angle,
		perspective: typeof t.perspective == "number" ? `${t.perspective}px` : t.perspective,
		hideOriginal: t.hideOriginal
	};
}
function q(e, t = {}) {
	let n = K(t), r = e.style.visibility;
	return e.dataset.fold3d = "attached", e.style.setProperty("--fold3d-angle", `${n.angle}deg`), e.style.setProperty("--fold3d-perspective", n.perspective), n.hideOriginal && (e.style.visibility = "hidden"), {
		element: e,
		options: n,
		setAngle(t) {
			e.style.setProperty("--fold3d-angle", `${t}deg`);
		},
		destroy() {
			delete e.dataset.fold3d, e.style.removeProperty("--fold3d-angle"), e.style.removeProperty("--fold3d-perspective"), e.style.visibility = r;
		}
	};
}
//#endregion
export { P as AnchorAdapter, N as ButtonAdapter, F as PointerSyntheticAdapter, e as ROOT_ID, M as StaticImageSnapshotProvider, I as TextInputProxyAdapter, D as buildBakedOrigamiManifest, _ as buildDerivedFoldTree, q as createFold3D, W as createOrigamiRuntime, m as cssMatrixFromMat4, T as hitTestFoldTree, f as mat4ApplyPoint, c as mat4Identity, p as mat4Invert, d as mat4Multiply, K as normalizeOptions };

//# sourceMappingURL=orikata.js.map