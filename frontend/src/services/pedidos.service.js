import { staffApi } from './api'

export const ESTADO_PEDIDO_LABELS = { BORRADOR: 'En borrador', ENVIADA: 'Enviado', CONFIRMADA: 'Recibido', CANCELADA: 'Cancelado' }

export async function fetchPedidos({ page = 1, limit = 20 } = {}) {
  const data = await staffApi.get(`/recepciones?${new URLSearchParams({ page, limit, origen: 'REABASTECIMIENTO' })}`)
  return { items: data.items || [], total: data.total ?? 0 }
}

export async function crearPedido({ supplierId, items, comentarios, folio }) {
  const data = await staffApi.post('/recepciones', { origen: 'REABASTECIMIENTO', fecha: new Date().toISOString(), supplierId: supplierId || null, comentarios: comentarios || undefined, folio: folio?.trim() || undefined, items })
  return data.item
}

export async function enviarPedido(id) { return (await staffApi.patch(`/recepciones/${id}/enviar`, {})).item }
export async function cancelarPedido(id) { return (await staffApi.patch(`/recepciones/${id}/cancel`, {})).item }
export async function eliminarPedido(id) { return staffApi.delete(`/recepciones/${id}`) }
