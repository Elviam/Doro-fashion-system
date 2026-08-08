# BUG-AUTH-001 — Cliente accede al perfil interno de STAFF al compartir sesiones

## Identificación

| Campo | Valor |
|---|---|
| ID | BUG-AUTH-001 |
| Módulo | Autenticación / Navegación / Perfiles |
| Fecha | 6 de agosto de 2026 |
| Reportado por | Elvia Gutiérrez García |
| Ambiente | Desarrollo local |
| Rama | `feature/erp-refactor` |
| Commit | `10c0dc9` |
| Severidad | Alta |
| Prioridad | Alta |
| Estado | OPEN |

## Título

Un cliente es dirigido al perfil interno del sistema y aparece autenticado como ADMIN cuando existen sesiones de cliente y STAFF en pestañas del mismo navegador.

## Descripción

Durante la ejecución de pruebas de ventas e inventario se mantuvo una sesión ADMIN abierta en una pestaña del navegador. En otra pestaña del mismo navegador se inició sesión en la tienda como cliente con la cuenta `juan@gmail.com`.

Al seleccionar la opción “Mi perfil” desde la tienda, la aplicación abrió la sección de perfil del sistema interno y mostró la sesión de ADMIN, en lugar de presentar exclusivamente el perfil del cliente.

## Precondiciones

- Aplicación ejecutándose en desarrollo local.
- Una cuenta ADMIN válida.
- Una cuenta CLIENTE válida.
- Ambas sesiones abiertas en pestañas del mismo navegador.

## Pasos para reproducir

1. Abrir el panel interno e iniciar sesión como ADMIN.
2. Mantener abierta esa pestaña.
3. Abrir la tienda en otra pestaña del mismo navegador.
4. Iniciar sesión como cliente.
5. Desde la tienda, seleccionar “Mi perfil”.
6. Observar la ruta y la información de sesión mostrada.

## Resultado esperado

El cliente debe permanecer dentro de la tienda y acceder únicamente a su perfil de cliente.

La aplicación debe impedir que una cuenta CLIENTE acceda a rutas o componentes exclusivos de STAFF, aunque existan otras sesiones abiertas en el mismo navegador.

## Resultado obtenido

La navegación abrió el perfil interno del sistema y mostró la identidad de ADMIN.

## Impacto

- Confusión de identidad entre cuentas.
- Posible exposición de rutas o información de STAFF.
- Incumplimiento de la separación entre cuentas CLIENTE y STAFF.
- Riesgo de autorización si las rutas internas no validan correctamente `accountType` y rol.

## Hipótesis técnica

La causa no está confirmada. Es posible que la tienda y el panel interno compartan:

- la misma clave de token en `localStorage`;
- la misma ruta de perfil;
- un estado de autenticación común;
- protecciones de ruta que no distinguen correctamente entre CLIENTE y STAFF.

## Evidencia

Pendiente de captura o grabación.

## Solución temporal

Usar una ventana de incógnito o un navegador diferente para mantener simultáneamente una sesión CLIENTE y una sesión STAFF.

## Defecto descubierto durante

Ejecución exploratoria relacionada con `TR-SI-001`. No provocó el fallo de `TC-SI-004`.
