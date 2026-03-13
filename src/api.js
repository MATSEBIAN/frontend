const BASE = 'https://backend-production-1c45.up.railway.app/api'

function getToken() {
  return localStorage.getItem('matsebian_token')
}

function setToken(token) {
  localStorage.setItem('matsebian_token', token)
}

function clearToken() {
  localStorage.removeItem('matsebian_token')
  localStorage.removeItem('matsebian_company')
  localStorage.removeItem('matsebian_user')
}

async function request(method, path, body = null, isForm = false) {
  const headers = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    method,
    headers,
    body: isForm ? body : (body ? JSON.stringify(body) : null),
  })

  if (res.status === 401) {
    clearToken()
    window.location.reload()
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error del servidor')
  return data
}

export const api = {
  // Auth
  register: (d) => request('POST', '/auth/register', d),
  login:    (d) => request('POST', '/auth/login', d),
  me:       ()  => request('GET',  '/auth/me'),

  // Transacciones
  getTransactions: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/transactions/${q ? '?' + q : ''}`)
  },
  createManual:   (d)  => request('POST', '/transactions/manual', d),
  uploadDocument: (fd) => request('POST', '/transactions/upload', fd, true),
  updateTransaction: (id, d) => request('PUT',    `/transactions/${id}`, d),
  deleteTransaction: (id)    => request('DELETE', `/transactions/${id}`),
  getCategories:  ()   => request('GET', '/transactions/categories'),
  createCategory: (d)  => request('POST', '/transactions/categories', d),

  // Dashboard
  getDashboard: (month, year) => request('GET', `/dashboard/?month=${month}&year=${year}`),

  // Reportes
  getReports:      ()          => request('GET',  '/reports/'),
  generateReport:  (year, m)   => request('POST', `/reports/generate/${year}/${m}`),
  deleteAllReports: ()          => request('DELETE', '/reports/all'),

  // Utils
  setToken, clearToken, getToken,
}
