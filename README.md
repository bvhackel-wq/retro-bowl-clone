# Pocket Gridiron

An original arcade American-football game for the browser: call plays, sling passes with a
drag-and-release throw, steer the ball carrier, and manage a franchise across seasons.
No build step, no dependencies.

## Run

Open `index.html` in a browser (or serve the folder with any static server, e.g. `python3 -m http.server`).

## How to play

- **You run the offense,** and call the defense (or simulate opponent drives from your defense's rating vs. their offense).
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
- **After a touchdown:** kick the extra point or go for 2: one play from the 2-yard line, called and run
  like any other (no field goal option, no clock, and the play doesn't count in your season stats). Only
  a touchdown on that play scores. Your coordinator highlights the usual chart in the second half: go for
  two when the touchdown leaves you down 2, 5 or 10, or up 1, 4 or 5. Inside the 5 he leans to quick throws
  and play action, since the defense loads the box.
- **4th down:** go for it, punt, or kick a field goal. Past midfield, Change also offers a field goal on
  any down (marked "a long shot" beyond your kicker's range).
- **Kicking:** tap the field to start the kick, drag back to aim (like a pass), and release to open the
  timing meter. A field goal is snapped and kicked from the line of scrimmage (held a yard behind it), so its
  distance is the line plus the 10-yard end zone, plus one. Kick distance sets how far you can aim: 30 yards at 40, about 45 at 70, 60 at 99 (a kick
  from the 41). Kick accuracy sets the meter's zones and how fast the marker moves: green (about 13% of the bar
  for a weak kicker up to 28% for a maxed one, the same for every kick and distance) goes where you aimed; the yellow
  around it does so about half the time; outside it the kick is pushed wide.
  Tapping to start is the snap: seven rushers fight the kick unit's blockers (your line's pass block
  sets how long they hold), then charge the ball. On a field goal the line holds at the line of scrimmage
  and only two rushers really try to get through, so the block comes at a different moment each kick:
  with an even matchup, about 1 in 100 at 2.5 seconds from the snap to the kick, 1 in 8 at 3, 1 in 3 at
  3.5, half at 4, and nearly certain by 5. A rusher who has beaten his block and is near the ball when
  the kicker connects may block it, and one who reaches it first blocks it outright. A blocked field goal gives
  the other team the ball at the spot. The kicker takes his steps and swings through on every kick.
- **Landing marker:** once a pass is in the air, a yellow marker on the turf shows where it will come down
  (after the throw's scatter), so you can see whether it's leading your receiver or floating to a defender.
- **Punting:** the same three steps from 13 yards behind the line. Aim where it should land; you can drag
  up to 25% past the range (the range ring turns yellow), which shrinks the green zone and makes even a
  clean punt sail a little. A full punt
  from a 71 kick-distance punter (about 3 stars) travels about 47 yards past the line, the NFL average;
  about 33 at 40 and 60 at 99. A clean punt lands where you aimed; a shank falls
  short and veers. Into the end zone is a
  touchback, over the sideline is spotted where it went out. Otherwise the play runs out: your gunners
  (held up a moment by jammers) and line cover downfield while the punter hangs back as the safety, the
  return team drops into a wall, and the returner settles under it. If the coverage is close he calls a
  fair catch; if not he returns it, picking a lane away from the coverage, with his blockers taking on
  your cover men and missed tackles possible. Inside his 10, or if he can't get there, he lets it go:
  the ball hops and rolls, with the odd bad hop sideways or back, until your coverage downs it, it dies,
  rolls out of bounds or bounces into the end zone for a touchback. Hang time is set so the coverage
  usually arrives close to the catch; a long line drive can outkick it.
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
- **Punt returns.** When the opponent punts (with playable defense on), it's played out with your return
  team: their punter aims for distance, or to pin you inside your 10 when he's close, and rarely shanks
  one. Tap during the flight to call a fair catch; otherwise your returner (your running back's speed and
  agility) catches it and you steer with the runner controls, with forward to the left: swipe up/down to
  cut, tap then swipe to juke (a timed juke can break a tackle), swipe left to lunge, right to stop. If he
  can't get to it, or it's inside your 10, he lets it bounce. A return touchdown goes to your extra point or
  two-point choice; a blocked punt is your ball. Keyboard: space calls the fair catch, then arrows.
- **Your lineman's dive.** On defense your best pass rusher among the linemen rushing on that call wears a
  white ring. He plays his assignment; swipe left (or press left) and he goes for whoever has the ball, the
  quarterback or the back on a run. If he's blocked he first has to beat his man (his pass rush, or run stop on
  runs, against the blocker, much easier as the play goes on), then he bursts and dives up to about 6.5 yards.
  A hit is a tackle attempt with a bonus (on the quarterback, almost always a sack). Lose the block or miss
  and he's on the ground with the ball carrier free. One dive a play; the ring goes when the quarterback
  throws. Measured on pass plays: diving too early (0.4s) gives up more than not diving, about 1.6s is the
  sweet spot (sacks on ~14% of plays against ~2% without), and by 2.2s the ball's usually gone.
- **Go for the interception.** On defense, swipe up (or press up/space) as their pass arrives. The
  defender nearest where it will come down plays the ball, and his coverage sets the timing window (about
  0.17s at 60 coverage, 0.34s at 90). On time and close enough: he goes for the pick (an interception or a
  breakup). Too early: pass interference, a spot foul and an automatic first down. Too late, just after the
  catch: he whiffs on the tackle. One try per pass.
- **Camera zoom** (pause menu, remembered on the device): framed from behind the offense, with the line of
  scrimmage near the back (left) of the screen and the field ahead. Before the snap and while the
  quarterback has the ball it only crops the stands, so every receiver stays on screen; once someone's
  running with the ball it closes in to about 1.6x, and moves up with him once he's about three-quarters of
  the way across. It eases back out for kicks; the scoreboard, hints and the stands strips above and below the field stay
  their normal size at any zoom.
- **Play defense (Phase 1: you call it).** When the opponent has the ball you play their drive: the field
  flips so they attack your end zone, their offense calls a play (hidden from you), and your defensive
  coordinator calls a coverage. Keep it or tap Change for four groups: Man (Cover 1, Cover 1 Press, 2-Man),
  Zone (Cover 3, Cover 2, Cover 4), Blitz (Cover 0, Fire Zone, Cover 1 Blitz) and Prevent; picking a group
  again gives the next call in it. Tap the field to snap and watch it play out. Their offense plays like a human,
  mistakes included: the quarterback reads one receiver at a time, misses throws and sometimes throws
  behind his man, sometimes stares down his first read, freezes and takes the sack when nobody's open, and
  now and then forces it into coverage (weaker quarterbacks do all of this more); their runner only reacts
  to what's in front of him, a few times a second. Their play-caller
  learns which coverages you lean on and calls plays that beat them. On 4th down they go for it, kick a
  field goal or punt. Interceptions and recovered fumbles give you the ball at the spot; a safety scores
  you 2. Your defenders are your defensive players (below), plus your coordinator's stars, which also set how
  often they bust. "Simulate drive" in the menu hands one drive to the old simulation, and your team page
  has a Play it / Simulate switch for whole games. Balance: tuned over thousands of simulated drives so an
  even matchup ends close to an NFL drive (about 25-30% touchdowns, ~57% completions, ~8 yards a throw,
  ~4.8 a carry, ~2% interceptions, a sack every few drives). Those mistakes do most of the balancing; their
  players also run 4% slower than their ratings, because yards after the catch run high against this
  defense.
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
- **Roster:** up to 22 players. Eighteen start: nine on offense (quarterback, back, two receivers, tight
  end, three linemen, kicker) and nine on defense (three linemen, two linebackers, two cornerbacks, two
  safeties; the second safety plays in two-deep coverages). Each game starts your best player at each spot. If nobody on
  the roster plays a starting spot, a nameless 0-1★ reserve with stats of 40-55 is fielded, and he
  can't be upgraded. Players who retire (at 36) leave their spot open; you can also release players.
  New careers start one back, receiver or tight end short, and one defender short.
- **Draft:** three rounds after each season, worst record first and the champion last, from about
  110 prospects aged 21-23. Unscouted prospects show only a star range and an overall range;
  scouting one costs a coaching point and reveals his real stars, stats and caps. Other teams draft
  by their own noisy read, so they can take your target. You need an open roster spot to draft.
- **Trades:** open in the offseason and during the season until the deadline after week 9. Each team
  has three players on its trade block each season, plus its picks in the next draft. Players are
  valued by overall, stars, age and position; picks by round and how high they are likely to fall.
  Other teams accept only if they come out about 10% ahead. A trade can't take you over 22 players.
- **Defensive players:** each has 0-5 stars, per-stat ceilings, an overall from his stats, upgrades and
  a jersey number, like the offense. Every stat does something on the field:
  - **DL:** pass rush (how fast he beats his blocker on throws), run stop (how fast he sheds him on runs),
    strength (driving the blocker back), speed, tackling.
  - **LB:** tackling, run stop (how fast he reads and fills a run), coverage, speed, strength (shedding blocks).
  - **CB:** coverage (staying with his man, breakups), speed, ball skills (interceptions and your swipe-up
    window when he plays the ball), tackling.
  - **S:** coverage, speed, tackling, ball skills, run stop.
  Your coordinator's stars add to every defender on the field, and the rating gap against their offense is
  narrowed the same way as before, so balance is unchanged (measured: player-built and rating-built
  defenses give up touchdowns at the same rate). Defenders are drafted, traded, develop and retire like
  everyone else. Older careers' defense unit becomes nine players at its level.
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
- **New career:** choosing your team will be part of career setup (not built yet); for now New career
  gives you a random team.
- **Team page:** your team's banner, the next game (tap Play), uniforms and the defense setting, then a
  tile for each part of running the team: Roster, Standings, Coaching staff, Trades, Draft (offseason) and
  Difficulty. The **roster** is a grid of cards (position, his own pixel portrait in your home jersey, name,
  stars, overall against potential, and a bar for how far he's grown); empty spots show as dimmed reserve
  cards. Tap a card for the **player card**: his profile on the left, attributes on the right (each bar
  filled to his value, outlined up to his ceiling) with upgrade buttons, and arrows to step through the
  roster. Menus use a pixel font (Silkscreen, from Google Fonts; plain monospace offline) and keep clear of the
  notch / Dynamic Island in landscape.
- **Notices:** a trade, a staff hire, a draft pick, a retirement or a forfeit pops up once at the top of
  the screen and leaves after a few seconds (tap it to close it sooner); nothing stays pinned to the team page.
- **Landscape only:** every screen is laid out for a phone held sideways. Held upright, a phone shows a
  "turn your phone sideways" prompt over every screen, and a game in progress pauses. On a landscape phone
  the title and team page split into two columns (the next game and Play on the left, your team's tiles on
  the right) so Play is on screen without scrolling. Tablets and computers keep the wider layout. A web page
  can't lock the rotation in iPhone Safari; the Home Screen version, and Android in full screen, do lock to
  landscape.
- **Player portraits:** every player gets a head-and-shoulders portrait in the game's pixel style, built
  from parts picked at random when he's created and kept for his career: 6 skin tones, 12 hairstyles
  (bald, buzz, short, flat top, afro, long, mohawk, locs, curly, swept fringe, headband, high top), hair
  colors, 6 kinds of facial hair, eyebrows and eye black. Players from older careers get one when the save
  loads.
- **Franchise:** 32 teams in two conferences (American, National), each with four divisions of four,
  laid out like the NFL: the American Conference is the AFC and the National the NFC, every team plays in
  its NFL counterpart's city and division, in that team's colors. Teams go by their city alone; where two
  share a city, the AFC team takes its stadium's location (New Jersey and New York, Inglewood and Los Angeles).
- **Uniforms:** every team has four, modeled on its NFL counterpart in that team's official colors
  (js/uniforms.js): home (dark), away (white), alternate (throwback or third jersey) and Color Rush
  (monochrome). Games have a home team: the host wears home and the visitor white, and if the jerseys look
  too alike the opponent switches. Pick yours for the next game on your team page (Auto, or any of the four),
  with a preview of each and of what the opponent will wear.
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
