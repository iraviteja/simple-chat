import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5005'
const api = axios.create({
  baseURL: `${baseURL.replace(/\/$/, '')}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
})

const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export default api