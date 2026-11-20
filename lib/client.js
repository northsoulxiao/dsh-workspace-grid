/**
 * Browser half of dsh-workspace-grid.
 *
 * Adds one entry to the workspace "view options" menu and, while it is on,
 * lays the workspace list out as a three-column tile grid. Everything is
 * derived from the host's own DOM nodes and CSS-module class suffixes, so the
 * plugin never depends on build hashes. When a selector stops matching, the
 * view simply stays one column instead of breaking the sidebar.
 */
window.__ModuleLoader__.load({
	id: "dsh-workspace-grid",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		var STORE_KEY = "dsh.workspaceGrid.enabled";
		var ATTR = "data-dsh-workspace-grid";

		function prefersZh() {
			try {
				var tags = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
				for (var i = 0; i < tags.length; i++) if (/^zh/i.test(String(tags[i] || ""))) return true;
			} catch (e) {}
			try {
				return /^zh/i.test(document.documentElement.lang || "");
			} catch (e) {
				return false;
			}
		}

		var LABEL = prefersZh() ? "九宫格（3 列）" : "Grid (3 columns)";
		var GROUP_LABEL = /分组方式|Group by/i;
		var SIDEBAR_MAX = 420;
		var GRID_ICON =
			'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" stroke="currentColor" stroke-width="1"><rect x="2" y="2" width="4.2" height="4.2" rx="1"></rect><rect x="9.8" y="2" width="4.2" height="4.2" rx="1"></rect><rect x="2" y="9.8" width="4.2" height="4.2" rx="1"></rect><rect x="9.8" y="9.8" width="4.2" height="4.2" rx="1"></rect></svg>';

		var ACCENT = "var(--dsw-alias-state-business-primary,#4d6bfe)";
		var SCOPE = 'html[data-dsh-workspace-grid="on"] [data-slot="sidebar.workspaces"] [role="tree"]';
		var TILE = SCOPE + ' > [class*="groupSection"]:not(:has([class*="sessionRow"])):not(:has([class*="groupSection"]))';

		var CSS = [
			/* the workspace list becomes a three-column grid */
			SCOPE + ':has(> [class*="groupSection"]){display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px 4px;align-content:start}',
			SCOPE + ' > [class*="groupSection"]{min-width:0;margin-top:0}',
			SCOPE + ' > [class*="groupSection"] > span{display:block;min-width:0}',
			/* a workspace that holds sessions (or child workspaces) keeps a full row */
			SCOPE + ' > [class*="groupSection"]:has([class*="sessionRow"]),' +
				SCOPE + ' > [class*="groupSection"]:has([class*="sessionOverflowButton"]),' +
				SCOPE + ' > [class*="groupSection"]:has([class*="groupSection"]){grid-column:1/-1}',
			/* an empty workspace is a compact tile */
			TILE + ' [class*="projectRow"]{box-sizing:border-box;height:auto;min-height:60px;flex-direction:column;justify-content:center;align-items:center;gap:4px;padding:8px 4px;padding-inline-start:4px;text-align:center;background:rgba(28,29,33,.035);border-radius:8px}',
			TILE + ' [class*="projectRow"]:hover{background:rgba(28,29,33,.075)}',
			'body[data-ds-dark-theme] ' + TILE + ' [class*="projectRow"]{background:rgba(255,255,255,.06)}',
			'body[data-ds-dark-theme] ' + TILE + ' [class*="projectRow"]:hover{background:rgba(255,255,255,.12)}',
			/* inside a tile: no chevron, no hover action buttons */
			TILE + ' [class*="projectRow"] [class*="chevron"]{display:none!important}',
			TILE + ' [class*="projectRow"] [class*="rowActions"]{display:none!important}',
			TILE + ' [class*="projectRow"] [class*="folder"]{display:inline-flex!important;width:100%;height:18px;justify-content:center}',
			TILE + ' [class*="projectRow"] [class*="projectText"]{width:100%;flex:none;align-items:center}',
			TILE + ' [class*="projectRow"] [class*="projectText"] [class*="title"]{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;white-space:normal;overflow:hidden;text-overflow:clip;overflow-wrap:break-word;word-break:keep-all;width:100%;font-size:11px;line-height:13px;text-align:center}',
			/* an opened workspace is highlighted, so open and closed differ at a glance */
			SCOPE + ' [class*="projectRow"][aria-expanded="true"]{background:color-mix(in srgb,' + ACCENT + ' 14%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,' + ACCENT + ' 42%,transparent);border-radius:8px}',
			SCOPE + ' [class*="projectRow"][aria-expanded="true"] [class*="folder"],' + SCOPE + ' [class*="projectRow"][aria-expanded="true"] [class*="title"]{color:' + ACCENT + '}',
			SCOPE + ' [class*="projectRow"][aria-expanded="true"] [class*="title"]{font-weight:500}',
			/* the selected session gets the same accent treatment */
			SCOPE + ' [class*="sessionRow"][class*="selected"]{background:color-mix(in srgb,' + ACCENT + ' 12%,transparent);border-radius:8px}',
			SCOPE + ' [class*="sessionRow"][class*="selected"] [class*="title"]{color:' + ACCENT + ';font-weight:500}',
		].join("\n");

		// ---------------------------------------------------------------
		// persisted state
		// ---------------------------------------------------------------
		function readEnabled() {
			try {
				return localStorage.getItem(STORE_KEY) === "1";
			} catch (e) {
				return false;
			}
		}

		function writeEnabled(value) {
			try {
				localStorage.setItem(STORE_KEY, value ? "1" : "0");
			} catch (e) {}
		}

		var enabled = readEnabled();
		var styleEl = null;

		function applyState() {
			var root = document.documentElement;
			if (enabled) root.setAttribute(ATTR, "on");
			else root.removeAttribute(ATTR);
		}

		function ensureStyle(doc) {
			if (styleEl && styleEl.isConnected) return styleEl;
			styleEl = doc.createElement("style");
			styleEl.dataset.dshWorkspaceGrid = "";
			styleEl.textContent = CSS;
			doc.head.appendChild(styleEl);
			return styleEl;
		}

		function setEnabled(value) {
			enabled = value;
			writeEnabled(value);
			applyState();
		}

		// ---------------------------------------------------------------
		// sidebar width: open the frame at the contract's maximum width
		// ---------------------------------------------------------------
		function frameElement() {
			var frame = document.querySelector('[class*="_frame"]');
			if (frame) return frame;
			var handle = document.querySelector('[data-side="sidebar"]');
			return handle ? handle.parentElement : null;
		}

		function currentSidebarWidth() {
			var frame = frameElement();
			if (!frame) return 0;
			var track = String(getComputedStyle(frame).gridTemplateColumns || "").split(" ")[0];
			var value = parseFloat(track);
			return isNaN(value) ? 0 : value;
		}

		/**
		 * Drive the frame's own sidebar drag handle to the contract maximum, so the
		 * width lands in the layout store exactly like a user drag (clamping,
		 * animations and later manual drags all keep working).
		 */
		function defaultSidebarToMax() {
			try {
				if (document.querySelector("[data-sidebar-collapsed]")) return false;
				var handle = document.querySelector('[data-side="sidebar"]');
				if (!handle) return false;
				var current = currentSidebarWidth();
				if (!(current > 0) || current >= SIDEBAR_MAX - 1) return true;
				var dx = SIDEBAR_MAX - current;
				var setCapture = handle.setPointerCapture;
				var hasCapture = handle.hasPointerCapture;
				var releaseCapture = handle.releasePointerCapture;
				handle.setPointerCapture = function () {};
				handle.hasPointerCapture = function () {
					return false;
				};
				handle.releasePointerCapture = function () {};
				function fire(type, clientX) {
					handle.dispatchEvent(
						new PointerEvent(type, {
							bubbles: true,
							cancelable: true,
							pointerId: 4242,
							pointerType: "mouse",
							isPrimary: true,
							button: 0,
							buttons: type === "pointerup" ? 0 : 1,
							clientX: clientX,
							clientY: 10,
						})
					);
				}
				try {
					fire("pointerdown", 0);
					fire("pointermove", dx);
					fire("pointerup", dx);
				} finally {
					handle.setPointerCapture = setCapture;
					handle.hasPointerCapture = hasCapture;
					handle.releasePointerCapture = releaseCapture;
				}
				return true;
			} catch (e) {
				return false;
			}
		}

		var widthTries = 0;

		function ensureSidebarWidth() {
			if (defaultSidebarToMax()) return;
			widthTries += 1;
			if (widthTries < 40) setTimeout(ensureSidebarWidth, 250);
		}

		// ---------------------------------------------------------------
		// view-options menu entry
		// ---------------------------------------------------------------
		function isMenu(menu) {
			return menu && menu.getAttribute && menu.getAttribute("role") === "menu" && (menu.className || "").indexOf("viewOptionsMenu") >= 0;
		}

		function isPlainLabel(el) {
			return el.children.length === 0 && (el.textContent || "").trim() !== "";
		}

		function injectMenu(menu) {
			if (!isMenu(menu) || menu.dataset.wgPatched === "1") return;
			var viewport = menu.querySelector('[class*="viewport"]') || menu;
			var kids = Array.prototype.slice.call(viewport.children);
			var labelIndex = -1;
			for (var i = 0; i < kids.length; i++) {
				if (isPlainLabel(kids[i]) && GROUP_LABEL.test(kids[i].textContent || "")) {
					labelIndex = i;
					break;
				}
			}
			if (labelIndex < 0) return;

			var lastRow = null;
			var selectedRow = null;
			for (var j = labelIndex + 1; j < kids.length; j++) {
				if (isPlainLabel(kids[j])) break;
				if (kids[j].querySelector('[role="menuitem"]')) {
					lastRow = kids[j];
					if (kids[j].querySelector('[class*="check"]')) selectedRow = kids[j];
				}
			}
			if (!lastRow) return;

			var row = (selectedRow || lastRow).cloneNode(true);
			var labelEl = row.querySelector('[class*="itemLabel"]');
			if (labelEl) labelEl.textContent = LABEL;
			var iconEl = row.querySelector('[class*="itemIcon"]');
			if (iconEl) iconEl.innerHTML = GRID_ICON;
			var checkEl = row.querySelector('[class*="check"]');
			var button = row.querySelector("button");
			if (!button) return;
			if (button.getAttribute("aria-label")) button.setAttribute("aria-label", LABEL);

			var selectedClass = null;
			for (var c = 0; c < button.classList.length; c++) if (/selected/i.test(button.classList[c])) selectedClass = button.classList[c];
			function syncRow() {
				if (selectedClass) {
					if (enabled) button.classList.add(selectedClass);
					else button.classList.remove(selectedClass);
				}
				if (checkEl) checkEl.style.visibility = enabled ? "visible" : "hidden";
				var role = button.getAttribute("role") || "";
				if (role.indexOf("checkbox") >= 0 || role.indexOf("radio") >= 0) button.setAttribute("aria-checked", enabled ? "true" : "false");
			}
			syncRow();

			button.addEventListener("click", function (event) {
				event.preventDefault();
				event.stopPropagation();
				setEnabled(!enabled);
				syncRow();
				closeMenu();
			});

			lastRow.parentNode.insertBefore(row, lastRow.nextSibling);
			menu.dataset.wgPatched = "1";
		}

		function isViewOptionsTrigger(el) {
			if (!el || !el.getAttribute || el.tagName !== "BUTTON") return false;
			return /视图选项|view options/i.test(el.getAttribute("aria-label") || "");
		}

		function viewOptionsTrigger() {
			var scope = document.querySelector('[data-slot="sidebar.workspaces"]');
			if (!scope) return null;
			var buttons = Array.prototype.slice.call(scope.querySelectorAll("button"));
			for (var i = 0; i < buttons.length; i++) if (isViewOptionsTrigger(buttons[i])) return buttons[i];
			return null;
		}

		function closeMenu() {
			var trigger = viewOptionsTrigger();
			if (trigger) trigger.click();
			else document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		}

		var observer = null;

		function scanForMenus(node) {
			if (!node || node.nodeType !== 1) return;
			if (isMenu(node)) injectMenu(node);
			var menus = node.querySelectorAll ? node.querySelectorAll('[role="menu"]') : [];
			for (var i = 0; i < menus.length; i++) injectMenu(menus[i]);
		}

		function startObserver(doc) {
			if (observer) return;
			observer = new MutationObserver(function (mutations) {
				for (var i = 0; i < mutations.length; i++) {
					var added = mutations[i].addedNodes;
					for (var j = 0; j < added.length; j++) scanForMenus(added[j]);
				}
			});
			observer.observe(doc.body, { childList: true, subtree: true });
		}

		// ---------------------------------------------------------------
		// plugin lifecycle
		// ---------------------------------------------------------------
		function apply(ctx) {
			applyState();
			ensureStyle(document);
			startObserver(document);
			scanForMenus(document.body);
			ensureSidebarWidth();
			ctx.effect(function () {
				return function () {
					if (observer) observer.disconnect();
					observer = null;
					if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
					styleEl = null;
					document.documentElement.removeAttribute(ATTR);
				};
			}, "workspace-grid: cleanup");
			console.log("[workspace-grid] mounted, enabled=" + enabled);
		}

		exports.apply = apply;
		exports.inject = [];
		exports.name = "workspace-grid";
		return module.exports;
	}
});
