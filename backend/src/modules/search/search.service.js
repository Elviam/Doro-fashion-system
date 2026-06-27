import { db } from '../../config/firebase.js';

export const performSearch = async (searchTerm) => {
  const term = searchTerm.toLowerCase();

  const [
    auditSnap,
    clientsSnap,
    inventorySnap,
    permissionsSnap,
    productsSnap,
    recepcionesSnap,
    rolesSnap,
    suppliersSnap,
    usersSnap
  ] = await Promise.all([
    db.collection('audit').get(),
    db.collection('clients').get(),
    db.collection('inventory_movements').get(),
    db.collection('permissions').get(),
    db.collection('products').get(),
    db.collection('recepciones').get(),
    db.collection('roles').get(),
    db.collection('suppliers').get(),
    db.collection('users').get()
  ]);

  const filterData = (snapshot, fieldsToSearch) => {
    const results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const matches = fieldsToSearch.some(field => {
        return data[field] && String(data[field]).toLowerCase().includes(term);
      });

      if (matches) {
        results.push({ id: doc.id, ...data });
      }
    });
    return results.slice(0, 15);
  };

  return {
    auditoria: filterData(auditSnap, ['action', 'details', 'resource', 'usuario']),
    clientes: filterData(clientsSnap, ['direccion', 'email', 'nombre', 'rfc', 'telefono']),
    inventario: filterData(inventorySnap, ['tipo', 'motivo', 'productNombre']),
    permisos: filterData(permissionsSnap, ['nombre', 'modulo']),
    productos: filterData(productsSnap, ['nombre', 'sku', 'categoria', 'marca', 'descripcion', 'departamento']),
    recepciones: filterData(recepcionesSnap, ['proveedor', 'comentarios']),
    roles: filterData(rolesSnap, ['nombre']),
    usuarios: filterData(usersSnap, ['nombre', 'apellido', 'usuario', 'email', 'telefono']),
    proveedores: filterData(suppliersSnap, ['contacto', 'direccion', 'email', 'giro', 'nombre', 'rfc', 'telefono', 'notas']),
    roles: filterData(rolesSnap, ['nombre']),
  };
};