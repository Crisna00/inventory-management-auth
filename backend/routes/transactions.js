import { Router } from 'express'

const router = Router()

let nextTransactionId = 1
let transactions = []

function findPallet(pallets, palletId) {
  return pallets.find(
    pallet => pallet.id.toLowerCase() === String(palletId).toLowerCase()
  )
}

function number(value) {
  const result = Number(value)
  return Number.isFinite(result) && result >= 0 ? result : 0
}

function generateTransactionId() {
  return `TRX-${String(nextTransactionId++).padStart(4, '0')}`
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function createTransactionRouter(palletStore) {
  const transactionRouter = Router()

  transactionRouter.get('/', (req, res) => {
    const { type, palletId } = req.query

    let result = [...transactions]

    if (type) {
      result = result.filter(transaction => transaction.type === type)
    }

    if (palletId) {
      result = result.filter(transaction => transaction.palletId === palletId)
    }

    result.sort(
      (a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt)
    )

    res.json(result)
  })

  transactionRouter.get('/:transactionId', (req, res) => {
    const transaction = transactions.find(
      item => item.id === req.params.transactionId
    )

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaksi tidak ditemukan'
      })
    }

    res.json(transaction)
  })

  transactionRouter.post('/', (req, res) => {
    const {
      type,
      palletId,
      driverName,
      nopol,
      items = []
    } = req.body

    if (!['inbound', 'outbound'].includes(type)) {
      return res.status(400).json({
        message: 'Jenis transaksi harus inbound atau outbound'
      })
    }

    const pallet = findPallet(palletStore, palletId)

    if (!pallet) {
      return res.status(404).json({
        message: 'Pallet tidak ditemukan'
      })
    }

    if (!String(driverName || '').trim()) {
      return res.status(400).json({
        message: 'Nama driver wajib diisi'
      })
    }

    if (!String(nopol || '').trim()) {
      return res.status(400).json({
        message: 'Nomor polisi wajib diisi'
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Minimal satu barang harus dipilih'
      })
    }

    const transactionItems = []

    if (type === 'inbound') {
      for (const input of items) {
        if (!input.selected) continue

        const packageQty = number(input.packageQty)
        const cartonQty = number(input.cartonQty)
        const sackQty = number(input.sackQty)
        const weightKg = number(input.weightKg)

        if (
          packageQty === 0 &&
          cartonQty === 0 &&
          sackQty === 0 &&
          weightKg === 0
        ) {
          return res.status(400).json({
            message: `Jumlah inbound untuk ${input.sku || 'barang'} harus lebih dari 0`
          })
        }

        const item = input.itemId
          ? pallet.items.find(item => item.id === input.itemId)
          : null

        transactionItems.push({
          itemId: item?.id || null,
          sku: String(input.sku || item?.sku || '').trim(),
          itemName: String(input.itemName || item?.itemName || '').trim(),
          packaging: String(input.packaging || item?.packaging || '-').trim(),
          packageQty,
          cartonQty,
          sackQty,
          weightKg,
          barcode: String(input.barcode || item?.barcode || '').trim()
        })
      }

      if (transactionItems.length === 0) {
        return res.status(400).json({
          message: 'Pilih minimal satu barang untuk inbound'
        })
      }

      for (const input of transactionItems) {
        if (!input.sku) {
          return res.status(400).json({
            message: 'SKU wajib diisi untuk barang inbound'
          })
        }

        if (!input.itemName) {
          return res.status(400).json({
            message: `Nama barang untuk ${input.sku} wajib diisi`
          })
        }

        let item = input.itemId
          ? pallet.items.find(existing => existing.id === input.itemId)
          : null

        if (!item) {
          item = pallet.items.find(existing =>
            existing.sku.toLowerCase() === input.sku.toLowerCase() &&
            input.barcode &&
            existing.barcode === input.barcode
          )
        }

        if (!item) {
          item = {
            id: `ITEM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            sku: input.sku,
            itemName: input.itemName,
            packaging: input.packaging,
            packageQty: 0,
            cartonQty: 0,
            sackQty: 0,
            weightKg: 0,
            barcode: input.barcode
          }
          pallet.items.push(item)
        }

        item.packageQty = number(item.packageQty) + input.packageQty
        item.cartonQty = number(item.cartonQty) + input.cartonQty
        item.sackQty = number(item.sackQty) + input.sackQty
        item.weightKg = number(item.weightKg) + input.weightKg

        transactionItems.find(transactionItem =>
          transactionItem.sku === input.sku &&
          transactionItem.itemId === input.itemId
        )
      }

      pallet.status = pallet.items.length > 0 ? 'occupied' : 'empty'
    } else {
      for (const input of items) {
        if (!input.selected) continue

        const item = pallet.items.find(
          existing => existing.id === input.itemId
        )

        if (!item) {
          return res.status(400).json({
            message: 'Item outbound tidak ditemukan di pallet'
          })
        }

        const packageQty = number(input.packageQty)
        const cartonQty = number(input.cartonQty)
        const sackQty = number(input.sackQty)
        const weightKg = number(input.weightKg)

        if (
          packageQty === 0 &&
          cartonQty === 0 &&
          sackQty === 0 &&
          weightKg === 0
        ) {
          return res.status(400).json({
            message: `Jumlah outbound untuk ${item.sku} harus lebih dari 0`
          })
        }

        if (
          packageQty > number(item.packageQty) ||
          cartonQty > number(item.cartonQty) ||
          sackQty > number(item.sackQty) ||
          weightKg > number(item.weightKg)
        ) {
          return res.status(400).json({
            message: `Jumlah outbound ${item.sku} melebihi stok pallet`
          })
        }

        transactionItems.push({
          itemId: item.id,
          sku: item.sku,
          itemName: item.itemName,
          packaging: item.packaging,
          packageQty,
          cartonQty,
          sackQty,
          weightKg,
          barcode: item.barcode
        })
      }

      if (transactionItems.length === 0) {
        return res.status(400).json({
          message: 'Pilih minimal satu barang untuk outbound'
        })
      }

      for (const output of transactionItems) {
        const item = pallet.items.find(
          existing => existing.id === output.itemId
        )

        item.packageQty = number(item.packageQty) - output.packageQty
        item.cartonQty = number(item.cartonQty) - output.cartonQty
        item.sackQty = number(item.sackQty) - output.sackQty
        item.weightKg = number(item.weightKg) - output.weightKg
      }

      pallet.items = pallet.items.filter(item =>
        number(item.packageQty) > 0 ||
        number(item.cartonQty) > 0 ||
        number(item.sackQty) > 0 ||
        number(item.weightKg) > 0
      )

      pallet.status = pallet.items.length > 0 ? 'occupied' : 'empty'
    }

    const transaction = {
      id: generateTransactionId(),
      type,
      palletId: pallet.id,
      palletName: pallet.name,
      driverName: String(driverName).trim(),
      nopol: String(nopol).trim().toUpperCase(),
      items: clone(transactionItems),
      status: 'confirmed',
      confirmedAt: new Date().toISOString()
    }

    transactions.push(transaction)

    res.status(201).json({
      message: type === 'inbound'
        ? 'Barang berhasil di-inbound'
        : 'Barang berhasil di-outbound',
      transaction,
      pallet: clone(pallet)
    })
  })

  return transactionRouter
}

export default router
