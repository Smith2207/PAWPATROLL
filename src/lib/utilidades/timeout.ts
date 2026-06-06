export function conTimeout<T>(promesa: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]);
}
