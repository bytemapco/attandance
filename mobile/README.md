# SAHAJ Mobile App

The official student companion mobile app for SAHAJ campus platform.

## Getting Started

The app needs the backend URL at build time. There is no fallback host, so
the app shows an error screen if the define is missing.

Start the backend (`./run.sh` from the repository root), then run the app on
an Android emulator, where `10.0.2.2` is the host machine:

```sh
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

## Tests

```sh
flutter analyze --no-fatal-infos
flutter test
```

The suite is offline and covers the brand tokens, text contrast, the shared
buttons, cards and overlay, the home header, the API URL guard, and a source
guard that blocks shadows, blur, gradients outside the three functional uses,
emoji, text under 11px and the legacy orange palette.
