import chromium from "@sparticuz/chromium";

type LaunchOptions = {
  headless?: boolean | "new" | "shell";
  args?: string[];
  executablePath?: string;
};

export async function getPdfLaunchOptions(): Promise<LaunchOptions> {
  if (process.platform === "linux") {
    return {
      headless: chromium.headless,
      args: chromium.args,
      executablePath: await chromium.executablePath(),
    };
  }

  return {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  };
}