# Backend de la Aplicación

Este es el repositorio del backend de nuestra aplicación, construido con NestJS, pnpm, y una base de datos PostgreSQL en Docker.

## 🚀 Cómo empezar

Sigue estos pasos para tener el proyecto corriendo en tu máquina local.

### 1. Requisitos

Asegúrate de tener instalado:

- **Node.js**: Versión 18 o superior.
- **pnpm**: El gestor de paquetes que usamos. Puedes instalarlo con `npm install -g pnpm`.
- **Docker**: Esencial para correr la base de datos.

### 2. Configuración de la Base de Datos

Utilizamos Docker para asegurar que todos los desarrolladores tengan el mismo entorno de base de datos.

1.  Abre una terminal y ejecuta el siguiente comando para iniciar el contenedor de PostgreSQL.

    ```bash
    docker run --name my-postgres-db -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=postgres -p 5432:5432 -d postgres
    ```

    > **Nota:** Si recibes un error de "puerto ya asignado", significa que algo más está usando el puerto 5432. Puedes usar un puerto diferente, como `-p 5433:5432`, y luego actualizar el puerto en tu archivo `.env`.

2.  Crea un archivo `.env` en la raíz del proyecto con la siguiente configuración:

    ```bash
    DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/postgres?schema=public"
    ```

### 3. Migraciones y Seeders

Con la base de datos corriendo, es hora de preparar la estructura y los datos iniciales.

1.  Instala las dependencias del proyecto:
    `pnpm install`
2.  Ejecuta la migración de la base de datos y genera el cliente de Prisma:
    `pnpm prisma migrate dev --name init`
3.  Ejecuta el comando para poblar la base de datos con datos de prueba:
    `pnpm run seed`

### 4. Ejecución del Servidor

Finalmente, inicia el servidor en modo de desarrollo:
`pnpm run start:dev`

El servidor estará disponible en `http://localhost:3000`.

---

### Flujo de Trabajo con Git (Git Flow)

Este flujo de trabajo simple te ayudará a mantener la rama principal (`main`) siempre estable y a trabajar de forma segura.

1.  **Rama `main`**: Es la rama de producción. Siempre debe estar lista para desplegarse. **Nunca hagas cambios directamente en esta rama.**
2.  **Rama `develop`**: Es la rama de integración. Todos los `pull requests` (PRs) se fusionan aquí.
3.  **Ramas de `feature`**: Para cada nueva funcionalidad o corrección de error, crea una rama a partir de `develop`. Usa un nombre descriptivo, como `feat/autenticacion-jwt` o `fix/bug-login`.

**Proceso de desarrollo:**

- Antes de empezar a trabajar, asegúrate de que tu rama `develop` esté actualizada:
  `git checkout develop`
  `git pull origin develop`
- Crea tu nueva rama de trabajo:
  `git checkout -b feat/nombre-de-tu-rama`
- Trabaja y realiza tus `commits`.
- Una vez que tu funcionalidad esté completa, haz un `push` a tu rama:
  `git push origin feat/nombre-de-tu-rama`
- Crea un **Pull Request** de tu rama hacia `develop`. Pide una revisión de código.
- Una vez aprobado, tu PR será fusionado con `develop`.

---

### 5. Extensiones recomendadas de VS Code

Para mantener la consistencia del código y facilitar el desarrollo, se recomienda instalar las siguientes extensiones de VS Code:

- **ESLint**: Para detectar errores de sintaxis y seguir las reglas de nuestro linter.
- **Prettier - Code formatter**: Para formatear el código de forma automática y consistente.
- **Prisma**: Proporciona resaltado de sintaxis, autocompletado e integración para el archivo `schema.prisma`.
- **Jest Runner**: Permite ejecutar y depurar pruebas de forma individual directamente desde el editor.
- **Docker**: Para gestionar contenedores y la base de datos de forma visual.
- **Error Lens**:Para detectar errores en el momento.
