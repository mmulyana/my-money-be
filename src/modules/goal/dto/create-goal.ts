import { createZodDto } from 'nestjs-zod'
import { GoalSchema } from '../goal.schema'

export class CreateGoalDto extends createZodDto(GoalSchema) { }
