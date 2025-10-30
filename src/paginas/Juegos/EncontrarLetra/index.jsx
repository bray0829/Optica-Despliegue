import React, { useState, useEffect, useRef } from 'react';
import './style.css';

const niveles = {
  facil: { label: 'Fácil', grid: 3, fontSize: 34, tiempo: 12, gap: 16 },
  medio: { label: 'Medio', grid: 4, fontSize: 26, tiempo: 9, gap: 10 },
  dificil: { label: 'Difícil', grid: 5, fontSize: 18, tiempo: 6, gap: 6 },
};

const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randChar(except) {
  let c;
  do {
    c = letras[Math.floor(Math.random() * letras.length)];
  } while (c === except);
  return c;
}

const EncontrarLetra = () => {
  const [nivel, setNivel] = useState('facil');
  const [jugando, setJugando] = useState(false);
  const [score, setScore] = useState(0);
  const [tiempo, setTiempo] = useState(niveles[nivel].tiempo);
  const [grid, setGrid] = useState([]);
  const [targetIndex, setTargetIndex] = useState(null);
  const [_modo, setModo] = useState('incorrecta'); // 'incorrecta' o 'faltante' (prefijo _ evita warning de var no usada)

  const timerRef = useRef(null);

  useEffect(() => {
    setTiempo(niveles[nivel].tiempo);
  }, [nivel]);

  useEffect(() => {
    if (jugando) {
      timerRef.current = setInterval(() => {
        setTiempo((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setJugando(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [jugando]);

  const generarRonda = () => {
    const cfg = niveles[nivel];
    const total = cfg.grid * cfg.grid;
    const base = letras[Math.floor(Math.random() * letras.length)];
    const arr = new Array(total).fill(base);

    const isFaltante = Math.random() < 0.5; // mitad de las rondas son faltante
    setModo(isFaltante ? 'faltante' : 'incorrecta');

    const idx = Math.floor(Math.random() * total);
    if (isFaltante) {
      arr[idx] = ''; // casilla vacía
    } else {
      arr[idx] = randChar(base); // letra incorrecta
    }

    setGrid(arr);
    setTargetIndex(idx);
    setTiempo(cfg.tiempo);
  };

  const iniciar = () => {
    setScore(0);
    setJugando(true);
    generarRonda();
  };

  const reiniciar = () => {
    setJugando(false);
    setGrid([]);
    setScore(0);
    setTiempo(niveles[nivel].tiempo);
    setTargetIndex(null);
  };

  const handleClick = (index) => {
    if (!jugando) return;
    if (index === targetIndex) {
      setScore((s) => s + 1);
      // siguiente ronda
      generarRonda();
    } else {
      // penalizar: restar tiempo
      setTiempo((t) => Math.max(0, t - 2));
    }
  };

  const cfg = niveles[nivel];

  return (
    <main className="encontrar-container">
      <header>
        <h2>Juego: Encontrar la letra</h2>
        <p>Encuentra la letra faltante o incorrecta en cada serie. Haz clic en la casilla que creas que está mal.</p>
      </header>

      <div className="controls">
        <div className="niveles">
          {Object.keys(niveles).map((k) => (
            <button key={k} className={`nivel ${nivel === k ? 'activo' : ''}`} onClick={() => setNivel(k)} disabled={jugando}>
              {niveles[k].label}
            </button>
          ))}
        </div>

        <div className="estado">
          <div>Tiempo: <strong>{tiempo}s</strong></div>
          <div>Puntaje: <strong>{score}</strong></div>
        </div>

        <div className="acciones">
          {!jugando ? (
            <button className="btn" onClick={iniciar}>Iniciar</button>
          ) : (
            <button className="btn" onClick={reiniciar}>Detener</button>
          )}
        </div>
      </div>

      <div className="grid-area" style={{ gap: cfg.gap }}>
        {grid.length === 0 && !jugando && <div className="placeholder">Pulsa Iniciar para empezar</div>}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${cfg.grid}, 1fr)` }}>
          {grid.map((cell, i) => (
            <button
              key={i}
              className={`cell ${i === targetIndex ? 'target' : ''} ${cell === '' ? 'empty' : ''}`}
              style={{ fontSize: cfg.fontSize }}
              onClick={() => handleClick(i)}
            >
              {cell || ' '}
            </button>
          ))}
        </div>
      </div>

      {!jugando && tiempo === 0 && (
        <div className="resultado">
          <h3>Fin del juego</h3>
          <p>Puntaje: <strong>{score}</strong></p>
          <button className="btn" onClick={iniciar}>Jugar de nuevo</button>
        </div>
      )}
    </main>
  );
};

export default EncontrarLetra;
