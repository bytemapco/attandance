# Smart Attendance iPhone Update Guide (Ubuntu + Codemagic + iLoader)

This guide repeats the workflow used to install **Smart Attendance App** on a physical iPhone from an Ubuntu computer using a free Apple Account.

## How the workflow works

1. Build the iOS app in **Codemagic**.
2. Download the build artifact (`Runner.app.zip`).
3. Convert that artifact into an `.ipa` with `make_ipa.sh`.
4. Import the `.ipa` into **iLoader** and use **Sign & Install App**.
5. Open the app on the iPhone.

**Important:** Ubuntu cannot natively produce a signed iOS app. The script only packages the `.app` into the `.ipa` container; it does not sign it. iLoader handles signing/installation in this workflow. A free Apple Account's iOS development signing generally expires after about 7 days, so you may need to sign and install again.

## One-time setup

- Ubuntu computer with `bash`, `unzip`, and `zip` installed.
- iLoader installed from its official source: <https://iloader.app/> or <https://github.com/nab138/iloader>.
- iPhone connected by USB and unlocked.
- Your Flutter project pushed to GitHub, with the iOS project files committed.
- Codemagic connected to the repository and configured for an iOS Release build.

Install command-line tools if needed:

```bash
sudo apt update
sudo apt install -y unzip zip
```

Keep your Apple Account password and verification codes private. Only enter credentials into software you have independently chosen to trust.

## A. Update the app code

From your Flutter project folder:

```bash
git status
flutter pub get
```

Make your code changes, test what you can, then commit and push:

```bash
git add .
git commit -m "Update Smart Attendance app"
git push
```

If there are no changes to commit, Git will tell you. Do not commit secrets, signing keys, API credentials, or private configuration files.

## B. Build in Codemagic

1. Open your app's workflow in Codemagic.
2. Confirm the repository/branch is the one you updated.
3. Choose the iOS workflow and **Release** mode.
4. For the unsigned artifact workflow used here, keep code signing disabled if that is how your successful build was configured.
5. Start the build and wait for it to finish successfully.
6. Download the generated `Runner.app.zip` artifact to your Ubuntu computer.

If you change native iOS configuration, plugins, bundle ID, or deployment settings, check the build logs and iOS project files too. Do not delete `ios/Runner.xcworkspace/contents.xcworkspacedata`; it needs to be committed. Check that `.gitignore` does not exclude `*.xcworkspace/`.

## C. Create the IPA on Ubuntu

Save `make_ipa.sh` somewhere convenient. From the folder containing the script, run:

```bash
chmod +x make_ipa.sh
./make_ipa.sh ~/Downloads/Runner.app.zip
```

By default, the script writes `attendance_mobile.ipa` in the current folder. You can choose the output path:

```bash
./make_ipa.sh ~/Downloads/Runner.app.zip ~/Downloads/attendance_mobile.ipa
```

The script accepts either:
- a Codemagic ZIP containing `Runner.app/` (the artifact format used in this workflow);
- a ZIP that already contains `Payload/SomeApp.app/`; or
- a path to an extracted `.app` directory.

It checks that an app bundle and `Info.plist` are present. The resulting IPA is a packaging step only; it is not proof that the app is signed.

## D. Sign and install with iLoader

1. Open iLoader and connect/unlock the iPhone.
2. Choose **Import IPA** and select the generated `.ipa`.
3. Follow iLoader's prompts to **Sign & Install App** using your Apple Account.
4. Wait for iLoader to report success.
5. On the iPhone, open the app. If iOS asks you to trust the developer, use **Settings → General → VPN & Device Management** and trust the profile you created, if shown.
6. If iOS requires Developer Mode, enable it at **Settings → Privacy & Security → Developer Mode**, restart, then confirm **Turn On** after reboot.

Only trust a developer profile you recognize and intentionally created.

## E. When updating an app already installed

Repeat sections **A–D**. Keep the same iOS bundle identifier between builds if you want the update to replace the existing app instead of appearing as a separate app. If installation fails, verify the bundle ID and signing identity match the installed app. Back up important app data before reinstalling; uninstalling can delete locally stored data.

## Troubleshooting

- **Codemagic fails with “Xcode workspace not found”:** confirm `ios/Runner.xcworkspace/contents.xcworkspacedata` is tracked by Git and not ignored. Commit and push it, then rebuild.
- **IPA script says no `.app` found:** check that you downloaded the actual iOS app artifact, not an Android artifact or a different archive. Inspect with `unzip -l Runner.app.zip | head -40`.
- **“Untrusted Developer”:** trust the developer profile under **Settings → General → VPN & Device Management**, if available.
- **“Developer Mode Required”:** enable it under **Settings → Privacy & Security → Developer Mode**, then restart and confirm.
- **App no longer opens after several days:** free-account provisioning may have expired. Rebuild if needed, then sign and install again with iLoader.
- **App installs but crashes or shows a blank screen:** this is usually an app/runtime issue, not an IPA packaging issue. Check device logs and Codemagic build output.

## Official links

- iLoader: <https://iloader.app/>
- iLoader source and documentation: <https://github.com/nab138/iloader>
- Codemagic: <https://codemagic.io/>
