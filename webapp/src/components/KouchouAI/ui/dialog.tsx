import { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalFooter, 
  ModalBody, 
  ModalCloseButton,
  Portal 
} from "@chakra-ui/react";
import * as React from "react";
import { CloseButton } from "./close-button";

interface DialogContentProps extends React.ComponentProps<typeof ModalContent> {
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
  backdrop?: boolean;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(props, ref) {
  const { children, portalled = true, portalRef, backdrop = true, ...rest } = props;

  return (
    <>
      {backdrop && <ModalOverlay />}
      <ModalContent ref={ref} {...rest}>
        {children}
      </ModalContent>
    </>
  );
});

export const DialogCloseTrigger = React.forwardRef<HTMLButtonElement, any>(
  function DialogCloseTrigger(props, ref) {
    return (
      <ModalCloseButton ref={ref} {...props}>
        {props.children}
      </ModalCloseButton>
    );
  },
);

// Chakra UI v2 Modal components mapped to Dialog API
export const DialogRoot = Modal;
export const DialogFooter = ModalFooter;
export const DialogHeader = ModalHeader;
export const DialogBody = ModalBody;
export const DialogBackdrop = ModalOverlay;
export const DialogTitle = ModalHeader; // In v2, ModalHeader serves as title
export const DialogDescription = ModalBody; // In v2, ModalBody serves as description
export const DialogTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DialogActionTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
