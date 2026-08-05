# Casos de prueba manuales — Ventas e inventario

## Identificación de la suite

| Campo | Valor |
|---|---|
| Proyecto | D’oro Fashion System |
| Suite | Ventas e inventario |
| Alcance | Creación, pago simulado, cancelación, autorización, stock por variante y movimientos |
| Tipo de ejecución | Manual |
| Estado de la suite | Diseñada; pendiente de ejecución |
| Total de casos | 16 |

## Base técnica confirmada

- `backend/src/modules/ventas/ventas.routes.js`: expone `POST /api/ventas` y `POST /api/ventas/:id/simulate-payment` para cuentas `CLIENT`, y `PATCH /api/ventas/:id/estado` para cuentas `STAFF` con `ventas:update`.
- `backend/src/modules/ventas/ventas.service.js`: `create`, `simulatePayment`, `updateEstado` y `buildTrustedItems` implementan propiedad del pedido, estados, validación de existencias y efectos transaccionales.
- `backend/src/modules/ventas/ventas.schema.js`: acepta los estados técnicos `PENDIENTE`, `PAGADO`, `ENVIADO` y `CANCELADO`, y los métodos simulados `tarjeta` y `oxxo`.
- `backend/prisma/schema.prisma`: el stock se persiste en `ProductVariant.stock`; `SaleItem` conserva producto, talla y cantidad; `InventoryMovement` conserva producto, tipo, cantidad, motivo y fecha.
- `backend/test/ventas.simulate-payment.service.test.js`: cubre a nivel de servicio el pago del cliente propietario y los rechazos para cliente ajeno, cuenta STAFF, venta inexistente y venta ya procesada.

`InventoryMovement` no persiste directamente la talla, el stock anterior, el stock nuevo ni el usuario responsable. La talla aparece actualmente dentro de `motivo`; las demás verificaciones deben obtenerse comparando el estado previo y posterior o, cuando corresponda, mediante auditoría separada.

## Datos de prueba

Los identificadores siguientes son descriptivos. Sus IDs, cantidades, tokens y fechas reales deberán obtenerse o prepararse en el ambiente autorizado antes de ejecutar cada caso.

| Identificador | Condición requerida |
|---|---|
| `CLIENTE_A` | Cuenta `CLIENT` activa, con rol efectivo `CLIENTE`, correo conocido y datos válidos de checkout. |
| `CLIENTE_B` | Cuenta `CLIENT` activa diferente de `CLIENTE_A`; no es propietaria de las ventas de `CLIENTE_A`. |
| `STAFF_VENTAS` | Cuenta `STAFF` activa, rol `ADMIN` o `BODEGUERO`, con permiso efectivo `ventas:update`. |
| `PRODUCTO_A` | Producto activo, con precio de venta conocido y variantes disponibles para las tallas utilizadas. |
| `PRODUCTO_B` | Segundo producto activo, distinto de `PRODUCTO_A`, para escenarios multiartículo. |
| `VARIANTE_A_M` | Variante de `PRODUCTO_A` cuya talla es `M` y cuyo stock inicial conocido es mayor que la cantidad solicitada. |
| `VARIANTE_A_EXACTA` | Variante de `PRODUCTO_A` cuyo stock inicial conocido es exactamente igual a la cantidad solicitada. |
| `VARIANTE_A_INSUFICIENTE` | Variante que tenía stock suficiente al crear la venta, pero cuyo stock antes del pago es menor que la cantidad de la venta y mayor que cero. |
| `VARIANTE_A_CERO` | Variante que tenía stock suficiente al crear la venta, pero cuyo stock antes del pago es cero. |
| `VARIANTE_B_DISPONIBLE` | Variante de `PRODUCTO_B` con stock suficiente para el escenario multiartículo. |
| `VENTA_PENDIENTE_A` | Venta propia de `CLIENTE_A`, método `tarjeta` u `oxxo`, estado `PENDIENTE`. |
| `VENTA_PAGADA_A` | Venta propia de `CLIENTE_A`, estado `PAGADO`, con stock ya descontado y movimientos de salida identificables. |
| `VENTA_CANCELADA_A` | Venta propia de `CLIENTE_A`, estado `CANCELADO`. |
| `VENTA_ENVIADA_A` | Venta propia de `CLIENTE_A`, estado `ENVIADO`. |
| `MOTIVO_CANCELACION_VALIDO` | Texto sintético de entre 5 y 300 caracteres, sin datos personales. |

Cada caso debe ejecutarse con datos aislados o restaurados a una línea base conocida. No se deben reutilizar existencias alteradas por otro caso sin registrar primero su nuevo estado.

---

## TC-SI-001

**ID:** TC-SI-001<br>
**Módulo:** Ventas / Inventario<br>
**Título:** Crear una venta válida sin descontar inventario<br>
**Objetivo:** Confirmar que el checkout registra la venta en `PENDIENTE` y no modifica existencias ni movimientos.<br>
**Requisito o riesgo relacionado:** R-01, R-03; una venta se crea `PENDIENTE` y el stock se descuenta al pagar.<br>
**Prioridad de ejecución:** P2<br>
**Tipo de prueba:** Smoke, Functional Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `CLIENTE_A` (`accountType: CLIENT`, rol `CLIENTE`)<br>
**Precondiciones:** `CLIENTE_A` autenticado; `PRODUCTO_A` activo; `VARIANTE_A_M` disponible; stock inicial y cantidad de movimientos registrados.<br>
**Datos de prueba:** `CLIENTE_A`, `PRODUCTO_A`, `VARIANTE_A_M`; dirección válida; método `tarjeta` u `oxxo`; cantidad permitida.<br>
**Pasos:**

1. Registrar el estado inicial de `ProductVariant.stock` y la cantidad de movimientos de `PRODUCTO_A`.
2. Enviar la creación mediante `POST /api/ventas` con el token de `CLIENTE_A` y los datos descriptivos preparados.
3. Revisar la respuesta y consultar la venta creada.
4. Consultar `Sale`, sus `SaleItem`, `ProductVariant` e `InventoryMovement` relacionados.

**Resultado esperado:** La API responde `201` con `Venta registrada correctamente`; se crea una sola `Sale` propia de `CLIENTE_A` en `PENDIENTE`, con sus artículos, talla y cantidad. `ProductVariant.stock` conserva el valor inicial y no se crean movimientos `ENTRADA` ni `SALIDA` por la creación.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Alta<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** El precio se toma del catálogo mediante `buildTrustedItems`; no debe utilizarse como fuente confiable un precio enviado por el cliente.

---

## TC-SI-002

**ID:** TC-SI-002<br>
**Módulo:** Ventas / Inventario<br>
**Título:** Pagar una venta con stock suficiente y descontar la variante correcta<br>
**Objetivo:** Validar la transición a `PAGADO` y el descuento exclusivo de la talla comprada.<br>
**Requisito o riesgo relacionado:** R-01, R-03; pago con existencias suficientes y consistencia por variante.<br>
**Prioridad de ejecución:** P1<br>
**Tipo de prueba:** Functional Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `CLIENTE_A`, propietario de `VENTA_PENDIENTE_A`<br>
**Precondiciones:** Venta de un artículo en `PENDIENTE`; `VARIANTE_A_M.stock` mayor que la cantidad; stock de otras tallas y movimientos iniciales registrados.<br>
**Datos de prueba:** `VENTA_PENDIENTE_A`, `VARIANTE_A_M`, cantidad de la venta.<br>
**Pasos:**

1. Registrar `Sale.estado`, stock de `VARIANTE_A_M`, stock de las demás tallas y movimientos existentes.
2. Enviar `POST /api/ventas/:id/simulate-payment` con el token de `CLIENTE_A`.
3. Revisar la respuesta y volver a consultar la venta.
4. Consultar la variante comprada, las demás variantes y los movimientos del producto.

**Resultado esperado:** La API responde `200` con `Pago simulado confirmado correctamente`; `Sale.estado` queda `PAGADO`; `VARIANTE_A_M.stock` disminuye exactamente la cantidad comprada; las demás tallas no cambian; se registra el movimiento `SALIDA` correspondiente.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Crítica<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** La talla se valida en `SaleItem.talla` y en la variante; `InventoryMovement` solo la refleja dentro de `motivo`.

---

## TC-SI-003

**ID:** TC-SI-003<br>
**Módulo:** Ventas / Inventario<br>
**Título:** Pagar con stock exacto sin producir existencias negativas<br>
**Objetivo:** Validar el límite inferior permitido cuando el stock coincide con la cantidad solicitada.<br>
**Requisito o riesgo relacionado:** R-03; prevención de stock negativo y límite de disponibilidad.<br>
**Prioridad de ejecución:** P1<br>
**Tipo de prueba:** Functional Testing, Boundary Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `CLIENTE_A`, propietario de la venta<br>
**Precondiciones:** Venta `PENDIENTE` asociada a `VARIANTE_A_EXACTA`; stock inicial igual a la cantidad del artículo.<br>
**Datos de prueba:** `VARIANTE_A_EXACTA`, venta pendiente y cantidad coincidente con su stock.<br>
**Pasos:**

1. Confirmar que el stock inicial es exactamente igual a la cantidad de `SaleItem`.
2. Registrar estado y movimientos iniciales.
3. Confirmar el pago simulado como `CLIENTE_A`.
4. Consultar venta, variante y movimientos persistidos.

**Resultado esperado:** El pago responde `200`; `Sale.estado` queda `PAGADO`; `ProductVariant.stock` queda exactamente en `0`, nunca negativo; se crea una `SALIDA` por la cantidad completa.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Crítica<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** La condición implementada para descontar es `stock >= cantidad`.

---

## TC-SI-004

**ID:** TC-SI-004<br>
**Módulo:** Ventas / Inventario<br>
**Título:** Rechazar el pago con stock insuficiente y revertir todos los efectos<br>
**Objetivo:** Confirmar que una pérdida de disponibilidad posterior a la creación no deja cambios parciales.<br>
**Requisito o riesgo relacionado:** R-01, R-03; venta sin existencias suficientes y atomicidad del pago.<br>
**Prioridad de ejecución:** P1<br>
**Tipo de prueba:** Negative Testing, Boundary Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `CLIENTE_A`, propietario de la venta<br>
**Precondiciones:** Venta creada cuando había stock; antes del pago, `VARIANTE_A_INSUFICIENTE.stock` es menor que `SaleItem.cantidad` y mayor que cero.<br>
**Datos de prueba:** Venta pendiente asociada a `VARIANTE_A_INSUFICIENTE`; valores iniciales conocidos.<br>
**Pasos:**

1. Registrar estado, stock insuficiente y número de movimientos.
2. Intentar el pago mediante `POST /api/ventas/:id/simulate-payment` como propietario.
3. Registrar código, cuerpo y mensaje de error.
4. Consultar nuevamente venta, variante y movimientos.

**Resultado esperado:** La API responde `409` con un mensaje que identifica stock insuficiente para producto y talla; `Sale.estado` permanece `PENDIENTE`; el stock no cambia; no se crea ningún movimiento y no queda ningún efecto parcial de la transacción.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Crítica<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** La condición se aplica mediante `productVariant.updateMany` dentro de `prisma.$transaction`.

---

## TC-SI-005

**ID:** TC-SI-005<br>
**Módulo:** Ventas / Inventario<br>
**Título:** Rechazar el pago cuando la variante tiene stock cero<br>
**Objetivo:** Validar el límite de stock cero sin cambio de estado, inventario ni movimientos.<br>
**Requisito o riesgo relacionado:** R-03; venta sin existencias y prevención de valores negativos.<br>
**Prioridad de ejecución:** P1<br>
**Tipo de prueba:** Negative Testing, Boundary Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `CLIENTE_A`, propietario de la venta<br>
**Precondiciones:** Venta creada con disponibilidad previa; `VARIANTE_A_CERO.stock` es `0` antes del pago.<br>
**Datos de prueba:** Venta pendiente asociada a `VARIANTE_A_CERO`.<br>
**Pasos:**

1. Confirmar y registrar stock cero, estado y movimientos iniciales.
2. Intentar confirmar el pago simulado como propietario.
3. Revisar la respuesta.
4. Consultar persistencia después del rechazo.

**Resultado esperado:** La API responde `409` por stock insuficiente; la venta permanece `PENDIENTE`; el stock sigue en `0`; no se crea `SALIDA` y no existe stock negativo.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Crítica<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** El caso requiere que la venta exista antes de dejar la variante en cero, porque la creación también valida disponibilidad.

---

## TC-SI-006

**ID:** TC-SI-006<br>
**Módulo:** Ventas / Inventario<br>
**Título:** Rechazar un segundo pago secuencial sin descontar stock nuevamente<br>
**Objetivo:** Validar la protección secuencial de una venta ya procesada.<br>
**Requisito o riesgo relacionado:** R-03; descuento duplicado y transición inválida.<br>
**Prioridad de ejecución:** P1<br>
**Tipo de prueba:** Negative Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `CLIENTE_A`, propietario de `VENTA_PAGADA_A`<br>
**Precondiciones:** Un primer pago aprobado; estado `PAGADO`, stock posterior y movimientos registrados.<br>
**Datos de prueba:** `VENTA_PAGADA_A`, token de `CLIENTE_A`.<br>
**Pasos:**

1. Registrar el estado posterior al primer pago, el stock y el número de movimientos `SALIDA`.
2. Repetir secuencialmente `POST /api/ventas/:id/simulate-payment` con el mismo cliente.
3. Revisar la respuesta de la segunda solicitud.
4. Volver a consultar estado, stock y movimientos.

**Resultado esperado:** La segunda solicitud responde `400` con un mensaje que indique que el pedido ya fue procesado; la venta continúa `PAGADO`; el stock no vuelve a disminuir y no se crea otra `SALIDA`.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Crítica<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** Este caso es secuencial; no cubre dos solicitudes simultáneas.

---

## TC-SI-007

**ID:** TC-SI-007<br>
**Módulo:** Inventario / Movimientos<br>
**Título:** Crear un único movimiento SALIDA para un artículo pagado<br>
**Objetivo:** Verificar cantidad, producto, tipo y trazabilidad persistida del movimiento de venta.<br>
**Requisito o riesgo relacionado:** R-01, R-11; consistencia entre artículo, cantidad y movimiento.<br>
**Prioridad de ejecución:** P2<br>
**Tipo de prueba:** Functional Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `CLIENTE_A`, propietario de la venta<br>
**Precondiciones:** Venta `PENDIENTE` con un solo `SaleItem`; stock suficiente; cantidad previa de movimientos conocida.<br>
**Datos de prueba:** `PRODUCTO_A`, `VARIANTE_A_M`, venta de un artículo.<br>
**Pasos:**

1. Registrar los movimientos existentes del producto.
2. Pagar la venta como propietario.
3. Consultar los movimientos persistidos después del pago.
4. Comparar tipo, cantidad, producto y motivo con la venta y su artículo.

**Resultado esperado:** Se agrega exactamente un `InventoryMovement` con `tipo = SALIDA`, `productId` del artículo, `cantidad` igual a `SaleItem.cantidad` y un `motivo` que contiene el número de pedido y la talla. No se crea una `ENTRADA`.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Alta<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** No buscar campos de talla, stock anterior, stock nuevo o responsable dentro de `InventoryMovement`, porque el modelo no los contiene.

---

## TC-SI-008

**ID:** TC-SI-008<br>
**Módulo:** Ventas / Inventario<br>
**Título:** Cancelar una venta pendiente sin alterar inventario<br>
**Objetivo:** Validar la transición `PENDIENTE` → `CANCELADO` sin reposición ni movimiento.<br>
**Requisito o riesgo relacionado:** R-01, R-10; transición válida sin efectos de inventario previos.<br>
**Prioridad de ejecución:** P2<br>
**Tipo de prueba:** Functional Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `STAFF_VENTAS`<br>
**Precondiciones:** Venta `PENDIENTE`; sesión STAFF con `ventas:update`; motivo válido; stock y movimientos iniciales registrados.<br>
**Datos de prueba:** `VENTA_PENDIENTE_A`, `STAFF_VENTAS`, `MOTIVO_CANCELACION_VALIDO`.<br>
**Pasos:**

1. Registrar estado, stock y movimientos.
2. Enviar `PATCH /api/ventas/:id/estado` con `estado: CANCELADO` y motivo válido.
3. Revisar la respuesta.
4. Consultar venta, variantes y movimientos.

**Resultado esperado:** La API responde `200` con `Estado de la venta actualizado correctamente`; `Sale.estado` queda `CANCELADO` y se conserva el motivo; el stock no cambia y no se crea movimiento de inventario.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Alta<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** El endpoint de cancelación es interno; una cuenta cliente no está autorizada para esta ruta.

---

## TC-SI-009

**ID:** TC-SI-009<br>
**Módulo:** Ventas / Inventario<br>
**Título:** Cancelar una venta pagada y reponer el stock de su variante<br>
**Objetivo:** Confirmar la reposición exacta al ejecutar `PAGADO` → `CANCELADO`.<br>
**Requisito o riesgo relacionado:** R-01, R-04; reposición de existencias tras cancelación.<br>
**Prioridad de ejecución:** P1<br>
**Tipo de prueba:** Functional Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `STAFF_VENTAS`<br>
**Precondiciones:** `VENTA_PAGADA_A`; descuento previo confirmado; sesión con `ventas:update`; motivo válido.<br>
**Datos de prueba:** `VENTA_PAGADA_A`, `STAFF_VENTAS`, `MOTIVO_CANCELACION_VALIDO`.<br>
**Pasos:**

1. Registrar stock original previo al pago, stock posterior al pago y movimientos.
2. Cancelar la venta mediante el endpoint interno de estado.
3. Revisar la respuesta.
4. Consultar venta, variante y movimientos posteriores.

**Resultado esperado:** La respuesta es `200`; `Sale.estado` queda `CANCELADO`; el stock aumenta exactamente en `SaleItem.cantidad` y vuelve al valor previo al pago si no hubo otros cambios; se crea la `ENTRADA` correspondiente.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Crítica<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** Estado, reposición y movimiento se ejecutan dentro de una transacción Prisma.

---

## TC-SI-010

**ID:** TC-SI-010<br>
**Módulo:** Inventario / Movimientos<br>
**Título:** Crear un único movimiento ENTRADA al cancelar una venta pagada<br>
**Objetivo:** Verificar la trazabilidad persistida de la reposición.<br>
**Requisito o riesgo relacionado:** R-01, R-04, R-11; cantidad y tipo correctos en la reposición.<br>
**Prioridad de ejecución:** P2<br>
**Tipo de prueba:** Functional Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `STAFF_VENTAS`<br>
**Precondiciones:** Venta pagada de un artículo; existe una `SALIDA` del pago; movimientos previos identificados.<br>
**Datos de prueba:** `VENTA_PAGADA_A`, `PRODUCTO_A`, `MOTIVO_CANCELACION_VALIDO`.<br>
**Pasos:**

1. Registrar los movimientos antes de cancelar.
2. Cancelar la venta pagada como STAFF autorizado.
3. Consultar los movimientos del producto.
4. Comparar el nuevo movimiento con el artículo vendido.

**Resultado esperado:** Se agrega exactamente un movimiento `ENTRADA` con el `productId` correcto, cantidad igual a `SaleItem.cantidad` y motivo que contiene el número de pedido y la talla; la `SALIDA` previa se conserva.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Alta<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** La relación con la venta se expresa en `motivo`; el modelo no contiene un campo de referencia estructurado.

---

## TC-SI-011

**ID:** TC-SI-011<br>
**Módulo:** Ventas / Inventario<br>
**Título:** Rechazar una segunda cancelación secuencial sin reponer otra vez<br>
**Objetivo:** Validar que una venta ya cancelada no produzca una reposición duplicada.<br>
**Requisito o riesgo relacionado:** R-04, R-10; reposición duplicada y transición inválida.<br>
**Prioridad de ejecución:** P2<br>
**Tipo de prueba:** Negative Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `STAFF_VENTAS`<br>
**Precondiciones:** Venta pagada ya cancelada una vez; stock repuesto; `ENTRADA` de cancelación identificada.<br>
**Datos de prueba:** `VENTA_CANCELADA_A`, `STAFF_VENTAS`, `MOTIVO_CANCELACION_VALIDO`.<br>
**Pasos:**

1. Registrar estado, stock y movimientos después de la primera cancelación.
2. Repetir secuencialmente el `PATCH` con `estado: CANCELADO` y motivo válido.
3. Revisar código y mensaje.
4. Consultar nuevamente venta, stock y movimientos.

**Resultado esperado:** La segunda solicitud responde `400` con un mensaje que indique que no se permite cambiar una venta `CANCELADO` a `CANCELADO`; el estado no cambia, el stock no vuelve a aumentar y no se crea otra `ENTRADA`.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Alta<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** Este caso no cubre cancelaciones simultáneas.

---

## TC-SI-012

**ID:** TC-SI-012<br>
**Módulo:** Ventas / Inventario<br>
**Título:** Revertir por completo el pago multiartículo si un artículo no tiene stock<br>
**Objetivo:** Comprobar atomicidad entre múltiples variantes, movimientos y estado de venta.<br>
**Requisito o riesgo relacionado:** R-01, R-03, R-11; ausencia de cambios parciales en una venta multiartículo.<br>
**Prioridad de ejecución:** P1<br>
**Tipo de prueba:** Negative Testing, Integration Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `CLIENTE_A`, propietario de la venta<br>
**Precondiciones:** Venta `PENDIENTE` con artículos de `VARIANTE_B_DISPONIBLE` y `VARIANTE_A_INSUFICIENTE`; ambos tenían stock al crearla, pero uno es insuficiente antes del pago.<br>
**Datos de prueba:** `PRODUCTO_A`, `PRODUCTO_B`, ambas variantes y sus cantidades conocidas.<br>
**Pasos:**

1. Registrar el estado, stock de todas las variantes y movimientos iniciales.
2. Confirmar que una variante sigue disponible y la otra no cubre su cantidad.
3. Intentar el pago como propietario.
4. Consultar todas las variantes, la venta y los movimientos después del rechazo.

**Resultado esperado:** La API responde `409` por el artículo sin stock suficiente; `Sale.estado` permanece `PENDIENTE`; ninguna variante conserva descuentos parciales; no se crea ningún movimiento nuevo para ninguno de los artículos.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Crítica<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** El orden de los artículos no cambia el criterio: toda la operación debe revertirse por `prisma.$transaction`.

---

## TC-SI-013

**ID:** TC-SI-013<br>
**Módulo:** Ventas / Autorización<br>
**Título:** Impedir que otro cliente pague una venta ajena<br>
**Objetivo:** Confirmar que el pago exige propiedad del pedido.<br>
**Requisito o riesgo relacionado:** R-05; acceso indebido a una venta de otro cliente.<br>
**Prioridad de ejecución:** P2<br>
**Tipo de prueba:** Negative Testing, API Testing, Authorization Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `CLIENTE_B` sobre una venta de `CLIENTE_A`<br>
**Precondiciones:** `VENTA_PENDIENTE_A`; ambas cuentas activas y separadas; estado, stock y movimientos registrados.<br>
**Datos de prueba:** Token de `CLIENTE_B`, identificador de `VENTA_PENDIENTE_A`.<br>
**Pasos:**

1. Registrar `Sale.clientId`, estado, stock y movimientos.
2. Enviar la solicitud de pago con el token de `CLIENTE_B`.
3. Revisar la respuesta.
4. Consultar persistencia con una cuenta autorizada.

**Resultado esperado:** La API responde `403` con un mensaje que indique que la cuenta no tiene acceso al pedido; la venta permanece `PENDIENTE`; no cambia el stock y no se crea movimiento.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Alta<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** `simulatePayment` compara el cliente autenticado con `Sale.clientId` y usa `cliente.id` solo como respaldo si el repositorio no incluye `clientId`.

---

## TC-SI-014

**ID:** TC-SI-014<br>
**Módulo:** Ventas / Autenticación y autorización<br>
**Título:** Rechazar el pago de cliente ejecutado con una sesión STAFF<br>
**Objetivo:** Validar la separación entre cuentas de tienda y personal interno.<br>
**Requisito o riesgo relacionado:** R-06; intercambio indebido de tipos de sesión.<br>
**Prioridad de ejecución:** P2<br>
**Tipo de prueba:** Negative Testing, API Testing, Authorization Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `STAFF_VENTAS` (`accountType: STAFF`)<br>
**Precondiciones:** Venta `PENDIENTE`; token STAFF válido; estado, stock y movimientos registrados.<br>
**Datos de prueba:** `VENTA_PENDIENTE_A`, token de `STAFF_VENTAS`.<br>
**Pasos:**

1. Enviar `POST /api/ventas/:id/simulate-payment` con el token STAFF.
2. Registrar código y respuesta.
3. Consultar estado, stock y movimientos mediante accesos autorizados.

**Resultado esperado:** `requireClientAccount` responde `403` con un mensaje que indique que la operación es exclusiva para clientes de la tienda; la venta permanece `PENDIENTE`; no cambia el inventario ni se crean movimientos.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Alta<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** La respuesta esperada corresponde al middleware de la ruta, antes de ejecutar el servicio de pago.

---

## TC-SI-015

**ID:** TC-SI-015<br>
**Módulo:** Ventas / Transiciones<br>
**Título:** Rechazar la cancelación de una venta enviada<br>
**Objetivo:** Confirmar que `ENVIADO` no admite transición a `CANCELADO`.<br>
**Requisito o riesgo relacionado:** R-10; transición de estado inválida.<br>
**Prioridad de ejecución:** P3<br>
**Tipo de prueba:** Negative Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `STAFF_VENTAS`<br>
**Precondiciones:** `VENTA_ENVIADA_A`; permiso `ventas:update`; stock y movimientos registrados.<br>
**Datos de prueba:** `VENTA_ENVIADA_A`, `MOTIVO_CANCELACION_VALIDO`.<br>
**Pasos:**

1. Registrar estado, stock y movimientos.
2. Enviar el `PATCH` de estado a `CANCELADO` con motivo válido.
3. Revisar código y mensaje.
4. Consultar persistencia después del rechazo.

**Resultado esperado:** La API responde `400` con un mensaje que indique que no se permite cambiar una venta `ENVIADO` a `CANCELADO`; la venta permanece `ENVIADO`; no se repone stock y no se crea `ENTRADA`.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Alta<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** `TRANSICIONES_PERMITIDAS.ENVIADO` es una lista vacía.

---

## TC-SI-016

**ID:** TC-SI-016<br>
**Módulo:** Ventas / Transiciones<br>
**Título:** Rechazar el pago de una venta cancelada<br>
**Objetivo:** Confirmar que una venta `CANCELADO` no puede regresar a `PAGADO`.<br>
**Requisito o riesgo relacionado:** R-03, R-10; transición inválida y descuento indebido posterior a cancelación.<br>
**Prioridad de ejecución:** P3<br>
**Tipo de prueba:** Negative Testing, API Testing, Database Testing, Regression Testing<br>
**Rol o tipo de cuenta:** `CLIENTE_A`, propietario de la venta<br>
**Precondiciones:** `VENTA_CANCELADA_A`; stock y movimientos posteriores a la cancelación registrados.<br>
**Datos de prueba:** `VENTA_CANCELADA_A`, token de `CLIENTE_A`.<br>
**Pasos:**

1. Registrar estado, stock y movimientos.
2. Intentar el pago simulado con el cliente propietario.
3. Revisar código y mensaje.
4. Consultar persistencia después del rechazo.

**Resultado esperado:** La API responde `400` con un mensaje que indique que el pedido ya fue procesado y no puede pagarse; la venta permanece `CANCELADO`; el stock no disminuye y no se crea `SALIDA`.<br>
**Resultado obtenido:** Pendiente de ejecución<br>
**Estado:** NOT RUN<br>
**Severidad potencial si falla:** Alta<br>
**Evidencia:** Pendiente<br>
**Defecto relacionado:** Ninguno<br>
**Observaciones:** El rechazo ocurre en `simulatePayment` porque el estado no es `PENDIENTE`.

## Criterios para iniciar ejecución

- Ambiente disponible y autorizado para QA.
- Backend y frontend levantados.
- Base de datos de desarrollo o QA conocida y restaurable.
- Datos sintéticos preparados sin información personal real.
- Cuentas `CLIENTE_A` y `CLIENTE_B` activas y separadas.
- Cuenta STAFF con permiso efectivo `ventas:update`.
- Stock inicial por variante registrado.
- Commit o versión bajo prueba identificados.
- Árbol de Git conocido antes de iniciar.

## Criterios para considerar un caso aprobado

- El resultado visible, cuando el caso utilice la interfaz, coincide con lo esperado.
- El código, mensaje y contrato de la respuesta API coinciden.
- `Sale.estado` y los artículos persistidos coinciden.
- `ProductVariant.stock` coincide con el cálculo esperado para la talla afectada.
- La cantidad y el tipo de movimientos coinciden con la operación.
- No existen cambios parciales ni efectos adicionales inesperados.

## Evidencias mínimas

Según el nivel utilizado por cada caso, conservar:

- respuesta de Network o de la herramienta manual usada para invocar la API;
- estado previo y posterior de la venta y del stock;
- captura del resultado visible cuando exista interacción de interfaz;
- consulta de base de datos de `Sale`, `SaleItem`, `ProductVariant` e `InventoryMovement` cuando corresponda;
- código y mensaje de error en escenarios negativos;
- movimiento persistido y su relación verificable con producto, cantidad, pedido y talla en el motivo.

No se requiere capturar cada clic. La evidencia debe demostrar la precondición relevante, la acción y el resultado verificable.

## Trazabilidad

Los casos etiquetados como `Regression Testing` son candidatos para integrar la suite de regresión después de completar y aprobar su primera ejecución formal.

| Caso | Riesgo | Regla de negocio | Tipo de prueba | Prioridad |
|---|---|---|---|---|
| TC-SI-001 | R-01, R-03 | Crear deja `Sale.estado = PENDIENTE` sin afectar stock ni movimientos | Smoke, Functional, Integration, API, Database, Regression | P2 |
| TC-SI-002 | R-01, R-03 | Pagar descuenta únicamente la variante y cambia a `PAGADO` | Functional, Integration, API, Database, Regression | P1 |
| TC-SI-003 | R-03 | Stock igual a cantidad puede llegar a cero, no a negativo | Functional, Boundary, Integration, API, Database, Regression | P1 |
| TC-SI-004 | R-01, R-03 | Stock insuficiente rechaza y revierte la transacción | Negative, Boundary, Integration, API, Database, Regression | P1 |
| TC-SI-005 | R-03 | Stock cero rechaza el pago sin efectos | Negative, Boundary, Integration, API, Database, Regression | P1 |
| TC-SI-006 | R-03 | Una venta ya pagada no vuelve a descontar secuencialmente | Negative, Integration, API, Database, Regression | P1 |
| TC-SI-007 | R-01, R-11 | Un artículo pagado genera una `SALIDA` con cantidad correcta | Functional, Integration, API, Database, Regression | P2 |
| TC-SI-008 | R-01, R-10 | Cancelar `PENDIENTE` no modifica inventario | Functional, Integration, API, Database, Regression | P2 |
| TC-SI-009 | R-01, R-04 | Cancelar `PAGADO` repone exactamente la cantidad vendida | Functional, Integration, API, Database, Regression | P1 |
| TC-SI-010 | R-01, R-04, R-11 | La reposición genera una sola `ENTRADA` correcta | Functional, Integration, API, Database, Regression | P2 |
| TC-SI-011 | R-04, R-10 | Una segunda cancelación secuencial no repone nuevamente | Negative, Integration, API, Database, Regression | P2 |
| TC-SI-012 | R-01, R-03, R-11 | El pago multiartículo es atómico | Negative, Integration, API, Database, Regression | P1 |
| TC-SI-013 | R-05 | Solo el cliente propietario puede confirmar el pago | Negative, API, Authorization, Database, Regression | P2 |
| TC-SI-014 | R-06 | Una sesión STAFF no puede usar el pago de cliente | Negative, API, Authorization, Regression | P2 |
| TC-SI-015 | R-10 | `ENVIADO` no puede pasar a `CANCELADO` | Negative, API, Database, Regression | P3 |
| TC-SI-016 | R-03, R-10 | `CANCELADO` no puede volver a `PAGADO` | Negative, API, Database, Regression | P3 |

## Resumen de cobertura

### Casos por prioridad de ejecución

| Prioridad | Casos | Total |
|---|---|---:|
| P1 | TC-SI-002, TC-SI-003, TC-SI-004, TC-SI-005, TC-SI-006, TC-SI-009, TC-SI-012 | 7 |
| P2 | TC-SI-001, TC-SI-007, TC-SI-008, TC-SI-010, TC-SI-011, TC-SI-013, TC-SI-014 | 7 |
| P3 | TC-SI-015, TC-SI-016 | 2 |

### Casos por severidad potencial

| Severidad | Casos | Total |
|---|---|---:|
| Crítica | TC-SI-002, TC-SI-003, TC-SI-004, TC-SI-005, TC-SI-006, TC-SI-009, TC-SI-012 | 7 |
| Alta | TC-SI-001, TC-SI-007, TC-SI-008, TC-SI-010, TC-SI-011, TC-SI-013, TC-SI-014, TC-SI-015, TC-SI-016 | 9 |

### Casos que requieren consulta de base de datos

Requieren comprobar persistencia TC-SI-001 a TC-SI-013, TC-SI-015 y TC-SI-016. TC-SI-014 puede comprobarse con la respuesta de autorización y una consulta posterior autorizada; no requiere acceso de base de datos para ejecutar la solicitud rechazada.

## Cobertura futura

La concurrencia queda expresamente fuera de esta suite. Se diseñará posteriormente en:

```text
qa/test-cases/TC-CONCURRENCY.md
```

Esa suite deberá cubrir, sin asumir todavía un resultado contractual:

- dos pagos simultáneos;
- dos cancelaciones simultáneas;
- dos clientes compitiendo por la última unidad;
- dos despachos simultáneos;
- dos confirmaciones simultáneas.

No se ejecutó ningún caso durante la creación de este documento.
