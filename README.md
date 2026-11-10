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
- **Read the defense.** The play-call strip sits under the field so you can see the alignment
  before you choose. The defense mixes five calls:
  - *Man* — corners 6 yards off, one deep safety. Beat it with crossing routes and speed mismatches.
  - *Press man* — corners on the line. Quick throws are tight; deep routes win if your receiver is faster.
  - *Two deep* — corners 9 yards off and bailing, safety walked up. Flats and the deep middle are open.
  - *Three deep* — both corners and the safety deep. Throw underneath.
  - *Blitz* — both linebackers creep up and nobody is deep. Get the ball out fast.
- **Franchise:** 32 teams in two conferences (American, National), each with four divisions of four.
  14-game season: 6 division games, 4 against another division in your conference, 4 against a
  division in the other conference (pairings rotate each season). Six teams per conference make
  the playoffs (four division winners plus two wild cards; top two seeds get a bye), then
  Wild Card, Divisional, Conference Championship and the Championship Game. Wins earn coaching
  points for roster upgrades; players age between seasons. Progress saves to `localStorage`.

## Layout

- `js/data.js` — teams, career state, schedule, season simulation, save/load
- `js/match.js` — on-field game (plays, player AI, passing, kicking, clock, rendering)
- `js/ui.js` — title, franchise hub, match launch
