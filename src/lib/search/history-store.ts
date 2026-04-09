import { MongoClient, ServerApiVersion } from "mongodb";

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient;
};

export type SearchHistoryDocument = {
  userId: string;
  cpfHash: string;
  cpfMasked: string;
  cpfData: Record<string, unknown>;
  antecedents: {
    total: number;
    criminal: number;
    civil: number;
    tribunals: string[];
  };
  tribunalBreakdown: Array<{
    tribunalCode: string;
    total: number;
    criminal: number;
    civil: number;
  }>;
  createdAt: Date;
};

export function getMongoClient(uri: string) {
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(uri, {
      serverApi: ServerApiVersion.v1,
    });
  }

  return globalForMongo.mongoClient;
}

export async function insertSearchHistory(
  uri: string,
  dbName: string,
  document: SearchHistoryDocument,
) {
  const client = getMongoClient(uri);
  await client.connect();
  const collection = client.db(dbName).collection<SearchHistoryDocument>("search_history");
  return collection.insertOne(document);
}

export async function listSearchHistory(
  uri: string,
  dbName: string,
  userId: string,
  limit = 20,
) {
  const client = getMongoClient(uri);
  await client.connect();
  const collection = client.db(dbName).collection<SearchHistoryDocument>("search_history");

  return collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
