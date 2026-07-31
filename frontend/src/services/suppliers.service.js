import { staffApi } from './api'

function isoToDisplay(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
}

function toFrontend(supplier) {
  return {
    id: supplier.id, nombre: supplier.nombre || '', rfc: supplier.rfc || '', giro: supplier.giro || '',
    email: supplier.email || '', telefono: supplier.telefono || '', contacto: supplier.contacto || '',
    direccion: supplier.direccion || '', notas: supplier.notas || '', estado: supplier.activo !== false ? 'Activo' : 'Inactivo',
    creado: isoToDisplay(supplier.createdAt), editado: isoToDisplay(supplier.updatedAt),
  }
}

function toBackend(formData) {
  return {
    nombre: formData.nombre, rfc: formData.rfc || '', email: formData.email || '', telefono: formData.telefono || '',
    contacto: formData.contacto || '', direccion: formData.direccion || '', giro: formData.giro || '',
    notas: formData.notas || '', activo: formData.estado === 'Activo',
  }
}

export async function fetchSuppliers({ q = '', activo, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ page, limit })
  if (q) params.set('q', q)
  if (typeof activo === 'boolean') params.set('activo', String(activo))
  const data = await staffApi.get(`/suppliers?${params}`)
  return { items: (data.items || []).map(toFrontend), total: data.total ?? 0, page: data.page ?? page, limit: data.limit ?? limit }
}

export async function createSupplier(formData) {
  return toFrontend((await staffApi.post('/suppliers', toBackend(formData))).item)
}

export async function updateSupplier(id, formData) {
  return toFrontend((await staffApi.patch(`/suppliers/${id}`, toBackend(formData))).item)
}

export async function deleteSupplier(id) {
  await staffApi.delete(`/suppliers/${id}`)
  return true
}
