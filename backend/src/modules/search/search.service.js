import { prisma } from '../../lib/prisma.js'

const TAKE = 15

function containsFilter(fields, term) {
  return {
    OR: fields.map((field) => ({
      [field]: { contains: term, mode: 'insensitive' }
    }))
  }
}

export const performSearch = async (searchTerm) => {
  const term = searchTerm

  const [
    auditLogs,
    clients,
    inventoryMovements,
    permissions,
    products,
    receptions,
    roles,
    suppliers,
    users
  ] = await Promise.all([
    // AuditLog no tiene un campo "usuario" plano — se busca vía la
    // relación con User (nombre o usuario). No se busca dentro de
    // "detalles" (JSON) porque requeriría SQL crudo con ruta específica.
    prisma.auditLog.findMany({
      where: {
        OR: [
          { accion: { contains: term, mode: 'insensitive' } },
          { entidad: { contains: term, mode: 'insensitive' } },
          { entidadId: { contains: term, mode: 'insensitive' } },
          { user: { usuario: { contains: term, mode: 'insensitive' } } },
          { user: { nombre: { contains: term, mode: 'insensitive' } } }
        ]
      },
      include: { user: true },
      take: TAKE
    }),

    prisma.client.findMany({
      where: containsFilter(['direccion', 'email', 'nombre', 'rfc', 'telefono'], term),
      take: TAKE
    }),

    // InventoryMovement no tiene "productNombre" propio — se busca vía
    // la relación con Product.
    prisma.inventoryMovement.findMany({
      where: {
        OR: [
          { tipo: { contains: term, mode: 'insensitive' } },
          { motivo: { contains: term, mode: 'insensitive' } },
          { product: { nombre: { contains: term, mode: 'insensitive' } } }
        ]
      },
      include: { product: true },
      take: TAKE
    }),

    // Permission ya no tiene "nombre" ni "modulo" en el schema actual;
    // se busca por code y description.
    prisma.permission.findMany({
      where: containsFilter(['code', 'description'], term),
      take: TAKE
    }),

    prisma.product.findMany({
      where: containsFilter(
        ['nombre', 'sku', 'categoria', 'marca', 'descripcion', 'departamento'],
        term
      ),
      take: TAKE
    }),

    // Reception no tiene "proveedor" propio — se busca vía la relación
    // con Supplier.
    prisma.reception.findMany({
      where: {
        OR: [
          { comentarios: { contains: term, mode: 'insensitive' } },
          { supplier: { nombre: { contains: term, mode: 'insensitive' } } }
        ]
      },
      include: { supplier: true },
      take: TAKE
    }),

    prisma.role.findMany({
      where: containsFilter(['nombre', 'codigo'], term),
      take: TAKE
    }),

    prisma.supplier.findMany({
      where: containsFilter(
        ['contacto', 'direccion', 'email', 'giro', 'nombre', 'rfc', 'telefono', 'notas'],
        term
      ),
      take: TAKE
    }),

    // User no tiene campo "telefono" en el schema actual — esa parte de
    // la búsqueda original ya no aplica.
    prisma.user.findMany({
      where: containsFilter(['nombre', 'apellido', 'usuario', 'email'], term),
      take: TAKE
    })
  ])

  return {
    auditoria: auditLogs.map((log) => ({
      id: log.id,
      action: log.accion,
      resource: log.entidad,
      resourceId: log.entidadId,
      details: log.detalles,
      usuario: log.user?.nombre || log.user?.usuario || null,
      createdAt: log.createdAt
    })),
    clientes: clients,
    inventario: inventoryMovements.map((mov) => ({
      id: mov.id,
      tipo: mov.tipo,
      motivo: mov.motivo,
      cantidad: mov.cantidad,
      productNombre: mov.product?.nombre || null,
      createdAt: mov.createdAt
    })),
    permisos: permissions,
    productos: products,
    recepciones: receptions.map((rec) => ({
      id: rec.id,
      folio: rec.folio,
      comentarios: rec.comentarios,
      estado: rec.estado,
      proveedor: rec.supplier?.nombre || null,
      createdAt: rec.createdAt
    })),
    roles: roles,
    usuarios: users,
    proveedores: suppliers
  }
}