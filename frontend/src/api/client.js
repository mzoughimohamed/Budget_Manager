import axios from 'axios'

const client = axios.create({
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
