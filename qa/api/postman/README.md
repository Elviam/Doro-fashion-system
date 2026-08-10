# Colección Postman QA

`Doro-QA.postman_collection.json` es una herramienta reutilizable para validar contratos y autorización de la API actual. Fue construida a partir de las rutas, esquemas, controladores, servicios y middleware versionados; no es una copia literal de TR-SI-001.

## Importación y configuración

1. Importe `Doro-QA.postman_collection.json` en Postman.
2. Mantenga `base_url` apuntando a `http://localhost:3000/api` o cámbiela por un entorno QA autorizado que incluya el prefijo `/api`.
3. Configure las variables necesarias en su ámbito local/current value:
   - `client_email` y `client_password`: cuenta CLIENT sintética del entorno.
   - `other_client_email` y `other_client_password`: una segunda cuenta CLIENT sintética, diferente de la principal; `Other client login` guarda su JWT en `other_client_token`.
   - `staff_username` y `staff_password`: cuenta STAFF sintética con los permisos indicados por cada request.
   - `product_id` y `size`: producto activo y talla existentes, con stock apropiado para el escenario.
   - `ownership_sale_id`: venta `PENDIENTE` propiedad del CLIENT principal y ajena al segundo CLIENT.
4. Ejecute `Client login`, `Other client login` y `Staff login` para guardar temporalmente `client_token`, `other_client_token` y `staff_token`. También puede pegarlos en los valores locales sin editar el JSON versionado.

No guarde JWT, passwords, cookies, API keys ni credenciales reales como initial/shared values. Antes de exportar la colección, limpie los current values; Postman puede conservar variables locales en el workspace aunque el archivo del repositorio esté sanitizado.

## Estructura

- **Authentication**: login del CLIENT principal, login de un segundo CLIENT, login STAFF y verificación de las sesiones principal y STAFF mediante `GET /auth/me`.
- **Sales**: creación por CLIENT, pedidos propios, listado y consulta para STAFF, pago simulado del propietario y cancelación por STAFF autorizado.
- **Authorization - Negative Testing**: pago de una venta ajena, STAFF contra el endpoint exclusivo de CLIENT y CLIENT contra la consulta exclusiva de STAFF.

La creación exitosa guarda `sale_id` y `order_number` para requests posteriores del flujo positivo. La prueba `Other CLIENT cannot pay foreign sale` usa por separado `ownership_sale_id`: debe identificar una venta `PENDIENTE` del CLIENT principal, mientras el segundo CLIENT debe ser una cuenta distinta que no sea su propietaria. Esta separación evita depender del estado pagado o cancelado que alcance `sale_id` en el flujo positivo. Las assertions comprueban códigos HTTP, estructura mínima, tipo de cuenta y estados principales sin depender de IDs históricos.

## Uso seguro y permisos

Las requests `Create sale`, `Confirm simulated payment` y `Cancel sale` modifican datos. Ejecútelas únicamente en local o en un entorno QA autorizado y controlado. No apunte la colección al deployment público o a producción para ejecutar mutaciones.

El listado de ventas requiere una cuenta STAFF con `ventas:read` o `tienda:read`; la consulta por ID requiere `ventas:read`; la cancelación requiere `ventas:update`. Los rechazos de tipo de cuenta se apoyan además en `requireClientAccount` y `requireStaffAccount`.

La colección fue construida desde el código y no fue ejecutada al crear estos archivos. Crear una request o una assertion no constituye un resultado PASS. Los resultados y evidencias históricas de TR-SI-001 permanecen en `qa/test-runs/` y `qa/evidence/TR-SI-001/`.
