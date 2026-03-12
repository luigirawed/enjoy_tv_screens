---
description: SKILL template for interacting with the enjoy_tv_screens codebase. Defines the application structure, expected conventions, and maintenance guidelines.
---

# Enjoy TV Screens - SKILL

## 1. Purpose
This SKILL provides the required context and operational boundaries required when working on the `enjoy_tv_screens` codebase. This React/Vite application acts as a keyless slide viewer for Google TVs which interfaces with a Google Apps Script bridge in order to read Google Slides. 

## 2. Source Files & Core Architecture
- **Frontend Codebase**: React, Vite, Vanilla CSS.
  - Location: `src/` directory.
  - Entry points: `main.jsx` and `App.jsx`.
  - Core Components: `App.jsx` (Orchestrator), `SlideViewer.jsx` (Carousel), `SettingsMenu.jsx` (Configuration).
- **Authentication**: `display-pairing.js` (Pairing logic) and `ip-check.js` (IP-based authorization).
- **External Bridge**: The app communicates strictly with `VITE_BRIDGE_URL` (Google Apps Script), relying on it to fetch presentation data securely.

## 3. Data Model
- The application relies primarily on environment variables (`.env`) for its backend configuration, specifically:
  - `VITE_BRIDGE_URL`: App Script proxy endpoint.
  - `VITE_SLIDES_PRESENTATION_ID`: The default Google Slides deck ID.
  - `VITE_ACCESS_PIN`: Static PIN for admin authorization.
  - `VITE_ALLOWED_IPS`: (Retained for future use) Comma-separated list of pre-authorized networking IP values.
- **Client Side State**: Minimal local storage variables to remember UI settings like `tv_interval` or 30-day authentication tokens via `tv_auth_token`.

## 4. Modification Guide & Workflow
- **When Adding Features**: Avoid adding placeholder, mock, or dead-end logic. Ensure the feature connects cohesively into the `App.jsx` orchestrator or an existing screen component. Ensure new screens adhere to the established `.css` convention (plain CSS matched identically to the component `<Name>.jsx`).
- **When Handling Auth**: Do not introduce native Google OAuth APIs or API keys into the frontend. The system's design explicitly prevents key exposure to the TV browser using Apps Script as the sole proxy.
- **When Modifying Settings**: Add corresponding UI knobs to `SettingsMenu.jsx` and persist changes safely in `localStorage` inside `App.jsx`.

## 5. Integration Points
- **Google Apps Script**: Contains the logic representing the bridge `google-apps-script/Code.gs`. For backend API changes or fixes related to slide fetching, modify this file.

## 6. Conventions
1. **Component Scoping**: Components reside in `src/components/`, utilities in `src/utils/`, and services in `src/api/`. Do not bleed component UI inside utilities.
2. **Minimal Styling**: Rely primarily on pure CSS. Tailwind CSS should be avoided unless implicitly requested by the user.
3. **Environment Security**: Under no circumstances should secrets or active `.env` files be tracked in git.
4. **Obsolete Files**: When removing files, avoid immediately deleting them. Instead, move them to the `/archive` root directory to await manual deletion.
