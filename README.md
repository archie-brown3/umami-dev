<img src="assets/images/header.png" alt="umami — recipe discovery and step-by-step cooking" width="100%">

A mobile app for finding, saving, and sharing recipes.

## Development Setup

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/umami-dev.git
cd umami-dev
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Then edit `.env.local` to include your API keys.

### Running the App

#### Standard Development Mode

```bash
npm start
```

#### Tunnel Mode (Recommended for API Connectivity Issues)

If you're experiencing API connectivity issues when testing on a physical device, use tunnel mode:

```bash
npm run dev-tunnel
```

This creates a tunnel that bypasses local network restrictions and allows your device to communicate with the development server regardless of network configuration.

#### Tunnel Mode with Debugging

For more verbose logging to diagnose connectivity issues:

```bash
npm run tunnel-debug
```

### API Connection Diagnostics

When running in tunnel mode, you'll see:

1. A floating "API Test" button on the main screen
2. A connection diagnostics tool in the bottom left corner

Use these tools to:

- Check connectivity to all APIs (Supabase, DeepSeek, etc.)
- Diagnose network issues
- Verify environment variables are correctly loaded

## API Dependencies

This app relies on several external APIs:

1. **Supabase** - For database and authentication
2. **DeepSeek API** - For recipe analysis and AI processing
3. **Recipe Extraction Service** - For extracting recipes from websites and Instagram

All API keys must be correctly configured in `.env.local` for proper functionality.

## Troubleshooting Common Issues

### "Network request failed" Errors

- Make sure you're running in tunnel mode (`npm run dev-tunnel`)
- Check that your API keys are properly set in `.env.local`
- Verify that the APIs are accessible from your network
- Try using a different network (switching from WiFi to cellular data)

### DeepSeek API Issues

- Verify your DeepSeek API key in `.env.local`
- The app has a fallback API key, but it may be rate-limited

### Recipe Extraction Service Issues

- The extraction service is hosted on Render which may have cold starts
- The first request might take longer to process
- The app will automatically retry failed requests
