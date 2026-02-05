import { PrismaClient } from "@/libs/prisma";

/**
 * Interface que define os métodos que um model do Prisma precisa ter.
 * Adicionamos FindManyArgs e CountArgs para garantir tipagem nos filtros.
 */
interface PrismaModel<T, CreateInput, UpdateInput, FindManyArgs, CountArgs> {
  create(args: { data: CreateInput }): Promise<T>;
  findUnique(args: { where: { id: string } }): Promise<T | null>;
  findMany(args?: FindManyArgs): Promise<T[]>;
  update(args: { where: { id: string }; data: UpdateInput }): Promise<T>;
  delete(args: { where: { id: string } }): Promise<T>;
  count(args?: CountArgs): Promise<number>;
}

export abstract class BaseRepository<
  T,
  CreateInput,
  UpdateInput,
  FindManyArgs = object,
  CountArgs = object,
> {
  protected prisma: PrismaClient;
  protected model: PrismaModel<
    T,
    CreateInput,
    UpdateInput,
    FindManyArgs,
    CountArgs
  >;

  constructor(
    prismaClient: PrismaClient,
    model: PrismaModel<T, CreateInput, UpdateInput, FindManyArgs, CountArgs>,
  ) {
    this.prisma = prismaClient;
    this.model = model;
  }

  async create(data: CreateInput): Promise<T> {
    return await this.model.create({ data });
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findUnique({ where: { id } });
  }

  async findMany(args?: FindManyArgs): Promise<T[]> {
    return await this.model.findMany(args);
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    return await this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<T> {
    return await this.model.delete({ where: { id } });
  }

  async count(args?: CountArgs): Promise<number> {
    return await this.model.count(args);
  }
}
