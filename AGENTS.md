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

## Outro Ângulo architecture
- Authorization lives in Postgres RLS + security-definer helpers (has_role, is_enrolled); UI gates are cosmetic. Why: user asked for server-side enforcement.
- Roles live only in public.user_roles; admins cannot change their own roles/enrollments (policy `user_id <> auth.uid()`). Why: prevent self-escalation.
- Lesson rows are readable only by enrolled users, previews, or admins; public outlines go through the `course_outline` RPC (titles only). Why: no private content leakage via catalog.
- Video is stored as provider + id/url, parsed in src/lib/video.ts into an allowlisted embed; never raw HTML. Why: XSS safety.
- Accessing user e-mails is admin-only via src/lib/admin.functions.ts (service role loaded inside handler after role check). Why: e-mails never exposed to members.
- Editable institutional content (founders, offer, support) lives in public.site_settings. Why: admins edit without code.
- AI calls go through server functions (src/lib/*.functions.ts) to the AI Gateway Responses API, output validated against known data (e.g. trail titles). Why: keep keys server-side and avoid invented content.
- Public gestor profiles use one typed template (src/lib/gestores.ts) rendered by /gestores and /gestor/$slug; "[...]" values are placeholders shown as unconfirmed. Why: add gestores without redesign and never invent facts.
- Public tools (src/components/tools) are deterministic client-side calculators with no AI and no persistence. Why: transparent results, no fake certainty, visitor data never stored.
- Interactive courses are defined as data (src/lib/learning/*) and rendered by reusable blocks; member work saves to learning_outputs (owner-only, write requires enrollment or staff). Gestor questions go to gestor_questions queue. Why: new courses without new layouts, private work by default.
