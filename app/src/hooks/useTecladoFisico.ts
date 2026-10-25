import { useEffect, useState } from "react";

// ¿Hay un teclado físico detrás de esta pantalla?
//
// Hace falta porque Shellpath escucha `keydown` en `window` y no tiene ningún
// campo de texto. En un móvil eso significa que el teclado del sistema NO se
// abre —no hay nada que enfocar— y encima el teclado virtual de la app no cabe:
// una fila necesita ~680px y un teléfono tiene 360-390. O sea que quien entra
// desde el móvil se encuentra una pantalla rota y sin forma de teclear.
//
// La decisión tomada es no fingir que eso se arregla con CSS: practicar
// mecanografía de comandos necesita un teclado de verdad. Lo que sí se puede
// hacer es que la app lo DIGA, en vez de enseñar algo roto y dejar que el
// visitante deduzca que el producto no funciona.
//
// `(pointer: fine)` es la pregunta correcta: no "¿qué ancho tienes?" —una
// tableta con teclado es ancha y un portátil en ventana estrecha no—, sino
// "¿el puntero es preciso?", que en la práctica separa ratón/trackpad de dedo.
// `(any-hover: hover)` cubre además el caso del móvil con teclado bluetooth.
const CONSULTA = "(pointer: fine), (any-hover: hover)";

export function useTecladoFisico(): boolean {
  const [hay, setHay] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return true;
    return window.matchMedia(CONSULTA).matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(CONSULTA);
    const alCambiar = () => setHay(mq.matches);
    // Cambia de verdad: conectar un teclado bluetooth a una tableta, o pasar el
    // navegador a un monitor externo.
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);

  return hay;
}
