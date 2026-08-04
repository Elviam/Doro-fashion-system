# Plan de pruebas — D’oro Fashion System

## 1. Identificación

| Campo | Valor |
|---|---|
| Proyecto | D’oro Fashion System |
| Documento | Plan de pruebas |
| Versión | 1.0 |
| Estado | Versión inicial aprobada |
| Fecha | 4 de agosto de 2026 |
| Responsable | Elvia Gutierrez Garcia |

## 2. Propósito

Este plan define el alcance, el enfoque y los criterios para validar D’oro Fashion System como tienda y sistema interno de gestión. Su propósito es detectar riesgos funcionales y de integridad antes de una entrega, priorizando inventario, pedidos, recepciones, ventas, sesiones y autorización.

También establece una base reproducible para ampliar el portafolio con casos, evidencias, pruebas de API, consultas de base de datos, automatización y resultados de las ejecuciones de regresión.

## 3. Objetivos de calidad

- Verificar las reglas que modifican existencias por talla.
- Validar transiciones permitidas y rechazar estados inválidos.
- Comprobar la separación de cuentas `CLIENTE` y de personal, así como la autorización por rol y permiso.
- Verificar que el sistema prevenga stock negativo, descuentos duplicados y reposiciones incorrectas.
- Preservar la integridad de pedidos de clientes, pedidos a proveedores y recepciones.
- Verificar validaciones, códigos de respuesta y mensajes comprensibles.
- Comprobar que las operaciones relevantes produzcan movimientos o registros auditables cuando corresponda.
- Reducir regresiones en los flujos críticos del negocio.

## 4. Alcance

### Identidad y acceso

- Registro e inicio de sesión de clientes.
- Inicio de sesión del personal.
- Verificación, expiración y cierre de sesión.
- Separación del almacenamiento y uso de tokens de `CLIENTE` y personal interno.
- Acceso a páginas y endpoints mediante roles y permisos efectivos.

### Catálogo y relaciones comerciales

- Productos, categorías, tallas, precios, estados activo e inactivo y proveedor asociado.
- Clientes y direcciones propias de clientes.
- Proveedores.

### Venta y tienda

- Catálogo público, detalle, carrito, lista de deseos y checkout.
- Creación y consulta de pedidos propios.
- Pago simulado con tarjeta u OXXO.
- Ventas internas, importes, envío y cancelación.

### Inventario y almacén

- Consulta y ajuste de inventario por talla.
- Movimientos de entrada, salida y ajuste.
- Preparación y despacho de pedidos pagados.
- Seguimiento simulado del envío.
- Recepción de mercancía, cantidades recibidas, costos y factura.

### Abastecimiento

- Identificación de productos y tallas cuyo stock alcanza el mínimo o queda por debajo de él.
- Cálculo sugerido de reposición hacia el stock ideal.
- Generación de borradores y envío de pedidos a proveedores.
- Consulta de pedidos a proveedores por estado.

### Administración y control

- Personal con roles internos `ADMIN` y `BODEGUERO`.
- Permisos individuales del bodeguero gestionados desde Personal.
- Protección del administrador principal.
- Auditoría del personal y notificaciones operativas.
- Dashboard y búsqueda interna.

## 5. Fuera de alcance inicial

- Pruebas de carga, estrés o volumen a gran escala.
- Auditoría especializada de seguridad o pruebas de penetración.
- Pruebas sobre dispositivos físicos; la primera etapa utilizará navegadores de escritorio.
- Integración con una pasarela de pago real, ya que el pago implementado es simulado.
- Integraciones reales de paquetería o proveedores; el seguimiento de entrega actual es simulado.
- Recuperación ante desastres y alta disponibilidad de infraestructura.
- Auditoría completa de conformidad con WCAG. Durante esta etapa solo se realizarán comprobaciones básicas de accesibilidad, como navegación con teclado, foco visible, etiquetas y contraste.
- Validación del despliegue público, pendiente hasta que el frontend y el backend estén publicados en un ambiente estable.

## 6. Enfoque basado en riesgos

Escala: probabilidad e impacto se califican como baja, media o alta. El nivel combina ambos valores y orienta el orden de ejecución.

| ID | Riesgo | Módulo | Probabilidad | Impacto | Nivel | Respuesta de prueba |
|---|---|---|---|---|---|---|
| R-01 | Stock inconsistente entre producto, talla y movimiento de inventario | Inventario | Media | Alta | Alto | Comparar el estado previo y posterior, así como el movimiento persistido por talla. |
| R-02 | Una recepción se confirma más de una vez | Recepciones | Media | Alta | Alto | Repetir solicitudes y ejecutarlas de forma concurrente; verificar una sola transición y un solo incremento. |
| R-03 | Se paga o vende una cantidad sin existencias suficientes | Ventas | Alta | Alta | Crítico | Probar stock cero, inferior a la cantidad solicitada, exacto y solicitudes concurrentes. |
| R-04 | Cancelar una venta pagada repone cantidades incorrectas o más de una vez | Ventas e inventario | Media | Alta | Alto | Validar transición, stock y movimiento de entrada; repetir la cancelación. |
| R-05 | Un usuario accede a páginas o endpoints sin permiso | Autorización | Media | Alta | Alto | Crear una matriz de rol, permiso y recurso, y probar la interfaz y la API directamente. |
| R-06 | Una sesión de `CLIENTE` se utiliza como sesión de personal interno o viceversa | Autenticación | Media | Alta | Alto | Intercambiar tokens, rutas y sesiones simultáneas; esperar 401/403 controlados. |
| R-07 | Se modifica, desactiva o elimina una cuenta protegida | Personal | Baja | Alta | Alto | Probar administrador principal, cuenta propia, administrador secundario e historial relacionado. |
| R-08 | Dos operadores intentan preparar simultáneamente el mismo pedido | Preparación | Media | Alta | Alto | Ejecutar solicitudes concurrentes y verificar que el pedido se despache una sola vez. La regla funcional y la protección de concurrencia deben confirmarse antes de clasificar un resultado como defecto. |
| R-09 | Se pierde información al cerrar un formulario sin guardar | Productos, personal, pedidos | Media | Media | Medio | Explorar cierre por botón, fondo, Escape, navegación y recarga con cambios pendientes. |
| R-10 | Se acepta una transición de estado no permitida | Ventas y recepciones | Media | Alta | Alto | Probar cada transición válida e inválida mediante API. |
| R-11 | Importes, costos, envío o cantidades se calculan incorrectamente | Checkout, ventas y abastecimiento | Media | Alta | Alto | Usar valores límite, decimales y cálculos independientes. |
| R-12 | El historial de recepciones expone datos fuera de la ventana del bodeguero | Recepciones | Media | Media | Medio | Verificar el frontend y realizar una consulta directa a la API. El límite de diez días está confirmado en el frontend, no en el servicio del backend. |

Los riesgos describen fallos potenciales; no afirman que exista un defecto.

## 7. Tipos de pruebas

- **Smoke:** disponibilidad, carga de tienda, login, acceso al panel y endpoints esenciales.
- **Funcionales:** reglas de cada módulo y resultados esperados de los flujos principales.
- **Negativas:** credenciales inválidas, permisos insuficientes, entidades inexistentes, duplicados y estados incompatibles.
- **Límites:** stock cero o exacto, cantidades mínimas y máximas, longitudes, fechas e importes.
- **Integración:** coordinación entre API, Prisma/PostgreSQL, auditoría, movimientos y pantallas consumidoras.
- **API:** contratos, esquemas, autenticación, códigos HTTP, prevención de efectos duplicados y manejo de errores.
- **Base de datos:** relaciones, unicidad, integridad, persistencia y efectos transaccionales.
- **Autorización:** cuenta, rol, permiso efectivo y protección del administrador principal.
- **Exploratorias:** sesiones guiadas por riesgos sobre formularios, navegación y estados poco frecuentes.
- **Regresión:** repetición de la ruta crítica tras cambios.
- **Automatización futura:** expansión de pruebas de servicio/API y cobertura end-to-end con Playwright.

## 8. Estrategia por nivel

| Nivel | Estrategia |
|---|---|
| Frontend | Validar navegación, formularios, mensajes, filtros, representación de estados y ocultamiento de acciones según permisos. |
| Backend | Probar servicios, validadores, transiciones, cálculos, errores y operaciones transaccionales. |
| API | Ejecutar solicitudes autenticadas y no autenticadas para cada endpoint y contrastar estado, cuerpo y efectos secundarios. |
| Base de datos | Consultar registros relacionados antes y después de operaciones críticas, sin usar datos reales ni alterar ambientes ajenos a QA. |
| End-to-end | Recorrer cliente → checkout → pago simulado → preparación → envío, y abastecimiento → pedido a proveedor → recepción → stock. |

## 9. Ambientes

El ambiente confirmado es de desarrollo local:

- Frontend con React servido por Vite; el servidor de desarrollo está configurado en el puerto `5173`.
- Backend con Express ejecutado mediante Node.js; la URL y el puerto se controlan mediante variables de entorno.
- Acceso a PostgreSQL mediante Prisma. La documentación principal indica Neon para el desarrollo actual.
- Variables separadas para URL de ejecución, URL directa de migraciones, secretos JWT, origen CORS, OAuth y configuración pública de archivos.

Los valores reales y secretos no forman parte de este plan. Se utilizarán los archivos `.env.example` como referencia y archivos `.env` locales no versionados. No se ha confirmado un ambiente público desplegado.

## 10. Datos de prueba

Se prepararán datos sintéticos, aislados y restaurables:

- cuentas `ADMIN`, incluido un escenario controlado de administrador principal;
- cuentas `BODEGUERO` con permisos base, revocados y concedidos;
- cuentas `CLIENTE` activas e inactivas;
- productos activos e inactivos, con y sin proveedor;
- productos sin stock, con stock exacto y con existencias suficientes;
- productos con distintas tallas disponibles;
- proveedores activos e inactivos;
- pedidos a proveedores en `BORRADOR`, `ENVIADA`, `CONFIRMADA` y `CANCELADA`;
- ventas en `PENDIENTE`, `PAGADO`, `ENVIADO` y `CANCELADO`;
- pedidos preparados, en tránsito, entregados y con incidencia;
- cantidades límite: 0 cuando el flujo lo admita, 1, stock exacto, stock + 1 y máximos aceptados por el esquema.

No se usarán credenciales ni datos personales reales.

## 11. Criterios de entrada

- Ambiente local disponible y configuración de variables validada.
- Dependencias instaladas.
- Migraciones aplicadas sobre una base destinada a desarrollo o QA.
- Datos mínimos sintéticos cargados y cuentas de prueba preparadas.
- Backend y frontend ejecutables.
- Build del frontend exitoso para la versión candidata.
- Endpoints de salud y funcionales disponibles.
- Alcance, riesgos y versión bajo prueba identificados.

## 12. Criterios de salida

- 100 % de los casos críticos planificados ejecutados.
- 100 % de los casos críticos de regresión aprobados.
- Ningún defecto crítico abierto.
- Defectos de severidad alta corregidos, aceptados expresamente o con mitigación documentada.
- Resultados, ambiente, versión y datos de prueba documentados.
- Evidencias de los flujos críticos almacenadas.
- Riesgos residuales y casos bloqueados comunicados.

Estos criterios son objetivos para una ejecución futura y no representan resultados actuales.

## 13. Criterios de suspensión y reanudación

Se suspenderá total o parcialmente la ejecución cuando:

- el ambiente o un servicio esencial no esté disponible;
- se pierda la conexión con PostgreSQL de forma sostenida;
- el build no sea ejecutable;
- exista un error bloqueante que impida continuar una ruta crítica;
- los datos de prueba estén corruptos o no permitan resultados confiables;
- se detecten efectos sobre datos fuera del ambiente autorizado.

La ejecución se reanudará cuando se restaure el servicio, se disponga de un build utilizable, se corrija o aísle el bloqueo y se restablezcan datos de prueba conocidos. Los casos afectados deberán reiniciarse desde una precondición válida.

## 14. Severidad

| Severidad | Definición | Ejemplo en D’oro |
|---|---|---|
| Crítica | Pérdida de integridad o indisponibilidad de una función esencial sin alternativa. | Una venta descuenta stock varias veces o permite existencias negativas. |
| Alta | Falla importante de un flujo principal o acceso indebido con impacto relevante. | Un cliente consulta ventas ajenas o un bodeguero accede a administración protegida. |
| Media | Función afectada con alternativa o impacto acotado. | Un filtro de recepciones muestra un periodo incorrecto, pero la consulta principal funciona. |
| Baja | Problema cosmético, de texto o usabilidad menor sin afectar el resultado. | Etiqueta desalineada o mensaje con redacción inconsistente. |

## 15. Prioridad

| Prioridad | Criterio |
|---|---|
| P1 | Corrección inmediata; bloquea operación, validación o entrega. |
| P2 | Corrección en la iteración actual por impacto relevante o alta frecuencia. |
| P3 | Corrección planificada en una iteración próxima. |
| P4 | Mejora menor que puede programarse cuando exista capacidad. |

La **severidad** mide el impacto técnico o de negocio del defecto; la **prioridad** determina cuándo conviene corregirlo. Un problema visual frecuente puede tener severidad baja y prioridad alta, mientras que un caso grave pero inaccesible en el ambiente actual podría evaluarse con otra prioridad.

## 16. Estrategia de regresión

La regresión mínima incluirá:

1. Login correcto e incorrecto para `CLIENTE` y personal interno; expiración y separación de sesiones.
2. Acceso permitido y denegado a páginas y endpoints según cuenta, rol y permiso.
3. Alta o edición de producto, estado activo y existencias por talla.
4. Consulta y ajuste de inventario con registro de movimiento.
5. Checkout, pago simulado, descuento de stock y cancelación con reposición.
6. Pedido a proveedor desde borrador hasta enviado; recepción parcial/completa y aumento de stock.
7. Listado y despacho de un pedido pagado, generación de guía y cambio de seguimiento.

Se ejecutará después de cambios en autenticación, permisos, modelos Prisma, ventas, inventario, recepciones o preparación de pedidos, y antes de cerrar una versión candidata.

## 17. Entregables

- Casos de prueba manuales.
- Evidencias de ejecución.
- Reportes de defectos.
- Colecciones y resultados de pruebas de API.
- Consultas SQL de validación.
- Automatización de regresión.
- Reportes de ejecución.
- Matriz de trazabilidad.

Estos entregables están planificados; en la fase actual solo se crean el README de QA y este plan.

## 18. Responsabilidades

Al ser un proyecto individual, la autora desempeña las funciones de analista QA, tester manual, responsable de automatización y desarrolladora encargada de las correcciones.

La falta de independencia entre desarrollo y pruebas aumenta el riesgo de sesgo y de repetir los mismos supuestos usados durante la implementación. Se mitigará con pruebas basadas en riesgos, criterios explícitos, revisión contra código y datos, sesiones exploratorias estructuradas y, cuando sea posible, revisión externa.

## 19. Supuestos y dependencias

- PostgreSQL está disponible y contiene el esquema esperado.
- Las variables de entorno están configuradas correctamente y no exponen secretos.
- Existen datos sintéticos suficientes para cada estado y rol.
- Los servicios externos configurados, como OAuth o carga de archivos, están disponibles cuando su escenario se incluya.
- El navegador utilizado es compatible con React, almacenamiento local y APIs web empleadas.
- Las migraciones corresponden a la versión bajo prueba.
- La fecha y zona horaria del ambiente son correctas para filtros e historial.

## 20. Riesgos del proceso de pruebas

- Sesgo por ser la misma persona autora y tester del sistema.
- Falta de usuarios reales para validar expectativas y usabilidad.
- Cobertura inicial limitada de navegadores y tamaños de pantalla.
- Dependencia de datos sintéticos que pueden no representar todas las combinaciones reales.
- Automatización aún incompleta y ausencia inicial de una suite end-to-end.
- Posibles diferencias entre el ambiente local y un futuro despliegue.
- Riesgo de desalineación temporal entre cambios de interfaz y pruebas automatizadas; se mitigará revisando las expectativas de navegación y regresión después de cambios estructurales.

## 21. Aprobación del plan

| Campo | Valor |
|---|---|
| Responsable | Elvia Gutierrez Garcia |
| Fecha | 4 de agosto de 2026 |
| Estado | Versión inicial aprobada |
| Observaciones | Documento sujeto a actualización conforme avancen el diseño y la ejecución de pruebas. |

## Reglas confirmadas y puntos pendientes

Las siguientes reglas se verificaron en el código y orientarán el diseño posterior:

- El inventario se almacena por talla; técnicamente, cada talla se representa mediante una entidad `ProductVariant`.
- Una venta pasa de `PENDIENTE` a `PAGADO` o `CANCELADO`; una venta en estado `PAGADO` puede cancelarse; `ENVIADO` y `CANCELADO` no admiten nuevas transiciones en el servicio de ventas.
- Pagar descuenta stock de forma condicional y registra una `SALIDA`; cancelar una venta pagada repone stock y registra una `ENTRADA`.
- Los pedidos a proveedores usan `BORRADOR`, `ENVIADA`, `CONFIRMADA` y `CANCELADA`. Solo una recepción `ENVIADA` puede confirmarse, y la confirmación incrementa stock y registra entradas dentro de una transacción.
- La vista operativa de recepciones excluye borradores. El frontend limita a diez días el historial confirmado o cancelado del `BODEGUERO`, mientras los pendientes no tienen ese filtro. La aplicación del límite en el backend está **pendiente de confirmar** porque el servicio no realiza ese filtrado por rol.
- Los pedidos de clientes pagados se preparan y pasan a `ENVIADO`, con estado de preparación `PREPARADO`, guía y seguimiento simulado.
- La protección ante dos despachos simultáneos está pendiente de confirmar; debe verificarse que solo una solicitud pueda cambiar el pedido de `PAGADO` a `ENVIADO`.
- Los roles internos utilizados por Personal son fijos (`ADMIN` y `BODEGUERO`); los permisos individuales del bodeguero se gestionan desde Personal. No se considera vigente una pantalla separada para crear roles o permisos.
