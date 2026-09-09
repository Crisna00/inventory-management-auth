import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('warehouse_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// ======================================================
// AUTH
// ======================================================

export const registerUser = data =>
  api.post('/auth/register', data)

export const loginUser = data =>
  api.post('/auth/login', data)

export const getCurrentUser = () =>
  api.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('warehouse_token') || ''}`
    }
  })

export const logoutUser = () =>
  api.post('/auth/logout', {}, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('warehouse_token') || ''}`
    }
  })

// ======================================================
// PALLET MASTER
// ======================================================

export const getPallets = () => api.get('/pallets')
export const getPallet = palletId => api.get(`/pallets/${palletId}`)
export const createPallet = data => api.post('/pallets', data)
export const updatePallet = (palletId, data) => api.put(`/pallets/${palletId}`, data)
export const addPalletItem = (palletId, data) => api.post(`/pallets/${palletId}/items`, data)
export const updatePalletItem = (palletId, itemId, data) => api.put(`/pallets/${palletId}/items/${itemId}`, data)
export const deletePalletItem = (palletId, itemId) => api.delete(`/pallets/${palletId}/items/${itemId}`)
export const clearPalletItems = palletId => api.delete(`/pallets/${palletId}/items`)

// ======================================================
// LAYOUT
// ======================================================

export const getLayouts = () => api.get('/layouts')
export const getLayout = layoutId => api.get(`/layouts/${layoutId}`)
export const createLayout = data => api.post('/layouts', data)
export const updateLayout = (layoutId, data) => api.put(`/layouts/${layoutId}`, data)
export const deleteLayout = layoutId => api.delete(`/layouts/${layoutId}`)

export const placePallet = (layoutId, data) =>
  api.put(`/layouts/${layoutId}/place`, data)

export const movePallet = (layoutId, data) =>
  api.put(`/layouts/${layoutId}/move`, data)

// ======================================================
// TRANSACTIONS
// ======================================================

export const getTransactions = params =>
  api.get('/transactions', { params })

export const getTransaction = transactionId =>
  api.get(`/transactions/${transactionId}`)

export const createTransaction = data =>
  api.post('/transactions', data)
