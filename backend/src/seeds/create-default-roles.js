import { db } from '../config/firebase.js'

const DEFAULT_ROLES = [
  {
    id: 'BODEGUERO',
    nombre: 'BODEGUERO',
    descripcion: 'Rol bodeguero con acceso a inventario, productos, proveedores y recepciones',
    permissions: [
      'auth:me',
      'dashboard:read',
      'inventory:read',
      'inventory:update',
      'products:read',
      'recepciones:create',
      'recepciones:read',
      'recepciones:update',
      'suppliers:read'
    ]
  },
  {
    id: 'GERENTE',
    nombre: 'GERENTE',
    descripcion: 'Rol gerente con acceso de supervisión y gestión operativa',
    permissions: [
      'auth:me',
      'audit:read',
      'clients:create',
      'clients:read',
      'clients:update',
      'dashboard:read',
      'inventory:read',
      'inventory:update',
      'products:create',
      'products:read',
      'products:update',
      'recepciones:create',
      'recepciones:read',
      'recepciones:update',
      'roles:read',
      'suppliers:create',
      'suppliers:read',
      'suppliers:update',
      'users:create',
      'users:read',
      'users:update',
      'ventas:read',
      'ventas:update'
    ]
  },
  {
    id: 'CLIENTE',
    nombre: 'CLIENTE',
    descripcion: 'Rol cliente con acceso básico al sistema y a la tienda',
    permissions: [
      'auth:me',
      'tienda:read'
    ]
  },
  {
    id: 'VENDEDOR',
    nombre: 'VENDEDOR',
    descripcion: 'Rol vendedor con acceso a clientes, productos e inventario de consulta',
    permissions: [
      'auth:me',
      'clients:create',
      'clients:read',
      'clients:update',
      'dashboard:read',
      'inventory:read',
      'products:read',
      'ventas:read'
    ]
  },
  {
    id: 'role_admin',
    nombre: 'ADMIN',
    descripcion: 'Rol administrador con acceso total',
    permissions: [
      'audit:read',
      'auth:me',
      'clients:create',
      'clients:delete',
      'clients:read',
      'clients:update',
      'dashboard:read',
      'inventory:read',
      'inventory:update',
      'permissions:create',
      'permissions:delete',
      'permissions:read',
      'permissions:seed',
      'permissions:update',
      'products:create',
      'products:delete',
      'products:read',
      'products:update',
      'recepciones:create',
      'recepciones:delete',
      'recepciones:read',
      'recepciones:update',
      'roles:create',
      'roles:delete',
      'roles:read',
      'roles:update',
      'suppliers:create',
      'suppliers:delete',
      'suppliers:read',
      'suppliers:update',
      'users:create',
      'users:delete',
      'users:read',
      'users:update',
      'ventas:read',
      'ventas:update'
    ]
  }
]

async function crearRolesDefault() {
  const rolesCollection = db.collection('roles')
  const batch = db.batch()

  for (const role of DEFAULT_ROLES) {
    const ref = rolesCollection.doc(role.id)

    batch.set(ref, {
      nombre: role.nombre,
      descripcion: role.descripcion,
      permissions: role.permissions,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true })
  }

  await batch.commit()
  console.log('✓ Roles creados exitosamente')
}

crearRolesDefault().catch((error) => {
  console.error('Error creando roles:', error)
  process.exit(1)
})
