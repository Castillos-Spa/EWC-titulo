import { PrismaService } from 'prisma/prisma.service';

type AnyFunction = (...args: any[]) => any;

type MockMap = Record<string | symbol, any>;

const functionCache = new Map<string, jest.Mock>();

const modelHandler: ProxyHandler<MockMap> = {
  get(target, prop: string | symbol) {
    if (!Object.prototype.hasOwnProperty.call(target, prop)) {
      const cacheKey = String(prop);
      if (!functionCache.has(cacheKey)) {
        functionCache.set(cacheKey, jest.fn());
      }
      target[prop] = functionCache.get(cacheKey);
    }
    return target[prop];
  },
};

const prismaHandler: ProxyHandler<MockMap> = {
  get(target, prop: string | symbol) {
    if (prop === '$transaction' || prop === '$connect' || prop === '$disconnect') {
      if (!Object.prototype.hasOwnProperty.call(target, prop)) {
        target[prop] = jest.fn();
      }
      return target[prop];
    }

    if (!Object.prototype.hasOwnProperty.call(target, prop)) {
      target[prop] = new Proxy({}, modelHandler);
    }

    return target[prop];
  },
};

export const createPrismaMock = (): jest.Mocked<PrismaService> => {
  functionCache.clear();
  return new Proxy({}, prismaHandler) as unknown as jest.Mocked<PrismaService>;
};

export type PrismaMock = jest.Mocked<PrismaService>;
