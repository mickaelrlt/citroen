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

- App data lives in one `items` table via src/lib/store.ts; direction is shared by all authenticated users and every other collection has owner-scoped RLS. Authenticated clients may update only the data column, preventing collection/owner changes from bypassing isolation.
- Own direction synchronization in the root authenticated-identity effect with cleanup on sign-out; use filtered INSERT/UPDATE realtime plus direction-only periodic reads for deletes, because DELETE events cannot safely filter the mixed private/shared table.
- Offer/order PDFs use the existing private `pdfs` bucket with user-prefixed paths and document metadata in the item's JSON; reuse PdfViewer so document zoom and navigation stay consistent.
- Keep order-month grouping in a pure helper passed into CrudPage's optional subgroup renderer, so other collections remain unchanged and date grouping is independently testable.
