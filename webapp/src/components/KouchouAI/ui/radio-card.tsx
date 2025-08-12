import { Radio, RadioGroup, Box, Text, VStack, HStack } from "@chakra-ui/react";
import * as React from "react";
import { Tooltip } from "./tooltip";

interface RadioCardItemProps {
  icon?: React.ReactElement;
  label?: React.ReactNode;
  description?: React.ReactNode;
  addon?: React.ReactNode;
  indicator?: React.ReactNode | null;
  indicatorPlacement?: "start" | "end" | "inside";
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  disabled?: boolean;
  disabledReason?: React.ReactNode;
  value?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export const RadioCardItem = React.forwardRef<HTMLInputElement, RadioCardItemProps>(function RadioCardItem(props, ref) {
  const {
    inputProps,
    label,
    description,
    addon,
    icon,
    indicator,
    indicatorPlacement = "end",
    disabled,
    disabledReason,
    value,
    children,
    ...rest
  } = props;

  const cardItem = (
    <Box
      {...rest}
      data-disabled={disabled}
      cursor={disabled ? "not-allowed" : "pointer"}
      opacity={disabled ? 0.3 : 1}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      p={4}
    >
      <Radio ref={ref} value={value} isDisabled={disabled} {...inputProps}>
        <HStack spacing={3}>
          {indicatorPlacement === "start" && indicator}
          {icon}
          <VStack align="start" spacing={1}>
            {label && <Text fontWeight="medium">{label}</Text>}
            {description && <Text fontSize="sm" color="gray.600">{description}</Text>}
            {indicatorPlacement === "inside" && indicator}
          </VStack>
          {indicatorPlacement === "end" && indicator}
        </HStack>
        {addon && <Box mt={2}>{addon}</Box>}
        {children}
      </Radio>
    </Box>
  );

  if (disabled && disabledReason) {
    return (
      <Tooltip content={disabledReason} showArrow>
        {cardItem}
      </Tooltip>
    );
  }

  return cardItem;
});

export const RadioCardRoot = RadioGroup;
export const RadioCardLabel = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
  <Text as="label" fontWeight="bold" {...props}>{children}</Text>
);
export const RadioCardItemIndicator = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
  <Box {...props}>{children}</Box>
);
