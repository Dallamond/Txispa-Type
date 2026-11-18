// Estado plegado del hero de Inicio. Es una comodidad por navegador: si el almacenamiento falla,
// el hero se muestra desplegado y todo sigue funcionando.

export const CLAVE_HERO_PLEGADO = "txispatype.hero.plegado.v1";

export interface AlmacenClaves {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

function almacenPorDefecto(): AlmacenClaves | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** `true` solo si el usuario lo plegó antes. En la primera visita, o si falla el almacenamiento, está desplegado. */
export function leerHeroPlegado(almacen: AlmacenClaves | null = almacenPorDefecto()): boolean {
  try {
    return almacen?.getItem(CLAVE_HERO_PLEGADO) === "1";
  } catch {
    return false;
  }
}

export function guardarHeroPlegado(plegado: boolean, almacen: AlmacenClaves | null = almacenPorDefecto()): void {
  try {
    almacen?.setItem(CLAVE_HERO_PLEGADO, plegado ? "1" : "0");
  } catch {
    // Sin almacenamiento: no se recuerda, pero no pasa nada.
  }
}
