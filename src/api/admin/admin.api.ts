import BaseApi from '@/_shared/api/base.api'

export class AdminApi extends BaseApi {
  // Проверка через edge function verify-admin (Telegram initData → таблица admins).
  async verify(): Promise<boolean> {
    const res = await this._fn<{ isAdmin: boolean }>('verify-admin')
    return !!res?.isAdmin
  }
}
