import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/prisma/prisma.service'

@Injectable()
export class UserService {
  constructor(private db: PrismaService) {}

  async findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } })
  }

  async findByUsername(username: string) {
    return this.db.user.findUnique({ where: { username } })
  }

  async getProfile(id) {
    const data = await this.db.user.findUnique({ where: { id } })
    return { data }
  }

  async findByUsernameAndEmail(data) {
    return this.db.user.findFirst({
      where: {
        OR: [{ email: data }, { username: data }],
      },
    })
  }

  async create(data: {
    username: string
    password?: string | null
    email?: string
    isGuest?: boolean
  }) {
    return this.db.user.create({ data })
  }
}
