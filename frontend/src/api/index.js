import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
})

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vault_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If token expires or is invalid, log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vault_token')
      localStorage.removeItem('vault_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
