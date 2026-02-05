import { PrismaClient } from "@/libs/prisma/index";

/**
 * Interface que define os métodos que um model do Prisma precisa ter
 */
interface PrismaModel<T, CreateInput, UpdateInput> {
  create(args: { data: CreateInput }): Promise<T>;
  findUnique(args: { where: { id: string } }): Promise<T | null>;
  findMany(args?: unknown): Promise<T[]>;
  update(args: { where: { id: string }; data: UpdateInput }): Promise<T>;
  delete(args: { where: { id: string } }): Promise<T>;
  count(args?: unknown): Promise<number>;
}

/**
 * Base Repository com operações CRUD comuns
 * Genérico para reutilizar lógica em todos os repositories
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected prisma: PrismaClient;
  protected model: PrismaModel<T, CreateInput, UpdateInput>;

  constructor(
    prismaClient: PrismaClient,
    model: PrismaModel<T, CreateInput, UpdateInput>,
  ) {
    this.prisma = prismaClient;
    this.model = model;
  }

  async create(data: CreateInput): Promise<T> {
    return this.model.create({ data });
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findMany(args?: unknown): Promise<T[]> {
    return this.model.findMany(args);
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }

  async count(args?: unknown): Promise<number> {
    return this.model.count(args);
  }
}
