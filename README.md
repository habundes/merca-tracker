## Commands

Run from this directory (`merca-tracker/`):

```bash
npm start          # expo start (choose platform interactively)
npm run android    # expo start --android
npm run ios        # expo start --ios (requires macOS + Xcode Simulator)
npm run web        # expo start --web
npx tsc --noEmit   # type-check without emitting
```

No test runner, linter, or formatter is configured. Type-check is the only automated verification. If iOS Simulator fails to launch via `osascript` on macOS, grant Terminal → System Events permission under Privacy → Automation, or open Simulator manually first.