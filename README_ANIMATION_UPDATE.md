# Animation synchronization update

Both pages continue to use the same stylesheet:

- Production: `docs/css/site.css`
- Local editor: `../docs/css/site.css`

The shared animation rules now provide:

- All four impact cards: move upward 5px with the existing shadow.
- All six capability cards: exactly the same upward movement and shadow.
- Every engagement row: moves 8px to the right.
- The engagement chevron: moves an additional 6px to the right.

No animation rules are duplicated in `local-editor/editor.css`.
