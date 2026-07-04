// client/src/components/StatCard.jsx

import { useRef, useEffect, useState } from 'react';

// Reusable animated stat card — used for dashboard summary numbers
// Props:
//   label     — small muted text above the number (e.g. "Spent this month")
//   value     — the target number to count up to
//   prefix    — text before the number, e.g. "₹"
//   valueColor — Tailwind color class for the number, defaults to dark text

function StatCard({ label, value, prefix = '', valueColor = 'text-gray-800' }) {
  const cardRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(0);

  // Count-up animation — runs once when the component first appears
  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.round(value / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= value) {
        current = value;
        clearInterval(timer);
      }
      setDisplayValue(current);
    }, 20);

    return () => clearInterval(timer); // cleanup if component unmounts early
  }, [value]);

  // 3D tilt effect — follows the mouse position within the card
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // rotateX/Y create the 3D effect. Multiplying by 10 keeps the tilt subtle
    // — too much rotation feels gimmicky rather than tactile
    card.style.transform = `translateY(-4px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) card.style.transform = '';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="bg-white border border-[#F0EDE6] rounded-2xl p-4 cursor-pointer transition-shadow duration-150 hover:shadow-lg"
      style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
    >
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <p className={`font-heading text-2xl font-semibold ${valueColor}`}>
        {prefix}{displayValue.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

export default StatCard;