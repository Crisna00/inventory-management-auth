import { useEffect, useState } from 'react'
import { createPallet, getPallets } from '../services/api'

export default function Pallets() {
  const [pallets, setPallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: '',
    name: ''
  })

  async function loadPallets() {
    try {
      setLoading(true)
      const { data } = await getPallets()
      setPallets(data)
    } catch (error) {
      console.error(error)
      alert(error?.response?.data?.message || 'Gagal mengambil data pallet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPallets()
  }, [])

  function openCreate() {
    setForm({ id: '', name: '' })
    setShowModal(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)

    try {
      const { data } = await createPallet(form)
      setPallets(prev => [...prev, data])
      setShowModal(false)
      setForm({ id: '', name: '' })
    } catch (error) {
      console.error(error)
      alert(error?.response?.data?.message || 'Gagal membuat pallet')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">INVENTORY</span>
          <h2>Master Pallet</h2>
          <p className="muted">
            Buat dan lihat daftar pallet yang tersedia di warehouse.
          </p>
        </div>

        <button className="primary" onClick={openCreate}>
          + Buat Pallet
        </button>
      </div>

      <div className="pallet-master-grid">
        <div className="master-stat">
          <span>Total Pallet</span>
          <strong>{pallets.length}</strong>
        </div>
        <div className="master-stat">
          <span>Terisi</span>
          <strong>{pallets.filter(pallet => pallet.status === 'occupied').length}</strong>
        </div>
        <div className="master-stat">
          <span>Kosong</span>
          <strong>{pallets.filter(pallet => pallet.status === 'empty').length}</strong>
        </div>
        <div className="master-stat">
          <span>Belum Ditempatkan</span>
          <strong>{pallets.filter(pallet => !pallet.location?.layoutId).length}</strong>
        </div>
      </div>

      <div className="layout-card">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">PALLET MASTER</span>
            <h3>Daftar Pallet</h3>
          </div>
        </div>

        {loading ? (
          <div className="loading-box">Memuat data pallet...</div>
        ) : pallets.length === 0 ? (
          <div className="empty-page">
            <div className="empty-page-icon">+</div>
            <h3>Belum ada pallet</h3>
            <p>Buat pallet pertama untuk digunakan pada layout.</p>
            <button className="primary" onClick={openCreate}>+ Buat Pallet</button>
          </div>
        ) : (
          <div className="master-table-wrap">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Pallet</th>
                  <th>Status</th>
                  <th>Inventory</th>
                  <th>Berat</th>
                  <th>SKU</th>
                </tr>
              </thead>
              <tbody>
                {pallets.map(pallet => (
                  <tr key={pallet.id}>
                    <td>
                      <strong>{pallet.id}</strong>
                      <span className="table-subtitle">{pallet.name}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${pallet.status}`}>
                        {pallet.status}
                      </span>
                    </td>
                    <td>{pallet.items?.length || 0} item</td>
                    <td>{pallet.summary?.totalWeight || 0} kg</td>
                    <td>{pallet.summary?.totalSku || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={handleSubmit}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">PALLET MASTER</span>
                <h3>Buat Pallet</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <label>
              ID Pallet
              <input
                required
                value={form.id}
                onChange={event => setForm({ ...form, id: event.target.value.toUpperCase() })}
                placeholder="P09"
              />
            </label>

            <label>
              Nama Pallet
              <input
                value={form.name}
                onChange={event => setForm({ ...form, name: event.target.value })}
                placeholder="Pallet P09"
              />
            </label>

            <div className="modal-info">
              Pallet baru akan dibuat sebagai <strong>empty</strong> dan belum ditempatkan.
              Setelah itu pallet dapat di-drag ke slot kosong pada Pallet Layout.
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setShowModal(false)}>
                Batal
              </button>
              <button className="primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Buat Pallet'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
