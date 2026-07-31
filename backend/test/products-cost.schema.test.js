import test from 'node:test'
import assert from 'node:assert/strict'
import { createProductSchema, updateProductSchema } from '../src/modules/products/products.schema.js'

const validProduct = {
  imagenes: ['https://example.test/producto.jpg'], nombre: 'Blusa de prueba', categoria: 'Blusas', departamento: 'Dama',
  stockMinimo: 1, stockIdeal: 2, stockMaximo: 3, precioCompra: 450,
}

test('precioCompra is mandatory, finite and greater than zero', () => {
  assert.equal(createProductSchema.safeParse({ ...validProduct, precioCompra: undefined }).success, false)
  assert.equal(createProductSchema.safeParse({ ...validProduct, precioCompra: 0 }).success, false)
  assert.equal(createProductSchema.safeParse({ ...validProduct, precioCompra: -1 }).success, false)
  assert.equal(createProductSchema.safeParse(validProduct).success, true)
  assert.equal(updateProductSchema.safeParse({ precioCompra: 0 }).success, false)
})
