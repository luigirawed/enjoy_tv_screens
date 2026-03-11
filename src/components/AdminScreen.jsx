import React, { useState, useEffect } from 'react';
import { Key, Check, X, Monitor, RefreshCw } from 'lucide-react';
import {
    getPin,
    isValidPairingCode,
    authorizeDisplay,
    getDisplayId,
    getAuthorization
} from '../utils/display-pairing';
import './AdminScreen.css';

export default function AdminScreen({ onComplete }) {
    const [displayCode, setDisplayCode] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const correctPin = getPin();
    const currentDisplayId = getDisplayId();
    const currentAuth = getAuthorization();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isValidPairingCode(displayCode)) {
            setError('Please enter a valid 6-character display code');
            return;
        }

        if (!pin) {
            setError('Please enter the PIN');
            return;
        }

        if (pin !== correctPin) {
            setError('Incorrect PIN');
            return;
        }

        setLoading(true);

        // Simulate a small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        // Authorize the display
        authorizeDisplay({
            displayCode: displayCode.toUpperCase(),
            authorizedBy: 'admin'
        });

        setSuccess(true);
        setLoading(false);

        // Redirect to TV view after short delay
        setTimeout(() => {
            onComplete();
        }, 1500);
    };

    const handleRefreshAuth = () => {
        if (pin === correctPin) {
            authorizeDisplay({
                displayCode: currentDisplayId,
                refreshed: true
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        }
    };

    if (!correctPin) {
        return (
            <div className="admin-screen">
                <div className="admin-error">
                    <X size={48} />
                    <h2>Configuration Error</h2>
                    <p>No PIN has been configured. Please set VITE_ACCESS_PIN in your environment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-screen">
            <div className="admin-container">
                <Key size={48} className="admin-icon" />
                <h1>Display Authorization</h1>

                {currentAuth && (
                    <div className="current-status">
                        <div className="status-badge authorized">
                            <Check size={16} />
                            This display is authorized
                        </div>
                        <p className="status-detail">
                            Expires: {new Date(currentAuth.expiresAt).toLocaleDateString()}
                        </p>
                        <button
                            className="refresh-auth-btn"
                            onClick={handleRefreshAuth}
                            disabled={pin !== correctPin}
                        >
                            <RefreshCw size={16} />
                            Extend Authorization
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="form-group">
                        <label htmlFor="displayCode">
                            <Monitor size={18} />
                            Display Code
                        </label>
                        <input
                            id="displayCode"
                            type="text"
                            value={displayCode}
                            onChange={(e) => setDisplayCode(e.target.value.toUpperCase())}
                            placeholder="Enter 6-character code"
                            maxLength={6}
                            className="code-input"
                            autoComplete="off"
                        />
                        <small>Enter the code shown on the TV display</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="pin">
                            <Key size={18} />
                            Admin PIN
                        </label>
                        <input
                            id="pin"
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Enter PIN"
                            className="pin-input"
                            autoComplete="off"
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            <X size={16} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="success-message">
                            <Check size={16} />
                            Display authorized successfully!
                        </div>
                    )}

                    <button
                        type="submit"
                        className="authorize-btn"
                        disabled={loading || !displayCode || !pin}
                    >
                        {loading ? (
                            <>Authorizing...</>
                        ) : (
                            <>
                                <Check size={20} />
                                Authorize Display
                            </>
                        )}
                    </button>
                </form>

                <div className="admin-help">
                    <h3>How it works:</h3>
                    <ol>
                        <li>The TV shows a 6-character display code</li>
                        <li>Enter that code above</li>
                        <li>Enter the admin PIN</li>
                        <li>The TV will be authorized for 30 days</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
