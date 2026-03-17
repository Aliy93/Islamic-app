# Security Test Support Document

## Application Overview

- Application name: Muslim App
- Framework: Next.js 15 with React 19 and TypeScript
- Deployment target: Firebase App Hosting configuration is present in the repository
- Client model: Primarily client-side rendered application with browser-based storage and direct calls to selected public APIs

## Overall Security Posture

Based on the current implementation, this application is a low-risk utility application from a data-classification perspective because it does not currently process:

- Account credentials
- Financial data
- Government identity documents
- User-generated file uploads
- User-to-user messaging content

The primary security-sensitive data element currently handled by the app is:

- Precise location data in the form of latitude and longitude

This means the most relevant security review areas are:

- Privacy protection for location data
- Client-side storage exposure
- Third-party API dependency risk
- Browser permission handling
- Frontend supply-chain and dependency risk

## Threat Model Summary

Primary threat actors relevant to the current design:

- Malicious scripts introduced through a future XSS issue
- Malicious or overprivileged browser extensions
- Attackers with access to a shared or compromised device
- Third-party API compromise or malformed external responses
- Network-level observers learning that the client connects to third-party services

Primary assets of interest:

- Stored coordinates in browser local storage
- Prayer time cache entries associated with coordinates and dates
- Browser permission state for geolocation and orientation sensors
- Integrity and availability of third-party prayer and geocoding responses

## Implemented Functionality

### 1. Home Dashboard

The home screen provides:

- Current Hijri date and Gregorian date display
- Countdown to the next prayer time
- Daily prayer time list
- Location label derived from the active coordinates
- Error and permission messaging when location access or remote prayer data is unavailable

### 2. Hijri Calendar

The calendar section provides:

- Monthly Hijri calendar view
- Day-by-day Gregorian and Hijri date mapping
- Highlighting of predefined Islamic events
- Month navigation
- Manual "today" reset from the calendar header
- User-controlled Hijri adjustment support

Important note: Hijri conversion is performed locally in the app using the browser `Intl.DateTimeFormat` Islamic calendar support (`islamic-umalqura`). It is not fetched from a remote Hijri API in the current implementation.

### 3. Prayer Times

The app provides:

- Daily prayer times for Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha
- Highlighting of the next upcoming prayer
- Countdown logic for the next prayer
- Selection of prayer calculation method in settings
- Local caching of prayer time responses per date, coordinates, and calculation method

### 4. Qibla Finder

The Qibla page provides:

- Qibla bearing calculation from the user's current latitude and longitude
- Live compass mode when supported by the device/browser
- Permission request flow for device orientation access where required
- Static fallback guidance when compass APIs are unavailable or denied

Important note: the current magnetic declination implementation is a local fallback value of `0`, so Qibla guidance is based on true-north bearing with browser/device compass readings. No external geomagnetic API is currently used.

### 5. Settings

The settings page provides:

- Language selection
- Automatic location detection using browser geolocation
- Manual latitude/longitude entry
- Prayer calculation method selection
- Hijri date adjustment selection

### 6. Localization

The app supports multiple UI languages:

- English
- Arabic
- Amharic
- Afan Oromo

The app also adjusts document direction (`ltr` or `rtl`) based on the selected language.

## Features Not Currently Implemented

The following are not present in the current user-facing implementation:

- User registration or authentication
- User profiles
- Payment processing
- File upload
- Messaging or social features
- Admin console
- Backend CRUD APIs for user data
- Quran page functionality (the route folder exists but is currently empty)

## External Sources and Third-Party Services in Current Use

### 1. AlAdhan Prayer Times API

Purpose:

- Fetches daily prayer times based on date, latitude, longitude, and selected calculation method

Observed request pattern:

- Browser request: `/api/prayer-times?timestamp={unixTimestamp}&latitude={lat}&longitude={lon}&method={method}`
- Server-side upstream request: `https://api.aladhan.com/v1/timings/{unixTimestamp}?latitude={lat}&longitude={lon}&method={method}`

Data sent from client:

- Latitude
- Longitude
- Unix timestamp for the requested date
- Prayer calculation method identifier

Data received by client:

- Daily prayer timing values

Security relevance:

- This is the main live data source for core religious timing data
- Coordinates are sent to an application-controlled API route instead of directly to AlAdhan
- Third-party infrastructure details are not exposed to the browser response
- Responses are cached in browser local storage
- The current implementation now validates the returned payload shape before use

### 2. OpenStreetMap Nominatim Reverse Geocoding API

Purpose:

- Converts stored coordinates into a readable location label such as city and country

Observed request pattern:

- Browser request: `/api/reverse-geocode?lat={lat}&lon={lon}`
- Server-side upstream request: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}`

Data sent from client:

- Latitude
- Longitude

Data received by client:

- Parsed location label used for UI display

Security relevance:

- Coordinates are sent to an application-controlled API route instead of directly to Nominatim
- Third-party infrastructure headers are not exposed to the browser response
- Used for display only and not required for local prayer calculation cache lookup
- The current implementation now validates the returned payload shape before use

### 3. Google Fonts via `next/font/google`

Purpose:

- Loads the following font families used by the UI:
  - Alegreya
  - Noto Kufi Arabic
  - Noto Sans Ethiopic

Security relevance:

- Frontend asset dependency only
- No business data is sent intentionally by application logic for this feature

## Browser and Device APIs Used

### 1. Geolocation API

Usage:

- `navigator.geolocation.getCurrentPosition(...)`

Purpose:

- Detects the user's current coordinates for prayer times, Qibla direction, and location labeling

Permission model:

- Browser permission prompt
- App provides manual coordinate entry when automatic location is unavailable or denied

### 2. Device Orientation / Compass APIs

Usage:

- `DeviceOrientationEvent`
- `deviceorientation` / `deviceorientationabsolute`
- `webkitCompassHeading` on supported iOS devices
- Generic Sensor API fallback detection for `Magnetometer` and `Accelerometer`

Purpose:

- Drives the live Qibla compass experience

Permission model:

- May require an explicit user gesture and permission on some mobile browsers
- App falls back to a static bearing guide if permission is denied or unsupported

### 3. Local Storage

Purpose:

- Persists user settings and cached prayer data in the browser

Keys observed in code:

- `language`
- `prayerMethod`
- `hijriAdjustment`
- `isManualLocation`
- `location`
- `prayerData:{date}:{lat}:{lon}:{method}`

Security relevance:

- Coordinates are stored locally on the device/browser
- Prayer API responses are cached locally on the device/browser
- No encryption layer is implemented for local storage values
- The app now provides a user-facing control to clear stored location and cached prayer data

## Data Handling Summary

### Data stored locally

- Selected language
- Prayer calculation method
- Hijri adjustment value
- Manual-location mode flag
- Last saved coordinates
- Cached prayer time results keyed by date and coordinates

Important note: cached prayer time entries now expire after 24 hours. Cache invalidation also occurs when location or prayer method changes.

### Data sent externally

- Coordinates sent to the application prayer-times route, which forwards them to AlAdhan server-side
- Coordinates sent to the application reverse-geocoding route, which forwards them to Nominatim server-side

### Data not observed in current implementation

- Account credentials
- User-uploaded files
- Payment information
- Government ID or other high-risk identity documents
- Server-managed personal profiles

## Server-Side / Backend Notes

- The current implementation exposes a custom backend API route for prayer times at `/api/prayer-times`
- The current implementation exposes a custom backend API route for reverse geocoding at `/api/reverse-geocode`
- Firebase App Hosting configuration exists, but no active Firebase database, authentication, or storage integration was identified in the current application flow
- Genkit and Google GenAI dependencies exist in the repository, but no user-facing AI flow or connected AI feature was identified in current app routes

## Verified Security Observations

The following items were verified from the current codebase:

- Content Security Policy is configured in the current Next.js configuration
- Response security headers including `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security` are configured in application configuration
- Next.js `X-Powered-By` is disabled in application configuration and app-controlled responses now explicitly strip `X-Powered-By` and `Server` where the framework exposes response headers
- Prayer time requests are routed through an application-controlled backend proxy that does not forward upstream response headers to the browser
- Reverse geocoding is routed through an application-controlled backend proxy that does not forward upstream infrastructure headers to the browser
- Runtime schema validation is implemented for responses returned by the prayer-time and reverse-geocoding APIs
- TypeScript build errors are no longer configured to be ignored during build
- ESLint findings are no longer configured to be ignored during build

Residual risk remains more concentrated in third-party API trust boundaries and client-side privacy than in classic server-side compromise.

## Key Risks and Clarifications

### 1. Location Privacy Risk

Observed behavior:

- Coordinates are stored in browser local storage under the `location` key
- Coordinates are sent directly from the browser to external APIs

Exposure paths:

- Local storage access on shared devices
- Malicious extensions
- Any future XSS issue running in the origin

Risk level:

- Low to Medium, primarily privacy risk

Recommended hardening:

- Rounded coordinate storage is now implemented to reduce precision persisted on-device
- Add a user control to clear stored location and cached prayer data
- Add an optional privacy mode that disables persistent storage

### 2. Direct Browser Access to Third-Party APIs

Observed behavior:

- Browser requests prayer times through the same-origin `/api/prayer-times` endpoint
- Browser requests reverse geocoding through the same-origin `/api/reverse-geocode` endpoint

Risk level:

- Low for direct application compromise
- Medium for privacy and reliability concerns

Recommended hardening:

- Keep prayer-time requests on the application-controlled backend proxy in production
- Keep reverse geocoding on the application-controlled backend proxy in production
- Consider adding server-side caching and rate limiting for both proxy routes if request volume grows

### 3. Missing Frontend Hardening Headers

Observed behavior:

- CSP and standard security headers are now configured in application headers

Risk level:

- Reduced from Medium after header hardening, but still dependent on ongoing CSP compatibility review

Recommended hardening:

- Review the deployed CSP against real production traffic and tighten it further where possible
- Keep frame, MIME-type, referrer, and permissions headers enforced at the hosting layer

Illustrative CSP baseline:

```text
Content-Security-Policy:
default-src 'self';
script-src 'self';
connect-src 'self';
img-src 'self' data: https:;
style-src 'self' 'unsafe-inline';
font-src 'self' https://fonts.gstatic.com;
```

### 4. Server and Technology Fingerprinting

Observed behavior:

- Application-controlled responses now delete `X-Powered-By` and `Server` before headers are finalized
- Next.js `poweredByHeader` is disabled in configuration
- If a deployed environment still returns `Server: Caddy`, `Server: FrankenPHP`, or a custom `X-Powered-By` value such as `Kipchak by Mamluk`, that header is being injected by infrastructure after the app response leaves Next.js

Risk level:

- High when the final deployed response exposes product or internal platform names

Recommended hardening:

- Keep application-level stripping in place to avoid framework-added disclosure
- Suppress or overwrite `Server` and any custom `X-Powered-By` headers at the hosting, proxy, CDN, or gateway layer in production
- Verify the final deployed response headers with an external scan after deployment, because upstream infrastructure can re-add headers after application code runs

### 5. Dependency and Supply-Chain Risk

Observed behavior:

- Firebase SDK is installed but not active in current user-facing flows
- Genkit and Google GenAI dependencies are installed but not active in current user-facing flows

Risk level:

- Medium for maintenance and supply-chain surface

Recommended hardening:

- Remove unused packages where possible
- Continue dependency scanning with lockfile-based review

### 5. Sensor Access Risk

Observed behavior:

- The app requests orientation permissions where required and removes listeners on cleanup
- Sensor listeners now stop when the page is hidden and restart when visible again

Risk level:

- Low

Recommended hardening:

- Stop sensor listeners when the page becomes hidden or inactive
- Keep permission gating explicit and user initiated

### 6. API Response Integrity Risk

Observed behavior:

- External API responses are validated before use

Risk level:

- Reduced to Low, with remaining dependency on upstream service integrity and availability

Recommended hardening:

- Keep schema validation aligned with upstream API contracts and monitor for breaking changes

### 7. Build and Deployment Assurance Risk

Observed behavior:

- TypeScript and ESLint now run as enforced checks instead of being bypassed during build

Risk level:

- Reduced from Medium after restoring build enforcement

Recommended hardening:

- Require successful typecheck and lint in CI before deployment

## Security Testing Focus Areas

Recommended focus for security testing:

1. Review client-side handling of precise location data in browser storage.
2. Review disclosure and consent flow for geolocation and device orientation permissions.
3. Review external API dependency risks, availability handling, and error behavior.
4. Review whether direct client calls to third-party APIs meet the target compliance requirements.
5. Review local storage exposure risk on shared or compromised devices.
6. Review Content Security Policy, CORS, and outbound request restrictions at deployment time.
7. Review dependency inventory, especially installed but inactive packages such as Firebase and Genkit-related libraries.
8. Review the remaining direct-browser architecture for third-party API traffic.
9. Review runtime schema validation coverage as external providers evolve.

## Security Headers Recommended for Deployment

Recommended baseline headers for deployment review:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(self)`
- `Strict-Transport-Security` enabled at the hosting layer where appropriate

These are now configured in the application and should still be validated in the deployed hosting environment.

## Security Risk Summary

| Area | Risk Level | Notes |
| --- | --- | --- |
| Location privacy | Medium | Precise coordinates stored locally and sent to third parties |
| Third-party APIs | Low | Main concern is privacy and reliability rather than direct compromise |
| Local storage | Low | Reduced by coordinate rounding, cache TTL, and user-facing clear-data control |
| Sensors | Low | Permission-gated, but still part of client fingerprinting surface |
| Dependencies | Medium | Inactive packages increase supply-chain and maintenance surface |
| CSP and security headers | Low | Baseline CSP and security headers are configured |
| Build assurance | Low | Lint and type checks are enforced again |

Overall assessed risk:

- Low to Medium

This rating is appropriate for the current application profile: a utility religious application with limited personal data but meaningful location privacy considerations.

## Likely Security Test Activities

Security testers will likely focus on:

1. XSS attempts against client-rendered views.
2. Extraction of locally stored data such as coordinates and prayer cache entries.
3. Manipulation of third-party API requests and malformed response handling.
4. Location spoofing and permission-flow behavior.
5. Compass and sensor permission handling.
6. Dependency vulnerability review.
7. Validation of deployment headers and browser security policy.

## Declaration of External Components Observed in Repository

Installed libraries relevant to the current application include:

- Next.js
- React
- date-fns
- lucide-react
- Radix UI components
- react-hook-form
- zod
- recharts

Installed but not observed as active in current user-facing flows:

- Firebase SDK
- Genkit
- Google GenAI plugin

## Conclusion

This application is currently a location-aware Islamic utility app with client-side settings persistence and same-origin backend proxy routes for prayer times and reverse geocoding. The application code now strips common fingerprinting headers where it controls the response, but final `Server` branding still depends on the production hosting and proxy stack. Based on the code reviewed, the highest security-relevant data handled by the current implementation is the user's location data, both in transit to third-party services and at rest in browser local storage.

For a formal security assessment, the main audit priorities should be location privacy, frontend hardening, third-party API trust boundaries, and dependency reduction. The current codebase does not suggest high-risk server-side data exposure, but it would benefit from stronger browser security controls and clearer privacy-oriented data handling options.