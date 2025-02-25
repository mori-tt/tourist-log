import {
  RepositoryFactoryHttp,
  Account,
  Deadline,
  NetworkType,
  TransferTransaction,
  PlainMessage,
  UInt64,
  Address,
  SignedTransaction,
  Mosaic,
  MosaicId,
} from "symbol-sdk";

// 環境変数からノードURLを取得。存在しない場合はエラー
const nodeUrl = process.env.SYMBOL_NODE_URL;
if (!nodeUrl) {
  throw new Error("SYMBOL_NODE_URL is not defined in environment variables");
}
const repositoryFactory = new RepositoryFactoryHttp(nodeUrl);
const networkType = NetworkType.TEST_NET; // 本番時は NetworkType.MAIN_NET を使用

export async function sendRewardTransaction(
  privateKey: string,
  recipientAddress: string,
  amount: number
): Promise<{ transactionInfo: SignedTransaction; fee: string }> {
  const account = Account.createFromPrivateKey(privateKey, networkType);
  const epochAdjustment = Number(process.env.EPOCH_ADJUSTMENT) || 1616694977;

  // SymbolネットワークのモザイクID
  const currencyMosaicId = new MosaicId(
    process.env.CURRENCY_MOSAIC_ID || "5E62990DCAC5BE8A"
  );

  // 金額をUInt64に変換
  const amountUInt64 = UInt64.fromUint(amount);

  // 送金トランザクションの作成
  const transferTransaction = TransferTransaction.create(
    Deadline.create(epochAdjustment),
    Address.createFromRawAddress(recipientAddress),
    [new Mosaic(currencyMosaicId, amountUInt64)],
    PlainMessage.create(`Reward payment of ${amount} tokens`),
    networkType
  );

  // 手数料の計算と設定
  const feeMultiplier = Number(process.env.SYMBOL_FEE_MULTIPLIER) || 100;
  const txSize = transferTransaction.size;
  const feeAmount = txSize * feeMultiplier;
  const signReadyTx = transferTransaction.setMaxFee(feeAmount);
  const fee = UInt64.fromUint(feeAmount);

  const networkGenerationHash =
    process.env.NETWORK_GENERATION_HASH || "NETWORK_GENERATION_HASH_HERE";
  const signedTransaction = account.sign(signReadyTx, networkGenerationHash);

  const transactionHttp = repositoryFactory.createTransactionRepository();
  await transactionHttp.announce(signedTransaction).toPromise();

  return {
    transactionInfo: signedTransaction,
    fee: fee.toString(),
  };
}
