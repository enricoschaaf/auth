import { sign } from "jsonwebtoken"

export function createAccessToken(userId: string, privatKey: string) {
  return sign({ userId }, privatKey, { algorithm: "RS256", expiresIn: "10m" })
}
