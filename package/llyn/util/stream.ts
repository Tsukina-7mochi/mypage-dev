export function watchFs(
  paths: string | string[],
  options?: { recursive: boolean },
): ReadableStream<Deno.FsEvent> {
  const watcher = Deno.watchFs(paths, options);
  const stream = new ReadableStream({
    start(controller) {
      (async () => {
        for await (const event of watcher) {
          controller.enqueue(event);
        }
        controller.close();
      })();
    },
  });
  return stream;
}

export class DebounceLatestStream<T> extends TransformStream<T, T> {
  constructor(timeout: number) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    super({
      transform(data, controller) {
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          controller.enqueue(data);
        }, timeout);
      },
    });
  }
}
