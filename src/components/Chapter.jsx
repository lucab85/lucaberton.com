// src/components/Chapter.jsx
import React, { useState } from 'react';

export default function Chapter({ title, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-4 border border-gray-200 rounded-lg shadow">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 text-left font-semibold bg-blue-100 hover:bg-blue-200 text-blue-900 flex justify-between items-center"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && <div className="px-4 py-2">{children}</div>}
    </div>
  );
}
