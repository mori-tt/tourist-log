import {
  RepositoryFactoryHttp,
  Account,
  Deadline,
  NetworkType,
  TransferTransaction as SymbolTransferTransaction,
  PlainMessage,
  UInt64,
  Address,
  SignedTransaction as SymbolSignedTransaction,
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
): Promise<{ transactionInfo: SymbolSignedTransaction; fee: string }> {
  const account = Account.createFromPrivateKey(privateKey, networkType);
  const epochAdjustment = Number(process.env.EPOCH_ADJUSTMENT) || 1616694977;

  let transferTransaction = SymbolTransferTransaction.create(
    Deadline.create(epochAdjustment),
    Address.createFromRawAddress(recipientAddress),
    [], // モザイクのリスト（今回は空）
    PlainMessage.create(`Reward payment of ${amount} tokens`),
    networkType,
    UInt64.fromUint(amount)
  );

  // 手数料の計算：size プロパティを利用し、setMaxFee() で新しいインスタンスを取得
  const feeMultiplier = Number(process.env.SYMBOL_FEE_MULTIPLIER) || 100;
  const fee = UInt64.fromUint(transferTransaction.size * feeMultiplier);
  transferTransaction = transferTransaction.setMaxFee(fee);

  const networkGenerationHash =
    process.env.NETWORK_GENERATION_HASH || "NETWORK_GENERATION_HASH_HERE";
  const signedTransaction = account.sign(
    transferTransaction,
    networkGenerationHash
  );

  const transactionHttp = repositoryFactory.createTransactionRepository();
  await transactionHttp.announce(signedTransaction).toPromise();

  return {
    transactionInfo: signedTransaction,
    fee: fee.toString(),
  };
}
