# Registro de ejecución — Ventas e inventario

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-001 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de preparación | 4 de agosto de 2026 |
| Fecha de ejecución | 5 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Objetivo

Crear una venta válida y comprobar que queda en estado `PENDIENTE` sin descontar `ProductVariant.stock` y sin crear registros en `InventoryMovement`.

## Precondiciones

- Backend y base de datos del ambiente de desarrollo o QA disponibles.
- Versión bajo prueba identificada por la rama y el commit registrados.
- `CLIENTE_A` activo, autenticado como cuenta `CLIENT` con rol efectivo `CLIENTE`.
- `PRODUCTO_A` activo y con `VARIANTE_A_M` disponible.
- Cantidad solicitada entera, igual o mayor que uno y no mayor que el stock de la variante.
- Dirección sintética válida.
- Método de pago `tarjeta` u `oxxo`.
- Stock inicial y conteo inicial de movimientos registrados antes de crear la venta.

Estado de las precondiciones: confirmado.


## Datos utilizados

| Dato | Condición | Cómo obtenerlo | Valor encontrado | Listo |
|---|---|---|---|---|
| `CLIENTE_A` | Cliente activo y autenticado | Sesión del cliente utilizada en Postman | `profile_cmrockb1o0003ckv8tazaeqni` | Sí |
| `PRODUCTO_A` | Producto activo con variante talla `M` disponible | `GET /api/products/cmrvkg97q0001ckr87t6oxr3s` | `cmrvkg97q0001ckr87t6oxr3s` — Vestido negro | Sí |
| `VARIANTE_A_M` | Variante talla `M` con stock suficiente | Respuesta de `GET /api/products/:id` | `cmrvqq4ls0009ckqk52q1iy2o` | Sí |
| Dirección válida | Dirección sintética válida para la prueba | Body enviado en Postman | Calle Prueba 124, Centro, León, Guanajuato, CP 37000 | Sí |
| Cantidad permitida | Entero igual o mayor que 1 y no superior al stock disponible | Body enviado en Postman | 1 | Sí |
| Método de pago válido | `tarjeta` u `oxxo` | Body enviado en Postman | `tarjeta` | Sí |
| Stock inicial | Stock de la talla `M` inmediatamente antes de crear la venta | `GET /api/products/cmrvkg97q0001ckr87t6oxr3s` | 2 | Sí |
| Conteo inicial de movimientos | Movimientos de inventario asociados al producto antes de crear la venta | Prisma Studio, filtro por `productId` | 8 | Sí |

## Contrato confirmado

- Ruta: `POST /api/ventas`.
- Autenticación: encabezado Bearer de una cuenta cliente activa. `authenticate` carga la cuenta y `requireClientAccount` exige `accountType = CLIENT` y rol `CLIENTE`.
- Validación: `createVentaSchema` exige `cliente`, `metodoPago` e `items`; cada artículo requiere `productoId`, `talla` y una `cantidad` entera mínima de uno.
- Servicio: `VentasService.create` vuelve a obtener producto, variante y precio desde el catálogo; verifica producto activo y stock suficiente.
- Persistencia: `VentasRepository.create` ejecuta un `prisma.sale.create` con creación anidada de `SaleItem`.
- Estado inicial: `PENDIENTE`.
- Respuesta correcta: HTTP `201`, mensaje `Venta registrada correctamente` y la venta en `item`.
- La creación no actualiza `ProductVariant` ni crea `InventoryMovement`. Esos efectos se encuentran en la transición posterior a `PAGADO`.

## Nombres reales de tablas y columnas

Confirmados en `backend/prisma/schema.prisma`:

| Modelo Prisma | Tabla | Columnas usadas en esta ejecución |
|---|---|---|
| `Client` | `clients` | `id`, `nombre`, `email`, `activo` |
| `Product` | `products` | `id`, `sku`, `nombre`, `precio_venta`, `activo` |
| `ProductVariant` | `product_variants` | `id`, `product_id`, `talla`, `stock` |
| `Sale` | `sales` | `id`, `numero_pedido`, `client_id`, `metodo_pago`, `subtotal`, `envio`, `total`, `estado`, `created_at` |
| `SaleItem` | `sale_items` | `id`, `sale_id`, `product_id`, `nombre_producto`, `talla`, `cantidad`, `precio_unitario` |
| `InventoryMovement` | `inventory_movements` | `id`, `product_id`, `tipo`, `cantidad`, `motivo`, `created_at` |

## Consultas SQL de solo lectura

Sustituir los placeholders localmente. No guardar valores sensibles en el repositorio.

### Confirmar CLIENTE_A

```sql
SELECT id, nombre, email, activo
FROM clients
WHERE id = '<CLIENT_ID>';
```

### Registrar producto, variante y stock previo

```sql
SELECT
  p.id AS product_id,
  p.sku,
  p.nombre,
  p.activo,
  pv.id AS variant_id,
  pv.talla,
  pv.stock
FROM products AS p
JOIN product_variants AS pv ON pv.product_id = p.id
WHERE p.id = '<PRODUCT_ID>'
  AND pv.id = '<VARIANT_ID>'
  AND pv.talla = 'M';
```

### Registrar movimientos previos

```sql
SELECT COUNT(*) AS movement_count_before
FROM inventory_movements
WHERE product_id = '<PRODUCT_ID>';
```

### Comprobar la venta creada

```sql
SELECT
  id,
  numero_pedido,
  client_id,
  metodo_pago,
  subtotal,
  envio,
  total,
  estado,
  created_at
FROM sales
WHERE id = '<SALE_ID>'
  AND client_id = '<CLIENT_ID>';
```

### Comprobar los artículos de la venta

```sql
SELECT
  id,
  sale_id,
  product_id,
  nombre_producto,
  talla,
  cantidad,
  precio_unitario
FROM sale_items
WHERE sale_id = '<SALE_ID>'
ORDER BY id;
```

### Comprobar el stock posterior

```sql
SELECT id, product_id, talla, stock
FROM product_variants
WHERE id = '<VARIANT_ID>'
  AND product_id = '<PRODUCT_ID>';
```

### Comprobar movimientos posteriores

```sql
SELECT COUNT(*) AS movement_count_after
FROM inventory_movements
WHERE product_id = '<PRODUCT_ID>';
```

```sql
SELECT id, product_id, tipo, cantidad, motivo, created_at
FROM inventory_movements
WHERE product_id = '<PRODUCT_ID>'
ORDER BY created_at, id;
```

Para aprobar el caso, `movement_count_after` debe ser igual a `movement_count_before`, y el stock posterior debe ser igual al stock inicial registrado.

## Solicitud API preparada

Método y URL relativa:

```http
POST /api/ventas
```

Headers:

```http
Authorization: Bearer <CLIENT_TOKEN>
Content-Type: application/json
```

Body de referencia. Reemplazar `<QUANTITY_INTEGER>` por un entero sin comillas:

```json
{
  "cliente": {
    "nombre": "<CLIENT_NAME>",
    "email": "<CLIENT_EMAIL>",
    "calle": "<STREET>",
    "numeroExterior": "<EXTERIOR_NUMBER>",
    "numeroInterior": "<INTERIOR_NUMBER_OR_EMPTY>",
    "cp": "<POSTAL_CODE>",
    "estado": "<STATE>",
    "ciudad": "<CITY>",
    "colonia": "<NEIGHBORHOOD>",
    "referencias": "<REFERENCES_OR_EMPTY>",
    "telefono": "<PHONE_8_TO_15_DIGITS>"
  },
  "metodoPago": "<tarjeta_OR_oxxo>",
  "items": [
    {
      "productoId": "<PRODUCT_ID>",
      "talla": "M",
      "cantidad": <QUANTITY_INTEGER>
    }
  ]
}
```

Resultado:

- HTTP: `201 Created`
- Mensaje: `Venta registrada correctamente`
- Venta ID: `cmsgzreso0001ckx047p46nqx`
- Pedido: `PED-MSGZRESN`
- Estado: `PENDIENTE`
- Stock antes: `2`
- Stock después: `2`
- Movimientos antes: `8`
- Movimientos después: `8`
- Comportamiento inesperado: ninguno

## Aislamiento de TC-SI-001

La interfaz no permite observar de forma segura la venta pendiente como único paso: `Checkout.confirmarPago` llama primero a `POST /ventas`, espera y después llama automáticamente a `POST /ventas/:id/simulate-payment`.

Para ejecutar solamente `TC-SI-001`, usar una llamada manual al endpoint con una herramienta REST o cliente HTTP local y enviar únicamente `POST /api/ventas`. No llamar a `simulate-payment`, no completar el flujo de checkout y no modificar el frontend.

## Guía de ejecución manual

1. Confirmar rama `feature/erp-refactor`, commit `10c0dc9`, ambiente y ejecutor.
2. Autenticar `CLIENTE_A` sin copiar el token completo al registro; confirmar su `id`, `accountType`, rol y estado activo mediante `GET /api/auth/me`.
3. Seleccionar `PRODUCTO_A` y `VARIANTE_A_M`; registrar `<PRODUCT_ID>`, `<VARIANT_ID>`, cantidad y datos sintéticos de dirección.
4. Ejecutar las consultas previas para registrar `ProductVariant.stock` y `movement_count_before`.
5. Enviar una sola solicitud `POST /api/ventas` con el body preparado. No enviar la solicitud de pago simulado.
6. Guardar el código HTTP y el cuerpo completo de la respuesta, ocultando cualquier dato sensible.
7. Tomar `item.id` de la respuesta como `<SALE_ID>` y ejecutar las consultas de venta y artículos.
8. Ejecutar nuevamente las consultas de variante y movimientos.
9. Comparar: venta `PENDIENTE`, artículo correcto, stock anterior igual al posterior y conteo de movimientos anterior igual al posterior.
10. Guardar la evidencia con los nombres propuestos y devolver únicamente la información mínima indicada abajo para clasificar el caso.

## Información necesaria para clasificar el caso

- Código HTTP recibido.
- Cuerpo de respuesta sanitizado, sin token ni datos personales reales.
- Identificador de la venta creado o una referencia enmascarada que permita correlacionar las consultas.
- Valor de `Sale.estado` persistido.
- Stock anterior y posterior de `VARIANTE_A_M`.
- Conteo de movimientos anterior y posterior de `PRODUCTO_A`.
- Confirmación de que el `SaleItem` conserva producto, talla y cantidad esperados.
- Cualquier mensaje o efecto inesperado.

## Resultado esperado

HTTP `201`; una venta y su artículo persistidos; `Sale.estado = PENDIENTE`; stock y movimientos sin cambios.

## Resultado obtenido

La venta fue creada correctamente con HTTP `201 Created` y quedó en estado `PENDIENTE`.

El stock de la talla `M` permaneció en `2` antes y después de crear la venta.

El conteo de movimientos de inventario permaneció en `8` antes y después de crear la venta, por lo que no se generó ningún movimiento de inventario durante este paso.

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-001-response.json`
- `qa/evidence/TR-SI-001/TC-SI-001-stock-before-after.txt`
- `qa/evidence/TR-SI-001/TC-SI-001-movements-before-after.png`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-002

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-002 |
| Estado | PASS |

## Resultado obtenido

El pago simulado fue confirmado correctamente.

| Campo | Valor |
|---|---|
| HTTP | 200 OK |
| Mensaje | Pago simulado confirmado correctamente |
| Venta ID | `cmsfr44wk0001ckrks7uwyzac` |
| Pedido | `PED-MSFR44WC` |
| Estado final de la venta | `PAGADO` |
| Producto ID | `cmrvkg97q0001ckr87t6oxr3s` |
| Producto | Vestido negro |
| Talla | `M` |
| Cantidad | 1 |
| Stock antes | 3 |
| Stock después | 2 |
| Movimiento | `SALIDA` |
| Cantidad del movimiento | 1 |
| createdAt del movimiento | `2026-08-06T02:18:46.693Z` |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-002-payment-response.json`
- `qa/evidence/TR-SI-001/TC-SI-002-stock-before-after.txt` — archivo presente pero vacío; los valores `3 → 2` permanecen documentados en la tabla de resultado, pero falta el artefacto independiente de before/after.
- `qa/evidence/TR-SI-001/TC-SI-002-inventory-movement.png`

---

# Registro de ejecución — TC-SI-003

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-003 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de ejecución | 5 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

La venta fue creada correctamente en estado `PENDIENTE` y posteriormente el pago simulado fue confirmado.

| Campo | Valor |
|---|---|
| HTTP creación | `201 Created` |
| HTTP pago | `200 OK` |
| Mensaje de pago | Pago simulado confirmado correctamente |
| Venta ID | `cmsh17rbu0005ckx0dyb4azef` |
| Pedido | `PED-MSH17RBT` |
| Estado final | `PAGADO` |
| Producto ID | `cmrvkg97q0001ckr87t6oxr3s` |
| Producto | Vestido negro |
| Variante | `XS` |
| Cantidad | 1 |
| Stock antes | 1 |
| Stock después | 0 |
| Movimientos antes | 8 |
| Movimientos después | 9 |
| Movimiento creado | `SALIDA` |
| Cantidad del movimiento | 1 |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-003-create-response.json`
- `qa/evidence/TR-SI-001/TC-SI-003-payment-response.json`
- `qa/evidence/TR-SI-001/TC-SI-003-stock-before-after.txt`
- `qa/evidence/TR-SI-001/TC-SI-003-inventory-movement.png`

## Defecto relacionado

Ninguno
---

# Registro de ejecución — TC-SI-004

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-004 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de ejecución | 6 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

La venta fue creada cuando existía stock suficiente. Antes de confirmar el pago, el stock de la talla `M` fue reducido a una unidad, quedando por debajo de las dos unidades solicitadas.

| Campo | Valor |
|---|---|
| HTTP creación | `201 Created` |
| Venta ID | `cmsh6coa1000bckx07wvyfl24` |
| Pedido | `PED-MSH6CO9U` |
| Cantidad solicitada | 2 |
| Stock antes del pago | 1 |
| Movimientos antes del pago | 10 |
| HTTP del pago | `409 Conflict` |
| Mensaje | No hay stock suficiente para Vestido negro en talla M |
| Estado final de la venta | `PENDIENTE` |
| Stock después del pago | 1 |
| Movimientos después del pago | 10 |
| Efectos parciales | Ninguno |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-004-payment-error-response.json`
- `qa/evidence/TR-SI-001/TC-SI-004-stock-movements-state.txt`
- `qa/evidence/TR-SI-001/TC-SI-004-sale-pending.png`
- `qa/evidence/TR-SI-001/TC-SI-004-inventory-movements.png`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-005

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-005 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de ejecución | 6 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se preparó una venta pendiente para la variante `XS`. Antes de confirmar el pago, el stock de la variante se estableció en `0` mediante Prisma Studio como dato controlado de prueba.

| Campo | Valor |
|---|---|
| HTTP creación | `201 Created` |
| Venta ID | `cmsh81m3y000dck5s0h61rzz6` |
| Pedido | `PED-MSH81M3X` |
| Variante | `XS` |
| Cantidad solicitada | 1 |
| Stock antes del pago | 0 |
| Movimientos antes del pago | 11 |
| HTTP del pago | `409 Conflict` |
| Mensaje | No hay stock suficiente para Vestido negro en talla XS |
| Estado final de la venta | `PENDIENTE` |
| Stock después del pago | 0 |
| Movimientos después del pago | 11 |
| Efectos parciales | Ninguno |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-005-payment-error-response.json`
- `qa/evidence/TR-SI-001/TC-SI-005-stock-movements-state.txt`
- `qa/evidence/TR-SI-001/TC-SI-005-stock-zero.png`
- `qa/evidence/TR-SI-001/TC-SI-005-sale-pending.png`
- `qa/evidence/TR-SI-001/TC-SI-005-inventory-movements.png`

## Observaciones

El stock cero se preparó directamente en Prisma Studio porque la interfaz de inventario no permitió registrar el valor final `0`. Se requiere revisar si el campo representa stock final o cantidad de movimiento antes de clasificar este comportamiento como defecto.

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-006

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-006 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de ejecución | 6 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se intentó confirmar nuevamente el pago de una venta que ya se encontraba en estado `PAGADO`.

| Campo | Valor |
|---|---|
| HTTP | `400 Bad Request` |
| Mensaje | Este pedido ya fue procesado |
| Venta ID | `cmsh17rbu0005ckx0dyb4azef` |
| Pedido | `PED-MSH17RBT` |
| Estado antes | `PAGADO` |
| Estado después | `PAGADO` |
| Producto ID | `cmrvkg97q0001ckr87t6oxr3s` |
| Variante | `XS` |
| Stock antes | 0 |
| Stock después | 0 |
| Movimientos antes | 11 |
| Movimientos después | 11 |
| Movimiento adicional | Ninguno |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-006-payment-error-response.json`
- `qa/evidence/TR-SI-001/TC-SI-006-product-after.json`
- `qa/evidence/TR-SI-001/TC-SI-006-state-stock-movements.txt`
- `qa/evidence/TR-SI-001/TC-SI-006-sale-paid.png`
- `qa/evidence/TR-SI-001/TC-SI-006-inventory-movements.png`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-007

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-007 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de ejecución | 6 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se verificó el movimiento de inventario generado por el pago de la venta correspondiente al pedido `PED-MSH17RBT`.

| Campo | Valor |
|---|---|
| Venta ID | `cmsh17rbu0005ckx0dyb4azef` |
| Pedido | `PED-MSH17RBT` |
| Producto ID | `cmrvkg97q0001ckr87t6oxr3s` |
| Variante | `XS` |
| Cantidad vendida | 1 |
| Movimiento ID | `cmsh1ar980009ckx07t7iktwq` |
| Tipo | `SALIDA` |
| Cantidad del movimiento | 1 |
| Motivo | VENTA PED-MSH17RBT - Talla XS |
| CreatedAt | `2026-08-06T04:47:02.013Z` |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-007-inventory-movement.png`
- `qa/evidence/TR-SI-001/TC-SI-007-inventory-movement.txt`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-008

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-008 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de ejecución | 6 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se canceló una venta que permanecía en estado `PENDIENTE`.

| Campo | Valor |
|---|---|
| HTTP | `200 OK` |
| Mensaje | Estado de la venta actualizado correctamente |
| Venta ID | `cmsh6coa1000bckx07wvyfl24` |
| Pedido | `PED-MSH6CO9U` |
| Estado antes | `PENDIENTE` |
| Estado después | `CANCELADO` |
| Motivo | Cancelación de prueba TC-SI-008 |
| Producto ID | `cmrvkg97q0001ckr87t6oxr3s` |
| Variante | `M` |
| Stock antes | 1 |
| Stock después | 1 |
| Movimientos antes | 11 |
| Movimientos después | 11 |
| Movimiento adicional | Ninguno |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-008-cancellation-response.json`
- `qa/evidence/TR-SI-001/TC-SI-008-state-stock-movements.txt`
- `qa/evidence/TR-SI-001/TC-SI-008-sale-cancelled.png`
- `qa/evidence/TR-SI-001/TC-SI-008-inventory-movements.png`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-009

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-009 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de ejecución | 6 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se canceló una venta que se encontraba en estado `PAGADO`.

| Campo | Valor |
|---|---|
| HTTP | `200 OK` |
| Mensaje | Estado de la venta actualizado correctamente |
| Venta ID | `cmsh17rbu0005ckx0dyb4azef` |
| Pedido | `PED-MSH17RBT` |
| Estado antes | `PAGADO` |
| Estado después | `CANCELADO` |
| Motivo | Cancelación de prueba TC-SI-009 |
| Producto ID | `cmrvkg97q0001ckr87t6oxr3s` |
| Variante | `XS` |
| Cantidad vendida | 1 |
| Stock antes | 0 |
| Stock después | 1 |
| Movimientos antes | 11 |
| Movimientos después | 12 |
| Movimiento creado | `ENTRADA` |
| Cantidad del movimiento | 1 |
| Motivo del movimiento | CANCELACION VENTA PED-MSH17RBT - Talla XS |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-009-cancellation-response.json`
- `qa/evidence/TR-SI-001/TC-SI-009-restock-result.txt`
- `qa/evidence/TR-SI-001/TC-SI-009-sale-cancelled.png`
- `qa/evidence/TR-SI-001/TC-SI-009-inventory-entry.png`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-010

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-010 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de ejecución | 6 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se verificó la trazabilidad de inventario generada al cancelar una venta previamente pagada.

| Campo | Valor |
|---|---|
| Venta ID | `cmsh17rbu0005ckx0dyb4azef` |
| Pedido | `PED-MSH17RBT` |
| Producto ID | `cmrvkg97q0001ckr87t6oxr3s` |
| Variante | `XS` |
| Cantidad vendida | 1 |
| Movimiento SALIDA previo | `cmsh1ar980009ckx07t7iktwq` |
| Movimiento ENTRADA | `cmsig7j0q000jck5s0qcxoxke` |
| Tipo del nuevo movimiento | `ENTRADA` |
| Cantidad del nuevo movimiento | 1 |
| Motivo | CANCELACION VENTA PED-MSH17RBT - Talla XS |
| CreatedAt | `2026-08-07T04:32:11.786Z` |
| SALIDA previa conservada | Sí |
| Movimientos ENTRADA creados | 1 |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-010-inventory-traceability.txt`
- `qa/evidence/TR-SI-001/TC-SI-010-inventory-traceability.png`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-011

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-011 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de ejecución | 6 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se intentó cancelar nuevamente una venta que ya se encontraba en estado `CANCELADO`.

| Campo | Valor |
|---|---|
| HTTP | `400 Bad Request` |
| Mensaje | No se puede cambiar una venta CANCELADO a CANCELADO |
| Venta ID | `cmsh17rbu0005ckx0dyb4azef` |
| Pedido | `PED-MSH17RBT` |
| Estado antes | `CANCELADO` |
| Estado después | `CANCELADO` |
| Producto ID | `cmrvkg97q0001ckr87t6oxr3s` |
| Variante | `XS` |
| Stock antes | 1 |
| Stock después | 1 |
| Movimientos antes | 12 |
| Movimientos después | 12 |
| Entradas de cancelación para el pedido | 1 |
| Movimiento adicional | Ninguno |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-011-second-cancellation-error.json`
- `qa/evidence/TR-SI-001/TC-SI-011-state-stock-movements.txt`
- `qa/evidence/TR-SI-001/TC-SI-011-sale-cancelled.png`
- `qa/evidence/TR-SI-001/TC-SI-011-inventory-movements.png`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-012

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-012 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de ejecución | 7 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se intentó pagar una venta PENDIENTE con dos variantes del mismo producto. XXS tenía stock suficiente y XS fue preparada con stock insuficiente antes del pago.

| Campo | Valor |
|---|---|
| HTTP | `409 Conflict` |
| Mensaje | No hay stock suficiente para Vestido negro en talla XS |
| Venta ID | `cmsimew9z000nck5shc1fhpse` |
| Pedido | `PED-MSIMEW9X` |
| Estado antes | `PENDIENTE` |
| Estado después | `PENDIENTE` |
| Producto ID | `cmrvkg97q0001ckr87t6oxr3s` |
| Artículo disponible | `XXS x1` |
| Artículo sin stock suficiente | `XS x1` |
| Stock XXS antes | 2 |
| Stock XXS después | 2 |
| Stock XS antes | 0 |
| Stock XS después | 0 |
| Movimientos antes | 12 |
| Movimientos después | 12 |
| Movimientos adicionales | Ninguno |
| Descuento parcial en XXS | No |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-012-payment-error-response.json`
- `qa/evidence/TR-SI-001/TC-SI-012-product-after.json`
- `qa/evidence/TR-SI-001/TC-SI-012-atomicity-result.txt`
- `qa/evidence/TR-SI-001/TC-SI-012-sale-pending.png`
- `qa/evidence/TR-SI-001/TC-SI-012-inventory-movements.png`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-013

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-013 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit bajo prueba | `10c0dc9` |
| Fecha de ejecución | 7 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se intentó pagar una venta perteneciente a CLIENTE_A utilizando el token autenticado de CLIENTE_B.

| Campo | Valor |
|---|---|
| HTTP | `403 Forbidden` |
| Mensaje | No tienes acceso a este pedido |
| Venta ID | `cmsimew9z000nck5shc1fhpse` |
| Pedido | `PED-MSIMEW9X` |
| Estado antes | `PENDIENTE` |
| Estado después | `PENDIENTE` |
| Producto ID | `cmrvkg97q0001ckr87t6oxr3s` |
| Stock XXS antes | 2 |
| Stock XXS después | 2 |
| Stock XS antes | 0 |
| Stock XS después | 0 |
| Movimientos antes | 12 |
| Movimientos después | 12 |
| Operación de inventario | Ninguna |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-013-unauthorized-payment-response.json`
- `qa/evidence/TR-SI-001/TC-SI-013-authorization-result.txt`
- `qa/evidence/TR-SI-001/TC-SI-013-sale-pending.png`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-014

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-014 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit de referencia | `10c0dc9` |
| Fecha de ejecución | 7 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se intentó ejecutar el pago de una venta de cliente utilizando una sesión autenticada de tipo STAFF.

| Campo | Valor |
|---|---|
| HTTP | `403 Forbidden` |
| Mensaje | Esta operación es exclusiva para clientes de la tienda |
| Venta ID | `cmsimew9z000nck5shc1fhpse` |
| Pedido | `PED-MSIMEW9X` |
| Tipo de sesión | `STAFF` |
| Rol | `ADMIN` |
| Estado antes | `PENDIENTE` |
| Estado después | `PENDIENTE` |
| Stock XXS antes | 2 |
| Stock XXS después | 2 |
| Stock XS antes | 0 |
| Stock XS después | 0 |
| Movimientos antes | 12 |
| Movimientos después | 12 |
| Solicitudes ejecutadas | 2 |
| Efectos secundarios | Ninguno |
| Comportamiento inesperado | Ninguno |

## Nota de ejecución

Durante la ejecución se corrigieron únicamente textos de mensajes en `requirePermissions.js`. No se modificó la lógica de autorización evaluada por este caso.

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-014-staff-payment-response.json`
- `qa/evidence/TR-SI-001/TC-SI-014-authorization-result.txt`
- `qa/evidence/TR-SI-001/TC-SI-014-sale-pending.png`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-015

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-015 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit de referencia | `10c0dc9` |
| Fecha de ejecución | 7 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se intentó cancelar una venta que ya se encontraba en estado `ENVIADO`.

| Campo | Valor |
|---|---|
| HTTP | `400 Bad Request` |
| Mensaje | No se puede cambiar una venta ENVIADO a CANCELADO |
| Venta ID | `cmrwvm1uq0001ckl4szbkhvhq` |
| Pedido | `PED-MRWVM1UF` |
| Producto | Blusa Plisada Manga Campana |
| Producto ID | `cmrek7zbd0001ck8wlb2giku2` |
| Variante | `XS` |
| Cantidad | 1 |
| Estado antes | `ENVIADO` |
| Estado después | `ENVIADO` |
| Stock XS antes | 9 |
| Stock XS después | 9 |
| Movimientos antes | 6 |
| Movimientos después | 6 |
| Reposición de inventario | Ninguna |
| Movimiento adicional | Ninguno |
| Comportamiento inesperado | Ninguno |

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-015-cancellation-error-response.json`
- `qa/evidence/TR-SI-001/TC-SI-015-state-stock-movements.txt`
- `qa/evidence/TR-SI-001/TC-SI-015-sale-enviado.png`

## Defecto relacionado

Ninguno

---

# Registro de ejecución — TC-SI-016

## Identificación

| Campo | Valor |
|---|---|
| ID de ejecución | TR-SI-001 |
| Suite | Ventas e inventario |
| Caso | TC-SI-016 |
| Rama bajo prueba | `feature/erp-refactor` |
| Commit de referencia | `10c0dc9` |
| Fecha de ejecución | 7 de agosto de 2026 |
| Ambiente | Desarrollo local con backend y base de datos local |
| Ejecutor | Elvia Gutiérrez García |
| Estado | PASS |

## Resultado obtenido

Se intentó procesar nuevamente el pago de una venta que ya se encontraba en estado `CANCELADO`.

| Campo | Valor |
|---|---|
| HTTP | `400 Bad Request` |
| Mensaje | Este pedido ya fue procesado |
| Venta ID | `cmsh17rbu0005ckx0dyb4azef` |
| Pedido | `PED-MSH17RBT` |
| Producto | Vestido negro |
| Producto ID | `cmrvkg97q0001ckr87t6oxr3s` |
| Variante | `XS` |
| Estado final | `CANCELADO` |
| Stock XS antes | 0 |
| Stock XS después | 0 |
| Nueva SALIDA asociada al pedido | No |
| Comportamiento inesperado | Ninguno |

## Verificación de inventario

Se revisaron los movimientos del producto después del rechazo.

No se encontró una nueva `SALIDA` para `PED-MSH17RBT`. Los movimientos relacionados con esa venta continúan siendo la `SALIDA` original y la `ENTRADA` generada posteriormente por su cancelación.

## Evidencias

- `qa/evidence/TR-SI-001/TC-SI-016-payment-error-response.json`
- `qa/evidence/TR-SI-001/TC-SI-016-state-stock-movements.txt`
- `qa/evidence/TR-SI-001/TC-SI-016-sale-cancelled.png`

## Defecto relacionado

Ninguno
