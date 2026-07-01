# Expense Sheets Mobile App

A cross-platform mobile application built using Expo (React Native), TypeScript, and NativeWind (Tailwind CSS). It connects to the Express backend to log daily expenses directly to a Google Sheet.

---

## Features

* **Quick Logging**: Add up to 10 expenses per day with specific descriptions and amounts.
* **Date Picker**: Choose any date and automatically check the remaining expense slots available.
* **Google OAuth Redirection**: Integrates with the backend auth flow and uses deep-linking to seamlessly authorize the mobile device.
* **Modern Styling**: Styled with Tailwind CSS via NativeWind v4.

---

## Setup and Installation

### 1. Prerequisites

Ensure you have the following installed on your machine:
* **Node.js** (v20 or higher) and **npm**.
* **Expo Go** app installed on your physical mobile device (Android or iOS) for testing, or an emulator/simulator.
* **EAS CLI**: `npm install -g eas-cli`

### 2. Install Dependencies

Navigate to the `mobile` directory and install the packages:

```bash
cd mobile
npm install
```

### 3. Environment Variables Configuration

1. Create a `.env` file in the `mobile` directory:
   ```env
   API_URL=http://<YOUR_LOCAL_IP>:5000
   ```
2. **Local Development Networking**:
   * If running on a physical device (using Expo Go or a Development Build), using `localhost` or `127.0.0.1` will not work because the device cannot resolve your computer's localhost.
   * Instead, find your computer's local IP address (e.g., `192.168.1.50`) and set `API_URL` to `http://192.168.1.50:5000`. Ensure both your mobile device and computer are on the same Wi-Fi network.
   * If using a production server, set `API_URL` to your production backend URL (e.g., `https://expense-google-sheets.fly.dev`).

---

## Running the Development Server

Start the Metro bundler to run the application locally:

```bash
npm run start
# or: npx expo start
```

### Running on a Device/Emulator:

Once the Metro bundler starts, scan the QR code in your terminal:
* **Physical Android / iOS Device**: Scan the QR code using the Expo Go app (Android) or the default Camera app (iOS).
* **Android Emulator**: Press `a` in the terminal (requires Android Studio and a running AVD).
* **iOS Simulator**: Press `i` in the terminal (requires macOS and Xcode).

---

## Google OAuth and Deep Linking

The application uses custom URL scheme deep linking to return users back to the app after they authenticate with Google:

1. **Custom Scheme**: Configured as `expenseSheetsApp` in `app.config.js` (`scheme: "expenseSheetsApp"`).
2. **Redirect URL**: The redirect URL registered with `expo-auth-session` is `expenseSheetsApp://redirect`.
3. **Flow**: 
   * When the mobile app starts, it checks authentication via `GET /api/checkAuth`.
   * If unauthenticated, it opens the browser to: `${API_URL}/auth?platform=mobile`.
   * The backend handles the Google OAuth login. Once successfully signed in, the backend redirects back to the mobile app via `expenseSheetsApp://redirect`.

---

## Building the App (Expo Application Services - EAS)

This project is configured with EAS Build to compile standalone binaries. Use the following commands to configure and build the application:

### 1. Authentication and Project Setup

* **Login to Expo**
  ```bash
  eas login
  ```
  Authenticates your terminal session with the Expo developer portal.

* **Configure EAS Project**
  ```bash
  eas build:configure
  ```
  Initializes and configures the EAS builds for the project.

### 2. Environment Variables and Secrets for Cloud Builds

* **Create Environment Secret**
  ```bash
  eas secret:create --name API_URL --value https://expense-google-sheets.fly.dev
  ```
  Creates a secure environment secret on EAS servers. Since app.config.js references `process.env.API_URL`, this secret will automatically inject the production backend URL into the client bundle at build-time.

* **Manage Environment Variables**
  ```bash
  eas env:create
  eas env:list
  ```
  Allows creating and listing environment variables for cloud builds via the CLI.

### 3. Build Commands

* **Build Android Development Client**
  ```bash
  eas build --platform android --profile development
  ```
  Builds a custom development client containing the `expo-dev-client` library for native testing.

* **Build Android Production App**
  ```bash
  eas build -p android --profile production
  ```
  Compiles the production-ready distribution binary (.aab) for the Google Play Store.

* **Build Android Production APK**
  ```bash
  eas build -p android --profile production-apk
  # or: eas build --profile production-apk --platform android
  ```
  Builds a standalone installable `.apk` using production configuration for direct installation and testing on devices.
