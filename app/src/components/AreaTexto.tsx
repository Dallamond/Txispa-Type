import { memo, useLayoutEffect, useRef, useState } from "react";
import { charState } from "../lib/typing";

// Texto a teclear: se desplaza para que la palabra activa quede en la segunda
// línea visible (una de contexto y una por delante). Adaptado de TextoTest.tsx
// de Shellpath.

interface Props {
  palabras: readonly string[];
  tecleadas: readonly string[];
  idx: number;
  /** Cuántas palabras por delante de la activa se montan. */
  adelante?: number;
}

export default function AreaTexto({ palabras, tecleadas, idx, adelante = 120 }: Props) {
  const activaRef = useRef<HTMLSpanElement | null>(null);
  const [desplaz, setDesplaz] = useState(0);

  // useLayoutEffect y no useEffect: con useEffect el navegador pinta un fotograma
  // sin desplazar y se ve un salto en cada línea. La altura de línea se mide del
  // propio elemento porque el zoom de Ajustes cambia el tamaño del texto.
  useLayoutEffect(() => {
    const el = activaRef.current;
    if (!el) return;
    const linea = el.offsetHeight || 40;
    setDesplaz(Math.max(0, Math.round(el.offsetTop / linea) * linea - linea));
  }, [idx]);

  // El corte va solo por delante: recortar por detrás remaquetaría el texto a cada palabra.
  const hasta = Math.min(palabras.length, idx + adelante);

  return (
    <div className="texto-caja">
      <div className="texto-viewport">
        <div className="texto-flow" style={{ transform: `translateY(-${desplaz}px)` }}>
          {palabras.slice(0, hasta).map((p, i) => (
            <Palabra
              key={i}
              palabra={p}
              tecleada={tecleadas[i] ?? ""}
              estado={i < idx ? "hecha" : i === idx ? "activa" : "pendiente"}
              innerRef={i === idx ? activaRef : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// `memo` no es un adorno: sin él cada pulsación vuelve a montar las ~130 palabras.
// Por eso `tecleada` se pasa como string y no dentro de un objeto recién creado.
const Palabra = memo(function Palabra({
  palabra,
  tecleada,
  estado,
  innerRef,
}: {
  palabra: string;
  tecleada: string;
  estado: "hecha" | "activa" | "pendiente";
  innerRef?: React.RefObject<HTMLSpanElement | null>;
}) {
  // Pendientes y palabras clavadas: texto plano, sin una etiqueta por letra.
  if (estado === "pendiente") {
    return (
      <span className="w" ref={innerRef}>
        {palabra}
      </span>
    );
  }
  if (estado === "hecha" && tecleada === palabra) {
    return (
      <span className="w hecha" ref={innerRef}>
        {palabra}
      </span>
    );
  }

  const extras = tecleada.slice(palabra.length);
  const cerrada = estado === "hecha";

  return (
    <span className={`w ${estado}${cerrada ? " fallo" : ""}`} ref={innerRef}>
      {palabra.split("").map((ch, k) => {
        const st = charState(palabra, tecleada, k);
        // En una palabra cerrada, "sin teclear" significa "te la dejaste".
        let cls = `ch ${st === "pending" && cerrada ? "falta" : st}`;
        if (estado === "activa" && k === tecleada.length) cls += " cursor";
        return (
          <span key={k} className={cls}>
            {ch}
          </span>
        );
      })}
      {extras.split("").map((ch, k) => (
        <span key={`x${k}`} className="ch extra">
          {ch}
        </span>
      ))}
      {estado === "activa" && tecleada.length >= palabra.length && <span className="ch cursor espacio"> </span>}
    </span>
  );
});
