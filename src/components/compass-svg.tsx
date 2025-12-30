import React from 'react';

const CompassSvg = ({ rotation }: { rotation: number }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="100" fill="#F5F1E6" />
      <circle cx="100" cy="100" r="95" fill="#F5F1E6" stroke="#2c4c3b" strokeWidth="0.5" />

      {/* Degree Markings */}
      <defs>
        <g id="marks">
          {Array.from({ length: 120 }).map((_, i) => (
            <line
              key={i}
              x1="100"
              y1="5"
              x2="100"
              y2={i % 10 === 0 ? "15" : "10"}
              stroke="#2c4c3b"
              strokeWidth={i % 10 === 0 ? "1" : "0.5"}
              transform={`rotate(${i * 3}, 100, 100)`}
            />
          ))}
        </g>
      </defs>
      <use href="#marks" />

      {/* Cardinal and Intercardinal Directions */}
      <g
        fill="#2c4c3b"
        fontSize="12"
        fontFamily="sans-serif"
        fontWeight="bold"
        textAnchor="middle"
        style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: 'center' }}
      >
        <text x="100" y="28">N</text>
        <text x="172" y="104">E</text>
        <text x="100" y="180">S</text>
        <text x="28" y="104">W</text>
        <g fontSize="10" fontWeight="normal">
          <text x="152" y="52">NE</text>
          <text x="152" y="156">SE</text>
          <text x="48" y="156">SW</text>
          <text x="48" y="52">NW</text>
        </g>
      </g>

      {/* Compass Rose */}
      <g id="rose" fill="#2c4c3b" opacity="0.8">
        <path d="M100 30 L115 115 L100 120 L85 115 Z" />
        <path d="M170 100 L85 115 L80 100 L85 85 Z" />
        <path d="M100 170 L85 85 L100 80 L115 85 Z" />
        <path d="M30 100 L115 85 L120 100 L115 115 Z" />
      </g>
      <circle cx="100" cy="100" r="65" stroke="#2c4c3b" strokeWidth="0.5" strokeDasharray="4 4" fill="none" />
      
      {/* Needle */}
      <g id="needle">
        {/* Blue part */}
        <path d="M100 25 L110 100 L100 115 L90 100 Z" fill="#4a90e2" />
        {/* Red part */}
        <path d="M100 175 L110 100 L100 85 L90 100 Z" fill="#d0021b" />
         {/* Tail of red part */}
        <path d="M93 155 L107 155 L107 165 L93 165 Z" fill="#d0021b" />
        <path d="M95 157 L105 157 L105 163 L95 163 Z" fill="#ffc107" />
        <path d="M93 155 h14 v2 h-14z M93 163 h14 v2 h-14z" fill="#2c4c3b" />
        {/* Center pin */}
        <circle cx="100" cy="100" r="5" fill="#2c4c3b" />
        <circle cx="100" cy="100" r="3" fill="#F5F1E6" />
      </g>
    </svg>
  );
};

export default CompassSvg;
