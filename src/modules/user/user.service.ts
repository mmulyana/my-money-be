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

  async getProfile(id: string) {
    const data = await this.db.user.findUnique({
      where: { id },
      omit: {
        password: true,
        deletedAt: true,
      },
    })
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
    photoUrl?: string
  }) {
    return this.db.user.create({ data })
  }
}
