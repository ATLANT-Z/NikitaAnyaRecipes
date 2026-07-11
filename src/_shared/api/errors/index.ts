// Типизированные доменные ошибки. Портировано из rockwheel-архитектуры.
// Идея: api-метод объявляет, какие HTTP-статусы в какие человеческие
// сообщения мапить, через ErrorHelper.map(SE._4xx('текст')).

export enum ServerErrors {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  PayloadTooLarge = 413,
  UnprocessableEntity = 422,
  InternalServerError = 500,
}

export class AppError extends Error {
  static readonly status: ServerErrors

  constructor(
    public status: number,
    msg: string,
  ) {
    super(msg)
    this.name = this.constructor.name
  }
}

type AppErrorClass<S extends ServerErrors = ServerErrors> = (new () => AppError) & {
  readonly status: S
}

type UniqueStatuses<T extends unknown[], Used = never> = T extends [infer First, ...infer Rest]
  ? First extends AppErrorClass<infer S>
    ? S extends Used
      ? [`Error: status ${S} duplicated!`, ...UniqueStatuses<Rest, Used>]
      : [First, ...UniqueStatuses<Rest, Used | S>]
    : UniqueStatuses<Rest, Used>
  : []

// Что бросают наши транспорты, когда есть HTTP-статус (Edge Functions).
export interface StatusError {
  status: number
  message?: string
}

function hasStatus(err: unknown): err is StatusError {
  return typeof err === 'object' && err !== null && typeof (err as StatusError).status === 'number'
}

export class ErrorHelper {
  private static create<S extends ServerErrors>(status: S, msg: string): AppErrorClass<S> {
    const Cls = class extends AppError {
      static readonly status: S = status
      constructor() {
        super(status, msg)
      }
    }
    Object.defineProperty(Cls, 'name', { value: `AppError_${status}` })
    return Cls as AppErrorClass<S>
  }

  static SE = {
    _400: (msg: string) => ErrorHelper.create(ServerErrors.BadRequest, msg),
    _401: (msg: string) => ErrorHelper.create(ServerErrors.Unauthorized, msg),
    _403: (msg: string) => ErrorHelper.create(ServerErrors.Forbidden, msg),
    _404: (msg: string) => ErrorHelper.create(ServerErrors.NotFound, msg),
    _409: (msg: string) => ErrorHelper.create(ServerErrors.Conflict, msg),
    _413: (msg: string) => ErrorHelper.create(ServerErrors.PayloadTooLarge, msg),
    _422: (msg: string) => ErrorHelper.create(ServerErrors.UnprocessableEntity, msg),
    _500: (msg: string) => ErrorHelper.create(ServerErrors.InternalServerError, msg),
  }

  static map =
    <T extends AppErrorClass<ServerErrors>[]>(...errorClasses: T & UniqueStatuses<T>) =>
    (err: unknown): never => {
      if (hasStatus(err)) {
        const Found = errorClasses.find((Cls) => Cls.status === err.status)
        if (Found) throw new Found()
      }
      throw err
    }
}

export const SE = ErrorHelper.SE
