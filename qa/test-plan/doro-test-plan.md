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
- Separación del almacenamiento y uso de tokens de `CLIENTE` y personal interno. `CLIENTE` corresponde a una sesión y entidad separada de las cuentas internas.
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

- Consulta y ajuste de inventario por talla. El stock persistente se encuentra en `ProductVariant.stock`; el stock agregado del producto se calcula sumando variantes.
- Mínimos, ideales y máximos definidos en `Product`.
- Ajuste manual como operación que genera `ENTRADA` al incrementar o `SALIDA` al disminuir. `AJUSTE` no es un tipo de movimiento persistido actual.
- Preparación y despacho de pedidos pagados.
- Seguimiento simulado del envío.
- Recepción de mercancía, cantidades recibidas, costos y factura.

### Abastecimiento

- Identificación de productos y tallas cuyo stock alcanza el mínimo o queda por debajo de él.
- Cálculo sugerido de reposición hacia el stock ideal.
- Generación de borradores y envío de pedidos a proveedores.
- Consulta de pedidos a proveedores por estado.

### Administración y control

- Personal con roles internos fijos `ADMIN` y `BODEGUERO`.
- Permisos individuales del bodeguero gestionados desde Personal.
- Ausencia de una página independiente de Configuración, Roles o Permisos en la navegación vigente.
- Catálogo técnico de permisos administrable mediante endpoints protegidos exclusivamente para el administrador principal.
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
- Validación formal del despliegue público; `TR-SI-001` se ejecutó en ambiente local y no certifica el entorno publicado.

## 6. Enfoque basado en riesgos

Escala: probabilidad e impacto se califican como baja, media o alta. El nivel combina ambos valores y orienta el orden de ejecución.

| ID | Riesgo | Módulo | Probabilidad | Impacto | Nivel | Respuesta de prueba |
|---|---|---|---|---|---|---|
| R-01 | Stock inconsistente entre producto, talla y movimiento de inventario | Inventario | Media | Alta | Alto | Comparar el estado previo y posterior, así como el movimiento persistido por talla. |
| R-02 | Dos confirmaciones concurrentes podrían incrementar el stock más de una vez porque no existe una actualización condicional confirmada por `id + estado` | Recepciones | Media | Alta | Alto | Ejecutar confirmaciones secuenciales y simultáneas; verificar una sola transición, movimientos y cantidades finales. No clasificar el riesgo como defecto sin reproducirlo. |
| R-03 | Un pago con stock insuficiente o cero, o un segundo pago secuencial sobre una venta ya procesada, podría comprometer la consistencia entre `Sale`, `ProductVariant` e `InventoryMovement` | Ventas | Alta | Alta | Crítico | Probar stock cero, inferior, exacto y suficiente; repetir el pago secuencialmente y contrastar estado, movimientos y stock final. |
| R-04 | Dos cancelaciones concurrentes podrían reponer stock más de una vez porque no existe compare-and-set sobre `Sale.estado` | Ventas e inventario | Media | Alta | Alto | Validar repetición secuencial y simultánea, stock final y movimientos de entrada. No declarar duplicidad sin ejecución reproducible. |
| R-05 | Un usuario accede a páginas o endpoints sin permiso | Autorización | Media | Alta | Alto | Crear una matriz de rol, permiso y recurso, y probar la interfaz y la API directamente. |
| R-06 | Una sesión de `CLIENTE` se utiliza como sesión de personal interno o viceversa | Autenticación | Media | Alta | Alto | Intercambiar tokens, rutas y sesiones simultáneas; esperar 401/403 controlados. |
| R-07 | Se modifica, desactiva o elimina una cuenta protegida | Personal | Baja | Alta | Alto | Probar administrador principal, cuenta propia, administrador secundario e historial relacionado. |
| R-08 | Dos operadores podrían despachar simultáneamente el mismo pedido y generar más de una guía o conjunto de eventos; no existe lock ni condición atómica confirmada sobre el estado | Preparación | Media | Alta | Alto | Ejecutar despachos simultáneos y contrastar estado, guía, eventos y auditoría; conservar el resultado como riesgo hasta reproducirlo formalmente. |
| R-09 | Se pierde información al cerrar un formulario sin guardar | Productos, personal, pedidos | Media | Media | Medio | Explorar cierre por botón, fondo, Escape, navegación y recarga con cambios pendientes. |
| R-10 | Se acepta una transición de estado no permitida | Ventas y recepciones | Media | Alta | Alto | Probar cada transición válida e inválida mediante API. |
| R-11 | Importes, costos, envío o cantidades se calculan incorrectamente | Checkout, ventas y abastecimiento | Media | Alta | Alto | Usar valores límite, decimales y cálculos independientes. |
| R-12 | Diferencia entre el filtro frontend de diez días para el bodeguero y el contrato backend, que puede devolver registros antiguos | Recepciones | Media | Media | Medio | Comparar la presentación de `CONFIRMADA`/`CANCELADA` con consultas directas; documentar la diferencia sin clasificarla automáticamente como vulnerabilidad o defecto. |
| R-13 | Un pedido a proveedor podría enviarse mediante API sin `supplierId`, aunque la interfaz exige proveedor antes de crear y enviar | Abastecimiento | Media | Alta | Alto | Crear un borrador sin proveedor y probar por separado interfaz y API de envío; verificar contrato, persistencia y trazabilidad sin asumir la regla pendiente. |
| R-14 | Dos solicitudes de pago simultáneas sobre la misma venta `PENDIENTE` podrían competir antes de que la transición de estado quede persistida | Ventas / Pago | Media | Alta | Alto | Ejecutar dos pagos simultáneos sobre la misma venta y verificar las respuestas, el estado final, el stock final, la ausencia de stock negativo, el número de `SALIDA` y la ausencia de descuento duplicado. Mantenerlo como riesgo hasta una ejecución reproducible. |

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

### Automatización existente

La ejecución actual confirma 60 pruebas automatizadas de backend y 19 de frontend, 79 en total. Cubren principalmente servicios, autorización, contratos y regresión estructural. Estas suites no levantan una API completa con PostgreSQL real, no usan un navegador real y no contienen cobertura end-to-end ni Playwright.

La automatización existente complementa, pero no sustituye, las pruebas manuales, las pruebas de API en un entorno real, la validación de base de datos, las pruebas de concurrencia ni los recorridos end-to-end.

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

Los valores reales y secretos no forman parte de este plan. Se utilizarán los archivos `.env.example` como referencia y archivos `.env` locales no versionados. La ejecución `TR-SI-001` documenta únicamente el ambiente local; la existencia de un despliegue público no equivale a una validación formal de ese entorno.

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
6. Pedido a proveedor desde borrador hasta enviado; recepción con cantidades completas o menores, cierre en `CONFIRMADA` y aumento de stock por cantidades efectivamente recibidas.
7. Listado y despacho de un pedido pagado, generación de guía y cambio de seguimiento.

Se ejecutará después de cambios en autenticación, permisos, modelos Prisma, ventas, inventario, recepciones o preparación de pedidos, y antes de cerrar una versión candidata.

## 17. Entregables

Entregables existentes y versionados:

- catálogo de reglas de negocio y matriz de trazabilidad;
- casos manuales de Ventas e inventario;
- ejecución `TR-SI-001` y resumen ejecutivo;
- evidencias de API, estado e inventario para la ejecución;
- reporte de defecto `BUG-AUTH-001`;
- análisis de riesgos;
- pruebas automatizadas de regresión en `backend/test/` y `frontend/test/`;
- consultas de validación incluidas dentro del registro de ejecución.

No se confirmó una colección de API exportada, un reporte separado de cobertura automatizada ni una suite formal de concurrencia. Esos elementos no deben presentarse como entregables actuales.

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

## Reglas confirmadas

Las siguientes reglas se verificaron en el código y orientarán el diseño posterior:

- El inventario se almacena por talla en `ProductVariant.stock`; `stockMinimo`, `stockIdeal` y `stockMaximo` pertenecen a `Product`, y el stock agregado se calcula sumando variantes.
- Una venta pasa de `PENDIENTE` a `PAGADO` o `CANCELADO`; una venta en estado `PAGADO` puede cancelarse; `ENVIADO` y `CANCELADO` no admiten nuevas transiciones en el servicio de ventas.
- El ajuste manual genera `ENTRADA` al incrementar y `SALIDA` al disminuir; `AJUSTE` no es un tipo persistido actual.
- Pagar descuenta stock con una condición de cantidad suficiente y registra una `SALIDA`; cancelar una venta pagada repone stock y registra una `ENTRADA`. La operación multiartículo se ejecuta dentro de una transacción.
- Un pago secuencial repetido y una cancelación secuencial repetida son rechazados. El riesgo independiente de dos pagos simultáneos se registra como `R-14` y permanece pendiente de ejecución formal; no se presenta como defecto. Las cancelaciones simultáneas también permanecen como riesgo pendiente dentro de `R-04`.
- Las ventas o pedidos de clientes usan `PENDIENTE`, `PAGADO`, `ENVIADO` y `CANCELADO`. `ENVIADO` pertenece a `Sale`.
- Los pedidos a proveedores y recepciones comparten `Reception`, diferenciada para reabastecimiento mediante su origen, y usan `BORRADOR`, `ENVIADA`, `CONFIRMADA` y `CANCELADA`. `RECIBIDO` puede aparecer como etiqueta de interfaz, pero no es un estado técnico persistido de `Reception`.
- Solo una recepción `ENVIADA` puede confirmarse secuencialmente. La confirmación incrementa stock, registra entradas y cambia a `CONFIRMADA` dentro de una transacción; la actualización final no usa una condición atómica por `id + estado`, por lo que la confirmación simultánea debe probarse.
- Una recepción parcial admite cantidades menores, registra faltantes y movimientos solo por cantidades mayores que cero, y cierra definitivamente en `CONFIRMADA`. No permite exceder lo solicitado ni completar faltantes mediante una recepción posterior enlazada al mismo pedido.
- La vista operativa excluye borradores. El filtro de diez días está implementado solo en `Recepciones.jsx`, usa el reloj local del navegador y se aplica al `BODEGUERO` para `CONFIRMADA` y `CANCELADA`, no para `ENVIADA`. El backend no impone el límite por rol y una consulta directa puede devolver registros antiguos.
- Los pedidos pagados se preparan y pasan a `ENVIADO`, con preparación `PREPARADO`, guía y seguimiento simulado. Dos operadores pueden abrir el mismo pedido; no existe lock. El despacho secuencial posterior se rechaza, pero la actualización final no condiciona atómicamente el estado y el despacho simultáneo debe verificarse.
- Un borrador de pedido a proveedor puede existir sin proveedor. La interfaz exige proveedor antes de crear y enviar, pero el servicio backend de envío no valida actualmente `supplierId`.
- Los roles internos son fijos (`ADMIN` y `BODEGUERO`), `CLIENTE` usa una entidad y sesión separada, y los permisos individuales del bodeguero se gestionan desde Personal. No existe una página independiente de Configuración, Roles o Permisos; el catálogo técnico de permisos conserva una API protegida para el administrador principal.

## Decisiones funcionales pendientes

1. Para `R-14`, respuesta contractual ante una segunda operación de pago concurrente: `409`, `400` o resultado idempotente.
2. Garantía de exclusividad de despacho mediante transición atómica, sin determinar todavía si existirá reserva al abrir.
3. Si la recepción parcial debe continuar cerrando definitivamente o admitir entregas posteriores.
4. Si la ventana de diez días es solo presentación o una restricción de acceso.
5. Si un pedido puede enviarse sin proveedor mediante API.
6. Si el catálogo de permisos debe seguir administrable solo mediante API.
7. Si `AJUSTE` debe permanecer como concepto de operación o convertirse algún día en tipo persistido.
