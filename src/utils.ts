
export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitFor(conditionFn: () => Promise<boolean>, description: string = '', pollInterval: number = 1000) {
  process.stdout.write(description);
  const poll = (resolve: any) => {
    conditionFn().then((result) => {
      if (result) {
        console.log(' OK');
        resolve();
      } else {
        process.stdout.write('.');
        setTimeout(_ => poll(resolve), pollInterval);
      }
    }).catch(() => {
      process.stdout.write('.');
      setTimeout(_ => poll(resolve), pollInterval);
    });
  }
  return new Promise(poll);
}

