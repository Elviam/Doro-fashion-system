import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

test('las rutas internas vigentes permanecen montadas y configuración continúa retirada', async () => {
  const [app, sidebar, personal, personalForm] = await Promise.all([
    read('frontend/src/App.jsx'),
    read('frontend/src/components/Sidebar.jsx'),
    read('frontend/src/pages/Usuarios.jsx'),
    read('frontend/src/components/FormUsuarios.jsx'),
  ])
  for (const route of [
    '/dashboard', '/productos', '/recepciones', '/clientes', '/proveedores',
    '/usuarios', '/auditoria', '/ventas', '/inventario',
    '/preparar-pedidos', '/reabastecimiento', '/reabastecimiento/pedidos',
    '/reabastecimiento/generar-pedido', '/perfil'
  ]) assert.match(app, new RegExp(`path="${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`))
  assert.doesNotMatch(app, /path="\/configuracion"/)
  assert.match(sidebar, /label: "Personal", ruta: "\/usuarios"/)
  assert.match(sidebar, /label: "Auditoría", ruta: "\/auditoria"/)
  assert.doesNotMatch(sidebar, /label: "Configuración"|ruta: "\/configuracion"/)
  assert.match(personal, /rolesDisponibles=\{rolesDB\}/)
  assert.match(personal, /permisosDisponibles=\{permisosDB\}/)
  assert.match(personalForm, /titulo="Ajustar permisos"/)
})

test('sidebar conserva el orden operativo y reabastecimiento depende de sus permisos propios', async () => {
  const sidebar = await read('frontend/src/components/Sidebar.jsx')
  const sections = ['GENERAL', 'VENTAS Y CATÁLOGO', 'OPERACIÓN DE ALMACÉN', 'ABASTECIMIENTO', 'ADMINISTRACIÓN Y CONTROL']
  let previous = -1
  for (const section of sections) {
    const position = sidebar.indexOf(`section: "${section}"`)
    assert.ok(position > previous, `${section} debe conservar el orden solicitado`)
    previous = position
  }
  assert.match(sidebar, /anyPermissions: \["reabastecimiento:read", "pedidos_proveedor:create", "pedidos_proveedor:send"\]/)
  assert.match(sidebar, /ruta: "\/reabastecimiento", permiso: "reabastecimiento:read"/)
  assert.match(sidebar, /ruta: "\/reabastecimiento\/generar-pedido", permiso: "pedidos_proveedor:create"/)
  assert.match(sidebar, /ruta: "\/reabastecimiento\/pedidos", anyPermissions: \["reabastecimiento:read", "pedidos_proveedor:send"\]/)
  assert.doesNotMatch(sidebar, /recepciones:create|recepciones:enviar/)
  for (const route of ['/reabastecimiento', '/reabastecimiento/generar-pedido', '/reabastecimiento/pedidos']) assert.match(sidebar, new RegExp(route.replaceAll('/', '\\/')))
})

test('el catálogo del modal muestra acciones reales y oculta permisos legados', async () => {
  const catalog = await read('frontend/src/config/permissionPresentation.js')
  for (const code of ['dashboard:read', 'ventas:read', 'products:create', 'inventory:update', 'fulfillment:update', 'recepciones:confirm', 'reabastecimiento:read', 'pedidos_proveedor:create', 'audit:read']) {
    assert.match(catalog, new RegExp(`'${code.replace(':', ':')}'`))
  }
  assert.doesNotMatch(catalog, /'recepciones:create'|\brecepciones:enviar\b|roles:create|roles:delete|permissions:create|permissions:delete/)
  assert.match(catalog, /MODULE_ALIASES = \{ roles: 'configuracion', permissions: 'configuracion' \}/)
})
