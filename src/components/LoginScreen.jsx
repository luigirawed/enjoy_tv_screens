import React from 'react';
import { redirectToGoogleLogin } from '../api/google-auth';
import './LoginScreen.css';

export default function LoginScreen() {
  return (
    <div className="login-screen">
      <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="login-logo" />
      <h1>Google TV Slides</h1>
      <p>Please authorize this display to read your Google Slides.</p>

      <div className="auth-box">
        <button 
          className="tv-button login-btn" 
          onClick={redirectToGoogleLogin}
          autoFocus
        >
          Sign in with Google
        </button>
        <p className="hint">
          <small>You will be redirected to Google to sign in.</small>
        </p>
      </div>
    </div>
  );
}
