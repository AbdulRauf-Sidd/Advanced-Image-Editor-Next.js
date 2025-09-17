declare module "@sparticuz/chromium-min" {
  const chromium: {
    args: string[];
    defaultViewport: { width: number; height: number } | null;
    headless?: boolean | "shell";
    executablePath: (location?: string) => Promise<string | null | undefined>;
    setGraphicsMode?: boolean;
  };
  export default chromium;
}