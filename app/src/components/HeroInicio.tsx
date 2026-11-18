import { useState } from "react";
import { guardarHeroPlegado, leerHeroPlegado } from "../lib/heroPlegado";
import "../styles/inicio.css";

export type DestinoHero = "calentar" | "test" | "entrenar" | "curso" | "ranking";

interface Props {
  onIr: (destino: DestinoHero) => void;
}

/** Las imágenes cuelgan de `public/img/`; si el archivo aún no existe se oculta y queda el marcador de posición. */
const RUTA_IMG = `${import.meta.env.BASE_URL}img/`;

interface Tarjeta {
  id: string;
  icono: string;
  titulo: string;
  texto: string;
  aviso?: string;
  destino: DestinoHero;
  accion: string;
}

const TARJETAS: readonly Tarjeta[] = [
  {
    id: "calentar",
    icono: "ico-calentar.svg",
    titulo: "Calentar",
    texto: "Teclea de 2 a 10 minutos para entrar en materia. No cuenta en las estadísticas: es solo para soltar los dedos.",
    destino: "calentar",
    accion: "Calentar",
  },
  {
    id: "test",
    icono: "ico-test.svg",
    titulo: "Test",
    texto: "Una prueba cronometrada. Es lo único que cuenta para tu ppm, siempre con la precisión al lado.",
    destino: "test",
    accion: "Hacer un test",
  },
  {
    id: "entrenar",
    icono: "ico-entrenar.svg",
    titulo: "Entrenar",
    texto: "Práctica dirigida a tus teclas y pares de letras más débiles. Alimenta el mapa de errores, no el ppm.",
    destino: "entrenar",
    accion: "Entrenar",
  },
  {
    id: "cursos",
    icono: "ico-cursos.svg",
    titulo: "Cursos y ranking",
    texto:
      "Aprendes HTML, CSS y Linux tecleando el código real. El ranking tiene una vista local y otra global; la global es opcional, necesita cuenta y solo mide ppm.",
    aviso: "En el plan gratuito de la nube el ppm puede falsearse, así que tómalo como un juego entre amigos.",
    destino: "curso",
    accion: "Ver cursos",
  },
];

/** Presentación de la app en Inicio. Se pliega y se recuerda en este navegador. */
export default function HeroInicio({ onIr }: Props) {
  const [plegado, setPlegado] = useState<boolean>(() => leerHeroPlegado());

  const alternar = () => {
    const nuevo = !plegado;
    setPlegado(nuevo);
    guardarHeroPlegado(nuevo);
  };

  return (
    <section className={`tarjeta hero${plegado ? " plegado" : ""}`} aria-labelledby="hero-titulo">
      <div className="hero-cabecera">
        <div>
          <h1 id="hero-titulo">Bienvenido a Txispa Type</h1>
          {!plegado && <p className="tenue">Tu entrenador de mecanografía: calienta, mide, corrige y aprende a programar tecleando.</p>}
        </div>
        <button type="button" className="btn" aria-expanded={!plegado} aria-controls="hero-contenido" onClick={alternar}>
          {plegado ? "Mostrar guía" : "Ocultar guía"}
        </button>
      </div>

      <div id="hero-contenido" hidden={plegado}>
        <div className="hero-cuerpo">
          <div className="hero-ilustracion" aria-hidden="true">
            <img src={`${RUTA_IMG}hero.webp`} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
          </div>
          {/* Hueco reservado para la mascota (las teclas F y J): se rellenará cuando existan sus imágenes. */}
          <div className="hero-mascota" aria-hidden="true" />
          <ul className="hero-tarjetas">
            {TARJETAS.map((t) => (
              <li key={t.id} className="hero-tarjeta">
                <div className="hero-icono" aria-hidden="true">
                  <img src={`${RUTA_IMG}${t.icono}`} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
                <div className="hero-texto">
                  <h2>{t.titulo}</h2>
                  <p className="tenue">{t.texto}</p>
                  {t.aviso && <p className="hero-aviso">{t.aviso}</p>}
                </div>
                <button type="button" className="btn" onClick={() => onIr(t.destino)}>
                  {t.accion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
