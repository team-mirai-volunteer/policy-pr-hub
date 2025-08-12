import {
  Button as ChakraButton,
  type ButtonProps as ChakraButtonProps,
} from "@chakra-ui/react";
import { forwardRef } from "react";

export type ButtonProps = ChakraButtonProps & {
  asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { asChild, ...rest } = props;
  return <ChakraButton ref={ref} {...rest} />;
});
