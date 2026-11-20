# Changelog

## 1.0.0

- Packaged as an installable bundle (`dsh.bundle.patch`) with title, description, detail image and icon, so it appears in **Plugins** and can be enabled, disabled or removed there.
- Same behavior as the 0.1.0 local prototype: a **Grid (3 columns)** item in the workspace view options menu, tile layout for workspaces without sessions, accent highlight for the opened workspace and the selected session, and the sidebar opened at its 420px maximum on startup.
- The menu label follows the browser language (Chinese or English).
- The injected menu item now also updates its accessible label and, when the row is checkable, `aria-checked`.
- The toggle still reads and writes `dsh.workspaceGrid.enabled`, so the existing state is kept.

## 0.1.0

- Local prototype mounted from `~/.dsh/local-plugins/workspace-grid` by a hand-written patch line.
