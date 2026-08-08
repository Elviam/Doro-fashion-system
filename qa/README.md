# D’oro Fashion System — QA Portfolio

## Descripción del proyecto

D’oro Fashion System es un proyecto de portafolio que implementa un sistema de comercio electrónico y gestión operativa para una tienda de ropa y accesorios.

El sistema combina una tienda en línea para clientes con un panel interno utilizado por administradores y personal de almacén. Incluye gestión de productos, ventas, inventario por talla, preparación de pedidos, abastecimiento, pedidos a proveedores, recepción de mercancía, personal, permisos y auditoría.

D’oro se utiliza como caso de estudio de QA porque contiene flujos con distintos roles, reglas de negocio relacionadas con inventario, transiciones de estado, validaciones de API, persistencia de datos y operaciones que requieren control de autorización e integridad.

## Objetivo de QA

El portafolio busca demostrar habilidades en análisis de requisitos, diseño y ejecución de pruebas funcionales y negativas, autorización por rol y permiso, pruebas de API, validación de base de datos, pruebas exploratorias, automatización, reporte de defectos y regresión.

Esta carpeta contiene la documentación del proceso de QA del proyecto: plan de pruebas, casos de prueba, ejecuciones manuales, evidencias, defectos encontrados y futuras actividades de automatización y regresión.

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
| Suite manual Ventas e inventario | 16/16 PASS |
| Defectos documentados durante QA | 1 abierto |
| Frontend ESLint | Correcto: 0 errores y 0 warnings |
| Frontend build | Correcto; Vite emitió una advertencia por chunks mayores de 500 kB |

### Ejecución manual destacada

La primera ejecución formal del portafolio QA corresponde a la suite **Ventas e inventario** (`TR-SI-001`).

Resultados:

- 16 casos ejecutados.
- 16 casos aprobados.
- 0 casos fallidos.
- Validaciones de API, reglas de negocio, inventario y persistencia en PostgreSQL.
- Pruebas positivas, negativas, autorización y transiciones de estado.
- Validación de atomicidad en operaciones con múltiples artículos.
- Verificación de movimientos `ENTRADA` y `SALIDA`.
- Evidencias almacenadas en `qa/evidence/TR-SI-001/`.

Durante el proceso también se documentó un defecto relacionado con la separación de sesiones entre cuentas `CLIENTE` y `STAFF`, registrado como `BUG-AUTH-001`.

Las pruebas automatizadas existentes cubren principalmente servicios, autorización, contratos y regresiones estructurales; no representan cobertura end-to-end. No se declara un porcentaje de cobertura porque actualmente no se genera un reporte automatizado de cobertura.

Como parte del portafolio QA ya se ejecutó una primera suite manual utilizando la API local, PostgreSQL mediante Prisma Studio y validaciones directas de persistencia. La cobertura actual no representa todavía una validación end-to-end completa del sistema y continuará ampliándose con pruebas exploratorias, RBAC, regresión y automatización.

## Estrategia de pruebas

La estrategia prevista combina:

- pruebas manuales funcionales, negativas y de límites;
- sesiones exploratorias sobre flujos críticos;
- pruebas de API y autorización;
- validaciones de persistencia e integridad en PostgreSQL;
- pruebas de integración entre frontend, backend y base de datos;
- automatización y regresión de escenarios estables.

El repositorio ya contiene pruebas automatizadas con el ejecutor nativo de Node.js. Estas pruebas complementan, pero no sustituyen, las pruebas manuales, exploratorias, de API con un entorno real, de base de datos, de concurrencia ni una automatización end-to-end formal. Esas actividades permanecen planificadas mientras no exista evidencia de ejecución.

## Estructura de QA

```text
qa/
├── README.md
├── test-plan/
├── test-cases/
├── test-runs/
├── evidence/
├── defects/
├── exploratory-testing/
├── api-testing/
├── database-testing/
├── automation/
├── reports/
└── traceability/
```

Actualmente ya existen documentación de planificación, casos de prueba, una ejecución formal, evidencias y un defecto documentado. Las demás áreas se incorporarán conforme avance el portafolio.

## Herramientas

### En uso

- Git y GitHub para control de versiones.
- Postman para ejecución manual y documentación de pruebas de API.
- Prisma Studio para inspección y validación de persistencia.
- PostgreSQL para validaciones de datos.
- ESLint para análisis estático del frontend.
- Vite para desarrollo y compilación del frontend.
- Ejecutor de pruebas nativo de Node.js para la suite automatizada.
- Express y Zod para API y validación.
- Herramientas de desarrollo del navegador para inspección manual.

### Planificadas

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
| Diseño de casos manuales de Ventas e inventario | Completado |
| Ejecución manual de Ventas e inventario | Completado — 16/16 PASS |
| Evidencias de ejecución | Completado para `TR-SI-001` |
| Reporte de defectos | En progreso — 1 defecto abierto |
| Pruebas de API | En progreso |
| Validaciones documentadas de base de datos | En progreso |
| Pruebas de autorización y RBAC | Siguiente fase |
| Pruebas exploratorias con charters y evidencias | Planificado |
| Automatización end-to-end con Playwright | Planificado |
| Matriz de trazabilidad | Planificado |
