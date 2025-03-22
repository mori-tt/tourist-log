// Symbol関連のサービス実装
class SymbolService {
  private symbolApiUrl: string;

  constructor() {
    // 環境変数からAPIのURLを取得、なければデフォルト値を使用
    this.symbolApiUrl =
      process.env.SYMBOL_API_URL || "https://sym-test.opening-line.jp:3001";
  }

  // トランザクション送信メソッド
  async sendTransaction(
    senderAddress: string,
    recipientAddress: string,
    amount: number
  ): Promise<{ txHash: string }> {
    try {
      // アドレスの検証
      if (
        !this.validateAddress(senderAddress) ||
        !this.validateAddress(recipientAddress)
      ) {
        throw new Error("無効なSymbolアドレスが含まれています");
      }

      // 残高チェック
      const balance = await this.getBalance(senderAddress);
      if (balance < amount) {
        throw new Error("送信者の残高が不足しています");
      }

      // 本番環境では実際のSymbol SDKを使用してトランザクションを作成・送信
      // このサンプルではシンプルなREST APIの例を示します
      console.log(
        `送金処理: ${amount} XYM from ${senderAddress} to ${recipientAddress}`
      );

      // APIエンドポイントの定義
      const endpoint = `${this.symbolApiUrl}/transactions`;

      // トランザクション作成リクエスト
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "transfer",
          sender: senderAddress,
          recipient: recipientAddress,
          amount: amount,
          message: "TouristLog Transaction",
        }),
      });

      // レスポンスの確認
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Symbolブロックチェーンへの送金に失敗しました"
        );
      }

      const data = await response.json();
      return { txHash: data.transactionHash };
    } catch (error) {
      console.error("Symbol送金エラー:", error);
      throw error instanceof Error
        ? error
        : new Error("不明なエラーが発生しました");
    }
  }

  // アドレス検証
  validateAddress(address: string): boolean {
    // Symbol(NEM2)アドレスの検証ロジック
    // 基本的なバリデーション（長さなど）
    if (!address || typeof address !== "string") return false;

    // Symbolアドレスの長さと形式を確認
    const isValidFormat = /^[A-Z0-9]{39}$/.test(address);

    return isValidFormat;
  }

  // 残高確認
  async getBalance(address: string): Promise<number> {
    try {
      // アドレスの検証
      if (!this.validateAddress(address)) {
        throw new Error("無効なSymbolアドレスです");
      }

      // APIエンドポイントの定義
      const endpoint = `${this.symbolApiUrl}/accounts/${address}`;

      // 残高取得リクエスト
      const response = await fetch(endpoint);

      // レスポンスの確認
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "残高取得に失敗しました");
      }

      const data = await response.json();

      // モザイク（XYM）の残高を取得
      const xymMosaicId =
        process.env.SYMBOL_XYM_MOSAIC_ID || "3A8416DB2D53B6C8";
      const xymBalance =
        data.account?.mosaics?.find(
          (mosaic: { id: string }) => mosaic.id === xymMosaicId
        )?.amount || 0;

      return Number(xymBalance) / 1000000; // マイクロXYMからXYMへの変換
    } catch (error) {
      console.error("残高取得エラー:", error);
      throw error instanceof Error
        ? error
        : new Error("残高取得中に不明なエラーが発生しました");
    }
  }

  // トランザクション状態確認
  async checkTransactionStatus(txHash: string): Promise<string> {
    try {
      // APIエンドポイントの定義
      const endpoint = `${this.symbolApiUrl}/transactions/${txHash}/status`;

      // トランザクション状態取得リクエスト
      const response = await fetch(endpoint);

      // レスポンスの確認
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "トランザクション状態の取得に失敗しました"
        );
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error("トランザクション状態確認エラー:", error);
      throw error instanceof Error
        ? error
        : new Error("トランザクション状態確認中に不明なエラーが発生しました");
    }
  }
}

const symbolService = new SymbolService();
export default symbolService;
