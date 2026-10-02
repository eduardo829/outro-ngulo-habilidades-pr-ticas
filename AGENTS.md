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
