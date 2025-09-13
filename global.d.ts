declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<import("mongodb").MongoClient> | undefined;
}