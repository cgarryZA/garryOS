import axios from 'axios'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    console.log('Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error status
      console.error('Response error:', error.response.status, error.response.data)

      switch (error.response.status) {
        case 401:
          // Handle unauthorized - redirect to login
          console.error('Unauthorized access')
          break
        case 403:
          // Handle forbidden
          console.error('Forbidden access')
          break
        case 404:
          // Handle not found
          console.error('Resource not found')
          break
        case 500:
          // Handle server error
          console.error('Server error')
          break
        default:
          console.error('An error occurred')
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error:', error.request)
    } else {
      // Something else happened
      console.error('Error:', error.message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
