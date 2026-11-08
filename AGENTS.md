<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- App data lives in one `items` table (collection + jsonb data, owner-scoped RLS) via src/lib/store.ts; pages sit under `_authenticated` — keeps per-user data synced across devices.
- Offer/order PDFs use the existing private `pdfs` bucket with user-prefixed paths and document metadata in the item's JSON; reuse PdfViewer so document zoom and navigation stay consistent.
- Keep order-month grouping in a pure helper passed into CrudPage's optional subgroup renderer, so other collections remain unchanged and date grouping is independently testable.
