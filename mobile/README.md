# SAHAJ Mobile App

The official student companion mobile app for SAHAJ campus platform.

## Getting Started

The app talks to the deployed backend at `https://sahaj-backend.bytemap.in`. The address is
`kApiBaseUrl` in `lib/core/constants.dart`; there is nothing to configure.

```sh
flutter pub get
flutter run
```

## Tests

```sh
flutter analyze --no-fatal-infos
flutter test
```

The suite is offline and covers the brand tokens, text contrast, the shared
buttons, cards and overlay, the home header, the API address, and a source
guard that blocks shadows, blur, gradients outside the three functional uses,
emoji, text under 11px and the legacy orange palette.
