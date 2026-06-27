import { suppliersRepository } from './suppliers.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

function normalizeOptionalText(value) {
  if (value === undefined) return undefined
  if (value === null) return null

  const trimmed = String(value).trim()
  return trimmed === '' ? '' : trimmed
}

export class SuppliersService {
  async list(query) {
    const {
      q = '',
      activo,
      page = 1,
      limit = 10
    } = query

     const activoBool = activo === true ? true : activo === 'true' ? true : activo === 'false' ? false : undefined

    const allSuppliers = await suppliersRepository.findAll()
    let filtered = Array.isArray(allSuppliers) ? allSuppliers : (allSuppliers.items ?? [])

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((supplier) => {
        return (
          String(supplier.nombre || '').toLowerCase().includes(term) ||
          String(supplier.rfc || '').toLowerCase().includes(term) ||
          String(supplier.email || '').toLowerCase().includes(term) ||
          String(supplier.telefono || '').toLowerCase().includes(term) ||
          String(supplier.contacto || '').toLowerCase().includes(term) ||
          String(supplier.direccion || '').toLowerCase().includes(term) ||
          String(supplier.giro || '').toLowerCase().includes(term)
        )
      })
    }

    if (typeof activoBool === 'boolean') {
      filtered = filtered.filter((supplier) => (supplier.activo ?? true) === activoBool)
     
    }

    filtered.sort((a, b) => {
      const aName = String(a.nombre || '').toLowerCase()
      const bName = String(b.nombre || '').toLowerCase()
      return aName.localeCompare(bName)
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const items = filtered.slice(start, end).map((supplier) => this.sanitizeSupplier(supplier))

    return {
      items,
      total,
      page,
      limit
    }
  }

  async getById(id) {
    const supplier = await suppliersRepository.findById(id)

    if (!supplier) {
      const error = new Error('Proveedor no encontrado')
      error.statusCode = 404
      throw error
    }

    return this.sanitizeSupplier(supplier)
  }

  async create(payload, currentUser = null) {
    const normalizedEmail = payload.email ? String(payload.email).trim().toLowerCase() : ''
    const normalizedRfc = payload.rfc ? String(payload.rfc).trim().toUpperCase() : ''

    if (normalizedEmail) {
      const existingByEmail = await suppliersRepository.findByEmail(normalizedEmail)

      if (existingByEmail) {
        const error = new Error('El email del proveedor ya existe')
        error.statusCode = 409
        throw error
      }
    }

    if (normalizedRfc) {
      const existingByRfc = await suppliersRepository.findByRfc(normalizedRfc)

      if (existingByRfc) {
        const error = new Error('El RFC del proveedor ya existe')
        error.statusCode = 409
        throw error
      }
    }

    const data = {
      nombre: payload.nombre.trim(),
      rfc: normalizedRfc || '',
      email: normalizedEmail || '',
      telefono: normalizeOptionalText(payload.telefono) || '',
      direccion: normalizeOptionalText(payload.direccion) || '',
      contacto: normalizeOptionalText(payload.contacto) || '',
      giro: normalizeOptionalText(payload.giro) || '',
      notas: normalizeOptionalText(payload.notas) || '',
      activo: payload.activo ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const created = await suppliersRepository.create(data)
    const sanitized = this.sanitizeSupplier(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'suppliers',
      resourceId: created.id,
      details: {
        nombre: sanitized.nombre,
        rfc: sanitized.rfc,
        email: sanitized.email,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async update(id, payload, currentUser = null) {
    const currentSupplier = await suppliersRepository.findById(id)

    if (!currentSupplier) {
      const error = new Error('Proveedor no encontrado')
      error.statusCode = 404
      throw error
    }

    if (payload.email !== undefined) {
      const normalizedEmail = payload.email ? String(payload.email).trim().toLowerCase() : ''

      if (normalizedEmail && normalizedEmail !== String(currentSupplier.email || '').toLowerCase()) {
        const existingByEmail = await suppliersRepository.findByEmail(normalizedEmail)

        if (existingByEmail && existingByEmail.id !== id) {
          const error = new Error('El email del proveedor ya existe')
          error.statusCode = 409
          throw error
        }
      }
    }

    if (payload.rfc !== undefined) {
      const normalizedRfc = payload.rfc ? String(payload.rfc).trim().toUpperCase() : ''

      if (normalizedRfc && normalizedRfc !== String(currentSupplier.rfc || '').toUpperCase()) {
        const existingByRfc = await suppliersRepository.findByRfc(normalizedRfc)

        if (existingByRfc && existingByRfc.id !== id) {
          const error = new Error('El RFC del proveedor ya existe')
          error.statusCode = 409
          throw error
        }
      }
    }

    const data = {
      updatedAt: new Date().toISOString()
    }

    if (payload.nombre !== undefined) data.nombre = payload.nombre.trim()
    if (payload.rfc !== undefined) data.rfc = payload.rfc ? String(payload.rfc).trim().toUpperCase() : ''
    if (payload.email !== undefined) data.email = payload.email ? String(payload.email).trim().toLowerCase() : ''
    if (payload.telefono !== undefined) data.telefono = normalizeOptionalText(payload.telefono) || ''
    if (payload.direccion !== undefined) data.direccion = normalizeOptionalText(payload.direccion) || ''
    if (payload.contacto !== undefined) data.contacto = normalizeOptionalText(payload.contacto) || ''
    if (payload.giro !== undefined) data.giro = normalizeOptionalText(payload.giro) || ''
    if (payload.notas !== undefined) data.notas = normalizeOptionalText(payload.notas) || ''
    if (payload.activo !== undefined) data.activo = payload.activo

    const updated = await suppliersRepository.update(id, data)
    const sanitized = this.sanitizeSupplier(updated)

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'suppliers',
      resourceId: updated.id,
      details: {
        changes: Object.keys(payload),
        nombre: sanitized.nombre,
        rfc: sanitized.rfc,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async toggleActive(id, activo, currentUser = null) {
    const currentSupplier = await suppliersRepository.findById(id)

    if (!currentSupplier) {
      const error = new Error('Proveedor no encontrado')
      error.statusCode = 404
      throw error
    }

    const updated = await suppliersRepository.update(id, {
      activo,
      updatedAt: new Date().toISOString()
    })

    const sanitized = this.sanitizeSupplier(updated)

    await logAuditEvent({
      action: 'TOGGLE_ACTIVE',
      resource: 'suppliers',
      resourceId: updated.id,
      details: {
        nombre: sanitized.nombre,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async remove(id, currentUser = null) {
    const currentSupplier = await suppliersRepository.findById(id)

    if (!currentSupplier) {
      const error = new Error('Proveedor no encontrado')
      error.statusCode = 404
      throw error
    }

    await suppliersRepository.remove(id)

    await logAuditEvent({
      action: 'DELETE',
      resource: 'suppliers',
      resourceId: id,
      details: {
        nombre: currentSupplier.nombre || '',
        rfc: currentSupplier.rfc || ''
      },
      currentUser
    })

    return {
      success: true
    }
  }

  sanitizeSupplier(supplier) {
    return {
      id: supplier.id,
      nombre: supplier.nombre || '',
      rfc: supplier.rfc || '',
      email: supplier.email || '',
      telefono: supplier.telefono || '',
      direccion: supplier.direccion || '',
      contacto: supplier.contacto || '',
      giro: supplier.giro || '',
      notas: supplier.notas || '',
      activo: supplier.activo ?? true,
      createdAt: supplier.createdAt || null,
      updatedAt: supplier.updatedAt || null
    }
  }
}

export const suppliersService = new SuppliersService()