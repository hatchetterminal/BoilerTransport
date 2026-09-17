# Boiler Transport App Store Release Guide

This project contains a native iOS app built around the React/Vite experience. The web and iPhone versions use the same feature code and bundled transportation reference data.

## Already implemented

- Capacitor 8 iOS project with iOS 15 as the minimum supported version
- iPhone-only version 1.0 build configuration
- Original app icon and launch screen without university trademarks
- Native safe-area and status-bar configuration
- Native location permission and nearby-parking sorting
- MapLibre map rendering with an OpenFreeMap/OpenStreetMap default style
- Apple Maps directions on iOS
- Device-local favorites, permit, and in-app alert preferences
- In-app Privacy Policy, Support, About, data-source, map-source, and affiliation disclosures
- A local Remove Saved App Data control
- iOS privacy manifest and export-compliance declaration
- Production web metadata, manifest, favicon, and Apple touch icon

The app does not provide accounts, server-side preference sync, analytics logging, or remote push notifications.

The public support and privacy contact is **contactboilertransport@gmail.com**. The app and release checks use this address by default; `VITE_SUPPORT_EMAIL` can override it. Use this inbox wherever a public user-support email is requested. Hosted support and privacy-policy URLs still need to be configured separately.

## Items the app owner must complete

1. Join the Apple Developer Program and install the current full version of Xcode.
2. Decide whether `com.boilertransport.app` will be the permanent Bundle ID. Change it before the first App Store upload if needed.
3. Open the iOS project in Xcode and select the Apple Developer Team.
4. Copy `.env.production.example` to `.env.production` and replace every placeholder.
5. Decide whether the default OpenFreeMap style is appropriate for production or configure another MapLibre-compatible `VITE_MAP_STYLE_URL`.
6. Host the web build at the public support and privacy URLs entered in App Store Connect.
7. Confirm rights to every university name, image, campus map, and transportation data source. Keep the independent-app disclaimer unless the university authorizes the app.
8. Establish an owner process for updating and validating the bundled transportation reference dataset before each release.

## Retiring the previous backend

Removing the SDK from this repository does not erase data already stored by the previous Base44 deployment. Before decommissioning it, the app owner should:

1. Export any transportation records that must be preserved and validate the replacement bundled dataset.
2. Decide whether existing users require notice that remote accounts and synced preferences are being retired; those remote preferences do not automatically migrate to device storage.
3. Delete or deactivate stored user identities, preferences, application logs, and APNs device tokens according to the published retention policy and applicable obligations.
4. Revoke production credentials, disable backend functions and authentication callbacks, then shut down the old deployment.

## Production commands

```sh
npm install
npm run lint
npm run typecheck
npm test
npm run release:check
npm run ios:sync
npm run ios:open
```

`npm run release:check` intentionally fails until production URLs, Xcode, and Apple signing are configured.

Rerun `npm audit --omit=dev` before release and resolve relevant production advisories without forcing an untested breaking upgrade.

## App Store Connect checklist

- App name, subtitle, description, keywords, primary category, and copyright
- Privacy Policy URL and Support URL
- App Privacy answers matching the privacy inventory below
- Age-rating questionnaire
- Content-rights confirmation
- Export-compliance questionnaire
- Pricing and availability
- iPhone screenshots showing Parking, Nearby Parking, Bus, Events, and Profile
- Review contact details and review notes explaining that transportation data is bundled reference data rather than a live campus feed

## Privacy inventory

| Data                                            | Sent to the app operator                                                                           | Tracking               | Purpose            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------- | ------------------ |
| Favorites, permit, and in-app alert preferences | No; stored on the device                                                                           | No                     | App functionality  |
| Current location                                | No; processed on the device for the active session                                                 | No                     | Nearby parking     |
| Map style and tile requests                     | No application backend; the map provider receives standard network information and requested tiles | No tracking by the app | Displaying the map |

MapLibre GL JS renders maps locally. The default style and tiles are served by OpenFreeMap using OpenStreetMap contributor data. If a user opens directions, Apple Maps or Google Maps processes that request under its own privacy terms. Confirm the current policies of every configured map provider before release.

## TestFlight acceptance pass

- Fresh install, legacy local-preference migration, preference changes, data removal, and reinstall
- Location denied, allowed, later revoked, and inaccurate-location cases
- Map style unavailable, individual tile failures, airplane mode, and weak service
- Empty and filtered parking results, bundled event notices, bus routes, and directions
- VoiceOver navigation, Dynamic Type, reduced motion, color contrast, and keyboard focus
- iPhone SE-sized screen and a current large-screen iPhone
- All external links, Apple Maps directions, privacy URL, support email, map attribution, and data-source link

Before uploading, verify Apple's current Xcode, SDK, privacy-manifest, and submission requirements in the official App Store documentation.
