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

  "¿Has probado alguna vez a madrugar sin alarma? Al principio cuesta, pero después de unos días el cuerpo se acostumbra y el día rinde mucho más. Lo difícil es acostarse pronto, no levantarse. Si consigues cenar ligero y dejar el móvil lejos de la cama, el resto viene solo.",

  "El router del salón llevaba semanas perdiendo la señal por las noches. Después de actualizar el firmware, cambiar el canal y moverlo a una estantería más alta, el problema desapareció. Moraleja: antes de culpar a la compañía, conviene revisar dónde está colocado cada aparato.",

  "Para subir al refugio hay dos caminos: el largo, que sigue el río durante casi tres horas, y el corto, que sale directo por el bosque y se vuelve empinado al final. Yo prefiero el largo. Se llega más cansado de piernas, pero con la cabeza despejada y muchas ganas de cenar.",

  "Querida Marta: gracias por la invitación, nos hace mucha ilusión. Llegaremos el viernes por la noche y nos iremos el domingo después de comer. Si necesitas que llevemos algo, dínoslo sin compromiso; de lo contrario, aparecemos con vino, un pastel y buen humor. ¡Un abrazo grande!",

  "La memoria de un ordenador se parece a una mesa de trabajo: cuanto más grande es, más cosas caben abiertas a la vez. Pero una mesa enorme llena de papeles no sirve de nada si no sabes dónde está cada uno. Por eso importa tanto el orden como el tamaño de los discos.",

  "Después de correr cinco kilómetros sin parar por primera vez, me senté en un banco con las piernas temblando y una sonrisa tonta. No había batido ningún récord, pero llevaba tres meses entrenando tres días por semana. Eso era justo lo que quería demostrarme a mí mismo.",

  "Hornear pan en casa exige paciencia más que técnica. La masa necesita reposar, doblarse y volver a reposar, y ningún truco acelera ese proceso. Si la prisa te gana, saldrá un pan duro y plano. Si esperas lo suficiente, la corteza cruje y la miga queda llena de burbujas.",

  "El invierno pasado nevó tanto que la carretera estuvo cortada durante dos días. Los vecinos se organizaron sin que nadie lo pidiera: unos despejaron el camino con palas, otros llevaron leña a los mayores y alguien preparó una olla enorme de caldo para todos. Aún lo recordamos con cariño.",

  "No hay nada peor que perder un trabajo de horas por no haber guardado una copia. Desde entonces hago dos cosas: guardo cada pocos minutos y repito la copia al terminar el día en otro disco. Parece una exageración hasta que el primer fallo te da la razón, y entonces ya es tarde.",

  "Los mercados de los pueblos tienen algo que los supermercados no consiguen imitar. Los puestos huelen a fruta madura, los vendedores gritan precios y bromas a partes iguales, y siempre te regalan un puñado de cerezas si compras mucho. Cuesta un poco más, pero se agradece cada euro.",

  "Antes de enviar un correo importante, léelo en voz alta una vez. Si te trabas, el destinatario también se trabará. Quita las frases largas, aclara qué esperas que haga la otra persona y pon una fecha concreta. Con tres cambios así, las respuestas llegan más rápidas y más claras.",

  "La tormenta empezó sobre las seis de la tarde con un trueno lejano que nadie tomó en serio. Media hora después el cielo estaba negro, las ventanas vibraban y se fue la luz en todo el barrio. Encendimos unas velas, jugamos a las cartas y, la verdad, fue una de las mejores noches del año.",

  "Para estudiar con eficacia no hace falta pasar ocho horas seguidas delante de los apuntes. Funciona mejor trabajar cuarenta minutos, descansar diez y repasar al día siguiente lo que se dio hoy. Esa pequeña repetición espaciada fija la información mucho mejor que cualquier maratón de última hora.",

  "El tomate de la huerta no se parece en nada al del invernadero. Es irregular, tiene grietas en la piel y a veces sale feo, pero sabe a verano. Con un poco de aceite, sal gorda y pan del día, no hace falta ningún otro plato. Los domingos de agosto, en mi casa, comemos así.",

  "Me gusta que las cosas funcionen sin tener que pensar en ellas: un enchufe que da corriente, una llave que gira a la primera, un programa que arranca en dos segundos. Quizá por eso valoro tanto el trabajo bien hecho, aunque casi nadie lo note hasta que falla.",

  "Si viajas en avión con poco tiempo entre vuelos, lleva solo equipaje de mano y descarga la tarjeta de embarque antes de llegar al aeropuerto. Revisa la puerta de salida en cuanto aterrices, porque cambia con frecuencia. Y, sobre todo, no compres bebidas hasta pasar el control: son carísimas.",

  "En la biblioteca del instituto había un rincón con sillones viejos donde nadie hablaba alto. Allí leí mis primeras novelas largas, siempre con la mochila de almohada y la chaqueta puesta porque la calefacción nunca funcionaba. Todavía hoy huelo papel antiguo y me acuerdo de aquellas tardes.",

  "Un buen entrenamiento de fuerza no necesita máquinas: con una barra de dominadas, unas gomas y el suelo del salón se consigue muchísimo. Lo importante es la constancia, la postura correcta y aumentar el esfuerzo poco a poco. Si te duele una articulación, para y consulta con alguien que sepa.",

  "El huerto urbano de la terraza empezó con tres macetas y ahora ocupa toda la barandilla. Crecen albahaca, perejil, fresas y un tomate cherry que no deja de dar frutos. Regarlo cada mañana se ha vuelto un ritual: diez minutos de calma antes de abrir el ordenador y empezar a trabajar.",

  "Cuando alguien te cuenta un problema, casi nunca busca una solución inmediata. Lo que quiere es que le escuches con atención y sin interrumpir. Prueba a preguntar: ¿quieres consejo o solo desahogarte? Esa sencilla frase evita muchos malentendidos y hace que la conversación sea mucho más útil para ambos.",

  "Mi primer ordenador tardaba cuatro minutos en arrancar y hacía un ruido como de avión pequeño. Aun así, pasaba horas delante de la pantalla descubriendo cómo funcionaba por dentro. Desmonté la torre, cambié piezas, rompí algunas cosas y aprendí muchísimo más que en cualquier curso posterior.",

  "La paella de domingo exige un buen fuego, un sofrito paciente y un caldo con sabor. El arroz se echa en forma de cruz, se reparte una sola vez y ya no se toca. Cuando el agua desaparece, hay que dejar reposar unos minutos tapada con un paño. Quien remueve el arroz no ha entendido nada.",

  "Los fines de semana largos son una trampa: prometen descanso y acaban llenos de recados, comidas familiares y atascos. Si quieres desconectar de verdad, tienes que decidir qué no vas a hacer. Elige un solo plan, déjalo reservado con tiempo y deja el resto de la agenda completamente vacío.",

  "Aprender a tocar la guitarra duele en las yemas de los dedos durante las primeras dos semanas. Después se endurecen y todo cambia. Lo más complicado no es la técnica, sino ser constante: veinte minutos diarios valen más que tres horas el sábado. Y conviene empezar por canciones fáciles, no por las de moda.",

  "Se me ha estropeado el portátil justo antes de entregar el trabajo, así que escribo desde el ordenador de la biblioteca. Funciona lento, la tecla de la ñ se atasca y alguien tose cada cinco minutos. Aun así, voy a terminar a tiempo. A veces la presión es el único método que realmente me funciona.",

  "El río baja tan limpio en primavera que se ven las piedras del fondo a tres metros de profundidad. Hay truchas, libélulas y un puente de madera por el que cruzan los ciclistas. Los domingos viene mucha gente, pero basta con caminar veinte minutos aguas arriba para quedarse completamente solo.",

  "Antes de comprar un móvil nuevo, pregúntate para qué lo necesitas realmente. Si el actual funciona, tiene batería y recibe actualizaciones, cambiarlo es un capricho. Si va lento, prueba primero a borrar aplicaciones y fotos que no usas. Si aun así no basta, compara modelos del año anterior.",

  "Mi vecino arregla relojes antiguos en un taller del tamaño de un armario. Trabaja con una lupa sujeta a la frente y unas pinzas casi invisibles, y cuando por fin consigue que una pieza vuelva a latir, sonríe como un niño. Me dijo una vez que el tiempo no se puede detener, pero sí cuidar.",

  "El autobús nocturno hace siete paradas entre la ciudad y el pueblo, y en cada una sube o baja alguien con cara de cansancio. Me gusta mirar por la ventana y adivinar a qué se dedica cada uno: la enfermera, el panadero, la chica que vuelve del último turno. Casi siempre acierto.",

  "Hoy he aprendido que no pasa nada por decir que no. Me pidieron ayuda con tres proyectos a la vez y casi acepto los tres por pura inercia. Después de pensarlo un rato, elegí uno y rechacé los otros con educación. Me sentí mal una hora y mucho mejor el resto de la semana.",

  "En la cocina de mi casa hay un cajón donde cabe de todo: pilas, cinta adhesiva, tornillos sueltos, bolígrafos secos y una linterna sin batería. Cada vez que busco algo lo encuentro justo ahí, debajo de los demás trastos. Es un desorden perfecto y nadie se atreve a tocarlo.",

  "Los atardeceres de octubre en el campo tienen un color naranja casi irreal. Las sombras se alargan, el aire se enfría de golpe y los pájaros se callan todos a la vez. Es el momento ideal para dar un paseo corto con una chaqueta fina y volver a casa justo cuando oscurece del todo.",

  "Si dudas entre dos opciones, escribe en un papel las ventajas y los inconvenientes de cada una, y luego tacha todo lo que sea poco importante. Casi siempre queda una sola línea en cada columna. A partir de ahí la decisión es mucho más sencilla y, además, no te arrepientes después.",

  "Mañana toca revisar las cuentas del trimestre: 1.250 euros de ingresos, 430 de gastos fijos y unos 180 de compras puntuales. Si los números cuadran, podré apartar la parte que había prometido al fondo de emergencia. ¡Qué ganas de ver el saldo final después de tanto esfuerzo!",

  "Cuando el verano termina y vuelve la rutina, lo más difícil es retomar el ritmo del sueño. Acostarse a la misma hora, evitar pantallas por la noche y abrir la persiana al despertar ayudan más que cualquier suplemento. En una semana, el cuerpo vuelve a pedir descanso a su hora de siempre.",

  "Las guardias del hospital se hacen largas, pero hay una costumbre que las vuelve llevaderas: a las tres de la madrugada, quien pueda prepara un café para todos. Nadie habla mucho, pero ese gesto pequeño une al equipo más que cualquier reunión. Y a las siete, cuando llega el relevo, todo parece un poco mejor.",
];
