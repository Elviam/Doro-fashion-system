import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  isProductImageWithinSizeLimit,
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  uploadImageToCloudinary,
} from '../src/services/cloudinaryClient.js'

const formSource = await readFile(new URL('../src/components/FormProductos.jsx', import.meta.url), 'utf8')

test('el límite acepta hasta 1 MiB exacto y rechaza cualquier byte adicional', () => {
  assert.equal(isProductImageWithinSizeLimit({ size: MAX_PRODUCT_IMAGE_SIZE_BYTES - 1 }), true)
  assert.equal(isProductImageWithinSizeLimit({ size: MAX_PRODUCT_IMAGE_SIZE_BYTES }), true)
  assert.equal(isProductImageWithinSizeLimit({ size: MAX_PRODUCT_IMAGE_SIZE_BYTES + 1 }), false)
})

test('una selección mixta conserva solamente las imágenes de hasta 1 MiB', () => {
  const archivos = [
    { name: '300kb.jpg', size: 300 * 1024 },
    { name: '1-5mb.jpg', size: 1.5 * 1024 * 1024 },
    { name: '600kb.webp', size: 600 * 1024 },
  ]

  assert.deepEqual(archivos.filter(isProductImageWithinSizeLimit).map((file) => file.name), ['300kb.jpg', '600kb.webp'])
})

test('el formulario filtra antes de actualizar el estado y conserva el máximo de seis', () => {
  const convierteSeleccion = formSource.indexOf(
    'const archivos = Array.from(e.target.files);'
  )

  const filtraValidos = formSource.indexOf(
    'const archivosValidos = archivos.filter('
  )

  const actualizaEstado = formSource.indexOf(
    'setFormData((prev) =>',
    convierteSeleccion
  )

  assert.ok(
    convierteSeleccion !== -1 &&
    filtraValidos !== -1 &&
    actualizaEstado !== -1 &&
    convierteSeleccion < filtraValidos &&
    filtraValidos < actualizaEstado
  )

  assert.match(
    formSource,
    /nuevosArchivos\s*=\s*archivosValidos\.slice\(\s*0,\s*espacioDisponible\s*\)/
  )

  assert.match(
    formSource,
    /const\s+espacioDisponible\s*=\s*6\s*-\s*prev\.imagenes\.length/
  )
})

test('una imagen de 1 MiB exacto conserva el flujo normal hacia Cloudinary', async () => {
  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  globalThis.fetch = async () => {
    fetchCalls += 1
    return {
      ok: true,
      json: async () => ({ secure_url: 'https://example.test/producto.jpg' }),
    }
  }

  try {
    const result = await uploadImageToCloudinary(new Blob([
      new Uint8Array(MAX_PRODUCT_IMAGE_SIZE_BYTES),
    ], { type: 'image/jpeg' }))
    assert.equal(result, 'https://example.test/producto.jpg')
    assert.equal(fetchCalls, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('la defensa de Cloudinary no ejecuta fetch para una imagen mayor de 1 MiB', async () => {
  const originalFetch = globalThis.fetch
  const originalConsoleError = console.error
  let fetchCalls = 0
  globalThis.fetch = async () => {
    fetchCalls += 1
    throw new Error('No debe llamarse')
  }
  console.error = () => {}

  try {
    const result = await uploadImageToCloudinary({
      name: 'demasiado-grande.jpg',
      size: MAX_PRODUCT_IMAGE_SIZE_BYTES + 1,
    })
    assert.equal(result, null)
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
    console.error = originalConsoleError
  }
})
