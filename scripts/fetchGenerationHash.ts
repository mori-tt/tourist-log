import path from "path";
import dotenv from "dotenv";
import { RepositoryFactoryHttp } from "symbol-sdk";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// 必要なプロパティだけを持つ型を定義
interface MyNetworkConfiguration {
  network: {
    generationHashSeed: string;
  };
}

async function fetchGenerationHash() {
  const nodeUrl = process.env.SYMBOL_NODE_URL;
  if (!nodeUrl) {
    throw new Error("SYMBOL_NODE_URL is not set");
  }
  const repositoryFactory = new RepositoryFactoryHttp(nodeUrl);
  const networkRepository = repositoryFactory.createNetworkRepository();

  // RxJS6では toPromise() を利用
  const networkProperties = (await networkRepository
    .getNetworkProperties()
    .toPromise()) as MyNetworkConfiguration;

  console.log("Generation Hash:", networkProperties.network.generationHashSeed);
}

fetchGenerationHash();
