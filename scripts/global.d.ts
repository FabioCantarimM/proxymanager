import * as supertest from 'supertest'

type NodeEnv = 'development' | 'production' | 'test'

declare global {
  var agent: supertest.SuperTest<supertest.Test>
  interface ObjectConstructor {
    entries<U, T extends number | string | symbol>(o: { [key in T]: U } | ArrayLike<U>): [T, U][]
    keys<T>(obj: T): (keyof T)[]
  }

  namespace NodeJS {
    interface ProcessEnv {
      npm_package_name: string
      npm_package_version: string
      npm_package_description: string
    }
  }
}
export {}
