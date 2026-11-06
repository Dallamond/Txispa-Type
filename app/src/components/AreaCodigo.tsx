import { memo, useMemo } from "react";
import { charState } from "../lib/typing";
import { lineasDeTokens, type Token } from "../lib/curso";

// Código a teclear, línea a línea y con la sangría ya puesta (no se teclea).
// El cierre de cada token se ve: el espacio como hueco y el Enter como "⏎".
// Los estilos de letra (.w, .ch) son los mismos que los del texto corrido.

interface Props {
  tokens: readonly Token[];
  tecleadas: readonly string[];
  idx: number;
}

export default function AreaCodigo({ tokens, tecleadas, idx }: Props) {
  const lineas = useMemo(() => lineasDeTokens(tokens), [tokens]);
  return (
    <div className="cod-caja" aria-label="Código a teclear">
      <div className="cod-codigo">
        {lineas.map((l, n) => (
          <div className="cod-linea" key={n} style={{ paddingLeft: `${l.sangria}ch` }}>
            {l.tokens.map((i) => (
              <TokenCodigo
                key={i}
                texto={tokens[i].texto}
                cierre={tokens[i].cierre}
                tecleada={tecleadas[i] ?? ""}
                estado={i < idx ? "hecha" : i === idx ? "activa" : "pendiente"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const TokenCodigo = memo(function TokenCodigo({
  texto,
  cierre,
  tecleada,
  estado,
}: {
  texto: string;
  cierre: Token["cierre"];
  tecleada: string;
  estado: "hecha" | "activa" | "pendiente";
}) {
  const cerrada = estado === "hecha";
  const completa = tecleada.length >= texto.length;
  const clase = estado === "hecha" && tecleada === texto ? "w hecha" : `w ${estado}${cerrada ? " fallo" : ""}`;
  return (
    <>
      <span className={clase}>
        {texto.split("").map((ch, k) => {
          const st = charState(texto, tecleada, k);
          let cls = `ch ${st === "pending" && cerrada ? "falta" : st}`;
          if (estado === "activa" && k === tecleada.length) cls += " cursor";
          return (
            <span key={k} className={cls}>
              {ch}
            </span>
          );
        })}
        {tecleada
          .slice(texto.length)
          .split("")
          .map((ch, k) => (
            <span key={`x${k}`} className="ch extra">
              {ch}
            </span>
          ))}
      </span>
      <span className={`cod-cierre${estado === "activa" && completa ? " ch cursor" : ""}`} aria-hidden="true">
        {cierre === "\n" ? "⏎" : cierre === " " ? " " : ""}
      </span>
    </>
  );
});
