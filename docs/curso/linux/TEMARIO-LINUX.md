# Temario de Linux (administración de sistemas) para Txispa Type

Fuente de verdad del contenido del curso de Linux. Procede del curso de Shellpath (`Shellpath/app/src/data/levels.ts` y `jefes.ts`, contrastados con los `TEMARIO — *.md` de esa carpeta). Se teclea un comando por línea; las notas explican cada línea. Formato parseable descrito en `docs/curso/SPEC-FORMATO-LECCIONES.md` §3, con dos ampliaciones nuevas que el generador aún no entiende (ver "Notas de conversión"): las notas por línea (`- nota N:`) y las lecciones de jefe (`tipo: jefe`).

**Estado:** convertido sin cambios de contenido técnico: 8 módulos, 50 lecciones y 8 jefes. Pendiente de revisión de Lucas y de ampliar el generador y el validador.

Convenciones del archivo:

- Un comando por línea, sin sangría, sin líneas en blanco y sin espacios dobles. Se teclea `Enter` al final de cada línea. Cada lección junta todas las pantallas de la lección original de Shellpath, en orden.
- `- nota N: ...` es la explicación de la línea N del bloque de código (1 = la primera). Todas las líneas llevan nota.
- `nuevas` lista los símbolos que se estrenan en esa lección dentro de este curso; `ninguna` si no hay.
- Las lecciones `tipo: jefe` son el examen del módulo: un escenario, varias opciones (exactamente una ✔) y el comando correcto, que es lo que se teclea.

---

## M01 · Archivos y navegación
Curso: linux
Descripción: pwd, cd, ls, mkdir, cp, mv, rm, find, tar, rsync — moverte y gestionar archivos como un sysadmin real

### L01.01 · Exploración y visualización del entorno
- tipo: leccion
- dificultad: 1
- nuevas: `~ / - . =`
> Los comandos que tecleas nada más entrar a una máquina: dónde estás, moverte y ver qué hay. Fíjate en ~, / y .. — símbolos que casi no usas en texto normal.

```bash
pwd
cd ~/Documentos
ls
cd /var/log
ls -la
cd ..
pwd
cd /etc/network
ls -la --quoting-style=escape
```
- nota 1: Te dice dónde estás ahora mismo dentro del árbol de carpetas. Es lo primero que tecleas cuando entras a una máquina nueva.
- nota 2: ~ es un atajo para tu carpeta personal — evita escribir la ruta completa cada vez.
- nota 3: Lista lo que hay en la carpeta actual, sin detalles todavía.
- nota 4: Ruta absoluta: empieza por /, así que funciona sin importar dónde estabas antes.
- nota 5: -l da formato largo (permisos, dueño, tamaño), -a incluye los archivos ocultos (los que empiezan por .).
- nota 6: .. sube un nivel al directorio padre — lo usarás constantemente para moverte hacia atrás.
- nota 7: Confirmas dónde has terminado tras el cd anterior.
- nota 8: Otra ruta absoluta, esta vez a la configuración de red.
- nota 9: Escapa caracteres raros en nombres de archivo (espacios, saltos de línea) para verlos sin ambigüedad — útil cuando un nombre de archivo viene de fuera y no confías en él.

### L01.02 · Gestión de estructuras y manipulación
- tipo: leccion
- dificultad: 2
- nuevas: `_`
> Crear, copiar, mover y borrar de verdad — con las banderas que evitan sustos (-p, -i, -m) y la que más cuidado exige (-rf).

```bash
mkdir -p /srv/backups/2026
cp -i informe.txt /srv/backups/2026/
ls /srv/backups/2026/
mkdir -p -m 750 /srv/shared/proyecto
mv -f borrador.txt /srv/shared/proyecto/final.txt
rm -rf /tmp/cache_vieja
```
- nota 1: -p crea toda la ruta de golpe, incluidos los directorios padres que falten — sin él, mkdir falla si /srv/backups no existe todavía.
- nota 2: -i avisa antes de sobrescribir si ya existe un archivo con ese nombre en el destino — una capa de seguridad barata.
- nota 3: Confirmas que la copia llegó a su sitio.
- nota 4: -m fija los permisos en el momento de crear la carpeta (750 = dueño todo, grupo lee y entra, otros nada) — evita un chmod aparte después.
- nota 5: mv sirve tanto para mover como para renombrar; -f fuerza el movimiento sin pedir confirmación si el destino ya existe.
- nota 6: Borra recursivo y sin preguntar. El comando más peligroso de la lección — un espacio de más entre / y rf puede borrar mucho más de lo que querías.

### L01.03 · Enlaces y referencias
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Un enlace simbólico es un puntero, no una copia — clave para entender por qué a veces un archivo 'desaparece' sin haberse borrado.

```bash
ln -s /mnt/nas/media /home/lucas/media
ls -la /home/lucas/media
```
- nota 1: Crea un enlace simbólico: un puntero, no una copia. Si borras el original, el enlace queda roto (apuntando a la nada).
- nota 2: En formato largo, un symlink se ve con una flecha (->) señalando a dónde apunta de verdad.

### L01.04 · Localización de elementos
- tipo: leccion
- dificultad: 3
- nuevas: `' " *`
> find busca en tiempo real (siempre actualizado, más lento); locate usa un índice (rápido, puede estar desactualizado). Los dos tienen su sitio.

```bash
sudo updatedb
locate -b -e 'docker-compose.yml'
find /etc -mindepth 2 -maxdepth 4 -name "*.conf"
find /var/www -name "*.php"
```
- nota 1: Actualiza el índice que usa locate — sin esto, locate puede no encontrar archivos creados hace poco.
- nota 2: -b busca solo por el nombre del archivo (no la ruta completa), -e descarta del resultado archivos que ya no existen en disco.
- nota 3: find busca en tiempo real (más lento que locate, pero siempre actualizado). -mindepth/-maxdepth acotan cuántos niveles de carpetas baja, para no rebuscar todo el disco.
- nota 4: Búsqueda directa por nombre, sin acotar profundidad esta vez.

### L01.05 · Archivado y compresión
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> tar empaqueta (con o sin comprimir), zip es más para compartir con Windows/Mac. Distinto propósito, distinta herramienta.

```bash
tar -cvf backup-web.tar /srv/web/public
tar -xvf backup-web.tar
tar -czvf backup-web.tar.gz /srv/web/public
zip -r fotos.zip /home/lucas/fotos
unzip fotos.zip -d /tmp/fotos_extraidas
```
- nota 1: Empaqueta sin comprimir: junta archivos en uno solo, pero no reduce tamaño. -c crea, -v muestra progreso, -f nombra el archivo destino.
- nota 2: -x extrae. Mismo flag -f para indicar qué archivo tar leer.
- nota 3: Igual que antes pero con -z: comprime con gzip. Pesa mucho menos, a cambio de tardar algo más en crear/extraer.
- nota 4: Formato ZIP, más pensado para compartir con Windows/Mac que para backups Linux. -r incluye subcarpetas.
- nota 5: -d elige dónde extraer, en vez de volcarlo en la carpeta actual.

### L01.06 · Operaciones avanzadas y limpieza
- tipo: leccion
- dificultad: 4
- nuevas: `| + { } \ ;`
> El mismo find que ya conoces, ahora combinado con xargs para actuar sobre lo que encuentra — con cuidado, porque borra de verdad.

```bash
find /var/log -type f -mtime -7
find /var/log -type f -mtime -7 -print0 | xargs -0 rm -f
find /tmp -type f -atime +30 -exec rm -f {} \;
```
- nota 1: Busca archivos modificados en los últimos 7 días (el "-" antes del número significa "menos de").
- nota 2: -print0/-0 separan los nombres con un carácter nulo en vez de un espacio — así no se rompe la tubería si algún nombre de archivo tiene espacios.
- nota 3: atime +30 son archivos que nadie ha leído en más de 30 días. -exec ejecuta un comando por cada resultado, {} se sustituye por el nombre encontrado.

### L01.07 · Sincronización y utilidades de sistema
- tipo: leccion
- dificultad: 4
- nuevas: `@ :`
> rsync para copiar de verdad (con permisos, comprimido, en remoto), más un par de comandos de diagnóstico rápido.

```bash
rsync -avz --delete -e "ssh -p 2222" /srv/web/ backup@192.168.1.50:/srv/web/
du -sh /srv/web
whereis rsync
```
- nota 1: Sincroniza por SSH en el puerto 2222. -a preserva permisos/fechas, -z comprime en tránsito, --delete borra en destino lo que ya no existe en origen (simetría exacta).
- nota 2: -s resume en un solo número (no carpeta por carpeta), -h lo muestra legible (GB/MB) en vez de bytes.
- nota 3: Dice dónde está instalado el binario, su código fuente (si lo hay) y su página de manual — útil para confirmar que un comando existe antes de usarlo en un script.

### L01.J · Jefe: Archivos y navegación
- tipo: jefe
- dificultad: 5
- nuevas: ninguna
> Llevas semanas sin limpiar /var/log en tu NAS y el disco está casi lleno. Necesitas borrar automáticamente los logs con más de 7 días sin modificarse, sin que la operación falle si algún nombre de archivo tiene espacios.
- opción ✘: `find /var/log -type f -mtime -7 -exec rm -f {} \;` | -mtime -7 es MENOS de 7 días, justo lo contrario de lo que pide el escenario (borraría los recientes, no los antiguos).
- opción ✔: `find /var/log -type f -mtime +7 -print0 | xargs -0 rm -f`
- opción ✘: `find /var/log -type f -mtime +7 | xargs rm -f` | Sin -print0/-0, un nombre de archivo con espacios puede partirse mal en la tubería y borrar (o fallar sobre) el archivo equivocado — justo el problema que el escenario pide evitar.

```bash
find /var/log -type f -mtime +7 -print0 | xargs -0 rm -f
```

## M02 · Red
Curso: linux
Descripción: ip, ping, ss, /etc/network/interfaces, netplan, ufw, iptables — diagnosticar y configurar red como en un homelab Proxmox real

### L02.01 · Inspección de interfaces y enlaces
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Antes de tocar nada de red, saber qué interfaces hay y en qué estado están. La base de todo diagnóstico.

```bash
ip link show
ip address add 192.168.10.254/24 dev eth0
ifconfig
```
- nota 1: Muestra las interfaces de red físicas y virtuales del sistema y su estado (UP/DOWN), sin entrar todavía en direcciones IP.
- nota 2: Asigna una IP de forma temporal (se pierde al reiniciar) — útil para pruebas rápidas antes de hacerlo persistente.
- nota 3: Comando heredado, deprecado en muchas distros modernas, pero todavía aparece en scripts antiguos y documentación vieja — bueno reconocerlo aunque ip sea el estándar actual.

### L02.02 · Diagnóstico de conectividad y rutas
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Cuando algo no conecta: resolver nombres, trazar la ruta y asegurarte de que hay puerta de enlace.

```bash
nslookup google.com
tracepath -n google.com
ip route add default via 192.168.10.1 dev eth0
```
- nota 1: Consulta DNS clásica: resuelve un nombre a IP y te dice qué servidor DNS respondió.
- nota 2: Traza la ruta salto a salto hasta el destino sin necesitar privilegios root; -n evita resolver nombres DNS en cada salto (más rápido).
- nota 3: Define la puerta de enlace por defecto — sin esto, el equipo no sabe cómo salir a Internet aunque tenga IP propia.

### L02.03 · Gestión de sockets y procesos
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Quién está escuchando en cada puerto — el primer sitio donde miras si un servicio no responde.

```bash
sudo ss -tlnp
sudo ss -tlnp | grep :22
```
- nota 1: -t TCP, -l solo sockets en escucha, -n sin resolver nombres (más rápido), -p muestra qué proceso tiene el puerto abierto — el primer comando para saber quién está escuchando en este puerto.
- nota 2: Filtra la salida para ver solo el puerto SSH — útil cuando la lista completa es larga.

### L02.04 · Configuración persistente mediante archivos planos
- tipo: leccion
- dificultad: 3
- nuevas: `&`
> La red que sobrevive a un reinicio vive en archivos, no en una herramienta gráfica. Tres familias: Debian/Proxmox, Netplan y nmcli.

```bash
sudo nano /etc/network/interfaces
sudo ifdown eth0 && sudo ifup eth0
sudo systemctl restart networking
sudo nano /etc/netplan/00-installer-config.yaml
sudo netplan try
sudo netplan apply
nmcli device status
```
- nota 1: En Proxmox VE y Debian, la configuración de red vive en un archivo plano, no en una herramienta gráfica — así se gestionan los puentes (vmbr0) que usan las VMs.
- nota 2: Recarga la interfaz para aplicar los cambios del archivo sin reiniciar toda la máquina.
- nota 3: Alternativa que reinicia de golpe todas las interfaces marcadas como auto.
- nota 4: Ubuntu Server moderno usa YAML descriptivo en vez de editar directamente el backend de red.
- nota 5: Aplica los cambios de forma temporal y revierte solo si no confirmas a tiempo — evita quedarte bloqueado fuera de una máquina remota por un error de configuración.
- nota 6: Aplica los cambios de forma definitiva, una vez confirmados.
- nota 7: En escritorios y RHEL/Fedora, NetworkManager gestiona la red de forma dinámica; nmcli es su interfaz de terminal. En un servidor headless como Proxmox no suele estar presente ni ser el método preferido.

### L02.05 · Firewall simplificado (UFW)
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> UFW es la capa amable sobre iptables: abrir justo lo necesario, y saber en todo momento qué tienes abierto.

```bash
sudo ufw allow from 203.0.113.50 to any port 22 proto tcp
sudo ufw allow OpenSSH
sudo ufw status numbered
```
- nota 1: Permite SSH solo desde una IP concreta, no desde cualquier origen — reduce mucho la superficie de ataque frente a abrir el puerto a todo el mundo.
- nota 2: Perfil de aplicación predefinido, más simple que especificar el puerto a mano.
- nota 3: Lista las reglas activas con un número — necesario para poder borrar una regla concreta más tarde.

### L02.06 · Seguridad avanzada con Iptables
- tipo: leccion
- dificultad: 4
- nuevas: `,`
> El motor real por debajo: reglas de estado y NAT, lo que hace que un Proxmox pueda dar salida a sus VMs.

```bash
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
```
- nota 1: Regla base de casi cualquier firewall: permite el tráfico de respuesta de conexiones que tú mismo iniciaste, sin la cual nada funcionaría aunque abras puertos.
- nota 2: NAT de salida: hace que el tráfico de tu red interna salga a Internet con la IP pública del router/gateway — típico en un Proxmox actuando de puerta de enlace para sus VMs.

### L02.J · Jefe: Red
- tipo: jefe
- dificultad: 5
- nuevas: ninguna
> Una VM de Proxmox recién clonada no tiene salida a Internet, aunque el ping a la puerta de enlace (192.168.10.1) funciona bien.
- opción ✘: `ip addr add 192.168.10.50/24 dev eth0` | Asigna una IP, pero la VM ya tiene IP (por eso el ping a la puerta de enlace funciona); el problema es la ruta de salida, no la dirección.
- opción ✔: `ip route add default via 192.168.10.1 dev eth0`
- opción ✘: `sudo ufw allow out to any` | Es una regla de firewall de salida, no soluciona la falta de ruta por defecto.

```bash
ip route add default via 192.168.10.1 dev eth0
```

## M03 · Permisos y propietarios
Curso: linux
Descripción: chown, chmod octal y simbólico, SUID/SGID/sticky, setfacl, umask — controlar quién puede hacer qué

### L03.01 · Identidades del sistema
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Cada archivo tiene dueño y grupo. Cambiarlos bien es el primer paso para que un servicio pueda tocar sus propios archivos.

```bash
sudo chown -R nginx:nginx /srv/web/public
ls -la /srv/web/public
```
- nota 1: Cambia dueño y grupo a la vez, de forma recursiva — típico tras desplegar una web para que el proceso del servidor (nginx) pueda leer/escribir sus propios archivos.
- nota 2: Comprueba el cambio: nginx aparece como usuario y grupo en la tercera y cuarta columna.

### L03.02 · La lógica octal y simbólica
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Los permisos en número (755) o en símbolos (g+rw). Saber cuándo conviene cada notación.

```bash
sudo chmod 755 deploy.sh
chmod g+rw notas_equipo.txt
```
- nota 1: Modo octal: 7 (dueño: todo), 5 y 5 (grupo/otros: leer y ejecutar, no escribir). Habitual en scripts que deben poder ejecutarse pero no modificarse por cualquiera.
- nota 2: Modo simbólico: añade permisos sin tocar los que ya había — más seguro que recalcular el número octal completo cuando solo quieres tocar una parte.

### L03.03 · Protección de la raíz
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Un seguro para que un chmod recursivo mal lanzado no se lleve por delante todo el sistema.

```bash
sudo chmod --preserve-root -R 755 /var/www/html
```
- nota 1: --preserve-root es un seguro: si por error la ruta se resuelve a / (una variable vacía en un script, por ejemplo), el comando se niega a ejecutar en vez de destrozar el sistema entero.

### L03.04 · Bits especiales de seguridad
- tipo: leccion
- dificultad: 3
- nuevas: `>`
> SUID, SGID y sticky bit: los permisos que cambian con qué privilegios se ejecuta algo o quién puede borrar qué. Potentes y peligrosos.

```bash
sudo chmod 2775 /srv/shared/developers
sudo chmod +t /srv/public/uploads
sudo chmod 4755 /usr/local/bin/app_audit
find / -perm -4000 2>/dev/null
```
- nota 1: El 2 inicial activa SGID: cualquier archivo nuevo creado ahí hereda el grupo de la carpeta, no el grupo principal de quien lo crea. Muy útil en carpetas de equipo.
- nota 2: Sticky bit: en una carpeta compartida, cada usuario solo puede borrar sus propios archivos, aunque todos tengan permiso de escritura en la carpeta.
- nota 3: SUID (el 4 inicial): el binario se ejecuta siempre con los privilegios de su dueño, no de quien lo lanza. Potente y peligroso — es el primer sitio donde mira cualquier auditoría de seguridad.
- nota 4: Busca en todo el sistema binarios con SUID activo — el comando real que usarías para auditar qué tiene ese privilegio en una máquina.

### L03.05 · Control de acceso granular (ACLs)
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> Cuando chmod no da para tanto: permisos por usuario concreto sin tocar el dueño ni el grupo.

```bash
sudo setfacl -m u:sysmonitor:r-- /var/log/nginx/error.log
setfacl -x u:kenny /var/log/nginx/error.log
```
- nota 1: Da permiso de solo lectura a un usuario concreto que no es el dueño ni pertenece al grupo del archivo, sin tocar los permisos normales de chmod.
- nota 2: Retira ese permiso extra a un usuario concreto, sin afectar al resto de la ACL.

### L03.06 · Herencia y auditoría
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> Leer lo que se ha montado con ACLs, y dejar que las carpetas nuevas hereden permisos solas.

```bash
getfacl /srv/audit
sudo setfacl -d -m g:auditors:rx /srv/audit
```
- nota 1: Muestra todos los permisos extendidos de una ruta — la forma de leer lo que se ha ido montando con setfacl.
- nota 2: ACL por defecto: no cambia nada de lo que ya existe, pero cualquier archivo o carpeta que se cree ahí a partir de ahora heredará automáticamente ese permiso.

### L03.07 · Máscara de creación (umask)
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> Con qué permisos nacen los archivos nuevos, antes de que toques nada. El valor por defecto y cuándo endurecerlo.

```bash
umask
umask 0022
umask 077
```
- nota 1: Sin argumentos, consulta el valor actual: la máscara que se resta de los permisos máximos cada vez que se crea algo nuevo.
- nota 2: Fija la máscara: con este valor, los archivos nuevos nacen en 644 y los directorios en 755, el estándar más común.
- nota 3: Máscara mucho más restrictiva: solo el dueño tiene acceso a lo que cree a partir de ahora — útil en carpetas de datos sensibles o claves privadas.

### L03.J · Jefe: Permisos y propietarios
- tipo: jefe
- dificultad: 5
- nuevas: ninguna
> Un binario en /usr/local/bin/app_audit necesita leer un archivo protegido de root aunque lo ejecute un usuario normal. Al probarlo, sigues viendo Permission denied.
- opción ✘: `sudo chmod 755 /usr/local/bin/app_audit` | Da permiso de ejecución normal, pero el binario se sigue ejecutando con los privilegios de quien lo lanza (el usuario normal), no con los de root.
- opción ✔: `sudo chmod 4755 /usr/local/bin/app_audit`
- opción ✘: `sudo chmod +t /usr/local/bin/app_audit` | El sticky bit protege archivos dentro de una carpeta compartida frente a borrado por otros usuarios, no da privilegios de ejecución elevados a un binario.

```bash
sudo chmod 4755 /usr/local/bin/app_audit
```

## M04 · Usuarios y privilegios
Curso: linux
Descripción: useradd, usermod, passwd, sudo, visudo, sudoers.d — gestionar cuentas y privilegios sin abrir agujeros

### L04.01 · Gestión de identidades
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Crear, modificar y borrar cuentas sin dejar archivos huérfanos ni romper los grupos que el usuario ya tenía.

```bash
sudo useradd -m -s /bin/bash sammy
sudo usermod -aG wheel sammy
sudo userdel -r test1
```
- nota 1: Crea el usuario; -m genera su carpeta personal, -s define qué shell tendrá al iniciar sesión.
- nota 2: -a es crítico aquí: sin él, usermod -G reemplazaría todos los grupos del usuario en vez de añadir uno nuevo.
- nota 3: -r borra también su carpeta personal y su correo — sin -r, la cuenta desaparece pero sus archivos quedan huérfanos en el sistema.

### L04.02 · Seguridad de credenciales
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Forzar cambios de contraseña y consultar cuándo caduca una cuenta.

```bash
sudo passwd -e sammy
chage -l sammy
```
- nota 1: Fuerza que en el próximo login tenga que cambiar la contraseña — típico tras crear una cuenta con contraseña provisional.
- nota 2: Consulta la política de caducidad de esa cuenta: cuándo cambió la contraseña por última vez y cuándo expira.

### L04.03 · Usuarios de sistema
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Las cuentas que no son personas: servicios que corren sin poder iniciar sesión. Y cómo bloquear una cuenta sin borrarla.

```bash
sudo useradd -r -s /usr/sbin/nologin node_exporter
sudo usermod -L baduser
```
- nota 1: Cuenta de sistema para un servicio: -r le da un UID bajo reservado, y nologin bloquea que nadie pueda usarla para iniciar sesión interactiva.
- nota 2: Bloquea la cuenta inhabilitando su contraseña en /etc/shadow — la cuenta sigue existiendo, solo no se puede autenticar con contraseña.

### L04.04 · Fundamentos de sudo
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Ejecutar con privilegios de root de forma puntual, y la diferencia entre cambiar de identidad con o sin entorno.

```bash
sudo whoami
sudo -iu postgres
```
- nota 1: Ejecuta un único comando con privilegios de root y vuelve a tu usuario normal justo después — el uso más básico de sudo.
- nota 2: -i simula un login completo como ese usuario (carga su entorno, te deja en su home) — muy distinto de sudo su, que solo cambia de identidad sin el entorno completo.

### L04.05 · Hardening de sudoers con visudo
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Editar los permisos de sudo sin arriesgarte a quedarte fuera: visudo valida la sintaxis antes de guardar.

```bash
sudo visudo
sudo visudo -f /etc/sudoers.d/10-admins
```
- nota 1: Nunca edites /etc/sudoers directamente con otro editor: visudo bloquea el archivo y valida la sintaxis antes de guardar, para que un error de tecleo no te deje sin forma de volver a usar sudo.
- nota 2: En vez de un único archivo gigante, se reparten los permisos en archivos modulares dentro de sudoers.d — más fácil de mantener y de revertir un cambio concreto.

### L04.06 · Delegación avanzada
- tipo: leccion
- dificultad: 4
- nuevas: `( )`
> Dar justo un permiso concreto sin contraseña (para automatizar) sin abrir sudo entero. El equilibrio entre comodidad y seguridad.

```bash
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx
sudo -E printenv PATH
```
- nota 1: Permite a un usuario de despliegue reiniciar un servicio concreto sin contraseña — imprescindible para automatización, pero solo seguro si el comando es muy concreto (nunca ALL).
- nota 2: -E conserva tus variables de entorno al escalar privilegios — sin esto, sudo suele limpiar el entorno por seguridad, lo que puede romper scripts que dependen de variables tuyas.

### L04.J · Jefe: Usuarios y privilegios
- tipo: jefe
- dificultad: 5
- nuevas: ninguna
> Quieres que el usuario deploy pueda reiniciar el servicio nginx desde un pipeline de CI/CD sin que se quede colgado pidiendo contraseña — pero sin darle sudo total sobre la máquina.
- opción ✘: `sudo usermod -aG sudo deploy` | Le da sudo total (cualquier comando), justo lo que el escenario pide evitar.
- opción ✔: `deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx`
- opción ✘: `sudo passwd -e deploy` | Expira la contraseña del usuario, no tiene relación con privilegios de sudo.

```bash
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx
```

## M05 · Procesos y servicios
Curso: linux
Descripción: top, ps, kill, systemctl, journalctl — controlar procesos, servicios y logs de systemd

### L05.01 · Monitoreo de procesos
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Quién consume qué, ahora mismo. La vista en vivo y la foto fija.

```bash
top
ps aux
ps -eo pid,ppid,psr,pcpu,pmem,stat,comm --sort=-pcpu
```
- nota 1: Vista en vivo del sistema: quién consume más CPU/memoria ahora mismo. Sales con q.
- nota 2: Foto fija de todos los procesos, de todos los usuarios (a), con detalle (u), incluidos los que no tienen terminal asociada (x).
- nota 3: Cuando top no basta para un informe, esto genera una tabla a medida ordenada por consumo de CPU — útil para pegar en un ticket o un log.

### L05.02 · Control de ejecución y señales
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Pedirle a un proceso que termine, por las buenas o por todas sus instancias a la vez.

```bash
kill 4821
killall nginx
```
- nota 1: Pide a ese PID que termine de forma educada (SIGTERM) — el proceso puede ignorarla si está mal programado.
- nota 2: Mata todos los procesos que se llamen así, sin tener que buscar cada PID a mano — útil cuando un servicio lanza varias instancias.

### L05.03 · Gestión de unidades con systemctl
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> El centro de mando de systemd: arrancar, parar, habilitar en el boot y desactivar del todo un servicio.

```bash
sudo systemctl start docker
systemctl status docker
sudo systemctl stop docker
sudo systemctl enable --now docker
sudo systemctl daemon-reload
sudo systemctl mask apache2
```
- nota 1: Arranca el servicio ahora, en esta sesión, sin tocar si arranca solo en el próximo boot.
- nota 2: El comando que más vas a usar de esta lección: dice si está activo, su PID, cuánta memoria consume y las últimas líneas de su log, todo en una pantalla.
- nota 3: Lo detiene ahora — a diferencia de mask, sigue pudiendo arrancar de nuevo si otro proceso lo requiere o en el próximo boot si estaba en enable.
- nota 4: Dos cosas a la vez: que arranque en cada boot a partir de ahora, y que arranque ya mismo sin esperar a reiniciar.
- nota 5: Obligatorio después de editar o crear un archivo .service a mano — si no lo haces, systemd sigue usando la versión antigua en memoria.
- nota 6: Lo inhabilita del todo, ni manual ni automáticamente puede arrancar — útil para evitar que un servicio no deseado vuelva a levantarse por una dependencia de otro paquete.

### L05.04 · Power management
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Apagar y reiniciar como es debido, incluido el apagado programado con aviso a quien tenga sesión abierta.

```bash
systemctl reboot
systemctl poweroff
sudo shutdown -h +10 "Mantenimiento programado"
systemctl soft-reboot
```
- nota 1: Cierre ordenado de todo antes de reiniciar el hardware — la forma correcta frente a cortar la luz.
- nota 2: Igual de ordenado, pero apaga en vez de reiniciar.
- nota 3: Apagado programado en 10 minutos con aviso a quien tenga sesión abierta — la forma educada de apagar un servidor compartido, frente al poweroff inmediato.
- nota 4: Reinicio solo del espacio de usuario, sin pasar por el hardware/firmware — uso especializado (SRE), pero permite aplicar cambios sin perder el estado de red o discos cifrados.

### L05.05 · Análisis del diario (journalctl)
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> El diario de systemd: filtrar por servicio, por gravedad y por ventana de tiempo para encontrar el fallo.

```bash
journalctl -u nginx.service -f
journalctl -b -p err
journalctl --since "2 hours ago" --until "now"
```
- nota 1: Filtra por un servicio concreto y se queda pegado mostrando líneas nuevas en vivo, como un tail -f pero del diario de systemd.
- nota 2: Solo los errores (o peor) del arranque actual — el primer sitio donde mirar tras un fallo reciente.
- nota 3: Acota el diario a una ventana de tiempo concreta — clave para correlacionar logs con la hora exacta de un incidente.

### L05.06 · Mantenimiento y persistencia
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> Que los logs no llenen el disco, y que sobrevivan a un reinicio.

```bash
journalctl --disk-usage
sudo journalctl --vacuum-size=500M
sudo nano /etc/systemd/journald.conf
```
- nota 1: Cuánto espacio ocupan los logs ahora mismo en disco — antes de purgar nada, conviene saber cuánto hay.
- nota 2: Purga los logs más antiguos hasta bajar del límite indicado — mantenimiento básico para que el diario no llene el disco con el tiempo.
- nota 3: Aquí se fija Storage=persistent, para que los logs sobrevivan a un reinicio en vez de vivir solo en memoria — configuración base recomendada en cualquier servidor real.

### L05.J · Jefe: Procesos y servicios
- tipo: jefe
- dificultad: 5
- nuevas: ninguna
> Después de docker compose up, el contenedor de tu app se cierra solo a los pocos segundos. Necesitas ver las últimas 20 líneas de su log en tiempo real para saber por qué.
- opción ✘: `journalctl -u docker.service -f` | Muestra el log del propio demonio Docker, no el del contenedor que falla.
- opción ✔: `docker compose logs -f --tail 20 web`
- opción ✘: `systemctl status docker` | Dice si el demonio Docker está activo, no por qué se cerró un contenedor concreto.

```bash
docker compose logs -f --tail 20 web
```

## M06 · Discos y almacenamiento
Curso: linux
Descripción: lsblk, fdisk, parted, mkfs, fstab, LVM — particionar, formatear y montar almacenamiento sin perder datos

### L06.01 · Exploración e identificación de dispositivos de bloque
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Antes de tocar un disco: ver qué hay y cómo se llama cada cosa, para no formatear el equivocado.

```bash
lsblk -o NAME,FSTYPE,UUID,SIZE,MOUNTPOINT
sudo fdisk -l
sudo blkid
```
- nota 1: Primer comando obligatorio antes de tocar cualquier disco: ver qué hay y cómo se llama cada cosa, para no formatear el disco equivocado.
- nota 2: Además del listado, confirma si cada disco usa tabla GPT (moderna) o MBR (antigua) — importante porque cambia qué herramienta y qué límites de tamaño aplican.
- nota 3: La forma más directa de sacar el UUID exacto de una partición — el dato que necesitarás para /etc/fstab.

### L06.02 · Particionado (fdisk vs parted)
- tipo: leccion
- dificultad: 3
- nuevas: `%`
> Crear particiones a mano (interactivo) o de un tirón para automatizar en un script.

```bash
sudo fdisk /dev/sdb
n
w
sudo parted /dev/sdc --script mklabel gpt mkpart data ext4 0% 100%
```
- nota 1: Abre el editor interactivo de particiones para ese disco — todavía no cambia nada hasta que confirmes con w.
- nota 2: Dentro de fdisk, crea una partición nueva; te pedirá tipo, número, sectores de inicio/fin.
- nota 3: Escribe los cambios físicamente en el disco y sale — el punto de no retorno de toda la sesión.
- nota 4: Versión no interactiva de todo lo anterior en un solo comando: crea tabla GPT y una partición que ocupa el disco entero, sin preguntas. Ideal para automatizar en un script de aprovisionamiento.

### L06.03 · Sistemas de archivos
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Dar formato: Ext4 por defecto en Debian, XFS en RHEL. Elegir con criterio.

```bash
sudo mkfs.ext4 -L backup-disk /dev/sdb1
sudo mkfs.xfs -f /dev/sdc1
```
- nota 1: Crea el sistema de archivos Ext4, el estándar en Debian/Ubuntu — la etiqueta (-L) facilita identificar el disco más adelante sin depender del UUID.
- nota 2: XFS, por defecto en RHEL/Rocky: mejor rendimiento con muchos archivos o I/O alto, pero a diferencia de Ext4 no se puede reducir una vez creado.

### L06.04 · Montaje persistente
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> Montar ahora, y dejarlo montado tras cada reinicio con la línea correcta de fstab (y el nofail que evita cuelgues en el arranque).

```bash
sudo mount -o noatime,ro /dev/sdb1 /mnt/data
sudo umount -l /mnt/data
sudo blkid /dev/sdb1
sudo nano /etc/fstab
```
- nota 1: Monta en solo lectura (ro) y sin registrar la fecha de cada lectura (noatime) — menos escrituras innecesarias en disco, típico para un disco de solo consulta.
- nota 2: -l (lazy) desmonta de la jerarquía ya mismo aunque algún proceso siga usando el volumen; se libera del todo en cuanto ese proceso termine.
- nota 3: Repites este paso antes de tocar /etc/fstab: necesitas el UUID exacto de esta partición concreta.
- nota 4: Aquí añades la línea UUID=<uuid> /mnt/backup ext4 noatime,nofail 0 2 — nofail es la pieza clave: sin ella, si ese disco no está conectado al arrancar (por ejemplo un USB), el sistema entero se puede quedar colgado en el arranque.

### L06.05 · Gestión de volúmenes lógicos (LVM)
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> Desacoplar el almacenamiento de los discos físicos: PV, VG y LV, los tres pisos de LVM.

```bash
sudo pvcreate /dev/sdb1
sudo vgcreate vg00 /dev/sdb1 /dev/sdc
sudo lvcreate -n sales-lv -L 10G vg00
```
- nota 1: Primer paso de LVM: marca esta partición como disponible para el pool gestionado, sin crear todavía nada usable.
- nota 2: Junta uno o varios PVs en un Grupo de Volúmenes: a partir de aquí el espacio ya no depende de en qué disco físico esté cada byte.
- nota 3: Talla del VG un volumen lógico de tamaño concreto: esto sí es ya lo que formateas y montas, como si fuera una partición normal.

### L06.06 · Escalabilidad LVM
- tipo: leccion
- dificultad: 5
- nuevas: ninguna
> Crecer en caliente es fácil; reducir tiene un orden obligatorio que, si te lo saltas, pierdes datos al instante.

```bash
sudo lvextend -L +1G /dev/vg00/sales-lv
sudo resize2fs /dev/vg00/sales-lv
sudo umount /mnt/sales-lv
sudo resize2fs /dev/vg00/sales-lv 8G
sudo lvreduce -L 8G /dev/vg00/sales-lv
```
- nota 1: Suma 1GB al volumen, tomándolo del espacio libre del VG — el + es importante, sin él estarías fijando un tamaño absoluto, no sumando.
- nota 2: Paso obligatorio tras el lvextend: hasta que no corres esto, el sistema operativo sigue viendo el tamaño antiguo aunque el volumen ya sea más grande. Se puede hacer en caliente.
- nota 3: Ext4 no admite reducir en caliente: hay que desmontar primero, a diferencia de ampliar.
- nota 4: Encoge el sistema de archivos a un tamaño exacto — este paso va SIEMPRE antes que reducir el volumen lógico, nunca al revés.
- nota 5: Ahora sí, reduce el volumen lógico — si hicieras esto antes que el resize2fs, cortarías el final del sistema de archivos y perderías datos al instante.

### L06.J · Jefe: Discos y almacenamiento
- tipo: jefe
- dificultad: 5
- nuevas: ninguna
> Un volumen lógico en producción se ha quedado corto de espacio. Necesitas ampliarlo 5GB sin desmontarlo, porque hay servicios usándolo ahora mismo.
- opción ✘: `sudo lvreduce -L 5G /dev/vg00/sales-lv` | Reduce el volumen, justo lo contrario de lo que pide el escenario, y además con riesgo de pérdida de datos si se hace en el orden incorrecto.
- opción ✔: `sudo lvextend -L +5G /dev/vg00/sales-lv && sudo resize2fs /dev/vg00/sales-lv`
- opción ✘: `sudo mkfs.ext4 -L backup-disk /dev/vg00/sales-lv` | Formatea el volumen desde cero, borrando todos los datos existentes.

```bash
sudo lvextend -L +5G /dev/vg00/sales-lv && sudo resize2fs /dev/vg00/sales-lv
```

## M07 · Pipes y redirecciones
Curso: linux
Descripción: >, >>, |, tee, grep, sed, awk, sort, uniq — redirigir flujos y procesar texto en pipelines reales

### L07.01 · Redirecciones y descriptores de flujo
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Mandar la salida a un archivo (sin borrar lo que había, ojo) y capturar también los errores.

```bash
echo "init" > /var/log/setup.log
echo "paso 2 completado" >> /var/log/setup.log
setup_script.sh > output.log 2>&1
echo "test" | tee -a debug.log
```
- nota 1: > sobrescribe el archivo entero: si ya existía contenido, se pierde. Cuidado al usarlo sobre algo que no quieres vaciar.
- nota 2: >> añade al final sin borrar lo anterior — la que sueles querer usar en un script que registra su propio progreso.
- nota 3: Junta salida normal y errores en un solo archivo — imprescindible en cronjobs, donde si no capturas ambos flujos un fallo puede pasar completamente desapercibido.
- nota 4: tee bifurca: escribe en el archivo Y lo sigues viendo en pantalla a la vez, en vez de tener que elegir uno de los dos. Muy usado con sudo para escribir en archivos que tu usuario normal no puede tocar directamente.

### L07.02 · Filtrado avanzado con grep
- tipo: leccion
- dificultad: 3
- nuevas: `^ $ ? < [ ]`
> grep con expresiones regulares: anclar al inicio o al final, contar repeticiones y buscar varios patrones a la vez.

```bash
grep -E "^ERROR" app.log
grep -E "fallo$" app.log
grep -E "^LOG:{3,5}" app.log
grep -E "ERROR|CRITICAL" app.log
grep -P -o "(?<=version\s)[0-9.]+" conf.xml
zgrep -i "warning" /var/log/syslog.2.gz
```
<!-- REVISAR: lleva "^", tecla muerta en el teclado ISO español (Mayús + la tecla a la derecha de P, y luego un espacio). Ver Notas de conversión. -->
- nota 1: ^ ancla al inicio exacto de la línea — solo cuenta si ERROR es lo primero, no si aparece en medio de otra palabra.
- nota 2: $ ancla al final: la línea tiene que terminar exactamente así.
- nota 3: {3,5} es un cuantificador: entre 3 y 5 repeticiones del carácter anterior — útil para validar formatos con un número concreto de dígitos o símbolos.
- nota 4: El | dentro de -E busca cualquiera de los dos patrones, sin tener que lanzar grep dos veces.
- nota 5: PCRE permite mirar hacia atrás (lookaround) sin capturar ese texto en el resultado; -o además hace que solo veas la coincidencia exacta, no la línea entera.
- nota 6: Busca dentro de un log ya comprimido sin tener que descomprimirlo a mano primero — muy común al revisar logs rotados antiguos.

### L07.03 · Edición de flujo con sed
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Sustituir texto sobre el flujo (para probar) o directamente en el archivo (con copia de seguridad automática).

```bash
sed 's/old/new/g' file.txt
sed -i.bak 's/127.0.0.1/0.0.0.0/g' /etc/redis/redis.conf
```
- nota 1: Sustituye sobre el flujo de salida, sin tocar el archivo original — perfecto para probar un cambio antes de aplicarlo de verdad.
- nota 2: -i edita el archivo directamente en disco, y el sufijo .bak crea automáticamente una copia de seguridad antes de tocar nada — la red de seguridad que hace que editar en caliente sea razonablemente seguro.

### L07.04 · Escaneo y extracción con awk
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> awk para columnas: sacar campos por posición, incluso contando desde el final, y bloques entre patrones.

```bash
awk '{print $1}' access.log
awk '{print $(NF-3)}' auth.log
awk '/inicio/,/fin/' config.txt
```
- nota 1: Por defecto awk separa por espacios/tabs: $1 es la primera columna, $2 la segunda, y así sucesivamente.
- nota 2: NF es el número total de campos de la línea; restar sobre NF da una columna contando desde el final, útil cuando el número de columnas varía de una línea a otra.
- nota 3: Extrae todo el bloque de texto entre dos patrones — algo que grep, al trabajar línea a línea, no puede hacer de forma nativa.

### L07.05 · Modularidad (sort, uniq, cut)
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> Las piezas pequeñas que se combinan: cortar columnas, ordenar y contar repetidos.

```bash
cut -d':' -f1 /etc/passwd
sort -rn -k2 data.tsv
uniq -c
```
- nota 1: -d define el separador (dos puntos aquí), -f1 se queda solo con el primer campo — la lista de nombres de usuario del sistema, sin nada más.
- nota 2: Ordena por la segunda columna (-k2), de forma numérica (-n) y descendente (-r) — el patrón típico para sacar un top N de cualquier cosa medible.
- nota 3: Cuenta líneas repetidas adyacentes — por eso casi siempre va después de un sort, que agrupa los repetidos uno junto al otro.

### L07.06 · Pipelines de auditoría de producción
- tipo: leccion
- dificultad: 5
- nuevas: ninguna
> Todas las piezas juntas en un pipeline real: de un log gigante al top de IPs atacantes.

```bash
grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -n 15
```
- nota 1: Pipeline completo de auditoría: filtra intentos fallidos de SSH, extrae la IP, cuenta repeticiones y muestra las 15 IPs más agresivas. Cada pieza de este comando ya la has practicado por separado en esta lección.

### L07.J · Jefe: Pipes y redirecciones
- tipo: jefe
- dificultad: 5
- nuevas: ninguna
> En /var/log/auth.log ves cientos de intentos fallidos de SSH. Quieres el top 15 de IPs que más han atacado.
- opción ✘: `grep "Failed password" /var/log/auth.log | sort | uniq -c` | Cuenta líneas completas repetidas, no extrae ni agrupa por IP — cada línea es casi siempre distinta (hora, PID), así que el conteo no sirve.
- opción ✔: `grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -n 15`
- opción ✘: `awk '{print $(NF-3)}' /var/log/auth.log | sort | uniq -c | sort -rn | head -n 15` | Sin el grep previo, procesa TODAS las líneas del log (no solo los fallos), así que el conteo mezcla eventos que no son ataques.

```bash
grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -n 15
```

## M08 · Nicho homelab
Curso: linux
Descripción: qm, cloud-init, docker, docker compose, git — orquestar VMs de Proxmox, contenedores y control de versiones

### L08.01 · Control de VMs con qm
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Crear, arrancar, comprobar y apagar limpiamente una VM de Proxmox desde la terminal.

```bash
sudo qm create 110 --memory 4096 --cores 4 --net0 virtio,bridge=vmbr0 --scsihw virtio-scsi-pci
qm start 110
qm status 110
sudo qm shutdown 110 --timeout 60
```
- nota 1: Crea la VM completa en un solo comando: memoria, CPU, red puenteada al vmbr0 (el puente estándar de Proxmox) y el controlador de disco, todo de una vez.
- nota 2: Arranca la VM recién creada.
- nota 3: Comprueba si está corriendo — el primer comando que tecleas para saber el estado de cualquier VM.
- nota 4: Pide un apagado limpio al sistema operativo invitado (evento ACPI), esperando hasta 60 segundos antes de darlo por fallido — mucho más seguro que apagar en seco desde el hipervisor.

### L08.02 · Clonación y plantillas
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Convertir una VM en plantilla y clonar: copia completa (independiente) o enlazada (instantánea y ligera).

```bash
sudo qm template 110
sudo qm clone 9000 120 --name srv-db --full 1
sudo qm clone 9000 130 --name srv-dev --full 0
```
- nota 1: Convierte la VM en plantilla de solo lectura — a partir de aquí ya no se puede arrancar directamente, solo clonar.
- nota 2: Clon completo: copia independiente de todos los discos, más lenta de crear pero sin ninguna dependencia de la plantilla original.
- nota 3: Clon enlazado: casi instantáneo, comparte el disco base con la plantilla (Copy-on-Write). Ahorra mucho espacio, pero no puedes borrar la plantilla mientras existan clones enlazados de ella.

### L08.03 · Automatización con Cloud-Init
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> Que la VM se configure sola en el primer arranque: IP fija y llave SSH inyectadas desde fuera.

```bash
sudo qm set 110 --ipconfig0 ip=10.0.0.110/24,gw=10.0.0.1 --sshkey ~/.ssh/id_rsa.pub
```
- nota 1: Cloud-init inyecta esta IP fija y esta llave SSH en la VM para que se apliquen solas en el primer arranque, sin tener que entrar manualmente a configurarlas dentro del sistema invitado.

### L08.04 · Contenerización con Docker
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> Levantar un contenedor en segundo plano, entrar a depurarlo, y ver por qué se cae.

```bash
docker run -d -p 8080:80 --restart always --name web-server nginx:alpine
docker exec -it app-container /bin/bash
docker compose logs -f --tail 20 web
```
- nota 1: Descarga la imagen si hace falta, la ejecuta en segundo plano (-d), mapea el puerto 8080 del host al 80 del contenedor, y hace que se reinicie sola si el host reinicia (--restart always).
- nota 2: Te mete dentro del contenedor con una terminal interactiva, para revisar o depurar algo sin pararlo.
- nota 3: El primer comando de diagnóstico cuando un contenedor se cierra solo tras el up: -f sigue en vivo, --tail 20 evita que se te llene la pantalla con todo el historial.

### L08.05 · Orquestación con Docker Compose
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> Levantar y tirar abajo toda una pila de servicios con un comando, incluyendo la limpieza a fondo.

```bash
docker compose up -d --build
docker compose down --volumes --remove-orphans
```
- nota 1: Levanta toda la pila definida en compose.yaml, reconstruyendo las imágenes si el código cambió — el comando del día a día para desplegar cambios.
- nota 2: Limpieza a fondo: para servicios, borra también los volúmenes de datos y cualquier contenedor que ya no esté en el archivo de configuración actual.

### L08.06 · Control de versiones (Git)
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> El flujo diario de git en un homelab: elegir qué subir, commitear con criterio y sincronizar sin ensuciar el historial.

```bash
git add -p
git commit -m "feat: added backup script"
git pull --rebase origin main
git push origin main
```
- nota 1: Modo interactivo de staging: revisar y elegir bloque a bloque qué entra en el próximo commit, en vez de subir todo el archivo de golpe (incluido código de depuración que no querías subir).
- nota 2: Guarda lo preparado en el historial local, con un mensaje que explica el qué y el porqué del cambio.
- nota 3: Baja los cambios del remoto y coloca tus commits locales encima, en vez de crear un commit de merge — mantiene el historial lineal y más fácil de leer.
- nota 4: Sube tus commits al remoto — si lo rechaza porque hay cambios que no tienes, el paso previo es siempre el pull --rebase de arriba, nunca forzar el push a lo loco.

### L08.J · Jefe: Nicho homelab
- tipo: jefe
- dificultad: 5
- nuevas: ninguna
> Necesitas desplegar 5 VMs de prueba idénticas a partir de una plantilla ya creada, lo más rápido posible y sin gastar mucho espacio en disco, porque son temporales.
- opción ✘: `sudo qm clone 9000 130 --name srv-dev --full 1` | Clon completo — copia todos los discos, lento y gasta mucho espacio para algo temporal.
- opción ✔: `sudo qm clone 9000 130 --name srv-dev --full 0`
- opción ✘: `sudo qm template 9000` | Vuelve a convertir la plantilla en plantilla (ya lo es), no crea ninguna VM nueva.

```bash
sudo qm clone 9000 130 --name srv-dev --full 0
```

---

## Notas de conversión

**Cifras.** 8 módulos, 50 lecciones (7+6+7+6+6+6+6+6), 73 pantallas, 159 líneas de comando (la lección L01.01 repite `pwd`) y 8 jefes (uno por módulo). No hay jefes de repaso transversales: todos tienen módulo.

**Contraste con los documentos de Shellpath.** `levels.ts` y los `TEMARIO — Módulo N (pantallas).md` coinciden línea a línea en los 8 módulos, y los 8 jefes coinciden con `TEMARIO — Jefes finales (banco de casos).md`, opciones incluidas. No hay huecos: lo que los archivos `(detalle)` listan y no aparece literalmente en `levels.ts` son plantillas genéricas (`sudo <comando>`, `kill <PID>`) o variantes con otras rutas (`zip`, `unzip`, `whereis`, `parted --script`, `awk '/pattern1/,/pattern2/'`), todas ya cubiertas con rutas concretas. En el índice de módulos figuran "51 lecciones, 71 pantallas, 148 líneas": está desactualizado frente al código (50, 73 y 159), y manda el código. El archivo `TEMARIO PREMIUM — Ideas (futuro).md` es una lista de ideas futuras y no se ha convertido. LXC (`pct`) queda fuera por decisión de Lucas en Shellpath (12/07/2026).

**Qué se ha hecho.** Cada lección de Shellpath es una lección de este temario (todas sus pantallas concatenadas, en orden); ninguna supera 9 líneas, así que no ha hecho falta partir ninguna. Los nombres, introducciones, comandos y explicaciones son los de `levels.ts` y `jefes.ts`, sin cambios de significado. Las dificultades y los `nuevas` son nuevos: la dificultad es progresiva dentro del módulo y según la complejidad de los comandos; `nuevas` lista cada símbolo la primera vez que aparece en el curso.

**Comandos con `^` (tecla muerta).** Hay dos, ambos en L07.02, y no se han reescrito porque la lección trata justo de anclar al inicio de línea y cualquier alternativa sin `^` cambiaría lo que enseña: `grep -E "^ERROR" app.log` y `grep -E "^LOG:{3,5}" app.log`. Están marcados con `<!-- REVISAR -->`. En el teclado ISO español `^` es Mayús + la tecla de la derecha de la P y es una tecla muerta (hay que pulsar un espacio detrás): `CHARMAP` lo trata como una tecla normal y la pulsación puede llegar al navegador como `Dead`. Hay que probarlo en el navegador antes de dar la lección por buena. No hay comandos con comillas invertidas, tabuladores ni comillas tipográficas. El resto de símbolos (`\` en `\;` y `\s`, `~`, `|`, `$`, `{ }`, `[ ]`, `@`) se escribe con AltGr o Mayús y ya está en `CHARMAP`.

**Lo que el generador y los tests de Txispa no admiten hoy** (hay que ampliarlos antes de generar `linux.ts`):
1. `- nota N:` (nota por línea). El glosario actual deduce las notas de las etiquetas y propiedades, y para Linux hace falta una nota explícita por línea.
2. `tipo: jefe`, el id `L01.J`, las líneas `- opción ✔:` y `- opción ✘: ... | razón`, y el componente de la pantalla del jefe.
3. El generador solo acepta `Curso: html|css`, ids `L\d{2}.(\d{2}|R)` y exige un repaso al final; aquí el último elemento del módulo es el jefe (`L0N.J`), no un repaso.
4. La línea `<!-- REVISAR ... -->` fuera del bloque no es una línea reconocida y haría fallar el generador. Hay que ignorarla o quitarla al revisar.
5. Los validadores de HTML (etiquetas) y de CSS (llaves) no aplican a este curso; los de longitud, espacios dobles, tabuladores y caracteres tecleables sí.

**Decisiones para Lucas.**
1. **Longitud de las lecciones.** El test exige de 6 a 15 líneas por lección y 45 de las 50 lecciones tienen menos de 6 (3 tienen 1 línea, 16 tienen 2, 16 tienen 3, 8 tienen 4 y 2 tienen 5). Opciones: (a) mínimo de líneas por curso, con 1 para Linux (recomendado: mantiene las lecciones tal cual); o (b) fundir lecciones contiguas de cada módulo hasta 6-15 líneas, lo que daría unas 20 lecciones y mezclaría temas.
2. **La línea de sudoers de L04.06** (`deploy ALL=(ALL) NOPASSWD: ...`) no es un comando de terminal, sino una línea de `/etc/sudoers.d/`. Se ha dejado como en Shellpath.
3. **`^`** en L07.02: dejarlo, reescribir la lección con otras herramientas (p. ej. `awk` con `substr`, lo que cambia la lección) o quitar esas dos líneas hasta probar la tecla muerta.
4. **Orden de los módulos.** Se mantiene el de Shellpath (M01 a M08). En Shellpath no estaba cerrado el orden de desbloqueo; aquí es lineal.
