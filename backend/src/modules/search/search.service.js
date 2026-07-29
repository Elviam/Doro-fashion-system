import { prisma } from '../../lib/prisma.js'

const TAKE_PER_SECTION = 8

function tokenize(query) {
  return String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5)
}

function matchesAllTerms(fields, terms) {
  return {
    AND: terms.map((term) => ({
      OR: fields.map((field) => ({ [field]: { contains: term, mode: 'insensitive' } }))
    }))
  }
}

function hasPermission(permissions, code) {
  return Array.isArray(permissions) && permissions.includes(code)
}

export async function performSearch(searchTerm, userPermissions = []) {
  const terms = tokenize(searchTerm)
  if (terms.length === 0) return {}

  const canReadProducts = hasPermission(userPermissions, 'products:read')
  const canReadInventory = hasPermission(userPermissions, 'inventory:read')
  const queries = []

  if (canReadProducts || canReadInventory) {
    queries.push(prisma.product.findMany({
      where: matchesAllTerms(['nombre', 'sku', 'categoria', 'descripcion', 'departamento'], terms),
      select: { id: true, nombre: true, sku: true, categoria: true, imagenes: true, activo: true },
      take: TAKE_PER_SECTION,
      orderBy: { nombre: 'asc' }
    }).then((items) => [canReadProducts ? 'productos' : 'inventario', items]))
  }

  if (hasPermission(userPermissions, 'clients:read')) {
    queries.push(prisma.client.findMany({
      where: matchesAllTerms(['nombre', 'email', 'telefono', 'rfc', 'direccion'], terms),
      select: { id: true, nombre: true, email: true, telefono: true },
      take: TAKE_PER_SECTION,
      orderBy: { nombre: 'asc' }
    }).then((items) => ['clientes', items]))
  }

  if (hasPermission(userPermissions, 'suppliers:read')) {
    queries.push(prisma.supplier.findMany({
      where: matchesAllTerms(['nombre', 'email', 'telefono', 'rfc', 'contacto', 'giro'], terms),
      select: { id: true, nombre: true, contacto: true, email: true },
      take: TAKE_PER_SECTION,
      orderBy: { nombre: 'asc' }
    }).then((items) => ['proveedores', items]))
  }

  if (hasPermission(userPermissions, 'users:read')) {
    queries.push(prisma.user.findMany({
      where: matchesAllTerms(['nombre', 'apellido', 'usuario', 'email'], terms),
      select: { id: true, nombre: true, apellido: true, usuario: true, email: true },
      take: TAKE_PER_SECTION,
      orderBy: { nombre: 'asc' }
    }).then((items) => ['usuarios', items]))
  }

  if (hasPermission(userPermissions, 'recepciones:read')) {
    queries.push(prisma.reception.findMany({
      where: {
        origen: 'REABASTECIMIENTO',
        estado: { not: 'BORRADOR' },
        AND: terms.map((term) => ({ OR: [
          { folio: { contains: term, mode: 'insensitive' } },
          { facturaProveedor: { contains: term, mode: 'insensitive' } },
          { comentarios: { contains: term, mode: 'insensitive' } },
          { supplier: { is: { nombre: { contains: term, mode: 'insensitive' } } } },
          { items: { some: { product: { is: { OR: [{ nombre: { contains: term, mode: 'insensitive' } }, { sku: { contains: term, mode: 'insensitive' } }] } } } } }
        ] }))
      },
      select: { id: true, folio: true, estado: true, supplier: { select: { nombre: true } } },
      take: TAKE_PER_SECTION,
      orderBy: { createdAt: 'desc' }
    }).then((items) => ['recepciones', items.map((item) => ({ ...item, proveedor: item.supplier?.nombre || '' }))]))
  }

  if (hasPermission(userPermissions, 'ventas:read') || hasPermission(userPermissions, 'fulfillment:read')) {
    const categoria = hasPermission(userPermissions, 'ventas:read') ? 'ventas' : 'preparacion'
    queries.push(prisma.sale.findMany({
      where: {
        AND: terms.map((term) => ({ OR: [
          { numeroPedido: { contains: term, mode: 'insensitive' } },
          { cliente: { is: { nombre: { contains: term, mode: 'insensitive' } } } },
          { cliente: { is: { direccion: { contains: term, mode: 'insensitive' } } } },
          { items: { some: { nombreProducto: { contains: term, mode: 'insensitive' } } } }
        ] }))
      },
      select: { id: true, numeroPedido: true, estado: true, cliente: { select: { nombre: true } } },
      take: TAKE_PER_SECTION,
      orderBy: { createdAt: 'desc' }
    }).then((items) => [categoria, items.map((item) => ({ ...item, clienteNombre: item.cliente?.nombre || '' }))]))
  }

  if (hasPermission(userPermissions, 'audit:read')) {
    queries.push(prisma.auditLog.findMany({
      where: {
        AND: terms.map((term) => ({ OR: [
          { accion: { contains: term, mode: 'insensitive' } },
          { entidad: { contains: term, mode: 'insensitive' } },
          { entidadId: { contains: term, mode: 'insensitive' } },
          { user: { is: { usuario: { contains: term, mode: 'insensitive' } } } },
          { user: { is: { nombre: { contains: term, mode: 'insensitive' } } } }
        ] }))
      },
      select: { id: true, accion: true, entidad: true, user: { select: { nombre: true, usuario: true } } },
      take: TAKE_PER_SECTION,
      orderBy: { createdAt: 'desc' }
    }).then((items) => ['auditoria', items.map((item) => ({ ...item, action: item.accion, usuario: item.user?.nombre || item.user?.usuario || '' }))]))
  }

  return Object.fromEntries(await Promise.all(queries))
}
