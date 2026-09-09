import { Router } from 'express'

const router = Router()

let nextId = 2

let layouts = [
  {
    id: 'LAY-001',
    name: 'Warehouse A',
    orientation: 'horizontal',
    fifoDirection: 'right',
    levels: [
      {
        id: 'L3',
        name: 'Level 3',
        slots: [
          { position: 1, palletId: 'P08', color: '#7c5cff' },
          { position: 2, palletId: null, color: null },
          { position: 3, palletId: null, color: null },
          { position: 4, palletId: null, color: null }
        ]
      },
      {
        id: 'L2',
        name: 'Level 2',
        slots: [
          { position: 1, palletId: 'P05', color: '#e66a6a' },
          { position: 2, palletId: 'P06', color: '#4f7cff' },
          { position: 3, palletId: 'P07', color: '#55b978' },
          { position: 4, palletId: null, color: null }
        ]
      },
      {
        id: 'L1',
        name: 'Level 1',
        slots: [
          { position: 1, palletId: 'P01', color: '#4f7cff' },
          { position: 2, palletId: 'P02', color: '#f2b84b' },
          { position: 3, palletId: 'P03', color: '#55b978' },
          { position: 4, palletId: 'P04', color: '#e66a6a' }
        ]
      }
    ]
  }
]

function createLevels(levelCount, slotCount) {
  return Array.from({ length: levelCount }, (_, levelIndex) => ({
    id: `L${levelIndex + 1}`,
    name: `Level ${levelIndex + 1}`,
    slots: Array.from({ length: slotCount }, (_, positionIndex) => ({
      position: positionIndex + 1,
      palletId: null,
      color: null
    }))
  })).reverse()
}

function findLayout(layoutId) {
  return layouts.find(layout => layout.id === layoutId)
}

function findSlot(layout, levelId, position) {
  const level = layout.levels.find(item => item.id === levelId)
  if (!level) return { level: null, slot: null }

  return {
    level,
    slot: level.slots.find(item => item.position === Number(position)) || null
  }
}

router.get('/', (_req, res) => {
  res.json(layouts)
})

router.get('/:layoutId', (req, res) => {
  const layout = findLayout(req.params.layoutId)

  if (!layout) {
    return res.status(404).json({ message: 'Layout tidak ditemukan' })
  }

  res.json(layout)
})

router.post('/', (req, res) => {
  const {
    name = `Layout ${nextId}`,
    orientation = 'horizontal',
    fifoDirection = 'right',
    levelCount = 3,
    slotCount = 4
  } = req.body

  const parsedLevels = Number(levelCount)
  const parsedSlots = Number(slotCount)

  if (!String(name).trim()) {
    return res.status(400).json({ message: 'Nama layout wajib diisi' })
  }

  if (!['horizontal', 'vertical'].includes(orientation)) {
    return res.status(400).json({ message: 'Orientasi tidak valid' })
  }

  if (!['right', 'left', 'down', 'up'].includes(fifoDirection)) {
    return res.status(400).json({ message: 'Arah FIFO tidak valid' })
  }

  if (
    !Number.isInteger(parsedLevels) ||
    parsedLevels < 1 ||
    parsedLevels > 10 ||
    !Number.isInteger(parsedSlots) ||
    parsedSlots < 1 ||
    parsedSlots > 30
  ) {
    return res.status(400).json({ message: 'Jumlah level atau slot tidak valid' })
  }

  const layout = {
    id: `LAY-${String(nextId++).padStart(3, '0')}`,
    name: String(name).trim(),
    orientation,
    fifoDirection,
    levels: createLevels(parsedLevels, parsedSlots)
  }

  layouts.push(layout)
  res.status(201).json(layout)
})

router.put('/:id', (req, res) => {
  const layout = findLayout(req.params.id)

  if (!layout) {
    return res.status(404).json({ message: 'Layout tidak ditemukan' })
  }

  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim()
    if (!name) {
      return res.status(400).json({ message: 'Nama layout tidak boleh kosong' })
    }
    layout.name = name
  }

  if (req.body.orientation !== undefined) {
    if (!['horizontal', 'vertical'].includes(req.body.orientation)) {
      return res.status(400).json({ message: 'Orientasi tidak valid' })
    }
    layout.orientation = req.body.orientation
  }

  if (req.body.fifoDirection !== undefined) {
    if (!['right', 'left', 'down', 'up'].includes(req.body.fifoDirection)) {
      return res.status(400).json({ message: 'Arah FIFO tidak valid' })
    }
    layout.fifoDirection = req.body.fifoDirection
  }

  res.json(layout)
})

router.delete('/:id', (req, res) => {
  const index = layouts.findIndex(layout => layout.id === req.params.id)

  if (index === -1) {
    return res.status(404).json({ message: 'Layout tidak ditemukan' })
  }

  const [removed] = layouts.splice(index, 1)
  res.json(removed)
})

// Tempatkan pallet yang sebelumnya belum memiliki posisi.
router.put('/:id/place', (req, res) => {
  const { palletId, levelId, position, color } = req.body
  const layout = findLayout(req.params.id)

  if (!layout) {
    return res.status(404).json({ message: 'Layout tidak ditemukan' })
  }

  if (!palletId) {
    return res.status(400).json({ message: 'Pallet ID wajib diisi' })
  }

  const { slot } = findSlot(layout, levelId, position)

  if (!slot) {
    return res.status(400).json({ message: 'Slot tujuan tidak valid' })
  }

  if (slot.palletId) {
    return res.status(409).json({ message: `Slot ${position} sudah ditempati ${slot.palletId}` })
  }

  // Pastikan pallet belum berada di layout ini.
  for (const level of layout.levels) {
    for (const currentSlot of level.slots) {
      if (currentSlot.palletId === palletId) {
        return res.status(409).json({ message: `${palletId} sudah berada di layout ini` })
      }
    }
  }

  slot.palletId = palletId
  slot.color = color || '#4f7cff'

  res.json(layout)
})

// Pindahkan pallet dalam layout, termasuk pindah level dan swap.
router.put('/:id/move', (req, res) => {
  const {
    fromLevelId,
    fromPosition,
    toLevelId,
    toPosition
  } = req.body

  const layout = findLayout(req.params.id)

  if (!layout) {
    return res.status(404).json({ message: 'Layout tidak ditemukan' })
  }

  const source = findSlot(layout, fromLevelId, fromPosition)
  const target = findSlot(layout, toLevelId, toPosition)

  if (!source.slot || !target.slot) {
    return res.status(400).json({ message: 'Posisi pallet tidak valid' })
  }

  if (!source.slot.palletId) {
    return res.status(400).json({ message: 'Slot asal tidak memiliki pallet' })
  }

  if (
    source.level.id === target.level.id &&
    source.slot.position === target.slot.position
  ) {
    return res.json(layout)
  }

  ;[source.slot.palletId, target.slot.palletId] = [
    target.slot.palletId,
    source.slot.palletId
  ]

  ;[source.slot.color, target.slot.color] = [
    target.slot.color,
    source.slot.color
  ]

  res.json(layout)
})

// Kompatibilitas dengan endpoint versi sebelumnya.
router.put('/:id/position', (req, res) => {
  const { levelId, fromPosition, toPosition } = req.body
  const layout = findLayout(req.params.id)

  if (!layout) {
    return res.status(404).json({ message: 'Layout tidak ditemukan' })
  }

  const source = findSlot(layout, levelId, fromPosition)
  const target = findSlot(layout, levelId, toPosition)

  if (!source.slot || !target.slot) {
    return res.status(400).json({ message: 'Posisi pallet tidak valid' })
  }

  if (!source.slot.palletId) {
    return res.status(400).json({ message: 'Slot asal tidak memiliki pallet' })
  }

  ;[source.slot.palletId, target.slot.palletId] = [
    target.slot.palletId,
    source.slot.palletId
  ]

  ;[source.slot.color, target.slot.color] = [
    target.slot.color,
    source.slot.color
  ]

  res.json(layout)
})

export default router
