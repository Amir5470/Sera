type PickResult = { uri: string; base64?: string } | null;

let resolver: ((r: PickResult) => void) | null = null;

export function waitForPickedImage(): Promise<PickResult> {
  return new Promise<PickResult>((res) => {
    resolver = res;
  });
}

export function resolvePickedImage(r: PickResult) {
  try {
    if (resolver) {
      resolver(r);
    } else {
      // no waiter — ignore
      console.warn("resolvePickedImage called but no waiter");
    }
  } finally {
    resolver = null;
  }
}

export default { waitForPickedImage, resolvePickedImage };
