import React, { useState } from 'react';
import { Lock, Check, X } from 'lucide-react';
import { authorizeDisplay } from '../utils/display-pairing';
import './DisplayCodeScreen.css';

export default function PinEntryScreen({ onAuthorized }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const correctPin = import.meta.env.VITE_ACCESS_PIN || '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

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

        // Authorize this display directly
        authorizeDisplay({
            displayCode: 'SELF',
            authorizedBy: 'pin-entry'
        });

        setSuccess(true);
        setLoading(false);

        // Notify parent and redirect to slides
        setTimeout(() => {
            if (onAuthorized) {
                onAuthorized();
            } else {
                window.location.reload();
            }
        }, 1500);
    };

    return (
        <div className="display-code-screen">
            <div className="display-code-content">
                <Lock size={64} className="display-icon" />

                <h1>Enter PIN to Authorize</h1>
                <p className="display-subtitle">
                    This display will be authorized for 30 days
                </p>

                <form onSubmit={handleSubmit} className="pin-form">
                    <div className="form-group">
                        <label htmlFor="pin">
                            <Lock size={18} />
                            6-Digit PIN
                        </label>
                        <input
                            id="pin"
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Enter PIN"
                            className="pin-input large"
                            maxLength={6}
                            autoComplete="off"
                            autoFocus
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
                            Authorized successfully!
                        </div>
                    )}

                    <button
                        type="submit"
                        className="authorize-btn"
                        disabled={loading || !pin}
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

                <div className="display-id-info">
                    IP-authorized access
                </div>
            </div>
        </div>
    );
}
