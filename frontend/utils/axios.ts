import axios from "axios"
import decode from "jwt-decode"
import { accessToken, setAccessToken } from "utils/accessToken"

export const instance = axios.create({
  headers: { Authorization: `Bearer ${accessToken}` }
})

instance.interceptors.request.use(async config => {
  try {
    const { exp } = decode(accessToken)
    decode(accessToken)
    if (Date.now() / 1000 > exp) throw Error
    return config
  } catch {
    const { data } = await axios.get("/api/access")
    if (data.accessToken) {
      setAccessToken(data.accessToken)
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${data.accessToken}`
      }
      return config
    }
  }
})
