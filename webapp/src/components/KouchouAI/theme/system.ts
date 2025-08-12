import { extendTheme } from "@chakra-ui/react";
import { fonts } from "./fonts";
import { semanticTokens } from "./semanticTokens";
import { textStyles } from "./textStyle";

export const system = extendTheme({
  fonts,
  semanticTokens,
  textStyles,
});
