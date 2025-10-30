import React, { useState } from 'react';
import SeguirPunto from './SeguirPunto';
import EncontrarLetra from './EncontrarLetra';
import './style.css';

const JuegosHome = () => {
  const [active, setActive] = useState('seguir'); // 'seguir' | 'encontrar'

  return (
    <main className="juegos-home">
      <header>
        <h2>Juegos</h2>
        <p>Elige el juego y usa los botones para cambiar entre ellos</p>
      </header>

      <div className="juegos-toggle">
        <button
          className="btn-toggle unico"
          onClick={() => setActive((a) => (a === 'seguir' ? 'encontrar' : 'seguir'))}
        >
          Cambiar a: {active === 'seguir' ? 'Encontrar Letra' : 'Seguir Punto'}
        </button>
      </div>

      <div className="juego-embed">
        {active === 'seguir' ? <SeguirPunto /> : <EncontrarLetra />}
      </div>
    </main>
  );
};

export default JuegosHome;
