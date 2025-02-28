import axios from "axios"

const axiosInstance = axios.create({
  baseURL: "https://www.googleapis.com/youtube/v3",
})

axiosInstance.interceptors.request.use(
  (config) => {
    config.params = config.params || {}
    config.params["key"] = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message)
    return Promise.reject(error)
  },
)

export default axiosInstance

