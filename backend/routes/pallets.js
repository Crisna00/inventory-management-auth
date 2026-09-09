import { Router } from 'express'

const router = Router()

export let pallets = [
  {
    id: 'P01',
    name: 'Pallet P01',
    status: 'occupied',
    items: [
      {
        id: 'ITEM-001',
        sku: 'SKU-001',
        itemName: 'Produk A',
        packaging: 'Box',
        packageQty: 20,
        cartonQty: 5,
        sackQty: 0,
        weightKg: 125,
        barcode: '899000000001'
      }
    ]
  },
  {
    id: 'P02',
    name: 'Pallet P02',
    status: 'occupied',
    items: [
      {
        id: 'ITEM-002',
        sku: 'SKU-002',
        itemName: 'Produk B',
        packaging: 'Bag',
        packageQty: 30,
        cartonQty: 6,
        sackQty: 10,
        weightKg: 150,
        barcode: '899000000002'
      },
      {
        id: 'ITEM-003',
        sku: 'SKU-003',
        itemName: 'Produk C',
        packaging: 'Box',
        packageQty: 10,
        cartonQty: 2,
        sackQty: 0,
        weightKg: 50,
        barcode: '899000000003'
      }
    ]
  },
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `P0${index + 3}`,
    name: `Pallet P0${index + 3}`,
    status: 'empty',
    items: []
  }))
]

function generateItemId() {
  return `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function findPallet(palletId) {
  return pallets.find(
    pallet => pallet.id.toLowerCase() === palletId.toLowerCase()
  )
}

function calculateSummary(pallet) {
  const items = pallet.items || []

  return {
    totalWeight: items.reduce((sum, item) => sum + Number(item.weightKg || 0), 0),
    totalCartons: items.reduce((sum, item) => sum + Number(item.cartonQty || 0), 0),
    totalPackages: items.reduce((sum, item) => sum + Number(item.packageQty || 0), 0),
    totalSacks: items.reduce((sum, item) => sum + Number(item.sackQty || 0), 0),
    totalSku: new Set(items.map(item => item.sku)).size
  }
}

function formatPallet(pallet) {
  return {
    ...pallet,
    summary: calculateSummary(pallet)
  }
}

router.get('/', (_req, res) => {
  res.json(pallets.map(formatPallet))
})

router.get('/:palletId', (req, res) => {
  const pallet = findPallet(req.params.palletId)

  if (!pallet) {
    return res.status(404).json({
      message: 'Pallet tidak ditemukan'
    })
  }

  res.json(formatPallet(pallet))
})

router.post('/', (req, res) => {
  const { id, name } = req.body

  if (!id || !id.trim()) {
    return res.status(400).json({
      message: 'Pallet ID wajib diisi'
    })
  }

  if (findPallet(id.trim())) {
    return res.status(409).json({
      message: 'Pallet ID sudah digunakan'
    })
  }

  const pallet = {
    id: id.trim(),
    name: name?.trim() || `Pallet ${id.trim()}`,
    status: 'empty',
    items: []
  }

  pallets.push(pallet)
  res.status(201).json(formatPallet(pallet))
})

router.put('/:palletId', (req, res) => {
  const pallet = findPallet(req.params.palletId)

  if (!pallet) {
    return res.status(404).json({
      message: 'Pallet tidak ditemukan'
    })
  }

  if (req.body.name !== undefined) {
    pallet.name = String(req.body.name).trim()
  }

  if (req.body.status !== undefined) {
    pallet.status = req.body.status
  }

  res.json(formatPallet(pallet))
})

router.post('/:palletId/items', (req, res) => {
  const pallet = findPallet(req.params.palletId)

  if (!pallet) {
    return res.status(404).json({ message: 'Pallet tidak ditemukan' })
  }

  const {
    sku,
    itemName,
    packaging,
    packageQty,
    cartonQty,
    sackQty,
    weightKg,
    barcode
  } = req.body

  if (!sku?.trim()) {
    return res.status(400).json({ message: 'SKU wajib diisi' })
  }

  if (!itemName?.trim()) {
    return res.status(400).json({ message: 'Nama barang wajib diisi' })
  }

  if (barcode?.trim() && pallet.items.some(item => item.barcode === barcode.trim())) {
    return res.status(409).json({ message: 'Barcode sudah digunakan dalam pallet ini' })
  }

  const item = {
    id: generateItemId(),
    sku: sku.trim(),
    itemName: itemName.trim(),
    packaging: packaging?.trim() || '-',
    packageQty: Number(packageQty || 0),
    cartonQty: Number(cartonQty || 0),
    sackQty: Number(sackQty || 0),
    weightKg: Number(weightKg || 0),
    barcode: barcode?.trim() || ''
  }

  pallet.items.push(item)
  pallet.status = 'occupied'

  res.status(201).json({
    item,
    pallet: formatPallet(pallet)
  })
})

router.put('/:palletId/items/:itemId', (req, res) => {
  const pallet = findPallet(req.params.palletId)

  if (!pallet) {
    return res.status(404).json({ message: 'Pallet tidak ditemukan' })
  }

  const item = pallet.items.find(item => item.id === req.params.itemId)

  if (!item) {
    return res.status(404).json({ message: 'Item tidak ditemukan' })
  }

  if (req.body.sku !== undefined) item.sku = String(req.body.sku).trim()
  if (req.body.itemName !== undefined) item.itemName = String(req.body.itemName).trim()
  if (req.body.packaging !== undefined) item.packaging = String(req.body.packaging).trim()
  if (req.body.packageQty !== undefined) item.packageQty = Number(req.body.packageQty)
  if (req.body.cartonQty !== undefined) item.cartonQty = Number(req.body.cartonQty)
  if (req.body.sackQty !== undefined) item.sackQty = Number(req.body.sackQty)
  if (req.body.weightKg !== undefined) item.weightKg = Number(req.body.weightKg)
  if (req.body.barcode !== undefined) item.barcode = String(req.body.barcode).trim()

  res.json({
    item,
    pallet: formatPallet(pallet)
  })
})

router.delete('/:palletId/items/:itemId', (req, res) => {
  const pallet = findPallet(req.params.palletId)

  if (!pallet) {
    return res.status(404).json({ message: 'Pallet tidak ditemukan' })
  }

  const index = pallet.items.findIndex(item => item.id === req.params.itemId)

  if (index === -1) {
    return res.status(404).json({ message: 'Item tidak ditemukan' })
  }

  const [deletedItem] = pallet.items.splice(index, 1)

  if (pallet.items.length === 0) {
    pallet.status = 'empty'
  }

  res.json({
    message: 'Item berhasil dihapus',
    item: deletedItem,
    pallet: formatPallet(pallet)
  })
})

router.delete('/:palletId/items', (req, res) => {
  const pallet = findPallet(req.params.palletId)

  if (!pallet) {
    return res.status(404).json({ message: 'Pallet tidak ditemukan' })
  }

  pallet.items = []
  pallet.status = 'empty'

  res.json({
    message: 'Semua barang dalam pallet berhasil dikosongkan',
    pallet: formatPallet(pallet)
  })
})

export default router
