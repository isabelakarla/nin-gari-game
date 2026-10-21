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

- Keep canvas physics and level progression in the JavaScript game engine, with the final arena combat isolated in BossBattle; this keeps combat rules independently testable without a UI framework or animation timers.
- Use the shared `btn-pixel` CSS class for pixel-button styling; preserve the retro design while keeping native HTML interaction markup consistent.
