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

- Keep canvas physics and level progression in the game engine, with the final arena combat isolated in BossBattle; this keeps combat rules independently testable without React or animation timers.
- Use the existing pixel-button appearance through a shared React control; preserve the retro design while keeping interaction markup consistent.
