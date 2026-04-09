import { useTheme } from "./useTheme";

export const useColorScheme = () => {
  const { theme } = useTheme();
  return theme;
};

export default useColorScheme;
