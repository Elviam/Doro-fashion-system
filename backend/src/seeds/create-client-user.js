import bcrypt from 'bcryptjs'
import { db } from '../config/firebase.js'

const CLIENT_USER = {
  nombre: 'Cliente',
  apellido: 'Demo',
  email: 'cliente@erp.local',
  usuario: 'cliente',
  password: 'Cliente123',
  role: 'CLIENTE',
  roleId: 'CLIENTE',
  telefono: '5551234567',
  rfc: 'CLDE000101ABC',
  activo: true
}

async function getClienteRolePermissions() {
  try {
    const roleDoc = await db.collection('roles').doc('CLIENTE').get()
    if (roleDoc.exists) {
      const roleData = roleDoc.data()
      return Array.isArray(roleData.permissions) ? roleData.permissions : ['auth:me', 'tienda:read']
    }
  } catch (err) {
    console.error('Error obteniendo permisos del rol CLIENTE:', err)
  }
  return ['auth:me', 'tienda:read']
}

async function findUserByUsuario(usuario) {
  const snapshot = await db
    .collection('users')
    .where('usuario', '==', usuario)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data()
  }
}

async function findClientByEmail(email) {
  const snapshot = await db
    .collection('clients')
    .where('email', '==', email)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data()
  }
}

async function createOrUpdateClientUser() {
  const passwordHash = await bcrypt.hash(CLIENT_USER.password, 10)
  const existingUser = await findUserByUsuario(CLIENT_USER.usuario)
  const existingClient = await findClientByEmail(CLIENT_USER.email)
  const clientePermissions = await getClienteRolePermissions()

  const userData = {
    nombre: CLIENT_USER.nombre,
    apellido: CLIENT_USER.apellido,
    email: CLIENT_USER.email,
    usuario: CLIENT_USER.usuario,
    passwordHash,
    role: CLIENT_USER.role,
    roleId: CLIENT_USER.roleId,
    permissions: clientePermissions,
    activo: CLIENT_USER.activo,
    updatedAt: new Date().toISOString()
  }

  const clientData = {
    nombre: CLIENT_USER.nombre,
    email: CLIENT_USER.email,
    telefono: CLIENT_USER.telefono,
    rfc: CLIENT_USER.rfc,
    activo: CLIENT_USER.activo,
    roleId: CLIENT_USER.roleId,
    updatedAt: new Date().toISOString()
  }

  let userResult = null
  if (existingUser) {
    await db.collection('users').doc(existingUser.id).set(userData, { merge: true })
    userResult = {
      id: existingUser.id,
      created: false
    }
  } else {
    const userRef = await db.collection('users').add({
      ...userData,
      createdAt: new Date().toISOString()
    })
    userResult = {
      id: userRef.id,
      created: true
    }
  }

  let clientResult = null
  if (existingClient) {
    await db.collection('clients').doc(existingClient.id).set(clientData, { merge: true })
    clientResult = {
      id: existingClient.id,
      created: false
    }
  } else {
    const clientRef = await db.collection('clients').add({
      ...clientData,
      createdAt: new Date().toISOString()
    })
    clientResult = {
      id: clientRef.id,
      created: true
    }
  }

  return {
    user: userResult,
    client: clientResult
  }
}

async function main() {
  console.log('🚀 Iniciando creación de usuario cliente...')

  const result = await createOrUpdateClientUser()

  console.log(result.user.created ? '✅ Usuario cliente creado correctamente' : '✅ Usuario cliente actualizado correctamente')
  console.log(result.client.created ? '✅ Cliente creado correctamente' : '✅ Cliente actualizado correctamente')
  console.log('----------------------------------------')
  console.log(`ID Usuario: ${result.user.id}`)
  console.log(`ID Cliente: ${result.client.id}`)
  console.log(`Usuario: ${CLIENT_USER.usuario}`)
  console.log(`Email: ${CLIENT_USER.email}`)
  console.log(`Password: ${CLIENT_USER.password}`)
  console.log(`Role: ${CLIENT_USER.role}`)
  console.log('----------------------------------------')
}

main().catch((error) => {
  console.error('❌ Error al crear el usuario cliente')
  console.error(error)
  process.exit(1)
})
