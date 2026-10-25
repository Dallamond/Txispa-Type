/** Pantalla aún sin construir: dice en qué fase llega. */
export default function Pendiente({ titulo, fase, children }: { titulo: string; fase: number; children?: React.ReactNode }) {
  return (
    <section className="tarjeta">
      <h1>{titulo}</h1>
      <p className="tenue">Esta pantalla llega en la fase {fase}.</p>
      {children}
    </section>
  );
}
