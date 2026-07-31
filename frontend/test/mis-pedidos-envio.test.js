import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/pages/MisPedidos.jsx', import.meta.url), 'utf8')
const handler = source.slice(source.indexOf('const handleMarcarEnviado'), source.indexOf('const handleConfirmarAccion'))

test('enviar pedido bloquea doble clic y solo actualiza la UI tras éxito', () => {
  assert.match(source, /import \{ useState, useEffect, useRef \} from "react"/)
  assert.match(handler, /if \(envioEnCursoRef\.current\) return;/)
  assert.match(handler, /envioEnCursoRef\.current = true;/)
  assert.match(handler, /envioEnCursoRef\.current = false;/)

  const envio = handler.indexOf('await enviarPedido(id);')
  const cerrarModal = handler.indexOf('setPedidoSeleccionado(null);')
  const actualizarLista = handler.indexOf('setRefreshKey((k) => k + 1);')
  const exito = handler.indexOf('setPedidoEnviadoExitosamente(true);')
  assert.ok(envio < cerrarModal && cerrarModal < actualizarLista && actualizarLista < exito)

  const catchBlock = handler.slice(handler.indexOf('catch (err)'), handler.indexOf('finally'))
  assert.doesNotMatch(catchBlock, /setPedidoSeleccionado\(null\)|setPedidoEnviadoExitosamente\(true\)/)
})
