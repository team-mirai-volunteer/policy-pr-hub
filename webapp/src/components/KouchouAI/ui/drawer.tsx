import { 
  Drawer,
  DrawerOverlay,
  DrawerContent as ChakraDrawerContent,
  DrawerHeader as ChakraDrawerHeader,
  DrawerBody as ChakraDrawerBody,
  DrawerFooter as ChakraDrawerFooter,
  DrawerCloseButton,
  Portal 
} from "@chakra-ui/react";
import * as React from "react";
import { CloseButton } from "./close-button";

interface DrawerContentProps extends React.ComponentProps<typeof ChakraDrawerContent> {
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
  offset?: string | number;
}

export const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(function DrawerContent(props, ref) {
  const { children, portalled = true, portalRef, offset, ...rest } = props;
  return (
    <>
      <DrawerOverlay />
      <ChakraDrawerContent ref={ref} {...rest}>
        {children}
      </ChakraDrawerContent>
    </>
  );
});

export const DrawerCloseTrigger = React.forwardRef<HTMLButtonElement, any>(
  function DrawerCloseTrigger(props, ref) {
    return (
      <DrawerCloseButton ref={ref} {...props} />
    );
  },
);

// Chakra UI v2 Drawer components mapped to v3 API
export const DrawerRoot = Drawer;
export const DrawerFooter = ChakraDrawerFooter;
export const DrawerHeader = ChakraDrawerHeader;
export const DrawerBody = ChakraDrawerBody;
export const DrawerBackdrop = DrawerOverlay;
export const DrawerTitle = ChakraDrawerHeader; // In v2, DrawerHeader serves as title
export const DrawerDescription = ChakraDrawerBody; // In v2, DrawerBody serves as description
export const DrawerTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DrawerActionTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
