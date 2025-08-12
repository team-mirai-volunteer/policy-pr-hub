import { Checkbox as ChakraCheckbox } from "@chakra-ui/react";
import * as React from "react";

export interface CheckboxProps {
  children?: React.ReactNode;
  isChecked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  [key: string]: any;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(props, ref) {
  const { children, ...rest } = props;
  return (
    <ChakraCheckbox ref={ref} {...rest}>
      {children}
    </ChakraCheckbox>
  );
});
