import type { Ajustes } from "../types";
import Pendiente from "./Pendiente";
import VirtualKeyboard from "./VirtualKeyboard";

export default function Test({ ajustes }: { ajustes: Ajustes }) {
  return (
    <Pendiente titulo="Test" fase={2}>
      {ajustes.tecladoVisible && <VirtualKeyboard nextChar="á" guide={ajustes.guiaDedos} />}
    </Pendiente>
  );
}
