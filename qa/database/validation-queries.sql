-- D'oro Fashion System - consultas PostgreSQL de validación QA
-- Sustituya cada placeholder entre <...> antes de ejecutar una consulta.
-- Todas las sentencias de este archivo son exclusivamente de lectura.

-- 1. Venta, estado, pedido y propietario
-- Valida: los datos principales de una venta y su propietario Client.
-- Escenario QA: comprobación posterior a creación, pago, rechazo o cancelación.
-- Esperado: una fila para <SALE_ID>, con el estado y numero_pedido previstos.
SELECT
  s.id AS sale_id,
  s.numero_pedido,
  s.estado,
  s.client_id,
  c.nombre AS client_nombre,
  c.email AS client_email,
  s.metodo_pago,
  s.subtotal,
  s.envio,
  s.total,
  s.cancellation_reason,
  s.created_at,
  s.updated_at
FROM sales AS s
JOIN clients AS c ON c.id = s.client_id
WHERE s.id = '<SALE_ID>';

-- 2. Venta localizada por número de pedido
-- Valida: que el número de pedido único resuelva a la venta y propietario correctos.
-- Escenario QA: trazabilidad cuando la API o la evidencia proporciona <ORDER_NUMBER>.
-- Esperado: exactamente una fila con el estado y client_id esperados.
SELECT
  s.id AS sale_id,
  s.numero_pedido,
  s.estado,
  s.client_id,
  c.email AS client_email,
  s.created_at,
  s.updated_at
FROM sales AS s
JOIN clients AS c ON c.id = s.client_id
WHERE s.numero_pedido = '<ORDER_NUMBER>';

-- 3. Items, producto, talla y cantidad de una venta
-- Valida: la relación Sale -> SaleItem -> Product y el snapshot vendido.
-- Escenario QA: creación, pago, cancelación y revisión de efectos por artículo.
-- Esperado: una fila por item, con producto, talla y cantidad iguales a la solicitud aceptada.
SELECT
  si.id AS sale_item_id,
  si.sale_id,
  si.product_id,
  p.sku,
  p.nombre AS product_nombre_actual,
  si.nombre_producto AS product_nombre_snapshot,
  si.talla,
  si.cantidad,
  si.precio_unitario
FROM sale_items AS si
JOIN products AS p ON p.id = si.product_id
WHERE si.sale_id = '<SALE_ID>'
ORDER BY si.id;

-- 4. Variante concreta y stock actual
-- Valida: ProductVariant.stock para un identificador de variante conocido.
-- Escenario QA: captura de stock antes y después de pago o cancelación.
-- Esperado: una fila para <VARIANT_ID>; comparar stock entre ambas capturas.
SELECT
  pv.id AS variant_id,
  pv.product_id,
  p.sku,
  p.nombre AS product_nombre,
  pv.talla,
  pv.stock,
  pv.updated_at
FROM product_variants AS pv
JOIN products AS p ON p.id = pv.product_id
WHERE pv.id = '<VARIANT_ID>';

-- 5. Variantes de un producto
-- Valida: tallas y existencias disponibles para un producto.
-- Escenario QA: preparación de datos y selección de límites de stock.
-- Esperado: una fila por talla de <PRODUCT_ID>, sin mezclar variantes de otros productos.
SELECT
  pv.id AS variant_id,
  pv.product_id,
  pv.talla,
  pv.stock,
  pv.created_at,
  pv.updated_at
FROM product_variants AS pv
WHERE pv.product_id = '<PRODUCT_ID>'
ORDER BY pv.talla;

-- 6. Variante que corresponde conceptualmente a un SaleItem
-- Valida: la unión real entre item y variante mediante product_id + talla.
-- Escenario QA: comprobar el stock actual de cada talla incluida en una venta.
-- Esperado: una fila por item; variant_id y stock deben corresponder al producto/talla vendidos.
SELECT
  s.id AS sale_id,
  s.numero_pedido,
  si.id AS sale_item_id,
  si.product_id,
  si.talla,
  si.cantidad AS sold_quantity,
  pv.id AS variant_id,
  pv.stock AS current_stock
FROM sales AS s
JOIN sale_items AS si ON si.sale_id = s.id
LEFT JOIN product_variants AS pv
  ON pv.product_id = si.product_id
 AND pv.talla = si.talla
WHERE s.id = '<SALE_ID>'
ORDER BY si.id;

-- 7. Historial cronológico de movimientos de un producto
-- Valida: tipo, cantidad, motivo y orden temporal del historial de inventario.
-- Escenario QA: trazabilidad general y comparación antes/después de una operación.
-- Esperado: todos los movimientos de <PRODUCT_ID>, del más antiguo al más reciente.
SELECT
  im.id AS movement_id,
  im.product_id,
  p.sku,
  p.nombre AS product_nombre,
  im.tipo,
  im.cantidad,
  im.motivo,
  im.created_at
FROM inventory_movements AS im
JOIN products AS p ON p.id = im.product_id
WHERE im.product_id = '<PRODUCT_ID>'
ORDER BY im.created_at ASC, im.id ASC;

-- 8. Movimientos SALIDA de un producto
-- Valida: únicamente descuentos de inventario registrados como SALIDA.
-- Escenario QA: pago exitoso, pago duplicado rechazado o pago no autorizado.
-- Esperado: solo filas tipo SALIDA; una nueva por item tras un pago exitoso y ninguna tras un rechazo.
SELECT
  im.id AS movement_id,
  im.product_id,
  im.cantidad,
  im.motivo,
  im.created_at
FROM inventory_movements AS im
WHERE im.product_id = '<PRODUCT_ID>'
  AND im.tipo = 'SALIDA'
ORDER BY im.created_at ASC, im.id ASC;

-- 9. Movimientos ENTRADA de un producto
-- Valida: únicamente incrementos de inventario registrados como ENTRADA.
-- Escenario QA: cancelación de una venta previamente PAGADO.
-- Esperado: una ENTRADA por item restaurado, con cantidad equivalente a la vendida.
SELECT
  im.id AS movement_id,
  im.product_id,
  im.cantidad,
  im.motivo,
  im.created_at
FROM inventory_movements AS im
WHERE im.product_id = '<PRODUCT_ID>'
  AND im.tipo = 'ENTRADA'
ORDER BY im.created_at ASC, im.id ASC;

-- 10. Conteo de movimientos antes o después de una operación
-- Valida: el total de movimientos de un producto en el momento de la consulta.
-- Escenario QA: ejecutar antes y después de pago, rechazo o cancelación.
-- Esperado: incremento acorde con los items exitosos; sin cambio en operaciones rechazadas.
SELECT
  COUNT(*) AS movement_count
FROM inventory_movements AS im
WHERE im.product_id = '<PRODUCT_ID>';

-- 11. Correlación real de movimientos con una venta mediante motivo
-- Valida: movimientos cuyo motivo contiene el número de pedido de la venta.
-- Escenario QA: confirmar SALIDA de pago y ENTRADA de cancelación para <SALE_ID>.
-- Esperado: los movimientos del pedido; no existe una FK InventoryMovement -> Sale.
SELECT
  s.id AS sale_id,
  s.numero_pedido,
  s.estado AS sale_estado,
  si.id AS sale_item_id,
  si.product_id,
  si.talla,
  si.cantidad AS item_quantity,
  im.id AS movement_id,
  im.tipo,
  im.cantidad AS movement_quantity,
  im.motivo,
  im.created_at
FROM sales AS s
JOIN sale_items AS si ON si.sale_id = s.id
LEFT JOIN inventory_movements AS im
  ON im.product_id = si.product_id
 AND im.motivo LIKE '%' || s.numero_pedido || '%'
 AND im.motivo LIKE '%Talla ' || si.talla || '%'
WHERE s.id = '<SALE_ID>'
ORDER BY si.id, im.created_at ASC, im.id ASC;

-- 12. Una única SALIDA después de un pago exitoso
-- Valida: cantidad de SALIDAS asociadas a cada item mediante pedido, producto y talla.
-- Escenario QA: inmediatamente después de confirmar correctamente un pago pendiente.
-- Esperado: salida_count = 1 y salida_quantity = item_quantity para cada item.
SELECT
  si.id AS sale_item_id,
  si.product_id,
  si.talla,
  si.cantidad AS item_quantity,
  COUNT(im.id) AS salida_count,
  COALESCE(SUM(im.cantidad), 0) AS salida_quantity
FROM sales AS s
JOIN sale_items AS si ON si.sale_id = s.id
LEFT JOIN inventory_movements AS im
  ON im.product_id = si.product_id
 AND im.tipo = 'SALIDA'
 AND im.motivo = 'VENTA ' || s.numero_pedido || ' - Talla ' || si.talla
WHERE s.id = '<SALE_ID>'
GROUP BY si.id, si.product_id, si.talla, si.cantidad
ORDER BY si.id;

-- 13. Ausencia de movimientos posteriores a una operación rechazada
-- Valida: que no existan efectos de inventario del pedido a partir del instante de prueba.
-- Escenario QA: pago insuficiente, duplicado, ajeno o solicitado por STAFF.
-- Esperado: movement_count_after_rejection = 0; use el timestamp UTC capturado justo antes del intento.
SELECT
  COUNT(im.id) AS movement_count_after_rejection
FROM sales AS s
JOIN sale_items AS si ON si.sale_id = s.id
JOIN inventory_movements AS im
  ON im.product_id = si.product_id
 AND im.motivo LIKE '%' || s.numero_pedido || '%'
WHERE s.id = '<SALE_ID>'
  AND im.created_at >= TIMESTAMPTZ '<OPERATION_STARTED_AT_UTC>';

-- 14. Estado de cancelación, stock actual y ENTRADA después de cancelar una venta pagada
-- Valida: estado CANCELADO, stock actual y una ENTRADA equivalente por cada item vendido.
-- Escenario QA: cancelación válida de una venta que estaba PAGADO.
-- Esperado: estado CANCELADO, entrada_count = 1 y entrada_quantity = item_quantity por item.
-- La restauración exacta del stock requiere comparar current_stock con la captura realizada antes de la cancelación.
SELECT
  s.id AS sale_id,
  s.estado,
  si.id AS sale_item_id,
  si.product_id,
  si.talla,
  si.cantidad AS item_quantity,
  pv.stock AS current_stock,
  COUNT(im.id) AS entrada_count,
  COALESCE(SUM(im.cantidad), 0) AS entrada_quantity
FROM sales AS s
JOIN sale_items AS si ON si.sale_id = s.id
LEFT JOIN product_variants AS pv
  ON pv.product_id = si.product_id
 AND pv.talla = si.talla
LEFT JOIN inventory_movements AS im
  ON im.product_id = si.product_id
 AND im.tipo = 'ENTRADA'
 AND im.motivo = 'CANCELACION VENTA ' || s.numero_pedido || ' - Talla ' || si.talla
WHERE s.id = '<SALE_ID>'
GROUP BY s.id, s.estado, si.id, si.product_id, si.talla, si.cantidad, pv.stock
ORDER BY si.id;

-- 15. Estado y efectos parciales después de un error
-- Valida: estado de venta, stock actual y movimientos creados desde el inicio del intento.
-- Escenario QA: pago multi-item que falla por stock insuficiente o transición inválida.
-- Esperado: estado sin cambio, stock igual a la captura previa y new_movement_count = 0 por item.
SELECT
  s.id AS sale_id,
  s.estado,
  si.id AS sale_item_id,
  si.product_id,
  si.talla,
  si.cantidad,
  pv.stock AS current_stock,
  COUNT(im.id) AS new_movement_count
FROM sales AS s
JOIN sale_items AS si ON si.sale_id = s.id
LEFT JOIN product_variants AS pv
  ON pv.product_id = si.product_id
 AND pv.talla = si.talla
LEFT JOIN inventory_movements AS im
  ON im.product_id = si.product_id
 AND im.motivo LIKE '%' || s.numero_pedido || '%'
 AND im.created_at >= TIMESTAMPTZ '<OPERATION_STARTED_AT_UTC>'
WHERE s.id = '<SALE_ID>'
GROUP BY s.id, s.estado, si.id, si.product_id, si.talla, si.cantidad, pv.stock
ORDER BY si.id;
