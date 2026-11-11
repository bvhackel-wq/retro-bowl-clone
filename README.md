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
- **4th down:** go for it, punt, or kick a field goal.
- **Kicking:** tap the field to start the kick, drag back to aim (like a pass), and release to open the
  timing meter. Kick distance sets how far you can aim: 30 yards at 40, about 45 at 70, 60 at 99 (a kick
  from the 40). Kick accuracy sets the meter's zones and how fast the marker moves: green (7% of the bar
  for a weak kicker up to about 16% for a maxed one on a 42-yarder) goes where you aimed; the yellow
  around it does so about half the time; outside it the kick is pushed wide.
  Tapping to start is the snap: seven rushers fight the kick unit's blockers (your line's pass block
  sets how long they hold), then charge the ball. Kick quickly: a rusher near the ball when the kicker
  connects may block it, and one who reaches it first blocks it outright. A blocked field goal gives
  the other team the ball at the spot. The kicker takes his steps and swings through on every kick.
- **Punting:** the same three steps from 13 yards behind the line. Aim where it should land (reach 30
  yards at 40 kick distance up to about 60 at 99). A clean punt lands where you aimed; a shank falls
  short and veers. Into the end zone is a touchback, over the sideline is spotted where it went out,
  otherwise there's a short return (fair catch inside their 10).
- **Playbook:** 18 plays in six types. Quick pass (Slants, Curls, Quick Outs, Stick), Deep pass
  (Verticals, Post & Cross, Dagger, Comebacks), Inside run (HB Off Tackle, HB Dive, HB Power: the backside guard pulls behind the line and leads
  through the hole onto the free linebacker, the answer to man coverage's extra man in the box), Outside run (Toss
  Right/Left: to the edge, then up), Screen (RB Screen: the line releases to lead-block; WR Screen:
  receiver steps back behind blockers) and Play action (PA Post, PA Crossers, PA Deep Shot: linebackers
  and safeties bite on the fake, less if they cover well, more the more you've run that game). The
  offensive coordinator calls a play each snap; Change shows the six types, and picking one gives his
  best play of that type for the situation (pick it again for his next one). His read of each coverage
  comes from measured results of every play against every call.
- **Defenders have jobs, and make mistakes.** Man defenders play leverage: they shade a yard inside or
  outside and give up the other way (inside in Cover 0, 2-Man and press; outside in Cover 1, where help
  is in the middle). A man defender whose man stays in to block drops into the hole over the middle. With
  one deep safety he plays the run fast; with two, both read pass first, so Cover 2 and 2-Man are the
  shells to run against (Cover 4's safeties still fit the run). Before every snap each defender may bust
  his assignment: he loses his man, jumps a short route, drops to the wrong spot, bites hard on play
  action or overruns a run. Low-star players and low-star coordinators bust more: about 1 bust every 12
  plays from a 5-star defense under a 5-star coordinator, 1 every 2 from 0 stars under 0 stars. Every
  team's defensive coordinator has 0-5 stars, shown on the next-game card. A big catch a bust caused
  pops up as "Busted coverage!".
- **Blocking is one-on-one.** A lineman holds only the man he's blocking, so the defense's numbers matter:
  against a one-high man call (Cover 0, Cover 1, press) one defender near the line goes unblocked, and you
  beat him with a juke or by throwing. Man defenders line up over their man, so the tight end's defender
  follows him to the run side. In Cover 0 the blitzing linebacker comes off the tight end's edge and keeps
  the runner inside; on outside runs the tight end kicks out the edge defender, and on inside runs he blocks
  the man covering him. Cover 0 is a real all-out blitz: quick throws beat it, slow ones get sacked.
- **Read the defense.** The opposing coordinator calls a coverage every snap from a nine-call playbook:
  Cover 0 (all-out blitz, nobody deep), Cover 1 and Cover 1 Press (man with one deep safety), Cover 2,
  Cover 3, Cover 4 (quarters), 2-Man (two deep, man under), Fire Zone (linebacker blitz, three deep, a
  lineman dropping into coverage) and Prevent. Two-deep calls take a lineman off for a second safety.
  He calls by down and distance (base looks on early downs, two-deep shells on 3rd and long, pressure on
  3rd and short), field position (man in the red zone), clock and score (prevent to protect a late lead,
  more blitzing when trailing), and your tendencies this game. Better defenses adapt more and sometimes
  disguise, showing one shell and rotating at the snap. After each play a note shows what they were in.
  Each call has holes: slants beat man and Cover 0, verticals beat Cover 2, posts beat Cover 3 and Fire
  Zone, curls beat Cover 3 and Prevent.
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
- **Passing help and difficulty:** a throw released near a receiver is nudged toward the right lead
  (partly on Normal, more for accurate quarterbacks; fully on Easy; not on Hard). Each opposing defender
  has speed and coverage ratings: receivers and defensive backs share a speed scale, a receiver's route
  break wrong-foots his man-coverage defender by his agility against the defender's coverage, and
  defenders read a thrown ball sooner and from farther away the better they cover. Easy also throws
  straighter, tires less, gets more time and a bigger catch window; Hard makes defenders read throws faster.
  Choose the difficulty on the title screen; change it any time from the team page.
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
