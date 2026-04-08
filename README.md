![MetaMask logo](logo.png?raw=true)

# MetaMask

[![CI](https://github.com/MetaMask/metamask-mobile/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MetaMask/metamask-mobile/actions/workflows/ci.yml) [![CLA](https://github.com/MetaMask/metamask-mobile/actions/workflows/cla.yml/badge.svg?branch=main)](https://github.com/MetaMask/metamask-mobile/actions/workflows/cla.yml)

MetaMask is a mobile wallet that provides easy access to websites that use the [Ethereum](https://ethereum.org/) blockchain and other EVM-compatible networks. The app also supports non-EVM chains (including Solana) via the extensible Snaps architecture, cross-chain bridging and swaps, staking and earning, and hardware wallet connectivity (Ledger, QR-based Keystone).

For up to the minute news, follow our [Twitter](https://twitter.com/metamask) or [Medium](https://medium.com/metamask) pages.

To learn how to develop MetaMask-compatible applications, visit our [Developer Docs](https://docs.metamask.io).

To learn how to contribute to the MetaMask codebase, visit our [Contributor Docs](https://github.com/MetaMask/contributor-docs).

## Key Features

- **Multi-chain wallet** — Manage assets across Ethereum, Linea, Polygon, Solana, and other networks from a single app
- **In-app browser** — Interact with Dapps directly through the built-in Web3 browser
- **Cross-chain Bridge & Swaps** — Bridge and swap tokens across EVM and Solana chains via integrated `BridgeController` and `SwapsController`
- **Staking & Earning** — Stake ETH and earn yield through the integrated `EarnController`
- **Multi-SRP support** — Import and manage multiple Secret Recovery Phrases within a single wallet
- **Snaps extensibility** — Install third-party Snaps plugins to add new chain support and functionality
- **Hardware wallets** — Connect Ledger (Bluetooth) and Keystone (QR-based) hardware wallets
- **Security alerts** — Real-time transaction risk assessment via PPOM (Privacy Preserving Offline Module) and Blockaid integration
- **Smart Transactions** — Optimized transaction submission with MEV protection and batching
- **Notifications** — Push notifications for transaction activity and account events
- **Profile syncing** — Backup and sync account data across devices via the Backup and Sync feature

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (v52) support
- **Language**: TypeScript / JavaScript
- **State Management**: Redux Toolkit + MetaMask Controller Messenger pattern
- **Navigation**: React Navigation v5
- **Native Platforms**: iOS (Xcode), Android (Android Studio)
- **Build System**: Metro bundler, Bitrise CI/CD
- **Node**: v20.18.0 (see `.nvmrc`)
- **Ruby**: v3.1.6 (for iOS CocoaPods, see `.ruby-version`)
- **Package Manager**: Yarn v1

## Project Structure

```
metamask-mobile/
├── app/
│   ├── core/
│   │   ├── Engine/              # Singleton controller orchestrator
│   │   │   ├── Engine.ts        # Initializes and composes all controllers
│   │   │   ├── controllers/     # Modular controller init functions
│   │   │   ├── messengers/      # Controller messenger factories
│   │   │   └── types.ts         # EngineState, EngineContext type definitions
│   │   ├── BackgroundBridge/    # RPC pipeline connecting Dapps to wallet
│   │   ├── RPCMethods/          # JSON-RPC method middleware
│   │   ├── Snaps/               # Snap execution and permission utilities
│   │   └── AppConstants.ts      # Global application constants
│   ├── components/
│   │   ├── UI/                  # Reusable UI components (ActionView, Tokens, etc.)
│   │   └── Views/               # Top-level screen components (Wallet, Browser, etc.)
│   ├── component-library/       # Design system components
│   ├── selectors/               # Redux selectors for UI-ready state
│   ├── reducers/                # Redux reducers
│   ├── store/                   # Redux store configuration
│   ├── constants/
│   │   └── navigation/Routes.ts # Centralized route manifest
│   ├── util/                    # Utility functions (networks, numbers, etc.)
│   └── images/                  # App image assets
├── ios/                         # iOS native project (Xcode)
├── android/                     # Android native project (Gradle)
├── e2e/                         # Detox E2E test specs
├── wdio/                        # Appium/WebDriverIO tests
├── locales/                     # i18n translation files (JSON)
├── scripts/                     # Build, setup, and automation scripts
├── patches/                     # Patch files for dependencies
├── docs/                        # Documentation
│   └── readme/                  # Setup, testing, debugging guides
├── metro.config.js              # Metro bundler configuration
├── jest.config.js               # Jest test configuration
├── tsconfig.json                # TypeScript configuration
├── bitrise.yml                  # Bitrise CI/CD pipeline definitions
└── package.json                 # Dependencies and scripts
```

### Core Architecture

The **Engine** (`app/core/Engine/Engine.ts`) is the central singleton that initializes and composes dozens of specialized controllers:

| Controller | Purpose |
|---|---|
| `KeyringController` | Manages encrypted vaults, seed phrases, and private keys |
| `AccountsController` | Standardized account management (internal accounts) |
| `NetworkController` | Multi-network provider management (EVM chains) |
| `TransactionController` | Transaction lifecycle (creation, signing, submission) |
| `BridgeController` / `BridgeStatusController` | Cross-chain bridge quotes and transaction tracking |
| `SwapsController` | Token swap quotes and execution |
| `EarnController` | Staking and lending operations |
| `SmartTransactionsController` | MEV-protected transaction submission |
| `PermissionController` | Dapp permission management (CAIP-25) |
| `SnapController` | Snap installation, execution, and state management |
| `PPOMController` | Privacy-preserving transaction security validation |
| `NotificationServicesController` | Push notification management |
| `RemoteFeatureFlagController` | Feature flag management via LaunchDarkly |
| `PreferencesController` | User preferences and settings |

New controllers are integrated via a modular pattern — see [`app/core/Engine/README.md`](./app/core/Engine/README.md) for the integration guide.

## Documentation

- [Architecture](./docs/readme/architecture.md)
- [Expo Development Environment Setup](./docs/readme/expo-environment.md)
- [Native Development Environment Setup](./docs/readme/environment.md)
- [Build Troubleshooting](./docs/readme/troubleshooting.md)
- [Testing](./docs/readme/testing.md)
- [Debugging](./docs/readme/debugging.md)
- [API Call Logging for Debugging](./docs/readme/api-logging.md)
- [Storybook](./docs/readme/storybook.md)
- [Miscellaneous](./docs/readme/miscellaneous.md)
- [E2E Testing Segment Events](./docs/testing/e2e/segment-events.md)
- [Adding Confirmations](./docs/confirmations.md)

## Getting Started

### Using Expo (recommended)

Expo is the fastest way to start developing. Developers don't need to compile native code — just download a precompiled development build and run the JavaScript bundler. The development build connects to the bundler to load code.

#### Expo Environment Setup

[Install Node (v20.18.0), Yarn v1, and Watchman.](./docs/readme/expo-environment.md)

#### Clone the project

```bash
git clone git@github.com:MetaMask/metamask-mobile.git && \
cd metamask-mobile
```

#### Install dependencies

```bash
yarn setup:expo
```

#### Run the bundler

```bash
yarn watch
```

#### Download and install the development build

- Expo development builds are hosted in [Runway](https://www.runway.team/) buckets and are made available to all contributors through the public bucket links below. A new build is generated every time a PR is merged into the `main` branch.

- For Android:
  - Download and install an `.apk` file from this [Runway bucket](https://app.runway.team/bucket/hykQxdZCEGgoyyZ9sBtkhli8wupv9PiTA6uRJf3Lh65FTECF1oy8vzkeXdmuJKhm7xGLeV35GzIT1Un7J5XkBADm5OhknlBXzA0CzqB767V36gi1F3yg3Uss) onto your Android device or emulator.
- For iOS:
  - Physical device
    - Your test device needs to first be registered with our Apple developer account.
    - Once registered, download and install an `.ipa` file from this [Runway bucket](https://app.runway.team/bucket/MV2BJmn6D5_O7nqGw8jHpATpEA4jkPrBB4EcWXC6wV7z8jgwIbAsDhE5Ncl7KwF32qRQQD9YrahAIaxdFVvLT4v3UvBcViMtT3zJdMMfkXDPjSdqVGw=) onto your device.
  - Simulator
    - Download and install an `.app` file from this [Runway bucket](https://app.runway.team/bucket/aCddXOkg1p_nDryri-FMyvkC9KRqQeVT_12sf6Nw0u6iGygGo6BlNzjD6bOt-zma260EzAxdpXmlp2GQphp3TN1s6AJE4i6d_9V0Tv5h4pHISU49dFk=) onto your simulator.
    - Note: Our `.app` files are zipped and hosted under `Additional Artifacts` in the bucket. Since this hosting additional artifacts in public buckets is a relatively new feature, contributors may find that some builds are missing additional artifacts. Under the hood, these are usually associated with failed or aborted Bitrise builds. We are working with the Runway team to better filter out these builds and are subject to change in the future.

#### Load the app

If on a simulator:

- Use the initial Expo screen that appears when starting the development build to choose the bundler URL
- OR press "a" for Android or "i" for iOS on the terminal where the bundler is running

If on a physical device:

- Use the camera app to scan the QR code presented by the bundler running on the terminal

That's it! This will work for any JavaScript development. If you need to develop or modify native code, please see the next section.

### Native Development

If developing or modifying native code or installing any library that introduces or uses native code, you need to compile the native side of the application. An Expo precompiled build will not suffice.

#### Native Environment Setup

Before running the app for native development, make sure your development environment has all the required tools. Several of these tools (Node v20.18.0 and Ruby v3.1.6) require specific versions in order to successfully build the app.

[Setup your development environment](./docs/readme/environment.md)

#### Building the App

**Clone the project**

```bash
git clone git@github.com:MetaMask/metamask-mobile.git && \
cd metamask-mobile
```

##### Firebase Messaging Setup

MetaMask uses Firebase Cloud Messaging (FCM) to enable app communications. To integrate FCM, you'll need configuration files for both iOS and Android platforms.

###### Internal Contributor Instructions

1. Grab the `.js.env` file from 1Password, ask around for the correct vault. This file contains the `GOOGLE_SERVICES_B64_ANDROID` and `GOOGLE_SERVICES_B64_IOS` secrets that will be used to generate the relevant configuration files for iOS/Android.
2. [Install](./README.md#install-dependencies) and [run & start](./README.md#running-the-app-for-native-development) the application as documented below.

###### External Contributor Instructions

As an external contributor, you need to provide your own Firebase project configuration files:

- **`GoogleService-Info.plist`** (iOS)
- **`google-services.json`** (Android)

1. Create a Free Firebase Project
   - Set up a Firebase project in the Firebase Console.
   - Configure the project with a client package name matching `io.metamask` (IMPORTANT).
2. Add Configuration Files
   - Create/Update the `google-services.json` and `GoogleService-Info.plist` files in:
   - `android/app/google-services.json` (for Android)
   - `ios/GoogleServices/GoogleService-Info.plist` directory (for iOS)
3. Create the correct base64 environment variables.

```bash
# Generate Android Base64 Version of Google Services
export GOOGLE_SERVICES_B64_ANDROID="$(base64 -w0 -i ./android/app/google-services.json)" && echo "export GOOGLE_SERVICES_B64_ANDROID=\"$GOOGLE_SERVICES_B64_ANDROID\"" | tee -a .js.env

# Generate IOS Base64 Version of Google Services
export GOOGLE_SERVICES_B64_IOS="$(base64 -w0 -i ./ios/GoogleServices/GoogleService-Info.plist)" && echo "export GOOGLE_SERVICES_B64_IOS=\"$GOOGLE_SERVICES_B64_IOS\"" | tee -a .js.env
```

> [!CAUTION]
> In case you don't provide your own Firebase project config file or run the steps above, you will face the error `No matching client found for package name 'io.metamask'`.

In case of any doubt, please follow the instructions in the link below to get your Firebase project config file.
[Firebase Project Quickstart](https://firebaseopensource.com/projects/firebase/quickstart-js/messaging/readme/#getting_started)

##### Install dependencies

```bash
yarn setup
```

_Not the usual install command — this will run scripts and a lengthy postinstall flow._

#### Running the App for Native Development

**Run Metro bundler**

```bash
yarn watch
```

_Like a local server for the app._

**Run on an iOS device**

```bash
yarn start:ios
```

**Run on an Android device**

```bash
yarn start:android
```

### Build Variants

The app supports multiple build variants for different use cases:

| Variant | Description | Command |
|---|---|---|
| Debug | Standard development build | `yarn start:ios` / `yarn start:android` |
| QA | QA testing (blocks wallet setup screen) | `yarn start:ios:qa` / `yarn start:android:qa` |
| Flask | Canary/experimental build for testing new features like Snaps | `yarn start:ios:flask` / `yarn start:android:flask` |
| Release | Production build | `yarn build:ios:release` / `yarn build:android:release` |

## Testing

### Unit Tests

```bash
yarn test:unit
```

Runs Jest tests for all files under `app/` and `locales/`. Configuration is in `jest.config.js`.

### E2E Tests (Detox)

The primary mobile automation framework. Tests are located in `e2e/specs/`.

```bash
# Build for testing
yarn test:e2e:ios:debug:build    # iOS
yarn test:e2e:android:debug:build # Android

# Run tests
yarn test:e2e:ios:debug:run      # iOS
yarn test:e2e:android:debug:run  # Android
```

### Appium Tests

Used for app launch times and upgrade testing. Tests are in `wdio/`.

```bash
yarn test:wdio:ios       # iOS
yarn test:wdio:android   # Android
```

### Linting & Type Checking

```bash
yarn lint          # ESLint
yarn lint:tsc      # TypeScript type checking
```

For more details, see the [Testing documentation](./docs/readme/testing.md).
