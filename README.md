# Launch Window

A 3D space mission design game for the 2026 NASA Space Apps Challenge, **Space Mission Design Game** challenge.

Design a mission, launch it yourself, and live with every trade-off you made. Pick a destination and a science objective. Then build the rocket and spacecraft within a $900M budget, fly the ascent, handle problems during the cruise, time the braking burn and land. A report scores the science you return and explains why.

**Play it:** open `index.html` in a browser, or enable GitHub Pages for this repository (Settings → Pages → deploy from the `main` branch, root folder).

## Modes

The game opens on a main menu. Choose a difficulty, then a mode:

- **Campaign:** a mission to Mars on a $900M budget, with a short story cutscene first.
- **Sandbox:** any destination and no budget cap, with its own cutscene.

A tutorial with arrows walks new players through the design screen, the integration review and the launch. Quit returns to the main menu at any time.

## What you decide

| Part of the challenge | In the game |
|---|---|
| Objective and requirements | Choose a goal (find water ice, map the surface, study the atmosphere, look inside the world, search for habitable places). Five requirements are checked live before launch. |
| Spacecraft and instruments | Bus size, chemical or ion propulsion, solar arrays, RTGs, battery, antenna, and up to 8 of 15 instruments, plus an optional lander. |
| Launch vehicle and orbit | Start from Falcon 9, Falcon Heavy, Atlas V, SLS or Saturn V, or build up to four stages. Pick the launch site and science orbit. |
| Budget, mass, power, comms, data, lifetime | Live Δv, liftoff mass, power at the destination, data sent home per day, cost and mission length. |
| Integration review | Before rollout, the full stack goes on the stand in the assembly hall in an exploded 3D view with labeled parts and a spacecraft close-up. Mass, power, data, Δv and cost budgets are broken down, and each subsystem gets a go, caution or no-go call that its owner signs off. |
| Collaboration | Up to four players share one screen as Mission Lead, Launch Engineer, Spacecraft Engineer and Science Lead, each with a goal. |
| Simulation and scoring | The launch is simulated with gravity, drag and Max-Q. Cruise brings decisions, arrival needs a braking burn, and you fly the landing yourself. The report breaks down every point. |

## Destinations

The Moon, Mercury, Venus, Mars, Ceres, Europa and Titan.

## Controls

| Key | Action |
|---|---|
| Space | Launch, stage, hold to burn |
| A / D | Tilt west / east |
| W / S | Throttle up / down |
| Z / X | Full throttle / cut |
| T | SAS: hold angle or follow prograde |
| P | Autopilot |
| M | Orbit map |
| . and , | Time warp faster / slower |
| V | Camera |
| Esc | Pause |

Touch buttons cover the same controls on phones.

## The science

- **Rocket equation:** each stage's Δv comes from engine Isp and propellant mass. Boosters burn in parallel with the core stage.
- **Ascent:** a 2D orbital simulation with inverse-square gravity, an exponential atmosphere, drag and dynamic pressure. Thrust and Isp blend between sea-level and vacuum values.
- **Power:** solar output falls with the square of distance from the Sun. RTGs give constant power.
- **Data:** dish data rates scale from the Mars Reconnaissance Orbiter's 3 m dish and 6 Mbps downlink, falling with the square of distance from Earth.

## NASA data used

- [NASA Visible Earth: Blue Marble](https://visibleearth.nasa.gov/collection/1484/blue-marble): the satellite image of Earth and its clouds. The images are embedded in `js/earth-images.js`.
- [NSSDCA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/): size, surface gravity and sunlight strength for each destination.
- [JPL: Mars Reconnaissance Orbiter data milestone](https://www.jpl.nasa.gov/news/nasa-mars-orbiter-speeds-past-data-milestone/): the 3 m dish and 6 Mbps figure that sets antenna data rates.
- [NASA Deep Space Network overview](https://science.nasa.gov/wp-content/uploads/2023/04/04_BaldwinVolosin_DSN.pdf): ground stations and daily contact time.
- [NASA MMRTG fact sheet](https://science.nasa.gov/wp-content/uploads/2024/02/mmrtg-factsheet-updated-5-18-20-1.pdf): about 110 W from a 45 kg generator, used for the RTG option.

Engine figures are rounded public numbers. Δv requirements are approximate values from standard Δv maps. Part costs are gameplay estimates.

## Built with

- [three.js](https://threejs.org/) r128, MIT License, loaded from cdnjs
- [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono) for the cockpit screens, SIL Open Font License, loaded from Google Fonts. Everything else uses Times New Roman and Arial.

There is no build step and no install. The Earth images are embedded in a script file, so the game also runs from a local copy.

## Project layout

```
index.html            page structure
css/style.css         all styles
js/earth-images.js    NASA Blue Marble images
js/util.js            small helpers
js/data.js            parts, destinations, instruments
js/state.js           game state
js/design.js          design panel
js/scene.js           3D scene, rocket and spacecraft models
js/controls.js        camera, sound, input, HUD
js/flight.js          launch and orbital physics
js/mission.js         cruise, braking burn, landing, operations
js/report.js          mission report and scoring
js/review.js          integration review in the assembly hall
js/loop.js            game loop and rendering
js/intro.js           main menu and the campaign and sandbox cutscenes
js/music.js           background music, composed live with Web Audio
js/tutorial.js        step-by-step tutorial with arrows
js/menu.js            quit to main menu
js/main.js            startup
```

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

Made by William Cheng, Torrey Pines High School, for the 2026 NASA Space Apps Challenge. This project is not affiliated with or endorsed by NASA.
