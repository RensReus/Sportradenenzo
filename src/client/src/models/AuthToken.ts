export interface AuthToken {
  account_id: number,
  email: string,
  admin: boolean,
  refreshString: string,
}