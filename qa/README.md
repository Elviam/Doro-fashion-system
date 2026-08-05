# D’oro Fashion System — QA Portfolio

## Descripción del proyecto

D’oro Fashion System es un proyecto de portafolio que implementa un sistema de comercio electrónico y gestión operativa para una tienda de ropa y accesorios.

El sistema combina una tienda en línea para clientes con un panel interno utilizado por administradores y personal de almacén. Incluye gestión de productos, ventas, inventario por talla, preparación de pedidos, abastecimiento, pedidos a proveedores, recepción de mercancía, personal, permisos y auditoría.

D’oro se utiliza como caso de estudio de QA porque contiene flujos con distintos roles, reglas de negocio relacionadas con inventario, transiciones de estado, validaciones de API, persistencia de datos y operaciones que requieren control de autorización e integridad.

## Objetivo de QA

El portafolio busca demostrar habilidades en análisis de requisitos, diseño y ejecución de pruebas funcionales y negativas, autorización por rol y permiso, pruebas de API, validación de base de datos, pruebas exploratorias, automatización, reporte de defectos y regresión.

Esta carpeta constituye la base documental inicial. El plan de pruebas está disponible; los casos detallados, las evidencias, los reportes y la automatización se incorporarán progresivamente.

## Alcance funcional resumido

### Tienda en línea

- Catálogo público y detalle de productos de ropa y accesorios.
- Selección de prendas por talla, cuando corresponda.
- Registro e inicio de sesión de clientes.
- Carrito, lista de deseos, checkout y direcciones de entrega.
- Creación de pedidos, pago simulado y consulta del historial propio.
- Páginas informativas de envíos, devoluciones, tallas, contacto, preguntas frecuentes, sustentabilidad y términos.

### Panel administrativo

- Dashboard.
- Productos y catálogo.
- Ventas y clientes.
- Proveedores.

### Operación de almacén

- Inventario por talla y ajustes con registro de movimientos.
- Preparación y envío de pedidos pagados.
- Recepción de mercancía y registro de cantidades recibidas.
- Notificaciones operativas derivadas del estado actual.

### Abastecimiento

- Resumen de productos y tallas con stock bajo.
- Generación de pedidos de reabastecimiento.
- Sección **Pedidos a proveedores** con borradores, enviados, recibidos y cancelados.

### Control y administración

- Personal con roles internos fijos y permisos individuales para bodegueros.
- Auditoría de acciones realizadas por personal interno.
- Control de acceso en frontend y autorización en endpoints del backend.

## Roles del sistema

- **ADMIN:** cuenta interna con acceso global a las funciones del personal. La administración de cuentas internas está restringida a administradores y ciertas operaciones protegen especialmente al administrador principal.
- **BODEGUERO:** cuenta interna orientada a inventario, recepción y preparación de pedidos. Sus capacidades efectivas dependen de permisos base y ajustes individuales.
- **CLIENTE:** cuenta de tienda separada de las sesiones internas; puede operar sobre sus direcciones y pedidos propios.

Los roles internos vigentes son fijos (`ADMIN` y `BODEGUERO`). La administración de cuentas internas y de los permisos individuales del bodeguero se realiza desde **Personal**. La navegación actual no incluye una página independiente de Configuración, Roles o Permisos.

El catálogo técnico de permisos conserva endpoints protegidos para su administración por el administrador principal, aunque esta operación no se expone en una página independiente del panel.

## Reglas técnicas confirmadas

- El stock persistente se almacena por talla en `ProductVariant.stock`; el stock agregado de un producto se calcula sumando sus variantes.
- El ajuste manual de inventario es una operación: un incremento genera un movimiento `ENTRADA` y una disminución genera `SALIDA`. Los tipos de movimiento persistidos confirmados son `ENTRADA` y `SALIDA`; `AJUSTE` no es un tipo persistido actual.
- `InventoryMovement` no almacena directamente talla, evidencia, responsable, referencia, stock anterior ni stock nuevo. Parte de ese contexto puede aparecer en el motivo del movimiento o en la auditoría, pero no como campos del modelo persistente.
- Una recepción admite cantidades recibidas menores que las solicitadas y registra los faltantes. Solo genera movimientos por cantidades mayores que cero y queda definitivamente en `CONFIRMADA`; no permanece abierta ni admite entregas posteriores enlazadas al mismo pedido.

## Estado actual de calidad

| Validación | Estado |
|---|---|
| Pruebas automatizadas del backend | 60/60 aprobadas |
| Pruebas automatizadas del frontend | 19/19 aprobadas |
| Total de pruebas automatizadas | 79/79 aprobadas |
| Frontend ESLint | Correcto: 0 errores y 0 warnings |
| Frontend build | Correcto; Vite emitió una advertencia por chunks mayores de 500 kB |

Las pruebas automatizadas existentes cubren principalmente servicios, autorización, contratos y regresiones estructurales; no representan cobertura end-to-end. No se declara un porcentaje de cobertura porque actualmente no se genera un reporte automatizado de cobertura.

Como parte del portafolio QA todavía no se han ejecutado formalmente pruebas con navegador real, una API completa levantada y PostgreSQL real. Las pruebas manuales y sus resultados también permanecen pendientes.

## Estrategia de pruebas

La estrategia prevista combina:

- pruebas manuales funcionales, negativas y de límites;
- sesiones exploratorias sobre flujos críticos;
- pruebas de API y autorización;
- validaciones de persistencia e integridad en PostgreSQL;
- pruebas de integración entre frontend, backend y base de datos;
- automatización y regresión de escenarios estables.

El repositorio ya contiene pruebas automatizadas con el ejecutor nativo de Node.js. Estas pruebas complementan, pero no sustituyen, las pruebas manuales, exploratorias, de API con un entorno real, de base de datos, de concurrencia ni una automatización end-to-end formal. Esas actividades permanecen planificadas mientras no exista evidencia de ejecución.

## Estructura prevista de QA

```text
qa/
├── README.md
├── test-plan/
├── test-cases/
├── exploratory-testing/
├── bug-reports/
├── api-testing/
├── database-testing/
├── automation/
├── evidence/
├── reports/
└── traceability/
```

En esta fase solo existen `README.md` y `test-plan/doro-test-plan.md`; las demás carpetas representan la evolución prevista.

## Herramientas

### En uso

- Git y GitHub para control de versiones.
- ESLint para análisis estático del frontend.
- Vite para desarrollo y compilación del frontend.
- Ejecutor de pruebas nativo de Node.js para la suite automatizada.
- Express y Zod para API y validación.
- Prisma y PostgreSQL para persistencia.
- Herramientas de desarrollo del navegador para inspección manual.

### Planificadas

- Postman para colecciones y ejecución documentada de pruebas de API.
- Playwright para automatización end-to-end.

## Cómo ejecutar las validaciones existentes

Desde la raíz del repositorio:

### Pruebas del backend

```powershell
cd backend
npm test
```

### Pruebas, lint y build del frontend

```powershell
cd frontend
npm test
npm run lint
npm run build
```

> `npm run lint` ejecuta ESLint sobre `src/` con corrección automática (`--fix`), por lo que puede modificar archivos. El lint es análisis estático y no sustituye pruebas funcionales.

## Autoría

D’oro Fashion System y su portafolio de QA fueron desarrollados y documentados por **Elvia Gutierrez Garcia**.

El proyecto refleja tanto el proceso de desarrollo de la aplicación como el análisis, la planificación y la validación de su calidad.

## Estado del portafolio QA

| Elemento | Estado |
|---|---|
| Inspección inicial del producto y del repositorio | Completado |
| README del portafolio QA | Completado |
| Plan de pruebas inicial | Completado |
| Revisión y actualización de la suite automatizada existente | Completado |
| Casos de prueba manuales y negativos | Planificado |
| Pruebas exploratorias con charters y evidencias | Planificado |
| Colección de pruebas de API | Planificado |
| Validaciones documentadas de base de datos | Planificado |
| Reportes de defectos y resultados de ejecución | Planificado |
| Automatización end-to-end con Playwright | Planificado |
| Matriz de trazabilidad | Planificado |
