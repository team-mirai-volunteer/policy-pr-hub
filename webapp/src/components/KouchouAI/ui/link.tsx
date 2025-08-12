import {
  Link as ChakraLink,
  type LinkProps as ChakraLinkProps,
} from "@chakra-ui/react";
import { forwardRef } from "react";

export type LinkProps = ChakraLinkProps;

export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  return <ChakraLink ref={ref} {...props} />;
});
