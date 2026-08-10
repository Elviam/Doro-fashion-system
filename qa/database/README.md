# SQL de validación QA

`validation-queries.sql` reúne consultas PostgreSQL de solo lectura para revisar ventas, items, variantes y movimientos de inventario durante pruebas QA. Sirve como apoyo para escenarios de creación, pago, rechazo, cancelación, trazabilidad y atomicidad.

## Uso

1. Abra el archivo en un cliente conectado a un entorno local o de pruebas autorizado.
2. Copie únicamente la consulta necesaria.
3. Sustituya los placeholders, por ejemplo `'<SALE_ID>'`, `'<PRODUCT_ID>'`, `'<VARIANT_ID>'`, `'<ORDER_NUMBER>'` y `'<OPERATION_STARTED_AT_UTC>'`, por valores del escenario vigente. Conserve las comillas para valores de texto y use un timestamp ISO 8601 UTC para el placeholder temporal.
4. Para comparaciones antes/después, ejecute la consulta correspondiente antes de la operación, preserve el resultado y vuelva a ejecutarla después.

Todas las sentencias incluidas son `SELECT`; el artefacto no crea ni modifica datos, esquema o migraciones. Revise siempre la conexión antes de ejecutar consultas y no use credenciales de producción en archivos versionados.

Las consultas complementan los casos y ejecuciones documentados en `qa/test-cases/` y `qa/test-runs/`. No reemplazan los pasos, resultados ni evidencias históricas de esas pruebas, y no se afirma que estas consultas hayan sido ejecutadas como parte de la creación del artefacto.

## Limitaciones del modelo

- `SaleItem` no almacena `variant_id`; la variante se resuelve mediante la combinación real `product_id` + `talla`.
- `InventoryMovement` se relaciona con `Product`, pero no tiene una relación directa con `Sale`, `SaleItem` ni `ProductVariant`.
- La correlación con una venta y talla depende del formato actual de `motivo`: `VENTA <numero_pedido> - Talla <talla>` o `CANCELACION VENTA <numero_pedido> - Talla <talla>`.
- `InventoryMovement` no conserva stock anterior/posterior; esa comparación requiere capturas separadas de `ProductVariant.stock`.

Este archivo es una guía reutilizable de validación manual y exploratoria. No constituye una suite automatizada de pruebas de base de datos.

