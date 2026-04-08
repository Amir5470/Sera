declare module "expo-clipboard" {
  export function getStringAsync(): Promise<string>;
  export function setStringAsync(text: string): Promise<void>;

  const Clipboard: {
    getStringAsync: () => Promise<string>;
    setStringAsync: (value: string) => Promise<void>;
  };

  export default Clipboard;
}
