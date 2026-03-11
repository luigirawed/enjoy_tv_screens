import React, { useState, useRef, useEffect } from 'react';
import './PinScreen.css';

const PIN_LENGTH = 4;

export default function PinScreen({ onSuccess }) {
  const [digits, setDigits] = useState(Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState(false);
  const inputRefs = useRef([]);

  const correctPin = import.meta.env.VITE_ACCESS_PIN;

  useEffect(() => {
    // Focus the first input on mount
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleChange = (index, value) => {
    // Accept only digits
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(false);

    // Auto-advance to next input
    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Check PIN when all digits are entered
    if (value && index === PIN_LENGTH - 1) {
      const entered = newDigits.join('');
      if (entered === correctPin) {
        localStorage.setItem('tv_pin_verified', 'true');
        onSuccess();
      } else {
        setError(true);
        // Clear and refocus
        setTimeout(() => {
          setDigits(Array(PIN_LENGTH).fill(''));
          inputRefs.current[0].focus();
        }, 800);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    // Allow TV remote navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  return (
    <div className="pin-screen">
      <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="pin-logo" />
      <h1>Enter Access PIN</h1>
      <p>Please enter the 4-digit PIN to continue.</p>

      <div className={`pin-inputs ${error ? 'shake' : ''}`}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`pin-digit ${error ? 'error' : ''}`}
          />
        ))}
      </div>

      {error && <p className="pin-error">Incorrect PIN. Try again.</p>}
    </div>
  );
}
