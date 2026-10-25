// Banco de TEXTOS del entrenador de mecanografía .
//
// Es el gemelo de `speedLines.ts`, pero al revés: allí hay comandos, aquí NO hay
// ni una línea de terminal. A propósito. El test de comandos mide lo que enseña
// Shellpath; este mide los dedos en seco — para calentar antes de una lección y
// para tener una cifra comparable con cualquier otra web de mecanografía, que
// siempre teclean prosa normal.
//
// Criterios al ampliar:
//   - Prosa española corriente: tildes, ñ, comas y puntos. Es el 90 % de lo que
//     una persona teclea de verdad y es justo lo que el temario no ejercita.
//   - NADA de código, rutas, banderas ni símbolos raros. Si aparece una barra o
//     un guion bajo, el texto se va al otro banco.
//   - Párrafos de 180-320 caracteres, con sentido completo. Frases sueltas sin
//     contexto se teclean peor: el ojo necesita anticipar la siguiente palabra.
//   - Comillas y guiones, los del teclado español, no los tipográficos: si el
//     carácter no está en una tecla, no se puede teclear.
//   - Sin nombres propios de personas reales ni datos de nadie.

export const TEXTOS: string[] = [
  "La sierra amanece con una niebla baja que se queda enredada entre los pinos hasta media mañana. Desde el camino viejo se oye el agua del arroyo, todavía crecida por las lluvias de la semana pasada, y de vez en cuando el ruido seco de una piña al caer sobre la hojarasca.",

  "Apunta la compra antes de salir o volverás con tres cosas que no hacían falta y sin la que ibas a buscar. Hace falta pan, dos cebollas, una lata de tomate y el café de siempre. Si encuentras fruta de temporada a buen precio, trae también un par de kilos.",

  "El tren de las siete y veinte va casi vacío en invierno. La gente sube en la tercera parada, ya con el abrigo puesto y el móvil en la mano, y hasta la estación grande nadie dice una palabra. Es el único rato tranquilo que tengo en todo el día y lo aprovecho para leer.",

  "Buenos días. Le escribo para confirmar la cita del jueves a las diez y media. Si le viene mejor por la tarde, tengo hueco a partir de las cinco. Dígame algo cuando pueda y lo dejamos cerrado. Un saludo cordial y gracias por la rapidez de la última vez.",

  "Cocinar lentejas no tiene ningún misterio, pero sí un orden. Primero la verdura en trozos grandes, luego el pimentón fuera del fuego para que no se queme, y al final las lentejas y el agua justa. Que hiervan flojo. Si se pasan de sal ya no hay quien las arregle.",

  "Mi abuela guardaba las cartas en una caja de galletas que ya no cerraba bien. Había facturas viejas, recortes de periódico, fotos con el borde blanco y una lista de teléfonos escrita a lápiz. Nunca tiró nada y, sin quererlo, dejó ordenada media historia de la familia.",

  "El perro entiende perfectamente cuándo vas a salir de casa. No hace falta que cojas la correa: le basta con verte buscar las llaves. Se planta en la puerta, mueve el rabo dos veces y espera. Si al final no sales, se vuelve a su sitio con cara de haber sido engañado.",

  "Aprender algo nuevo cansa más de lo que parece porque durante las primeras semanas todo es cuesta arriba y no se ve ningún avance. Luego, un día cualquiera, sale solo. No es que hayas mejorado de golpe: es que llevabas meses mejorando muy poco a poco y no te dabas cuenta.",

  "La reunión duró cincuenta minutos y se podría haber resuelto en un correo de cuatro líneas. Se habló del calendario, de quién se encarga de cada cosa y de un problema que nadie sabía explicar del todo. Al salir, la mitad de los presentes seguía sin tener claro qué hacer.",

  "En agosto el pueblo se llena y en septiembre vuelve a quedarse en las mismas doscientas personas de siempre. Cierran los dos bares de la plaza, se apagan las luces de la piscina y el silencio de las siete de la tarde se vuelve tan grande que casi molesta al principio.",

  "Guarda el recibo aunque pienses que no lo vas a necesitar. La garantía son dos años y sin ese papel no hay manera de reclamar nada. Lo mismo pasa con los contratos: se firman rápido, se leen despacio y se archivan en un sitio que puedas recordar dentro de mucho tiempo.",

  "El café de la esquina abre a las seis y media y a esa hora ya hay cuatro personas en la barra. Nadie pide nada: el camarero conoce lo que toma cada uno y lo pone sin preguntar. Es un acuerdo silencioso que lleva años funcionando mejor que cualquier sistema de reservas.",

  "Antes de pintar una habitación conviene tapar el suelo entero, no solo el trozo que crees que vas a salpicar. Lija las paredes, quita el polvo con un trapo húmedo y da la primera mano fina. La segunda es la que cubre. Con prisa siempre queda peor y hay que repetirlo.",

  "Nos vemos el sábado sobre las doce en la entrada del parque, junto a la fuente. Llevo yo la comida y las bebidas, así que no compres nada. Si llueve lo dejamos para el domingo a la misma hora. Avísame si al final se apunta más gente para calcular las cantidades.",

  "Escribir a mano obliga a ir despacio y a elegir mejor las palabras, porque tacharlas cuesta. Con el teclado ocurre justo lo contrario: sale todo tan rápido que hay que volver atrás y quitar la mitad. Las dos formas sirven, pero no sirven para lo mismo ni en el mismo momento.",

  "El presupuesto del mes se descuadra siempre por lo mismo: los gastos pequeños que no se apuntan. Un café aquí, un envío allá, la suscripción que se renovó sola. Sumados no son pequeños. La única forma de controlarlos es anotarlos el mismo día, aunque parezca exagerado.",

  "La bicicleta llevaba dos años en el trastero con las ruedas deshinchadas y la cadena seca. Media tarde de trabajo, un poco de aceite y unos frenos nuevos la dejaron mejor que muchas del escaparate. A veces arreglar lo que ya tienes sale más barato y da más satisfacción.",

  "Los días de viento fuerte la ropa se seca en una hora, pero hay que sujetarla bien o acaba en el jardín del vecino. Mi madre usaba tres pinzas por prenda y se reía de quien ponía dos. Con el tiempo he ido entendiendo que casi todos sus consejos tenían una razón detrás.",

  "Estimado cliente, le informamos de que su pedido ha salido esta mañana del almacén y llegará en un plazo de dos a tres días laborables. Recibirá un aviso por mensaje cuando el repartidor esté de camino. Si no se encuentra en casa, podrá elegir una nueva fecha de entrega.",

  "Hay una diferencia enorme entre estar ocupado y estar avanzando. Se puede pasar una semana entera contestando mensajes, moviendo tareas de una lista a otra y saliendo agotado cada noche sin que nada importante se haya movido un centímetro. Conviene revisarlo de vez en cuando.",

  "El examen era largo pero justo. Entraba todo lo que se había dado en clase y no había ninguna pregunta con trampa. Los que se prepararon con tiempo salieron tranquilos; los que empezaron el fin de semana anterior se quedaron mirando la última hoja hasta que recogieron.",

  "Al final del verano la piscina municipal huele a cloro y a crema solar, y el agua está tan caliente que ya no refresca. Los socorristas cuentan los días que faltan para cerrar. Los niños, en cambio, se comportan como si aquello fuera a durar siempre, que es justo lo que toca.",

  "Ordenar el armario por temporadas parece una manía y resulta ser el mejor invento del mundo. Se tarda una tarde en octubre y otra en abril, y a cambio te ahorras revolver cajones cada mañana. Lo que no te has puesto en dos años, además, ya sabes que no te lo vas a poner.",

  "La carta de la casa no cambia desde hace quince años y por eso el sitio siempre está lleno. Seis platos, todos buenos, y un postre que hacen ellos. El dueño explica cada mediodía lo mismo con la misma calma. Nadie le ha pedido nunca que amplíe la carta ni falta que hace.",
];
