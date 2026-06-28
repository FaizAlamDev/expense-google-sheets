# Expense Sheets 📊

A modern, full-stack Expense Logging Application that records daily expenses directly to a Google Sheet. It features a React (Vite + TypeScript) web client, an Express backend, and supports integration with an Android APK built via Expo using custom URL scheme redirection for Google OAuth.

---

## 🚀 Key Features

* **Daily Expense Tracking**: Log multiple expenses (up to 10 per day) with a name and amount.
* **Smart Sheet Management**: Automatically finds the correct row for a given date, appends new expenses to empty slots, or updates existing entries.
* **Auto-Summing Formula**: Dynamically injects a spreadsheet formula to parse amounts and calculate daily totals automatically without backend computations.
* **Google OAuth 2.0 Auth Flow**: Authenticates users securely via Google OAuth and persists tokens.
* **Multi-Platform Ready**: Seamless authorization flows for both web and mobile clients (redirecting back to Expo mobile apps via deep links).
* **Dockerized & Cloud Deployable**: Ready to deploy on Fly.io with persistent volumes for keeping authentication tokens active.

---

## 🏗️ Architecture & Authentication Flow

Below is the design of the application's authentication and data flow between the clients, server, and Google APIs:

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Web/Mobile APK)
    participant Client as Client (React / Expo)
    participant Server as Server (Node.js/Express)
    participant GoogleAuth as Google OAuth 2.0
    participant GoogleSheets as Google Sheets API

    User->>Client: Open App & Select Date
    Client->>Server: GET /api/checkAuth
    Server-->>Client: Return auth status (true/false)
    
    Note over Client, Server: If not authenticated:
    Client->>Server: Redirect to /auth?platform=[web|mobile]
    Server->>GoogleAuth: Generate Auth URL with state=[web|mobile]
    GoogleAuth-->>User: Show Google Sign-in & Consent Screen
    User->>GoogleAuth: Approve Permission
    GoogleAuth->>Server: Redirect to /auth/callback?code=CODE&state=platform
    Server->>GoogleAuth: Exchange CODE for Access & Refresh Tokens
    GoogleAuth-->>Server: Return Tokens
    Server->>Server: Write tokens to /data/tokens.json (Persistent Volume)
    
    alt state is mobile
        Server-->>Client: Redirect to expenseSheetsApp://redirect (Expo App)
    else state is web
        Server-->>Client: Redirect to FRONTEND_URL
    end

    Note over Client, GoogleSheets: When Authenticated:
    User->>Client: Input Date & Expenses -> Submit
    Client->>Server: POST /api/expenses { date, expenses }
    Server->>GoogleSheets: Read sheet row for date & write new expenses
    GoogleSheets-->>Server: Confirm updates
    Server-->>Client: Success response
    Client-->>User: Toast success message & Clear form
```

---

## 📋 Google Sheet Structure

The server formats and inserts entries into the Google Sheet named `Sheet1` using the following column mapping:

* **Column A**: `Date` (e.g. `2026-06-29`)
* **Columns B to K (Slots 1–10)**: Daily expenses formatted as `"{name}: {amount}"` (e.g. `Lunch: 15.50`)
* **Column L (Total)**: An Excel/Google Sheets formula dynamically generated and written for new rows:
  ```excel
  =SUMPRODUCT(ARRAYFORMULA(IFERROR(REGEXEXTRACT(B{row}:K{row}, ":\s(\d+\.?\d*)")*1, 0)))
  ```
  *This formula extracts the numerical amount after the colon (`:`) in columns B through K, converts them to numbers, and sums them up automatically.*

---

## ⚙️ Programmatic Setup & Configuration

### Prerequisites

* **Node.js** (v20+) and **npm** installed.
* A **Google Cloud Console** project with the **Google Sheets API** enabled.
* A **Google Sheet** to use as your database.

---

### Step 1: Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Search for the **Google Sheets API** and click **Enable**.
4. Configure the **OAuth Consent Screen**:
   * Set user type to **External** (or **Internal** if using Google Workspace).
   * Fill out the app information.
   * Add the scope: `https://www.googleapis.com/auth/spreadsheets`.
   * Add your Google account under **Test Users** (crucial if the app is in testing mode).
5. Create **OAuth Credentials**:
   * Navigate to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
   * Select Application Type: **Web application**.
   * Add Authorized Redirect URIs:
     * Local development: `http://localhost:5000/auth/callback`
     * Production: `https://your-backend-app.fly.dev/auth/callback`
   * Click **Create** and note down the **Client ID** and **Client Secret**.

---

### Step 2: Google Sheet Setup

1. Create a new Google Sheet.
2. Ensure the sheet tab is named `Sheet1` (or update server code if renamed).
3. Copy the **Sheet ID** from the sheet's URL:
   `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

---

### Step 3: Server Configuration

Navigate into the `server` directory and configure the environment variables:

1. Create a `server/.env` file:
   ```env
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   SHEET_ID=your_google_sheet_id_here
   CLIENT_ID=your_google_oauth_client_id_here
   CLIENT_SECRET=your_google_oauth_client_secret_here
   REDIRECT_URI=http://localhost:5000/auth/callback
   ```
2. *(Optional)* Download the client credentials JSON from Google Cloud Console, rename it to `credentials.json`, and place it in the `server` directory.

---

### Step 4: Client Configuration

Navigate into the `client` directory and configure the environment variables:

1. Create a `client/.env` file:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

---

### Step 5: Install & Run Locally

From the root directory of the project, you can run both the client and server concurrently using:

```bash
# Install dependencies in root, client, and server
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Start both client (Vite) and server (Express) concurrently
npm run dev
```

* The client will start at: `http://localhost:5173`
* The server will start at: `http://localhost:5000`

---

## 🐳 Production Deployment (Fly.io example)

The server contains a `Dockerfile` and a `fly.toml` for easy container deployment. Since the Google OAuth refresh token needs to be saved persistently to avoid asking the user to log in repeatedly, a persistent volume is used.

### Fly Volume Setup

The server uses a persistent volume called `tokens_data` mapped to `/data` in the container.

1. Create the volume on Fly.io:
   ```bash
   fly volumes create tokens_data --region bom --size 1
   ```
2. Deploy the application:
   ```bash
   fly deploy
   ```
3. Set your production environment secrets on Fly.io:
   ```bash
   fly secrets set SHEET_ID="your_sheet_id" CLIENT_ID="your_client_id" CLIENT_SECRET="your_client_secret" REDIRECT_URI="https://your-backend-app.fly.dev/auth/callback" FRONTEND_URL="https://your-frontend-app.vercel.app"
   ```

---

## 📱 Expo Mobile APK Integration

To compile this project as an Android APK using Expo and maintain proper Google OAuth flows, follow these integration rules:

1. **Custom URL Scheme**: Ensure your Expo configuration (`app.json`) includes the scheme matching the server's redirect controller config:
   ```json
   {
     "expo": {
       "scheme": "expenseSheetsApp"
     }
   }
   ```
2. **Authorization Call**:
   * Open the OAuth flow in the mobile application by pointing a browser or web session to:
     `https://your-backend-app.fly.dev/auth?platform=mobile`
   * This sends the `state` parameter as `mobile`.
3. **Redirection Processing**:
   * Once authorization is approved, the server intercepts the callback, retrieves the tokens, saves them, and performs a redirect to:
     `expenseSheetsApp://redirect`
   * This deep-links back into your Expo React Native application, signaling that the device is successfully authorized and ready to make API calls to `/api/expenses`.
