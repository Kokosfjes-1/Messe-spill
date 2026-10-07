# Game test version

Type `ppa5` on the main menu or during a game to open `/test/`. Type it again
to return to the main game, or use **Avslutt** in the yellow test banner.
Shortcuts are ignored while entering a score so names cannot trigger navigation.
The existing `ppa4` sandbox tools still work during a game in either version.

`test/index.html` is an independent copy of the game. Make new gameplay and UI
changes there first; `index.html` is the production version. Test mode has normal
collisions and game-over behavior, its own local best time and top three, and no
phone-number collection. It makes no API requests, never uploads scores, and
does not read or flush production's stored entries. Test difficulty uses the
`CFG` values in `test/index.html`, independent of production admin settings.

Serve the repository over HTTP, for example with `python3 -m http.server 8000`,
then open `http://localhost:8000/`. The local static server supports the test
game without Azure; production API features require Azure Functions.

## Workflow

The current test version includes a rounded slow-motion fuel bar near the bottom,
centered at 50% screen width and 44px tall, above the test-mode banner. Hold
left-click or Space to run enemies, spawning, effects, and the timer at 60%
speed while the player keeps full movement speed with mouse, touch, or keyboard.
Fuel lasts four real seconds and recharges by one second per eight
real seconds at normal speed with both controls released (32 seconds from empty
to full).
Releasing both controls returns to normal speed linearly over 0.25 real seconds.
Fuel drains in proportion to the remaining slowdown during that transition:
a complete release costs another 0.125 seconds of fuel. Recharge starts only
after the transition ends. If fuel runs out, normal speed resumes immediately;
pressing again during a release immediately restores 60% speed if fuel remains.
Holding either control on empty keeps normal speed and prevents recharging.
Each new run starts full. Fuel does not change outside a run, while sandbox
pause is active, or while the tab is hidden. In this test version, sandbox pause
has moved to **K** so Space can activate slow motion.

1. Edit `test/index.html` and test locally. Push those changes to publish the
   test version alongside the current production game when ready.
2. Test `/test/`, including controls, game over, saving a local result, and the
   `ppa5` return shortcut. Confirm the production game still behaves as expected.
3. Once the changes are approved for production, run
   `python3 scripts/promote-test.py` from the repository root.
4. Review `git diff -- index.html`, check the main game, then commit and push.
   The existing GitHub workflow deploys pushes to `main` to Azure.

Both copies retain the URL-based test guards, so promotion restores production
scores and settings automatically at `/`. Promotion only copies the game HTML;
new assets must also be included, and test edits to shared assets would affect
production. Give experimental assets separate paths until promotion.

This is staging for the game frontend, not a separate Azure environment. Backend,
admin, and hosting changes are shared and need a separate staging deployment to
test in isolation. The shortcut is a convenience, not authentication: `/test/`
is publicly accessible and must not contain secrets.
