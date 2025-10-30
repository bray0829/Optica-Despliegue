import React, { useState, useRef, useEffect } from 'react';
import './style.css';

const niveles = {
  facil: { label: 'Fácil', intervalo: 900 },
  medio: { label: 'Medio', intervalo: 600 },
  dificil: { label: 'Difícil', intervalo: 300 },
};

const SeguirPunto = () => {
  const [nivel, setNivel] = useState('facil');
  const [jugando, setJugando] = useState(false);
  const [tiempo, setTiempo] = useState(30); // segundos
  const [puntos, setPuntos] = useState(0);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const areaRef = useRef(null);
  const intervaloRef = useRef(null);
  const tiempoRef = useRef(null);

  useEffect(() => {
    if (jugando) {
      // iniciar temporizador
      tiempoRef.current = setInterval(() => {
        setTiempo((t) => {
          if (t <= 1) {
            clearInterval(tiempoRef.current);
            clearInterval(intervaloRef.current);
            setJugando(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      // mover punto a intervalos según nivel
      const intervaloMs = niveles[nivel].intervalo;
      intervaloRef.current = setInterval(() => {
        moverPunto();
      }, intervaloMs);
    }

    return () => {
      clearInterval(intervaloRef.current);
      clearInterval(tiempoRef.current);
    };
  }, [jugando, nivel]);

  const moverPunto = () => {
    const area = areaRef.current;
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const size = 28; // tamaño del punto
    const x = Math.max(0, Math.random() * (rect.width - size));
    const y = Math.max(0, Math.random() * (rect.height - size));
    setPos({ x, y });
  };

  const iniciar = () => {
    setPuntos(0);
    setTiempo(30);
    setJugando(true);
    // mover punto inmediatamente
    moverPunto();
  };

  const reiniciar = () => {
    setJugando(false);
    clearInterval(intervaloRef.current);
    clearInterval(tiempoRef.current);
    setTiempo(30);
    setPuntos(0);
    setPos({ x: 50, y: 50 });
  };

  const handleClickPunto = () => {
    if (!jugando) return;
    setPuntos((p) => p + 1);
    // al hacer click, mover punto inmediatamente (premio)
    moverPunto();
  };

  return (
    <main className="juego-container">
      <header className="juego-header">
        <h2>Juego: Seguir el Punto</h2>
        <p>Selecciona dificultad e intenta hacer clic en el punto tantas veces puedas antes de que termine el tiempo.</p>
      </header>

      <div className="juego-controls">
        <div className="niveles">
          {Object.keys(niveles).map((key) => (
            <button
              key={key}
              className={`nivel-boton ${nivel === key ? 'activo' : ''}`}
              onClick={() => setNivel(key)}
              disabled={jugando}
            >
              {niveles[key].label}
            </button>
          ))}
        </div>

        <div className="estado">
          <div>Tiempo: <strong>{tiempo}s</strong></div>
          <div>Puntos: <strong>{puntos}</strong></div>
        </div>

        <div className="acciones">
          {!jugando ? (
            <button className="btn-start" onClick={iniciar}>Iniciar</button>
          ) : (
            <button className="btn-stop" onClick={reiniciar}>Detener</button>
          )}
        </div>
      </div>

      <div className="area-juego" ref={areaRef}>
        <div
          className="punto"
          onClick={handleClickPunto}
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
          role="button"
          aria-label="punto objetivo"
        />
      </div>

      <footer className="juego-footer">
        <p>Al final del tiempo verás tu puntaje. ¡Buena suerte!</p>
      </footer>
    </main>
  );
};

export default SeguirPunto;
