# Boiler Transport

A campus transportation app built with React and Vite, with a native iPhone app powered by Capacitor.

Parking and event schedules are bundled reference data; bus routes and arrivals are illustrative. Favorites, appearance, permits, and alert settings are saved only on the device. There is no application backend, account system, analytics pipeline, or remote push service.

## Start here

Use Node.js 22 or newer. Install the locked dependencies and start the browser preview:

```sh
npm ci
npm run dev
```

Optional public settings are documented in `.env.example`. Copy it to `.env.local` to customize them. The default map uses OpenFreeMap's Positron style with OpenStreetMap data; set `VITE_MAP_STYLE_URL` to use another compatible style.

## Run on an iPhone simulator

Install Xcode and an iOS simulator runtime, then run:

```sh
npm run ios:sync
npm run ios:open
```

In Xcode, select an iPhone simulator and press Run. After changing the app, run `npm run ios:sync` again before rebuilding in Xcode. If launch reports that the simulator is busy, stop the Xcode run, restart the simulator, wait for its home screen, then retry.

## Project layout

| Location               | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `src/App.jsx`          | Routes and shared application providers                      |
| `src/Layout.jsx`       | Shared layout and pop-up notifications                       |
| `src/pages/`           | Main screen, legal/support pages, and not-found page         |
| `src/components/tabs/` | Parking, Bus, Events, and Profile screens                    |
| `src/components/`      | Feature components, shared controls, and UI primitives       |
| `src/hooks/`           | Data queries and saved preferences                           |
| `src/lib/`             | Date, appearance, map, parking, and native-device helpers    |
| `src/data/`            | Bundled source snapshots, derived records, and demo bus data |
| `public/`              | App icon source, browser icons, and web manifest             |
| `ios/`                 | Native Xcode project and Capacitor package integration       |
| `scripts/`             | Data importers and release configuration checks              |
| `tests/`               | Regression tests for data and application logic              |
| `docs/`                | Data maintenance and App Store release guides                |

`node_modules/`, `dist/`, and `ios/App/App/public/` contain installed or generated files. Do not edit them; the install, build, and iOS sync commands recreate them. Capacitor also manages the native package under `ios/App/CapApp-SPM/`.

## Checks and formatting

```sh
npm run format       # Format maintained source and documentation
npm run check        # Check formatting, lint, types, and regression tests
npm run build        # Build the production web app
```

Generated data snapshots and native Xcode files are excluded from the formatter. Run the importers to refresh snapshots, then review the changes before accepting them.

## Data and release guides

User support and privacy questions: [contactboilertransport@gmail.com](mailto:contactboilertransport@gmail.com).

- [Parking inventory](docs/PARKING_DATA.md): coverage, permit interpretation, source links, and refresh procedure.
- [Event schedules](docs/EVENT_DATA.md): home-game records, TBA times, and schedule refresh procedure.
- [App Store release](docs/APP_STORE_RELEASE.md): production settings, signing, privacy, and TestFlight checks.

The parking snapshot contains 294 mapped areas: 6 garages, 247 surface areas, and 41 street sections. It does not report live space availability. Events come from Purdue's published home schedules; the snapshot verification date is stored with the data. `src/data/demoBusData.js` contains sample bus records.

Preferences use the `boiler_transport_preferences` local-storage key. Compatibility cleanup for earlier local preferences remains in place so existing users keep their supported settings.
