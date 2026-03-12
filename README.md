# Enjoy TV Screens

A React app that displays Google Slides presentations on Google TV displays. Hosted on GitHub Pages with a Google Apps Script bridge for secure, keyless access to slides.

## Architecture

```
Google TV Browser → GitHub Pages (React App) → Google Apps Script Bridge → Google Slides API
```

- **No API keys or OAuth on the TV** — the Apps Script bridge handles all authentication
- **Display Code Pairing** — TVs are authorized via a code shown on screen
- **Auto-refresh** — slides refresh every 6 hours automatically

## Setup

### 1. Deploy the Google Apps Script Bridge

1. Go to [script.google.com](https://script.google.com/) and create a **new project**
2. Delete the default code and paste the contents of [`google-apps-script/Code.gs`](google-apps-script/Code.gs)
3. **Important:** In the Apps Script editor, click the **+** next to "Services" in the left sidebar → Add **Google Slides API**
4. Run the `testAccess` function first (▶ button) to verify it can access your presentation
5. Click **Deploy** → **New deployment**
6. Click the gear icon → Select **Web app**
7. Set **Execute as**: Me
8. Set **Who has access**: **Anyone**
9. Click **Deploy** and copy the Web app URL

### 2. Configure GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** and add:

| Secret | Value |
|--------|-------|
| `VITE_BRIDGE_URL` | The Web app URL from step 1 |
| `VITE_SLIDES_PRESENTATION_ID` | Your Google Slides presentation ID (from the URL) |
| `VITE_ACCESS_PIN` | A PIN for authorizing displays (e.g., `2323`) |

### 3. Deploy to GitHub Pages

Push to `main` or manually trigger the workflow in **Actions** → **Deploy to GitHub Pages**.

### 4. Set Up a TV Display

1. Open the app URL on the Google TV browser
2. The TV will show a **6-character display code**
3. On your phone/laptop, visit the same URL with `?admin=true` appended
4. Enter the display code and your PIN
5. The TV is now authorized for 30 days

## Local Development

```bash
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Documentation & AI Skills
A complete technical walkthrough of the core app flow and authentication strategy can be found in the associated `walkthrough.md` document. AI instructions and operational boundaries for this repository are defined as an AI Skill inside `_agents/skills/enjoy_tv_screens.md`.

## Troubleshooting

### "Could not open slides. Check ID and permissions."

- Make sure the **Google Slides API** is enabled in the Apps Script project (Services → + → Google Slides API)
- Make sure the presentation is shared with the Google account that deployed the script
- Run the `testAccess` function in the Apps Script editor to verify
- After any script changes, create a **new deployment** (the URL changes each time)

### Slides not loading on deployed site

- Check that GitHub Secrets are set correctly
- Re-run the GitHub Actions workflow after changing secrets
- The `VITE_SLIDES_PRESENTATION_ID` should NOT have quotes around it

# END
