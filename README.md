# Pocket Gridiron

An original arcade American-football game for the browser: call plays, sling passes with a
drag-and-release throw, steer the ball carrier, and manage a franchise across seasons.
No build step, no dependencies.

## Run

Open `index.html` in a browser (or serve the folder with any static server, e.g. `python3 -m http.server`).

## How to play

- **You run the offense.** Opponent drives are simulated from your Defense rating vs. their Offense.
- **Pass:** after the snap, drag backwards anywhere on the field and release. The ring is where the
  ball lands, so lead the receiver. Nearby defenders can break it up or intercept.
- **Run / after the catch:** hold on the field to steer toward your pointer, or use arrows / WASD.
- **4th down:** go for it, punt, or kick a field goal. Kicks use a timing meter (tap or space).
- **Franchise:** 10 teams, 9-week round robin, top 4 make the playoffs. Wins earn coaching points
  for roster upgrades; players age between seasons. Progress saves to `localStorage`.

## Layout

- `js/data.js` — teams, career state, schedule, season simulation, save/load
- `js/match.js` — on-field game (plays, player AI, passing, kicking, clock, rendering)
- `js/ui.js` — title, franchise hub, match launch
