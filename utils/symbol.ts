import {
  RepositoryFactoryHttp,
  Account,
  Deadline,
  NetworkType,
  TransferTransaction,
  PlainMessage,
  UInt64,
  Address,
  Mosaic,
  MosaicId,
  TransactionGroup,
} from "symbol-sdk";

// 環境変数からノードURLを取得。存在しない場合はエラー
const nodeUrl = process.env.SYMBOL_NODE_URL;
if (!nodeUrl) {
  throw new Error("SYMBOL_NODE_URL is not defined in environment variables");
}
const repositoryFactory = new RepositoryFactoryHttp(nodeUrl);
const networkType = NetworkType.TEST_NET; // 本番時は NetworkType.MAIN_NET を使用

/**
 * XYMトークンを送信するトランザクションを実行する
 * @param privateKey 送信者の秘密鍵
 * @param recipientAddress 受信者のアドレス
 * @param amount 送信するXYMの量（XYM単位）
 * @param message トランザクションに添付するメッセージ
 * @returns トランザクション情報
 */
export async function sendXYMTransaction(
  privateKey: string,
  recipientAddress: string,
  amount: number,
  message = ""
): Promise<{ hash: string; fee: string }> {
  const account = Account.createFromPrivateKey(privateKey, networkType);
  const epochAdjustment = Number(process.env.EPOCH_ADJUSTMENT) || 1637848847;

  // SymbolネットワークのモザイクID（XYM）
  const currencyMosaicId = new MosaicId(
    process.env.CURRENCY_MOSAIC_ID || "6BED913FA20223F8"
  );

  // 金額をUInt64に変換（XYM単位の金額をそのまま使用）
  // Symbol ネットワークでは1XYM = 1,000,000マイクロXYM
  // 例: 1 XYM を送るには 1000000 を指定
  const microXymAmount = Math.floor(amount * 1000000);
  const amountUInt64 = UInt64.fromUint(microXymAmount);

  // 送金トランザクションの作成
  const transferTransaction = TransferTransaction.create(
    Deadline.create(epochAdjustment),
    Address.createFromRawAddress(recipientAddress),
    [new Mosaic(currencyMosaicId, amountUInt64)],
    PlainMessage.create(message || `Payment of ${amount} XYM`),
    networkType
  );

  // 手数料の計算と設定
  const feeMultiplier = Number(process.env.SYMBOL_FEE_MULTIPLIER) || 100;
  const txSize = transferTransaction.size;
  const feeAmount = txSize * feeMultiplier;
  const signReadyTx = transferTransaction.setMaxFee(feeAmount);
  const fee = UInt64.fromUint(feeAmount);

  const networkGenerationHash = process.env.NETWORK_GENERATION_HASH;
  if (!networkGenerationHash) {
    throw new Error(
      "NETWORK_GENERATION_HASH is not defined in environment variables"
    );
  }
  const signedTransaction = account.sign(signReadyTx, networkGenerationHash);

  const transactionHttp = repositoryFactory.createTransactionRepository();
  await transactionHttp.announce(signedTransaction).toPromise();

  return {
    hash: signedTransaction.hash,
    fee: fee.toString(),
  };
}

/**
 * 下位互換性のために残しておく
 * @deprecated 代わりに sendXYMTransaction を使用してください
 */
export async function sendRewardTransaction(
  privateKey: string,
  recipientAddress: string,
  amount: number
): Promise<{ transactionInfo: { hash: string }; fee: string }> {
  const result = await sendXYMTransaction(privateKey, recipientAddress, amount);

  return {
    transactionInfo: { hash: result.hash },
    fee: result.fee,
  };
}

/**
 * Symbol ウォレットアドレスが有効かどうかを検証する
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

export async function checkTransactionStatus(transactionHash: string) {
  const transactionHttp = repositoryFactory.createTransactionRepository();
  try {
    const transaction = await transactionHttp
      .getTransaction(transactionHash, TransactionGroup.Confirmed)
      .toPromise();
    return transaction;
  } catch (error) {
    console.error("トランザクション確認エラー:", error);
    return null;
  }
}

// フロントエンド側でトランザクションの状態を確認する関数
// async function checkTransactionStatus(transactionHash: string) {
//   try {
//     const response = await fetch(`/api/transactions/status/${transactionHash}`);
//     const data = await response.json();
//     return data.status; // "confirmed", "pending", "failed" などの状態を返す
//   } catch (error) {
//     console.error("トランザクション状態確認エラー:", error);
//     return "error";
//   }
// }
