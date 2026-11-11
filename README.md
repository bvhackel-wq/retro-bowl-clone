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
- **Lunge and stop:** any ball carrier (not a quarterback still in the pocket) can swipe forward to
  lunge: a head-first dive of 1 yard (best of speed, power or agility at 50) up to 2 yards (90+), or for
  a scrambling quarterback a feet-first slide of 0.75 to 1.5 yards. He goes down where he lands and
  tacklers can't stop the dive itself. Swiping back stops him for about a second. Keyboard: right arrow / D and left arrow / A.
- **Juke:** tap, then swipe (keyboard: space, then up/down). For a third of a second the runner
  slips any tackle; time it just before contact. A juke into empty space costs speed, and there is a
  short cooldown, so spamming it gains less than running straight.
- **Agility (AGI):** a running back's agility lengthens the juke window, shortens the recovery between jukes, and is matched against the
  tackler's TKL when a juke connects: an even matchup works 75% of the time, an agile back against
  a poor tackler almost always. Quarterbacks use their own agility stat when scrambling. Receivers use their
  own agility stat; tight ends juke with a fixed 55.
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
- **Tight end stats:** catching, strength, blocking, speed and stamina. On run plays he lines up on
  the run side and climbs to block a linebacker or safety; blocking sets how long he holds him (about
  half a second at 50, over two seconds at 90, varying block to block). A poor blocker loses his man
  and hurts the run game; above about 70 the unblocked safety becomes the limit. His overall is
  computed from these. Agility stays fixed at 55 for now.
- **Roster:** up to 12 players (quarterbacks, backs, receivers, tight ends, offensive linemen,
  kickers); the defense is a team-wide unit. Nine start each game, including three linemen. Each game starts your best player at each spot. If nobody on
  the roster plays a starting spot, a nameless 0-1★ reserve with stats of 40-55 is fielded, and he
  can't be upgraded. Players who retire (at 36) leave their spot open; you can also release players.
  New careers start one back, receiver or tight end short.
- **Draft:** three rounds after each season, worst record first and the champion last, from about
  110 prospects aged 21-23. Unscouted prospects show only a star range and an overall range;
  scouting one costs a coaching point and reveals his real stars, stats and caps. Other teams draft
  by their own noisy read, so they can take your target. You need an open roster spot to draft.
- **Trades:** open in the offseason and during the season until the deadline after week 9. Each team
  has three players on its trade block each season, plus its picks in the next draft. Players are
  valued by overall, stars, age and position; picks by round and how high they are likely to fall.
  Other teams accept only if they come out about 10% ahead. A trade can't take you over 12 players.
- **Offensive line stats:** strength (holding ground against the pass rush), pass block (how long he
  holds his man on passes), run block (how long he holds on runs), speed (a faster rusher gets around
  a slow lineman sooner) and stamina (blocking fades up to 25% over a long drive; fresh each drive).
- **Coordinators:** an offensive and a defensive coordinator, each with 0-5★ and one special skill
  (two at 4★+) from a small set (`GP.SKILLS` in `js/data.js`). Hire them with coaching points from three
  candidates per job that change each season (free at 0★ up to 14 points at 5★). The offensive
  coordinator calls a play before every snap from the down, distance, field position, clock, score and
  the defense's look; more stars means he reads the coverage more often (about 25% at 0-1★, 50% at 3★,
  90% at 5★). You can change his call with the button over the field. On 4th down he only recommends.
  The defensive coordinator's stars and skills improve your simulated defense.
- **Franchise:** 32 teams in two conferences (American, National), each with four divisions of four.
  14-game season: 6 division games, 4 against another division in your conference, 4 against a
  division in the other conference (pairings rotate each season). Six teams per conference make
  the playoffs (four division winners plus two wild cards; top two seeds get a bye), then
  Wild Card, Divisional, Conference Championship and the Championship Game. Wins earn coaching
  points for roster upgrades; players age between seasons. Progress saves to `localStorage`.

## Art

The field is drawn as pixel art: everything is rendered in whole pixels on a 480x270 canvas and scaled
up without smoothing. Sprites, the 5x7 font and the field are original and generated in code
(`js/pixel.js`); there are no image files.

## Layout

- `js/data.js` — teams, career state, schedule, season simulation, save/load
- `js/pixel.js` — pixel font, player sprites and the pre-rendered field
- `js/match.js` — on-field game (plays, player AI, passing, kicking, clock, rendering)
- `js/ui.js` — title, franchise hub, match launch
