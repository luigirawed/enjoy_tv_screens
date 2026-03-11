import React, { useEffect, useState } from 'react';
import { Monitor, RefreshCw } from 'lucide-react';
import { getDisplayId, generatePairingCode } from '../utils/display-pairing';
import './DisplayCodeScreen.css';

export default function DisplayCodeScreen({ onAuthorized }) {
    const [displayCode, setDisplayCode] = useState('');
    const [refreshCount, setRefreshCount] = useState(0);

    useEffect(() => {
        // Get the display ID (this is the pairing code)
        const code = getDisplayId();
        setDisplayCode(code);
    }, [refreshCount]);

    const handleRefresh = () => {
        setRefreshCount(prev => prev + 1);
    };

    return (
        <div className="display-code-screen">
            <div className="display-code-content">
                <Monitor size={64} className="display-icon" />

                <h1>Display Setup Required</h1>
                <p className="display-subtitle">
                    This display needs to be authorized before showing slides
                </p>

                <div className="code-display">
                    <span className="code-label">Display Code</span>
                    <div className="code-value">{displayCode}</div>
                    <button
                        className="refresh-btn tv-focusable"
                        onClick={handleRefresh}
                        title="Generate new code"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>

                <div className="instructions">
                    <h2>How to authorize this display:</h2>
                    <ol>
                        <li>Open this app on a phone or computer</li>
                        <li>Add <strong>?admin=true</strong> to the URL</li>
                        <li>Enter the code above: <strong>{displayCode}</strong></li>
                        <li>Enter the PIN to complete authorization</li>
                    </ol>
                </div>

                <div className="display-id-info">
                    Display ID: {displayCode}
                </div>
            </div>
        </div>
    );
}
