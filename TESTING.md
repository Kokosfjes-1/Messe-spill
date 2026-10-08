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

The current test version experiments with a 3–2–1 countdown, device-aware
instructions, near-miss feedback, difficulty milestone messages, stronger
game-over effects, enemy entry warnings, a moving grid, and an unattended demo
after 30 seconds of inactivity. The demo stays at the 30-second difficulty,
uses predictive automatic movement, hides the timer, and displays the local top
three. A demo collision uses the normal impact animation before automatically
restarting. Any pointer press or key press during the demo starts a real run.
Use **Ta opp demo** to start a real run while recording player positions and
enemy spawns at 30 samples per second. The recording is saved in localStorage
when the player is hit or **Stopp og lagre** is pressed. Automatic and manual
demo mode replay the saved run exactly; the automatic AI remains the fallback
until a recording exists. Recordings preserve their original aspect ratio and
game-unit scale when replayed at another resolution. V1 recordings infer that
information from their edge spawns; new V2 recordings store it explicitly. The
other test-only button starts or stops the demo immediately.

Press **Eksporter demo** to download the active recording as
`demo-recording.json`. To bundle it permanently with the test site, place that
file at `test/demo-recording.json` and refresh `/test/`. Test mode automatically
loads the bundled file when the browser has no local recording. Commit
that JSON file with the site to make the recording available on other devices.

The slow-motion power and its fuel HUD have been removed. Sandbox pause uses
**Space**. The current test build is marked **V0.113** in the bottom-right corner.

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
