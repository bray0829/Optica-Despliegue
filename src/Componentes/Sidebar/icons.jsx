// Reemplazo de lucide-react por SVGs inline ligeros para evitar dependencia externa
import React from 'react';

export const sidebarIcons = {
  Inicio: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 21h14a1 1 0 0 0 1-1V11" />
    </svg>
  ),
  Pacientes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3" />
      <path d="M5 21c2.5-4 11-4 14 0" />
    </svg>
  ),
  Exámenes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="5" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  Remisiones: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12a9 9 0 1 0-3.1 6.6" />
      <path d="M21 12v4h-4" />
    </svg>
  ),
  Citas: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
    </svg>
  ),
  Juegos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <polygon points="8 5 8 19 19 12 8 5" />
    </svg>
  ),
  Ajustes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.32 18.7l.06-.06A1.65 1.65 0 0 0 2.71 16a1.65 1.65 0 0 0-1.51-1H1a2 2 0 1 1 0-4h.2c.7 0 1.3-.5 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 6.53 2.3l.06.06A1.65 1.65 0 0 0 8.41 2.71c.5.2 1 .3 1 .3H10a2 2 0 1 1 4 0h1.09c.38 0 .88-.1 1.38-.3a1.65 1.65 0 0 0 1.82.33l.06-.06A2 2 0 1 1 21.68 5.3l-.06.06a1.65 1.65 0 0 0-.33 1.82c.2.5.3 1 .3 1H22a2 2 0 1 1 0 4h-.2c-.7 0-1.3.5-1.51 1z" />
    </svg>
  ),
  Salir: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};

export default sidebarIcons;
