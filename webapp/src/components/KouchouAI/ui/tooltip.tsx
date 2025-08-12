import { Tooltip as ChakraTooltip, Portal } from "@chakra-ui/react";
import * as React from "react";

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  showArrow?: boolean;
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
  disabled?: boolean;
  openDelay?: number;
  closeDelay?: number;
  placement?: "top" | "bottom" | "left" | "right";
  isDisabled?: boolean;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  const { 
    showArrow = true, 
    children, 
    disabled, 
    isDisabled,
    portalled = true, 
    content, 
    portalRef, 
    openDelay = 0,
    closeDelay = 0,
    placement = "top",
    ...rest 
  } = props;

  if (disabled || isDisabled) return <>{children}</>;

  return (
    <ChakraTooltip
      label={content}
      hasArrow={showArrow}
      openDelay={openDelay}
      closeDelay={closeDelay}
      placement={placement}
      {...rest}
    >
      {children}
    </ChakraTooltip>
  );
});
