declare module "@sparticuz/chromium" {
  const chromium: {
    args: string[];
    defaultViewport: { width: number; height: number } | null;
    headless?: boolean;
    executablePath: () => Promise<string | null | undefined>;
  };
  export default chromium;
}
