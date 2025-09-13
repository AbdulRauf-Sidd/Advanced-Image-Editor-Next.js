interface Env {
  MY_KV: KVNamespace;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CLOUDFLARE_ACCOUNT_ID: string;
      CLOUDFLARE_API_TOKEN: string;
      CLOUDFLARE_KV_NAMESPACE_ID: string;
    }
  }
}

export {};