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
- **Scramble:** instead of throwing, swipe toward the end zone (keyboard: right arrow or D) and the
  quarterback tucks the ball and becomes a runner.
- **Running:** anyone with the ball except a quarterback still in the pocket (the back, a receiver
  after the catch, a scrambling quarterback) runs straight ahead automatically. Swipe up or down
  to cut toward a sideline, or hold W/S or the up/down arrows.
- **Juke:** tap, then swipe (keyboard: space, then up/down). For a third of a second the runner
  slips any tackle; time it just before contact. A juke into empty space costs speed, and there is a
  short cooldown, so spamming it gains less than running straight.
- **Agility (AGI):** a running back's agility lengthens the juke window, shortens the recovery between jukes, and is matched against the
  tackler's TKL when a juke connects: an even matchup works 75% of the time, an agile back against
  a poor tackler almost always. Quarterbacks use their own agility stat when scrambling. Receivers use their
  own agility stat; tight ends (55) juke with fixed agility for now.
- **Tackling:** each opposing defender has a jersey number and a tackling rating (TKL) built from
  his team's defense (linebackers highest, corners lowest). Whether a tackle lands depends on TKL,
  the runner's rating, the angle (head-on lands about 97% of the time; from the side or behind
  much less) and both players' speed. Tackled runners fall forward up to about 2.5 yards. Big
  head-on hits fumble about 1-2% of the time, and the defense recovers 60% of those. The box
  score lists broken tackles, yards after contact, fumbles lost and the opponent's top tacklers.
- **4th down:** go for it, punt, or kick a field goal. Kicks use a timing meter (tap or space).
- **Read the defense.** The play-call strip sits under the field so you can see the alignment
  before you choose. The defense mixes five calls:
  - *Man* — corners 6 yards off, one deep safety. Beat it with crossing routes and speed mismatches.
  - *Press man* — corners on the line. Quick throws are tight; deep routes win if your receiver is faster.
  - *Two deep* — corners 9 yards off and bailing, safety walked up. Flats and the deep middle are open.
  - *Three deep* — both corners and the safety deep. Throw underneath.
  - *Blitz* — both linebackers creep up and nobody is deep. Get the ball out fast.
- **Stars and stats:** every player has a 0–5★ rating fixed for life. Stars set the general level
  of his ceilings (about 52 at 0★ to 94 at 5★), and each stat has its own cap scattered around that
  level, so two 3★ players can have different strengths. Upgrades stop at the cap; the bar's tick
  marks it. Retiring players are replaced by rookies with fresh stars.
- **Quarterback stats:** arm strength (range and ball speed), accuracy (how close throws land),
  speed (scramble pace), agility (juking on scrambles) and stamina. His overall is computed from
  these. Every snap drains his energy, faster with low stamina: a tired QB throws shorter and less
  accurately and scrambles slower. The bar over his head shows it; he is fresh each new drive.
- **Running back stats:** speed (top speed), agility (jukes), catching (passes thrown to him),
  power (breaking tackles, falling forward, ball security) and stamina. After about three seconds
  with the ball he starts to slow, up to 10% on a long run; high stamina barely fades. His overall
  is computed from these.
- **Wide receiver stats:** catching (catch chance), speed (routes and open field), agility (when he
  breaks on a route, the defender in man coverage on him is wrong-footed for a moment; also his juke
  after the catch), stamina (he slows after about two seconds of running, so it shows on deep routes)
  and strength (winning contested catches, breaking tackles, falling forward). His overall is
  computed from these.
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
