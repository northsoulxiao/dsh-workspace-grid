# dsh-workspace-grid

A DeepSeek Harness plugin that shows the sidebar's workspace list as a three-column tile grid.
The switch is one item in the workspace **view options** menu, next to **Group by** — no new icon or button.

## What it does

- **Off (default)**: exactly the stock one-column list.
- **Grid (3 columns)**: a workspace without sessions becomes a compact tile — folder icon on top, name centered and clamped to three lines. A workspace that holds sessions, or child workspaces under **Group by → Workspace tree**, keeps a full row, so session titles stay as wide as before.
- **The opened workspace is highlighted**: an expanded folder (`aria-expanded="true"`) gets a tinted background, an accent border and accent-colored icon and name, so opened and closed are distinguishable at a glance. Collapsing restores the plain tile.
- **The selected session uses the same accent**: the current session row gets the same treatment, so workspace → session → conversation reads as one visual trail.
- **Layout only**: clicking, drag-to-sort, the context menu, hover cards (full name and path) and new-session entries are the stock elements.
- **Sidebar opens at its maximum width (420px)**: the layout does not persist the sidebar width, so it returns to 280px on every start. On startup the plugin drives the frame's own drag handle to the layout's contract maximum. You can still drag it narrower afterwards; the plugin only sets it once per load.
- The switch state lives in browser `localStorage` (`dsh.workspaceGrid.enabled`) and survives restarts.
- Colors are theme tokens: tiles and highlights follow light and dark mode.

## Install

Install this folder as a bundle:

```
plugins → Add plugin → the absolute path of this directory
```

or, from an agent: `plugin_manager` `install_bundle` with the package directory as `target`.
The bundle patch inserts the `workspace-grid` row, so the plugin appears in **Plugins** with its own title, description and icon.

## Turn it off

- View only: open the workspace view options menu and click **Grid (3 columns)** again; the check disappears and the list returns to one column.
- Plugin level: disable the bundle in **Plugins** (or remove it). Nothing in the workspace is modified.

## Known limits

- The plugin matches the host's CSS-module class suffixes and a few `aria` attributes. If a DSH upgrade renames them, the rules stop applying and the list falls back to one column; nothing breaks.
- Keyboard arrow navigation covers the stock menu items; the injected item is used with mouse or touch.
- With **Group by → Single list** there is no workspace grouping, so the grid has nothing to lay out (the switch state is kept).

## License

MIT. See `LICENSE`.
