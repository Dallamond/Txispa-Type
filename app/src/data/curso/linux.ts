// Generado por scripts/generar-curso.mjs desde docs/curso/**/TEMARIO*.md.
// No editar a mano: se cambia el Markdown y se ejecuta `npm run curso:generar`.

import type { Modulo } from "./tipos";

export const MODULOS_LINUX: readonly Modulo[] = [
  {
    "id": "M01",
    "curso": "linux",
    "titulo": "Archivos y navegación",
    "descripcion": "pwd, cd, ls, mkdir, cp, mv, rm, find, tar, rsync — moverte y gestionar archivos como un sysadmin real",
    "lecciones": [
      {
        "id": "L01.01",
        "moduloId": "M01",
        "titulo": "Exploración y visualización del entorno",
        "tipo": "leccion",
        "dificultad": 1,
        "nuevas": [
          "~",
          "/",
          "-",
          ".",
          "="
        ],
        "explicacion": "Los comandos que tecleas nada más entrar a una máquina: dónde estás, moverte y ver qué hay. Fíjate en ~, / y .. — símbolos que casi no usas en texto normal.",
        "codigo": "pwd\ncd ~/Documentos\nls\ncd /var/log\nls -la\ncd ..\npwd\ncd /etc/network\nls -la --quoting-style=escape",
        "notas": [
          "Te dice dónde estás ahora mismo dentro del árbol de carpetas. Es lo primero que tecleas cuando entras a una máquina nueva.",
          "~ es un atajo para tu carpeta personal — evita escribir la ruta completa cada vez.",
          "Lista lo que hay en la carpeta actual, sin detalles todavía.",
          "Ruta absoluta: empieza por /, así que funciona sin importar dónde estabas antes.",
          "-l da formato largo (permisos, dueño, tamaño), -a incluye los archivos ocultos (los que empiezan por .).",
          ".. sube un nivel al directorio padre — lo usarás constantemente para moverte hacia atrás.",
          "Confirmas dónde has terminado tras el cd anterior.",
          "Otra ruta absoluta, esta vez a la configuración de red.",
          "Escapa caracteres raros en nombres de archivo (espacios, saltos de línea) para verlos sin ambigüedad — útil cuando un nombre de archivo viene de fuera y no confías en él."
        ]
      },
      {
        "id": "L01.02",
        "moduloId": "M01",
        "titulo": "Gestión de estructuras y manipulación",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [
          "_"
        ],
        "explicacion": "Crear, copiar, mover y borrar de verdad — con las banderas que evitan sustos (-p, -i, -m) y la que más cuidado exige (-rf).",
        "codigo": "mkdir -p /srv/backups/2026\ncp -i informe.txt /srv/backups/2026/\nls /srv/backups/2026/\nmkdir -p -m 750 /srv/shared/proyecto\nmv -f borrador.txt /srv/shared/proyecto/final.txt\nrm -rf /tmp/cache_vieja",
        "notas": [
          "-p crea toda la ruta de golpe, incluidos los directorios padres que falten — sin él, mkdir falla si /srv/backups no existe todavía.",
          "-i avisa antes de sobrescribir si ya existe un archivo con ese nombre en el destino — una capa de seguridad barata.",
          "Confirmas que la copia llegó a su sitio.",
          "-m fija los permisos en el momento de crear la carpeta (750 = dueño todo, grupo lee y entra, otros nada) — evita un chmod aparte después.",
          "mv sirve tanto para mover como para renombrar; -f fuerza el movimiento sin pedir confirmación si el destino ya existe.",
          "Borra recursivo y sin preguntar. El comando más peligroso de la lección — un espacio de más entre / y rf puede borrar mucho más de lo que querías."
        ]
      },
      {
        "id": "L01.03",
        "moduloId": "M01",
        "titulo": "Enlaces y referencias",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Un enlace simbólico es un puntero, no una copia — clave para entender por qué a veces un archivo 'desaparece' sin haberse borrado.",
        "codigo": "ln -s /mnt/nas/media /home/lucas/media\nls -la /home/lucas/media",
        "notas": [
          "Crea un enlace simbólico: un puntero, no una copia. Si borras el original, el enlace queda roto (apuntando a la nada).",
          "En formato largo, un symlink se ve con una flecha (->) señalando a dónde apunta de verdad."
        ]
      },
      {
        "id": "L01.04",
        "moduloId": "M01",
        "titulo": "Localización de elementos",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [
          "'",
          "\"",
          "*"
        ],
        "explicacion": "find busca en tiempo real (siempre actualizado, más lento); locate usa un índice (rápido, puede estar desactualizado). Los dos tienen su sitio.",
        "codigo": "sudo updatedb\nlocate -b -e 'docker-compose.yml'\nfind /etc -mindepth 2 -maxdepth 4 -name \"*.conf\"\nfind /var/www -name \"*.php\"",
        "notas": [
          "Actualiza el índice que usa locate — sin esto, locate puede no encontrar archivos creados hace poco.",
          "-b busca solo por el nombre del archivo (no la ruta completa), -e descarta del resultado archivos que ya no existen en disco.",
          "find busca en tiempo real (más lento que locate, pero siempre actualizado). -mindepth/-maxdepth acotan cuántos niveles de carpetas baja, para no rebuscar todo el disco.",
          "Búsqueda directa por nombre, sin acotar profundidad esta vez."
        ]
      },
      {
        "id": "L01.05",
        "moduloId": "M01",
        "titulo": "Archivado y compresión",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "tar empaqueta (con o sin comprimir), zip es más para compartir con Windows/Mac. Distinto propósito, distinta herramienta.",
        "codigo": "tar -cvf backup-web.tar /srv/web/public\ntar -xvf backup-web.tar\ntar -czvf backup-web.tar.gz /srv/web/public\nzip -r fotos.zip /home/lucas/fotos\nunzip fotos.zip -d /tmp/fotos_extraidas",
        "notas": [
          "Empaqueta sin comprimir: junta archivos en uno solo, pero no reduce tamaño. -c crea, -v muestra progreso, -f nombra el archivo destino.",
          "-x extrae. Mismo flag -f para indicar qué archivo tar leer.",
          "Igual que antes pero con -z: comprime con gzip. Pesa mucho menos, a cambio de tardar algo más en crear/extraer.",
          "Formato ZIP, más pensado para compartir con Windows/Mac que para backups Linux. -r incluye subcarpetas.",
          "-d elige dónde extraer, en vez de volcarlo en la carpeta actual."
        ]
      },
      {
        "id": "L01.06",
        "moduloId": "M01",
        "titulo": "Operaciones avanzadas y limpieza",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [
          "|",
          "+",
          "{",
          "}",
          "\\",
          ";"
        ],
        "explicacion": "El mismo find que ya conoces, ahora combinado con xargs para actuar sobre lo que encuentra — con cuidado, porque borra de verdad.",
        "codigo": "find /var/log -type f -mtime -7\nfind /var/log -type f -mtime -7 -print0 | xargs -0 rm -f\nfind /tmp -type f -atime +30 -exec rm -f {} \\;",
        "notas": [
          "Busca archivos modificados en los últimos 7 días (el \"-\" antes del número significa \"menos de\").",
          "-print0/-0 separan los nombres con un carácter nulo en vez de un espacio — así no se rompe la tubería si algún nombre de archivo tiene espacios.",
          "atime +30 son archivos que nadie ha leído en más de 30 días. -exec ejecuta un comando por cada resultado, {} se sustituye por el nombre encontrado."
        ]
      },
      {
        "id": "L01.07",
        "moduloId": "M01",
        "titulo": "Sincronización y utilidades de sistema",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [
          "@",
          ":"
        ],
        "explicacion": "rsync para copiar de verdad (con permisos, comprimido, en remoto), más un par de comandos de diagnóstico rápido.",
        "codigo": "rsync -avz --delete -e \"ssh -p 2222\" /srv/web/ backup@192.168.1.50:/srv/web/\ndu -sh /srv/web\nwhereis rsync",
        "notas": [
          "Sincroniza por SSH en el puerto 2222. -a preserva permisos/fechas, -z comprime en tránsito, --delete borra en destino lo que ya no existe en origen (simetría exacta).",
          "-s resume en un solo número (no carpeta por carpeta), -h lo muestra legible (GB/MB) en vez de bytes.",
          "Dice dónde está instalado el binario, su código fuente (si lo hay) y su página de manual — útil para confirmar que un comando existe antes de usarlo en un script."
        ]
      },
      {
        "id": "L01.J",
        "moduloId": "M01",
        "titulo": "Jefe: Archivos y navegación",
        "tipo": "jefe",
        "dificultad": 5,
        "nuevas": [],
        "explicacion": "Llevas semanas sin limpiar /var/log en tu NAS y el disco está casi lleno. Necesitas borrar automáticamente los logs con más de 7 días sin modificarse, sin que la operación falle si algún nombre de archivo tiene espacios.",
        "codigo": "find /var/log -type f -mtime +7 -print0 | xargs -0 rm -f",
        "opciones": [
          {
            "comando": "find /var/log -type f -mtime -7 -exec rm -f {} \\;",
            "correcta": false,
            "razon": "-mtime -7 es MENOS de 7 días, justo lo contrario de lo que pide el escenario (borraría los recientes, no los antiguos)."
          },
          {
            "comando": "find /var/log -type f -mtime +7 -print0 | xargs -0 rm -f",
            "correcta": true,
            "razon": ""
          },
          {
            "comando": "find /var/log -type f -mtime +7 | xargs rm -f",
            "correcta": false,
            "razon": "Sin -print0/-0, un nombre de archivo con espacios puede partirse mal en la tubería y borrar (o fallar sobre) el archivo equivocado — justo el problema que el escenario pide evitar."
          }
        ]
      }
    ]
  },
  {
    "id": "M02",
    "curso": "linux",
    "titulo": "Red",
    "descripcion": "ip, ping, ss, /etc/network/interfaces, netplan, ufw, iptables — diagnosticar y configurar red como en un homelab Proxmox real",
    "lecciones": [
      {
        "id": "L02.01",
        "moduloId": "M02",
        "titulo": "Inspección de interfaces y enlaces",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Antes de tocar nada de red, saber qué interfaces hay y en qué estado están. La base de todo diagnóstico.",
        "codigo": "ip link show\nip address add 192.168.10.254/24 dev eth0\nifconfig",
        "notas": [
          "Muestra las interfaces de red físicas y virtuales del sistema y su estado (UP/DOWN), sin entrar todavía en direcciones IP.",
          "Asigna una IP de forma temporal (se pierde al reiniciar) — útil para pruebas rápidas antes de hacerlo persistente.",
          "Comando heredado, deprecado en muchas distros modernas, pero todavía aparece en scripts antiguos y documentación vieja — bueno reconocerlo aunque ip sea el estándar actual."
        ]
      },
      {
        "id": "L02.02",
        "moduloId": "M02",
        "titulo": "Diagnóstico de conectividad y rutas",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Cuando algo no conecta: resolver nombres, trazar la ruta y asegurarte de que hay puerta de enlace.",
        "codigo": "nslookup google.com\ntracepath -n google.com\nip route add default via 192.168.10.1 dev eth0",
        "notas": [
          "Consulta DNS clásica: resuelve un nombre a IP y te dice qué servidor DNS respondió.",
          "Traza la ruta salto a salto hasta el destino sin necesitar privilegios root; -n evita resolver nombres DNS en cada salto (más rápido).",
          "Define la puerta de enlace por defecto — sin esto, el equipo no sabe cómo salir a Internet aunque tenga IP propia."
        ]
      },
      {
        "id": "L02.03",
        "moduloId": "M02",
        "titulo": "Gestión de sockets y procesos",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Quién está escuchando en cada puerto — el primer sitio donde miras si un servicio no responde.",
        "codigo": "sudo ss -tlnp\nsudo ss -tlnp | grep :22",
        "notas": [
          "-t TCP, -l solo sockets en escucha, -n sin resolver nombres (más rápido), -p muestra qué proceso tiene el puerto abierto — el primer comando para saber quién está escuchando en este puerto.",
          "Filtra la salida para ver solo el puerto SSH — útil cuando la lista completa es larga."
        ]
      },
      {
        "id": "L02.04",
        "moduloId": "M02",
        "titulo": "Configuración persistente mediante archivos planos",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [
          "&"
        ],
        "explicacion": "La red que sobrevive a un reinicio vive en archivos, no en una herramienta gráfica. Tres familias: Debian/Proxmox, Netplan y nmcli.",
        "codigo": "sudo nano /etc/network/interfaces\nsudo ifdown eth0 && sudo ifup eth0\nsudo systemctl restart networking\nsudo nano /etc/netplan/00-installer-config.yaml\nsudo netplan try\nsudo netplan apply\nnmcli device status",
        "notas": [
          "En Proxmox VE y Debian, la configuración de red vive en un archivo plano, no en una herramienta gráfica — así se gestionan los puentes (vmbr0) que usan las VMs.",
          "Recarga la interfaz para aplicar los cambios del archivo sin reiniciar toda la máquina.",
          "Alternativa que reinicia de golpe todas las interfaces marcadas como auto.",
          "Ubuntu Server moderno usa YAML descriptivo en vez de editar directamente el backend de red.",
          "Aplica los cambios de forma temporal y revierte solo si no confirmas a tiempo — evita quedarte bloqueado fuera de una máquina remota por un error de configuración.",
          "Aplica los cambios de forma definitiva, una vez confirmados.",
          "En escritorios y RHEL/Fedora, NetworkManager gestiona la red de forma dinámica; nmcli es su interfaz de terminal. En un servidor headless como Proxmox no suele estar presente ni ser el método preferido."
        ]
      },
      {
        "id": "L02.05",
        "moduloId": "M02",
        "titulo": "Firewall simplificado (UFW)",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "UFW es la capa amable sobre iptables: abrir justo lo necesario, y saber en todo momento qué tienes abierto.",
        "codigo": "sudo ufw allow from 203.0.113.50 to any port 22 proto tcp\nsudo ufw allow OpenSSH\nsudo ufw status numbered",
        "notas": [
          "Permite SSH solo desde una IP concreta, no desde cualquier origen — reduce mucho la superficie de ataque frente a abrir el puerto a todo el mundo.",
          "Perfil de aplicación predefinido, más simple que especificar el puerto a mano.",
          "Lista las reglas activas con un número — necesario para poder borrar una regla concreta más tarde."
        ]
      },
      {
        "id": "L02.06",
        "moduloId": "M02",
        "titulo": "Seguridad avanzada con Iptables",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [
          ","
        ],
        "explicacion": "El motor real por debajo: reglas de estado y NAT, lo que hace que un Proxmox pueda dar salida a sus VMs.",
        "codigo": "sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT\nsudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE",
        "notas": [
          "Regla base de casi cualquier firewall: permite el tráfico de respuesta de conexiones que tú mismo iniciaste, sin la cual nada funcionaría aunque abras puertos.",
          "NAT de salida: hace que el tráfico de tu red interna salga a Internet con la IP pública del router/gateway — típico en un Proxmox actuando de puerta de enlace para sus VMs."
        ]
      },
      {
        "id": "L02.J",
        "moduloId": "M02",
        "titulo": "Jefe: Red",
        "tipo": "jefe",
        "dificultad": 5,
        "nuevas": [],
        "explicacion": "Una VM de Proxmox recién clonada no tiene salida a Internet, aunque el ping a la puerta de enlace (192.168.10.1) funciona bien.",
        "codigo": "ip route add default via 192.168.10.1 dev eth0",
        "opciones": [
          {
            "comando": "ip addr add 192.168.10.50/24 dev eth0",
            "correcta": false,
            "razon": "Asigna una IP, pero la VM ya tiene IP (por eso el ping a la puerta de enlace funciona); el problema es la ruta de salida, no la dirección."
          },
          {
            "comando": "ip route add default via 192.168.10.1 dev eth0",
            "correcta": true,
            "razon": ""
          },
          {
            "comando": "sudo ufw allow out to any",
            "correcta": false,
            "razon": "Es una regla de firewall de salida, no soluciona la falta de ruta por defecto."
          }
        ]
      }
    ]
  },
  {
    "id": "M03",
    "curso": "linux",
    "titulo": "Permisos y propietarios",
    "descripcion": "chown, chmod octal y simbólico, SUID/SGID/sticky, setfacl, umask — controlar quién puede hacer qué",
    "lecciones": [
      {
        "id": "L03.01",
        "moduloId": "M03",
        "titulo": "Identidades del sistema",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Cada archivo tiene dueño y grupo. Cambiarlos bien es el primer paso para que un servicio pueda tocar sus propios archivos.",
        "codigo": "sudo chown -R nginx:nginx /srv/web/public\nls -la /srv/web/public",
        "notas": [
          "Cambia dueño y grupo a la vez, de forma recursiva — típico tras desplegar una web para que el proceso del servidor (nginx) pueda leer/escribir sus propios archivos.",
          "Comprueba el cambio: nginx aparece como usuario y grupo en la tercera y cuarta columna."
        ]
      },
      {
        "id": "L03.02",
        "moduloId": "M03",
        "titulo": "La lógica octal y simbólica",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Los permisos en número (755) o en símbolos (g+rw). Saber cuándo conviene cada notación.",
        "codigo": "sudo chmod 755 deploy.sh\nchmod g+rw notas_equipo.txt",
        "notas": [
          "Modo octal: 7 (dueño: todo), 5 y 5 (grupo/otros: leer y ejecutar, no escribir). Habitual en scripts que deben poder ejecutarse pero no modificarse por cualquiera.",
          "Modo simbólico: añade permisos sin tocar los que ya había — más seguro que recalcular el número octal completo cuando solo quieres tocar una parte."
        ]
      },
      {
        "id": "L03.03",
        "moduloId": "M03",
        "titulo": "Protección de la raíz",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Un seguro para que un chmod recursivo mal lanzado no se lleve por delante todo el sistema.",
        "codigo": "sudo chmod --preserve-root -R 755 /var/www/html",
        "notas": [
          "--preserve-root es un seguro: si por error la ruta se resuelve a / (una variable vacía en un script, por ejemplo), el comando se niega a ejecutar en vez de destrozar el sistema entero."
        ]
      },
      {
        "id": "L03.04",
        "moduloId": "M03",
        "titulo": "Bits especiales de seguridad",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [
          ">"
        ],
        "explicacion": "SUID, SGID y sticky bit: los permisos que cambian con qué privilegios se ejecuta algo o quién puede borrar qué. Potentes y peligrosos.",
        "codigo": "sudo chmod 2775 /srv/shared/developers\nsudo chmod +t /srv/public/uploads\nsudo chmod 4755 /usr/local/bin/app_audit\nfind / -perm -4000 2>/dev/null",
        "notas": [
          "El 2 inicial activa SGID: cualquier archivo nuevo creado ahí hereda el grupo de la carpeta, no el grupo principal de quien lo crea. Muy útil en carpetas de equipo.",
          "Sticky bit: en una carpeta compartida, cada usuario solo puede borrar sus propios archivos, aunque todos tengan permiso de escritura en la carpeta.",
          "SUID (el 4 inicial): el binario se ejecuta siempre con los privilegios de su dueño, no de quien lo lanza. Potente y peligroso — es el primer sitio donde mira cualquier auditoría de seguridad.",
          "Busca en todo el sistema binarios con SUID activo — el comando real que usarías para auditar qué tiene ese privilegio en una máquina."
        ]
      },
      {
        "id": "L03.05",
        "moduloId": "M03",
        "titulo": "Control de acceso granular (ACLs)",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Cuando chmod no da para tanto: permisos por usuario concreto sin tocar el dueño ni el grupo.",
        "codigo": "sudo setfacl -m u:sysmonitor:r-- /var/log/nginx/error.log\nsetfacl -x u:kenny /var/log/nginx/error.log",
        "notas": [
          "Da permiso de solo lectura a un usuario concreto que no es el dueño ni pertenece al grupo del archivo, sin tocar los permisos normales de chmod.",
          "Retira ese permiso extra a un usuario concreto, sin afectar al resto de la ACL."
        ]
      },
      {
        "id": "L03.06",
        "moduloId": "M03",
        "titulo": "Herencia y auditoría",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Leer lo que se ha montado con ACLs, y dejar que las carpetas nuevas hereden permisos solas.",
        "codigo": "getfacl /srv/audit\nsudo setfacl -d -m g:auditors:rx /srv/audit",
        "notas": [
          "Muestra todos los permisos extendidos de una ruta — la forma de leer lo que se ha ido montando con setfacl.",
          "ACL por defecto: no cambia nada de lo que ya existe, pero cualquier archivo o carpeta que se cree ahí a partir de ahora heredará automáticamente ese permiso."
        ]
      },
      {
        "id": "L03.07",
        "moduloId": "M03",
        "titulo": "Máscara de creación (umask)",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Con qué permisos nacen los archivos nuevos, antes de que toques nada. El valor por defecto y cuándo endurecerlo.",
        "codigo": "umask\numask 0022\numask 077",
        "notas": [
          "Sin argumentos, consulta el valor actual: la máscara que se resta de los permisos máximos cada vez que se crea algo nuevo.",
          "Fija la máscara: con este valor, los archivos nuevos nacen en 644 y los directorios en 755, el estándar más común.",
          "Máscara mucho más restrictiva: solo el dueño tiene acceso a lo que cree a partir de ahora — útil en carpetas de datos sensibles o claves privadas."
        ]
      },
      {
        "id": "L03.J",
        "moduloId": "M03",
        "titulo": "Jefe: Permisos y propietarios",
        "tipo": "jefe",
        "dificultad": 5,
        "nuevas": [],
        "explicacion": "Un binario en /usr/local/bin/app_audit necesita leer un archivo protegido de root aunque lo ejecute un usuario normal. Al probarlo, sigues viendo Permission denied.",
        "codigo": "sudo chmod 4755 /usr/local/bin/app_audit",
        "opciones": [
          {
            "comando": "sudo chmod 755 /usr/local/bin/app_audit",
            "correcta": false,
            "razon": "Da permiso de ejecución normal, pero el binario se sigue ejecutando con los privilegios de quien lo lanza (el usuario normal), no con los de root."
          },
          {
            "comando": "sudo chmod 4755 /usr/local/bin/app_audit",
            "correcta": true,
            "razon": ""
          },
          {
            "comando": "sudo chmod +t /usr/local/bin/app_audit",
            "correcta": false,
            "razon": "El sticky bit protege archivos dentro de una carpeta compartida frente a borrado por otros usuarios, no da privilegios de ejecución elevados a un binario."
          }
        ]
      }
    ]
  },
  {
    "id": "M04",
    "curso": "linux",
    "titulo": "Usuarios y privilegios",
    "descripcion": "useradd, usermod, passwd, sudo, visudo, sudoers.d — gestionar cuentas y privilegios sin abrir agujeros",
    "lecciones": [
      {
        "id": "L04.01",
        "moduloId": "M04",
        "titulo": "Gestión de identidades",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Crear, modificar y borrar cuentas sin dejar archivos huérfanos ni romper los grupos que el usuario ya tenía.",
        "codigo": "sudo useradd -m -s /bin/bash sammy\nsudo usermod -aG wheel sammy\nsudo userdel -r test1",
        "notas": [
          "Crea el usuario; -m genera su carpeta personal, -s define qué shell tendrá al iniciar sesión.",
          "-a es crítico aquí: sin él, usermod -G reemplazaría todos los grupos del usuario en vez de añadir uno nuevo.",
          "-r borra también su carpeta personal y su correo — sin -r, la cuenta desaparece pero sus archivos quedan huérfanos en el sistema."
        ]
      },
      {
        "id": "L04.02",
        "moduloId": "M04",
        "titulo": "Seguridad de credenciales",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Forzar cambios de contraseña y consultar cuándo caduca una cuenta.",
        "codigo": "sudo passwd -e sammy\nchage -l sammy",
        "notas": [
          "Fuerza que en el próximo login tenga que cambiar la contraseña — típico tras crear una cuenta con contraseña provisional.",
          "Consulta la política de caducidad de esa cuenta: cuándo cambió la contraseña por última vez y cuándo expira."
        ]
      },
      {
        "id": "L04.03",
        "moduloId": "M04",
        "titulo": "Usuarios de sistema",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Las cuentas que no son personas: servicios que corren sin poder iniciar sesión. Y cómo bloquear una cuenta sin borrarla.",
        "codigo": "sudo useradd -r -s /usr/sbin/nologin node_exporter\nsudo usermod -L baduser",
        "notas": [
          "Cuenta de sistema para un servicio: -r le da un UID bajo reservado, y nologin bloquea que nadie pueda usarla para iniciar sesión interactiva.",
          "Bloquea la cuenta inhabilitando su contraseña en /etc/shadow — la cuenta sigue existiendo, solo no se puede autenticar con contraseña."
        ]
      },
      {
        "id": "L04.04",
        "moduloId": "M04",
        "titulo": "Fundamentos de sudo",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Ejecutar con privilegios de root de forma puntual, y la diferencia entre cambiar de identidad con o sin entorno.",
        "codigo": "sudo whoami\nsudo -iu postgres",
        "notas": [
          "Ejecuta un único comando con privilegios de root y vuelve a tu usuario normal justo después — el uso más básico de sudo.",
          "-i simula un login completo como ese usuario (carga su entorno, te deja en su home) — muy distinto de sudo su, que solo cambia de identidad sin el entorno completo."
        ]
      },
      {
        "id": "L04.05",
        "moduloId": "M04",
        "titulo": "Hardening de sudoers con visudo",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Editar los permisos de sudo sin arriesgarte a quedarte fuera: visudo valida la sintaxis antes de guardar.",
        "codigo": "sudo visudo\nsudo visudo -f /etc/sudoers.d/10-admins",
        "notas": [
          "Nunca edites /etc/sudoers directamente con otro editor: visudo bloquea el archivo y valida la sintaxis antes de guardar, para que un error de tecleo no te deje sin forma de volver a usar sudo.",
          "En vez de un único archivo gigante, se reparten los permisos en archivos modulares dentro de sudoers.d — más fácil de mantener y de revertir un cambio concreto."
        ]
      },
      {
        "id": "L04.06",
        "moduloId": "M04",
        "titulo": "Delegación avanzada",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [
          "(",
          ")"
        ],
        "explicacion": "Dar justo un permiso concreto sin contraseña (para automatizar) sin abrir sudo entero. El equilibrio entre comodidad y seguridad.",
        "codigo": "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx\nsudo -E printenv PATH",
        "notas": [
          "Permite a un usuario de despliegue reiniciar un servicio concreto sin contraseña — imprescindible para automatización, pero solo seguro si el comando es muy concreto (nunca ALL).",
          "-E conserva tus variables de entorno al escalar privilegios — sin esto, sudo suele limpiar el entorno por seguridad, lo que puede romper scripts que dependen de variables tuyas."
        ]
      },
      {
        "id": "L04.J",
        "moduloId": "M04",
        "titulo": "Jefe: Usuarios y privilegios",
        "tipo": "jefe",
        "dificultad": 5,
        "nuevas": [],
        "explicacion": "Quieres que el usuario deploy pueda reiniciar el servicio nginx desde un pipeline de CI/CD sin que se quede colgado pidiendo contraseña — pero sin darle sudo total sobre la máquina.",
        "codigo": "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx",
        "opciones": [
          {
            "comando": "sudo usermod -aG sudo deploy",
            "correcta": false,
            "razon": "Le da sudo total (cualquier comando), justo lo que el escenario pide evitar."
          },
          {
            "comando": "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx",
            "correcta": true,
            "razon": ""
          },
          {
            "comando": "sudo passwd -e deploy",
            "correcta": false,
            "razon": "Expira la contraseña del usuario, no tiene relación con privilegios de sudo."
          }
        ]
      }
    ]
  },
  {
    "id": "M05",
    "curso": "linux",
    "titulo": "Procesos y servicios",
    "descripcion": "top, ps, kill, systemctl, journalctl — controlar procesos, servicios y logs de systemd",
    "lecciones": [
      {
        "id": "L05.01",
        "moduloId": "M05",
        "titulo": "Monitoreo de procesos",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Quién consume qué, ahora mismo. La vista en vivo y la foto fija.",
        "codigo": "top\nps aux\nps -eo pid,ppid,psr,pcpu,pmem,stat,comm --sort=-pcpu",
        "notas": [
          "Vista en vivo del sistema: quién consume más CPU/memoria ahora mismo. Sales con q.",
          "Foto fija de todos los procesos, de todos los usuarios (a), con detalle (u), incluidos los que no tienen terminal asociada (x).",
          "Cuando top no basta para un informe, esto genera una tabla a medida ordenada por consumo de CPU — útil para pegar en un ticket o un log."
        ]
      },
      {
        "id": "L05.02",
        "moduloId": "M05",
        "titulo": "Control de ejecución y señales",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Pedirle a un proceso que termine, por las buenas o por todas sus instancias a la vez.",
        "codigo": "kill 4821\nkillall nginx",
        "notas": [
          "Pide a ese PID que termine de forma educada (SIGTERM) — el proceso puede ignorarla si está mal programado.",
          "Mata todos los procesos que se llamen así, sin tener que buscar cada PID a mano — útil cuando un servicio lanza varias instancias."
        ]
      },
      {
        "id": "L05.03",
        "moduloId": "M05",
        "titulo": "Gestión de unidades con systemctl",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "El centro de mando de systemd: arrancar, parar, habilitar en el boot y desactivar del todo un servicio.",
        "codigo": "sudo systemctl start docker\nsystemctl status docker\nsudo systemctl stop docker\nsudo systemctl enable --now docker\nsudo systemctl daemon-reload\nsudo systemctl mask apache2",
        "notas": [
          "Arranca el servicio ahora, en esta sesión, sin tocar si arranca solo en el próximo boot.",
          "El comando que más vas a usar de esta lección: dice si está activo, su PID, cuánta memoria consume y las últimas líneas de su log, todo en una pantalla.",
          "Lo detiene ahora — a diferencia de mask, sigue pudiendo arrancar de nuevo si otro proceso lo requiere o en el próximo boot si estaba en enable.",
          "Dos cosas a la vez: que arranque en cada boot a partir de ahora, y que arranque ya mismo sin esperar a reiniciar.",
          "Obligatorio después de editar o crear un archivo .service a mano — si no lo haces, systemd sigue usando la versión antigua en memoria.",
          "Lo inhabilita del todo, ni manual ni automáticamente puede arrancar — útil para evitar que un servicio no deseado vuelva a levantarse por una dependencia de otro paquete."
        ]
      },
      {
        "id": "L05.04",
        "moduloId": "M05",
        "titulo": "Power management",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Apagar y reiniciar como es debido, incluido el apagado programado con aviso a quien tenga sesión abierta.",
        "codigo": "systemctl reboot\nsystemctl poweroff\nsudo shutdown -h +10 \"Mantenimiento programado\"\nsystemctl soft-reboot",
        "notas": [
          "Cierre ordenado de todo antes de reiniciar el hardware — la forma correcta frente a cortar la luz.",
          "Igual de ordenado, pero apaga en vez de reiniciar.",
          "Apagado programado en 10 minutos con aviso a quien tenga sesión abierta — la forma educada de apagar un servidor compartido, frente al poweroff inmediato.",
          "Reinicio solo del espacio de usuario, sin pasar por el hardware/firmware — uso especializado (SRE), pero permite aplicar cambios sin perder el estado de red o discos cifrados."
        ]
      },
      {
        "id": "L05.05",
        "moduloId": "M05",
        "titulo": "Análisis del diario (journalctl)",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "El diario de systemd: filtrar por servicio, por gravedad y por ventana de tiempo para encontrar el fallo.",
        "codigo": "journalctl -u nginx.service -f\njournalctl -b -p err\njournalctl --since \"2 hours ago\" --until \"now\"",
        "notas": [
          "Filtra por un servicio concreto y se queda pegado mostrando líneas nuevas en vivo, como un tail -f pero del diario de systemd.",
          "Solo los errores (o peor) del arranque actual — el primer sitio donde mirar tras un fallo reciente.",
          "Acota el diario a una ventana de tiempo concreta — clave para correlacionar logs con la hora exacta de un incidente."
        ]
      },
      {
        "id": "L05.06",
        "moduloId": "M05",
        "titulo": "Mantenimiento y persistencia",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Que los logs no llenen el disco, y que sobrevivan a un reinicio.",
        "codigo": "journalctl --disk-usage\nsudo journalctl --vacuum-size=500M\nsudo nano /etc/systemd/journald.conf",
        "notas": [
          "Cuánto espacio ocupan los logs ahora mismo en disco — antes de purgar nada, conviene saber cuánto hay.",
          "Purga los logs más antiguos hasta bajar del límite indicado — mantenimiento básico para que el diario no llene el disco con el tiempo.",
          "Aquí se fija Storage=persistent, para que los logs sobrevivan a un reinicio en vez de vivir solo en memoria — configuración base recomendada en cualquier servidor real."
        ]
      },
      {
        "id": "L05.J",
        "moduloId": "M05",
        "titulo": "Jefe: Procesos y servicios",
        "tipo": "jefe",
        "dificultad": 5,
        "nuevas": [],
        "explicacion": "Después de docker compose up, el contenedor de tu app se cierra solo a los pocos segundos. Necesitas ver las últimas 20 líneas de su log en tiempo real para saber por qué.",
        "codigo": "docker compose logs -f --tail 20 web",
        "opciones": [
          {
            "comando": "journalctl -u docker.service -f",
            "correcta": false,
            "razon": "Muestra el log del propio demonio Docker, no el del contenedor que falla."
          },
          {
            "comando": "docker compose logs -f --tail 20 web",
            "correcta": true,
            "razon": ""
          },
          {
            "comando": "systemctl status docker",
            "correcta": false,
            "razon": "Dice si el demonio Docker está activo, no por qué se cerró un contenedor concreto."
          }
        ]
      }
    ]
  },
  {
    "id": "M06",
    "curso": "linux",
    "titulo": "Discos y almacenamiento",
    "descripcion": "lsblk, fdisk, parted, mkfs, fstab, LVM — particionar, formatear y montar almacenamiento sin perder datos",
    "lecciones": [
      {
        "id": "L06.01",
        "moduloId": "M06",
        "titulo": "Exploración e identificación de dispositivos de bloque",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Antes de tocar un disco: ver qué hay y cómo se llama cada cosa, para no formatear el equivocado.",
        "codigo": "lsblk -o NAME,FSTYPE,UUID,SIZE,MOUNTPOINT\nsudo fdisk -l\nsudo blkid",
        "notas": [
          "Primer comando obligatorio antes de tocar cualquier disco: ver qué hay y cómo se llama cada cosa, para no formatear el disco equivocado.",
          "Además del listado, confirma si cada disco usa tabla GPT (moderna) o MBR (antigua) — importante porque cambia qué herramienta y qué límites de tamaño aplican.",
          "La forma más directa de sacar el UUID exacto de una partición — el dato que necesitarás para /etc/fstab."
        ]
      },
      {
        "id": "L06.02",
        "moduloId": "M06",
        "titulo": "Particionado (fdisk vs parted)",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [
          "%"
        ],
        "explicacion": "Crear particiones a mano (interactivo) o de un tirón para automatizar en un script.",
        "codigo": "sudo fdisk /dev/sdb\nn\nw\nsudo parted /dev/sdc --script mklabel gpt mkpart data ext4 0% 100%",
        "notas": [
          "Abre el editor interactivo de particiones para ese disco — todavía no cambia nada hasta que confirmes con w.",
          "Dentro de fdisk, crea una partición nueva; te pedirá tipo, número, sectores de inicio/fin.",
          "Escribe los cambios físicamente en el disco y sale — el punto de no retorno de toda la sesión.",
          "Versión no interactiva de todo lo anterior en un solo comando: crea tabla GPT y una partición que ocupa el disco entero, sin preguntas. Ideal para automatizar en un script de aprovisionamiento."
        ]
      },
      {
        "id": "L06.03",
        "moduloId": "M06",
        "titulo": "Sistemas de archivos",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Dar formato: Ext4 por defecto en Debian, XFS en RHEL. Elegir con criterio.",
        "codigo": "sudo mkfs.ext4 -L backup-disk /dev/sdb1\nsudo mkfs.xfs -f /dev/sdc1",
        "notas": [
          "Crea el sistema de archivos Ext4, el estándar en Debian/Ubuntu — la etiqueta (-L) facilita identificar el disco más adelante sin depender del UUID.",
          "XFS, por defecto en RHEL/Rocky: mejor rendimiento con muchos archivos o I/O alto, pero a diferencia de Ext4 no se puede reducir una vez creado."
        ]
      },
      {
        "id": "L06.04",
        "moduloId": "M06",
        "titulo": "Montaje persistente",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Montar ahora, y dejarlo montado tras cada reinicio con la línea correcta de fstab (y el nofail que evita cuelgues en el arranque).",
        "codigo": "sudo mount -o noatime,ro /dev/sdb1 /mnt/data\nsudo umount -l /mnt/data\nsudo blkid /dev/sdb1\nsudo nano /etc/fstab",
        "notas": [
          "Monta en solo lectura (ro) y sin registrar la fecha de cada lectura (noatime) — menos escrituras innecesarias en disco, típico para un disco de solo consulta.",
          "-l (lazy) desmonta de la jerarquía ya mismo aunque algún proceso siga usando el volumen; se libera del todo en cuanto ese proceso termine.",
          "Repites este paso antes de tocar /etc/fstab: necesitas el UUID exacto de esta partición concreta.",
          "Aquí añades la línea UUID=<uuid> /mnt/backup ext4 noatime,nofail 0 2 — nofail es la pieza clave: sin ella, si ese disco no está conectado al arrancar (por ejemplo un USB), el sistema entero se puede quedar colgado en el arranque."
        ]
      },
      {
        "id": "L06.05",
        "moduloId": "M06",
        "titulo": "Gestión de volúmenes lógicos (LVM)",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Desacoplar el almacenamiento de los discos físicos: PV, VG y LV, los tres pisos de LVM.",
        "codigo": "sudo pvcreate /dev/sdb1\nsudo vgcreate vg00 /dev/sdb1 /dev/sdc\nsudo lvcreate -n sales-lv -L 10G vg00",
        "notas": [
          "Primer paso de LVM: marca esta partición como disponible para el pool gestionado, sin crear todavía nada usable.",
          "Junta uno o varios PVs en un Grupo de Volúmenes: a partir de aquí el espacio ya no depende de en qué disco físico esté cada byte.",
          "Talla del VG un volumen lógico de tamaño concreto: esto sí es ya lo que formateas y montas, como si fuera una partición normal."
        ]
      },
      {
        "id": "L06.06",
        "moduloId": "M06",
        "titulo": "Escalabilidad LVM",
        "tipo": "leccion",
        "dificultad": 5,
        "nuevas": [],
        "explicacion": "Crecer en caliente es fácil; reducir tiene un orden obligatorio que, si te lo saltas, pierdes datos al instante.",
        "codigo": "sudo lvextend -L +1G /dev/vg00/sales-lv\nsudo resize2fs /dev/vg00/sales-lv\nsudo umount /mnt/sales-lv\nsudo resize2fs /dev/vg00/sales-lv 8G\nsudo lvreduce -L 8G /dev/vg00/sales-lv",
        "notas": [
          "Suma 1GB al volumen, tomándolo del espacio libre del VG — el + es importante, sin él estarías fijando un tamaño absoluto, no sumando.",
          "Paso obligatorio tras el lvextend: hasta que no corres esto, el sistema operativo sigue viendo el tamaño antiguo aunque el volumen ya sea más grande. Se puede hacer en caliente.",
          "Ext4 no admite reducir en caliente: hay que desmontar primero, a diferencia de ampliar.",
          "Encoge el sistema de archivos a un tamaño exacto — este paso va SIEMPRE antes que reducir el volumen lógico, nunca al revés.",
          "Ahora sí, reduce el volumen lógico — si hicieras esto antes que el resize2fs, cortarías el final del sistema de archivos y perderías datos al instante."
        ]
      },
      {
        "id": "L06.J",
        "moduloId": "M06",
        "titulo": "Jefe: Discos y almacenamiento",
        "tipo": "jefe",
        "dificultad": 5,
        "nuevas": [],
        "explicacion": "Un volumen lógico en producción se ha quedado corto de espacio. Necesitas ampliarlo 5GB sin desmontarlo, porque hay servicios usándolo ahora mismo.",
        "codigo": "sudo lvextend -L +5G /dev/vg00/sales-lv && sudo resize2fs /dev/vg00/sales-lv",
        "opciones": [
          {
            "comando": "sudo lvreduce -L 5G /dev/vg00/sales-lv",
            "correcta": false,
            "razon": "Reduce el volumen, justo lo contrario de lo que pide el escenario, y además con riesgo de pérdida de datos si se hace en el orden incorrecto."
          },
          {
            "comando": "sudo lvextend -L +5G /dev/vg00/sales-lv && sudo resize2fs /dev/vg00/sales-lv",
            "correcta": true,
            "razon": ""
          },
          {
            "comando": "sudo mkfs.ext4 -L backup-disk /dev/vg00/sales-lv",
            "correcta": false,
            "razon": "Formatea el volumen desde cero, borrando todos los datos existentes."
          }
        ]
      }
    ]
  },
  {
    "id": "M07",
    "curso": "linux",
    "titulo": "Pipes y redirecciones",
    "descripcion": ">, >>, |, tee, grep, sed, awk, sort, uniq — redirigir flujos y procesar texto en pipelines reales",
    "lecciones": [
      {
        "id": "L07.01",
        "moduloId": "M07",
        "titulo": "Redirecciones y descriptores de flujo",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Mandar la salida a un archivo (sin borrar lo que había, ojo) y capturar también los errores.",
        "codigo": "echo \"init\" > /var/log/setup.log\necho \"paso 2 completado\" >> /var/log/setup.log\nsetup_script.sh > output.log 2>&1\necho \"test\" | tee -a debug.log",
        "notas": [
          "> sobrescribe el archivo entero: si ya existía contenido, se pierde. Cuidado al usarlo sobre algo que no quieres vaciar.",
          ">> añade al final sin borrar lo anterior — la que sueles querer usar en un script que registra su propio progreso.",
          "Junta salida normal y errores en un solo archivo — imprescindible en cronjobs, donde si no capturas ambos flujos un fallo puede pasar completamente desapercibido.",
          "tee bifurca: escribe en el archivo Y lo sigues viendo en pantalla a la vez, en vez de tener que elegir uno de los dos. Muy usado con sudo para escribir en archivos que tu usuario normal no puede tocar directamente."
        ]
      },
      {
        "id": "L07.02",
        "moduloId": "M07",
        "titulo": "Filtrado avanzado con grep",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [
          "^",
          "$",
          "?",
          "<",
          "[",
          "]"
        ],
        "explicacion": "grep con expresiones regulares: anclar al inicio o al final, contar repeticiones y buscar varios patrones a la vez.",
        "codigo": "grep -E \"^ERROR\" app.log\ngrep -E \"fallo$\" app.log\ngrep -E \"^LOG:{3,5}\" app.log\ngrep -E \"ERROR|CRITICAL\" app.log\ngrep -P -o \"(?<=version\\s)[0-9.]+\" conf.xml\nzgrep -i \"warning\" /var/log/syslog.2.gz",
        "notas": [
          "^ ancla al inicio exacto de la línea — solo cuenta si ERROR es lo primero, no si aparece en medio de otra palabra.",
          "$ ancla al final: la línea tiene que terminar exactamente así.",
          "{3,5} es un cuantificador: entre 3 y 5 repeticiones del carácter anterior — útil para validar formatos con un número concreto de dígitos o símbolos.",
          "El | dentro de -E busca cualquiera de los dos patrones, sin tener que lanzar grep dos veces.",
          "PCRE permite mirar hacia atrás (lookaround) sin capturar ese texto en el resultado; -o además hace que solo veas la coincidencia exacta, no la línea entera.",
          "Busca dentro de un log ya comprimido sin tener que descomprimirlo a mano primero — muy común al revisar logs rotados antiguos."
        ]
      },
      {
        "id": "L07.03",
        "moduloId": "M07",
        "titulo": "Edición de flujo con sed",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Sustituir texto sobre el flujo (para probar) o directamente en el archivo (con copia de seguridad automática).",
        "codigo": "sed 's/old/new/g' file.txt\nsed -i.bak 's/127.0.0.1/0.0.0.0/g' /etc/redis/redis.conf",
        "notas": [
          "Sustituye sobre el flujo de salida, sin tocar el archivo original — perfecto para probar un cambio antes de aplicarlo de verdad.",
          "-i edita el archivo directamente en disco, y el sufijo .bak crea automáticamente una copia de seguridad antes de tocar nada — la red de seguridad que hace que editar en caliente sea razonablemente seguro."
        ]
      },
      {
        "id": "L07.04",
        "moduloId": "M07",
        "titulo": "Escaneo y extracción con awk",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "awk para columnas: sacar campos por posición, incluso contando desde el final, y bloques entre patrones.",
        "codigo": "awk '{print $1}' access.log\nawk '{print $(NF-3)}' auth.log\nawk '/inicio/,/fin/' config.txt",
        "notas": [
          "Por defecto awk separa por espacios/tabs: $1 es la primera columna, $2 la segunda, y así sucesivamente.",
          "NF es el número total de campos de la línea; restar sobre NF da una columna contando desde el final, útil cuando el número de columnas varía de una línea a otra.",
          "Extrae todo el bloque de texto entre dos patrones — algo que grep, al trabajar línea a línea, no puede hacer de forma nativa."
        ]
      },
      {
        "id": "L07.05",
        "moduloId": "M07",
        "titulo": "Modularidad (sort, uniq, cut)",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Las piezas pequeñas que se combinan: cortar columnas, ordenar y contar repetidos.",
        "codigo": "cut -d':' -f1 /etc/passwd\nsort -rn -k2 data.tsv\nuniq -c",
        "notas": [
          "-d define el separador (dos puntos aquí), -f1 se queda solo con el primer campo — la lista de nombres de usuario del sistema, sin nada más.",
          "Ordena por la segunda columna (-k2), de forma numérica (-n) y descendente (-r) — el patrón típico para sacar un top N de cualquier cosa medible.",
          "Cuenta líneas repetidas adyacentes — por eso casi siempre va después de un sort, que agrupa los repetidos uno junto al otro."
        ]
      },
      {
        "id": "L07.06",
        "moduloId": "M07",
        "titulo": "Pipelines de auditoría de producción",
        "tipo": "leccion",
        "dificultad": 5,
        "nuevas": [],
        "explicacion": "Todas las piezas juntas en un pipeline real: de un log gigante al top de IPs atacantes.",
        "codigo": "grep \"Failed password\" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -n 15",
        "notas": [
          "Pipeline completo de auditoría: filtra intentos fallidos de SSH, extrae la IP, cuenta repeticiones y muestra las 15 IPs más agresivas. Cada pieza de este comando ya la has practicado por separado en esta lección."
        ]
      },
      {
        "id": "L07.J",
        "moduloId": "M07",
        "titulo": "Jefe: Pipes y redirecciones",
        "tipo": "jefe",
        "dificultad": 5,
        "nuevas": [],
        "explicacion": "En /var/log/auth.log ves cientos de intentos fallidos de SSH. Quieres el top 15 de IPs que más han atacado.",
        "codigo": "grep \"Failed password\" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -n 15",
        "opciones": [
          {
            "comando": "grep \"Failed password\" /var/log/auth.log | sort | uniq -c",
            "correcta": false,
            "razon": "Cuenta líneas completas repetidas, no extrae ni agrupa por IP — cada línea es casi siempre distinta (hora, PID), así que el conteo no sirve."
          },
          {
            "comando": "grep \"Failed password\" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -n 15",
            "correcta": true,
            "razon": ""
          },
          {
            "comando": "awk '{print $(NF-3)}' /var/log/auth.log | sort | uniq -c | sort -rn | head -n 15",
            "correcta": false,
            "razon": "Sin el grep previo, procesa TODAS las líneas del log (no solo los fallos), así que el conteo mezcla eventos que no son ataques."
          }
        ]
      }
    ]
  },
  {
    "id": "M08",
    "curso": "linux",
    "titulo": "Nicho homelab",
    "descripcion": "qm, cloud-init, docker, docker compose, git — orquestar VMs de Proxmox, contenedores y control de versiones",
    "lecciones": [
      {
        "id": "L08.01",
        "moduloId": "M08",
        "titulo": "Control de VMs con qm",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Crear, arrancar, comprobar y apagar limpiamente una VM de Proxmox desde la terminal.",
        "codigo": "sudo qm create 110 --memory 4096 --cores 4 --net0 virtio,bridge=vmbr0 --scsihw virtio-scsi-pci\nqm start 110\nqm status 110\nsudo qm shutdown 110 --timeout 60",
        "notas": [
          "Crea la VM completa en un solo comando: memoria, CPU, red puenteada al vmbr0 (el puente estándar de Proxmox) y el controlador de disco, todo de una vez.",
          "Arranca la VM recién creada.",
          "Comprueba si está corriendo — el primer comando que tecleas para saber el estado de cualquier VM.",
          "Pide un apagado limpio al sistema operativo invitado (evento ACPI), esperando hasta 60 segundos antes de darlo por fallido — mucho más seguro que apagar en seco desde el hipervisor."
        ]
      },
      {
        "id": "L08.02",
        "moduloId": "M08",
        "titulo": "Clonación y plantillas",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Convertir una VM en plantilla y clonar: copia completa (independiente) o enlazada (instantánea y ligera).",
        "codigo": "sudo qm template 110\nsudo qm clone 9000 120 --name srv-db --full 1\nsudo qm clone 9000 130 --name srv-dev --full 0",
        "notas": [
          "Convierte la VM en plantilla de solo lectura — a partir de aquí ya no se puede arrancar directamente, solo clonar.",
          "Clon completo: copia independiente de todos los discos, más lenta de crear pero sin ninguna dependencia de la plantilla original.",
          "Clon enlazado: casi instantáneo, comparte el disco base con la plantilla (Copy-on-Write). Ahorra mucho espacio, pero no puedes borrar la plantilla mientras existan clones enlazados de ella."
        ]
      },
      {
        "id": "L08.03",
        "moduloId": "M08",
        "titulo": "Automatización con Cloud-Init",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Que la VM se configure sola en el primer arranque: IP fija y llave SSH inyectadas desde fuera.",
        "codigo": "sudo qm set 110 --ipconfig0 ip=10.0.0.110/24,gw=10.0.0.1 --sshkey ~/.ssh/id_rsa.pub",
        "notas": [
          "Cloud-init inyecta esta IP fija y esta llave SSH en la VM para que se apliquen solas en el primer arranque, sin tener que entrar manualmente a configurarlas dentro del sistema invitado."
        ]
      },
      {
        "id": "L08.04",
        "moduloId": "M08",
        "titulo": "Contenerización con Docker",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Levantar un contenedor en segundo plano, entrar a depurarlo, y ver por qué se cae.",
        "codigo": "docker run -d -p 8080:80 --restart always --name web-server nginx:alpine\ndocker exec -it app-container /bin/bash\ndocker compose logs -f --tail 20 web",
        "notas": [
          "Descarga la imagen si hace falta, la ejecuta en segundo plano (-d), mapea el puerto 8080 del host al 80 del contenedor, y hace que se reinicie sola si el host reinicia (--restart always).",
          "Te mete dentro del contenedor con una terminal interactiva, para revisar o depurar algo sin pararlo.",
          "El primer comando de diagnóstico cuando un contenedor se cierra solo tras el up: -f sigue en vivo, --tail 20 evita que se te llene la pantalla con todo el historial."
        ]
      },
      {
        "id": "L08.05",
        "moduloId": "M08",
        "titulo": "Orquestación con Docker Compose",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Levantar y tirar abajo toda una pila de servicios con un comando, incluyendo la limpieza a fondo.",
        "codigo": "docker compose up -d --build\ndocker compose down --volumes --remove-orphans",
        "notas": [
          "Levanta toda la pila definida en compose.yaml, reconstruyendo las imágenes si el código cambió — el comando del día a día para desplegar cambios.",
          "Limpieza a fondo: para servicios, borra también los volúmenes de datos y cualquier contenedor que ya no esté en el archivo de configuración actual."
        ]
      },
      {
        "id": "L08.06",
        "moduloId": "M08",
        "titulo": "Control de versiones (Git)",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "El flujo diario de git en un homelab: elegir qué subir, commitear con criterio y sincronizar sin ensuciar el historial.",
        "codigo": "git add -p\ngit commit -m \"feat: added backup script\"\ngit pull --rebase origin main\ngit push origin main",
        "notas": [
          "Modo interactivo de staging: revisar y elegir bloque a bloque qué entra en el próximo commit, en vez de subir todo el archivo de golpe (incluido código de depuración que no querías subir).",
          "Guarda lo preparado en el historial local, con un mensaje que explica el qué y el porqué del cambio.",
          "Baja los cambios del remoto y coloca tus commits locales encima, en vez de crear un commit de merge — mantiene el historial lineal y más fácil de leer.",
          "Sube tus commits al remoto — si lo rechaza porque hay cambios que no tienes, el paso previo es siempre el pull --rebase de arriba, nunca forzar el push a lo loco."
        ]
      },
      {
        "id": "L08.J",
        "moduloId": "M08",
        "titulo": "Jefe: Nicho homelab",
        "tipo": "jefe",
        "dificultad": 5,
        "nuevas": [],
        "explicacion": "Necesitas desplegar 5 VMs de prueba idénticas a partir de una plantilla ya creada, lo más rápido posible y sin gastar mucho espacio en disco, porque son temporales.",
        "codigo": "sudo qm clone 9000 130 --name srv-dev --full 0",
        "opciones": [
          {
            "comando": "sudo qm clone 9000 130 --name srv-dev --full 1",
            "correcta": false,
            "razon": "Clon completo — copia todos los discos, lento y gasta mucho espacio para algo temporal."
          },
          {
            "comando": "sudo qm clone 9000 130 --name srv-dev --full 0",
            "correcta": true,
            "razon": ""
          },
          {
            "comando": "sudo qm template 9000",
            "correcta": false,
            "razon": "Vuelve a convertir la plantilla en plantilla (ya lo es), no crea ninguna VM nueva."
          }
        ]
      }
    ]
  }
];
