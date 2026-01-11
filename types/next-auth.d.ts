import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    discord: {
      id: string
      username: string
      discriminator: string
      avatar: string
      banner: string
      accentColor: number | null
      verified: boolean
      email: string
      createdAt: string
    }
  }
}