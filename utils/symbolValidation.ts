import { Address } from "symbol-sdk";
/**
 * Symbol ウォレットアドレスが有効かどうかを検証する
 * ※この関数はクライアントサイドでも動作可能な軽量な検証のみを行います。
 * @param address 検証するSymbolアドレス
 * @returns 有効な場合はtrue、無効な場合はfalse
 */
export function isValidSymbolAddress(address: string): boolean {
  try {
    Address.createFromRawAddress(address);
    return true;
  } catch (error) {
    return false;
  }
}
