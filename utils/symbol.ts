import {
  RepositoryFactoryHttp,
  Account,
  Deadline,
  NetworkType,
  TransferTransaction,
  PlainMessage,
  UInt64,
  Address,
} from "symbol-sdk";

// 環境変数からノードURLを取得。存在しない場合はプレースホルダを利用
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
) {
  const account = Account.createFromPrivateKey(privateKey, networkType);
  const epochAdjustment = Number(process.env.EPOCH_ADJUSTMENT) || 1616694977;
  const transferTransaction = TransferTransaction.create(
    Deadline.create(epochAdjustment),
    Address.createFromRawAddress(recipientAddress),
    [], // トークン送付の場合はモザイクのリストを指定
    PlainMessage.create(`Reward payment of ${amount} tokens`),
    networkType,
    UInt64.fromUint(amount)
  );

  const networkGenerationHash =
    process.env.NETWORK_GENERATION_HASH || "NETWORK_GENERATION_HASH_HERE";
  const signedTransaction = account.sign(
    transferTransaction,
    networkGenerationHash
  );

  const transactionHttp = repositoryFactory.createTransactionRepository();
  // Use toPromise() instead of firstValueFrom for RxJS v6
  await transactionHttp.announce(signedTransaction).toPromise();
  return { transactionInfo: signedTransaction };
}
