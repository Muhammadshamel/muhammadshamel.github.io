# Synchronized Production and Local Editor

The repository structure is unchanged:

- `docs/` is the public GitHub Pages site.
- `local-editor/` is the private local editor.

Both pages now load the same visual stylesheet:

- Production: `docs/css/site.css`
- Editor: `../docs/css/site.css`

`local-editor/editor.css` contains only editor controls and does not redefine website cards or animations. This keeps the impact cards, capability cards, engagement rows, arrow movement, buttons, spacing, responsive rules, and other visual behavior identical in production and editing mode.

Test locally from the repository root:

```powershell
python -m http.server 8080
```

Open:

- Production: `http://localhost:8080/docs/`
- Editor: `http://localhost:8080/local-editor/`
