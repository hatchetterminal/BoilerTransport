# Purdue parking inventory

Checked September 6, 2026. Scope: the Purdue West Lafayette campus parking inventory, including Purdue/PRF campus facilities and permit-only curbside areas. City of West Lafayette parking is excluded.

## Coverage and accounting

Purdue's current parking map links to the `SurfaceParkingLots` GIS layer, last updated August 13, 2026. Despite its name, that layer includes streets and garage floors as well as surface parking.

- 329 source features downloaded; the importer checks the server's total when fetching a fresh snapshot.
- Excluded feature 240: the City of West Lafayette street-parking placeholder, marked `NotALot=Y`.
- Excluded feature 249: 400 N Russell, explicitly marked `NotALot=Yes`.
- All other 327 source features are accounted for exactly once.
- 39 garage-floor features are represented by six garage entries, using their ground-level footprints.
- The remaining entries retain 247 surface parking areas and 41 street-parking sections.
- Result: 294 entries. Multiple entries can represent different permit sections or separate pieces of one named parking facility.

Some ownership/control fields in the official layer are blank. Those campus-map entries are retained, with the source's restricted or unspecified access designation; inclusion is not an independent title/ownership determination or permission to park. Purdue Research Foundation campus parking is included. This scope excludes city parking; it does not claim to inventory every Purdue land holding or every individual stall. The campus map's separate accessible-space and meter-location layers are not counted as additional facilities on top of these areas.

## Accuracy changes

- Replaced the 34 illustrative parking records with the official area's geometry and source permit designation. The old garage coordinates were inaccurate; all six remaining garages now use their official footprints.
- Removed Graduate House Garage. Purdue announced that it closed completely on November 25, 2024 for demolition; it is absent from the current garage inventory.
- Retained the six existing active-garage IDs so saved garage favorites still work. Unsupported old illustrative surface-lot entries are no longer presented as verified locations.
- Added a separate street category. The map renders each published area outline; a curbside entry does not authorize parking along an entire road.
- Removed fabricated hourly occupancy patterns from the parking inventory. Availability is unreported. Locations and permit rules are reference data, not live closure information.
- Unknown (`NPR`) source permit designations are not interpreted as free or unrestricted public parking.
- Special-permit, residential/FSCL, reserved, contractor and university-vehicle areas remain restricted; no general A/B/C permission is inferred for them.
- Current student rules supplement the map: assigned Student Garage permits cover Wood, Northwestern or University; South Campus Graduate includes Harrison in fall 2026 and moves in spring 2027; designated Hawkins spaces are at Wood and Pierce; Value permits are location-specific. Student Garage and South Campus Graduate permits also cover surface-lot C spaces.
- A-permit access to gated Grant/Harrison garages requires the appropriate access eligibility. Student A, monthly A and daily A are not treated as gated-access permits.

## Sources

- [Purdue parking map](https://purdueuniversity.maps.arcgis.com/apps/instant/basic/index.html?appid=47529701e46e48a08289fc46cb6de802)
- [Current parking GIS layer](https://services1.arcgis.com/mLNdQKiKsj5Z5YMN/arcgis/rest/services/SurfaceParkingLots/FeatureServer/0)
- [Building names and garage addresses](https://services1.arcgis.com/mLNdQKiKsj5Z5YMN/arcgis/rest/services/BuildingShapesZip4/FeatureServer/0)
- [Permit-code legend in the earlier campus layer](https://services1.arcgis.com/mLNdQKiKsj5Z5YMN/arcgis/rest/services/Surface_Parking_Lots/FeatureServer/0)
- [Current student permit rules](https://www.purdue.edu/operations/parking/home/permits/students/)
- [Current faculty and staff permit rules](https://www.purdue.edu/operations/parking/home/permits/faculty-staff/)
- [Graduate House Garage closure and demolition](https://www.purdue.edu/operations/blog/2024/09/12/work-to-progress-on-new-building-for-the-daniels-school-of-business-this-month/)

Posted signs and current Purdue instructions govern each space. Garage permits and special permissions do not necessarily cover every level or section of a facility.

## Refreshing

Run `node scripts/import-purdue-parking.mjs` with network access to update the bundled source snapshot. It downloads the official layer, checks completeness and rejects unfamiliar permit codes. Review the current parking-map service and permit pages before accepting the update: source IDs and policies can change, and policy overrides are deliberately not inferred automatically.

For an already downloaded snapshot, pass `--source-dir /absolute/path/to/source-files`; the directory must contain the `purdue-SurfaceParkingLots.geojson`, `purdue-SurfaceParkingLots-meta.json` and `purdue-BuildingShapesZip4.geojson` files. This offline mode trusts that the source files were downloaded completely.

Then run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run ios:sync`. Inspect the map/list and permit details. The inventory tests check complete feature accounting, garage consolidation, street coverage, permit restrictions, and that every map marker lies inside its recorded parking area.
