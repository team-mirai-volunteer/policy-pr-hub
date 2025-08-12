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

interface DialogContentProps {
  children?: React.ReactNode;
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
  backdrop?: boolean;
  [key: string]: any;
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

export const DialogRoot = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
  const isOpen = props.open !== undefined ? props.open : true;
  const onClose = props.onOpenChange || props.onClose || (() => {});
  
  const { open, onOpenChange, initialFocusEl, lazyMount, ...modalProps } = props;
  
  if (initialFocusEl) {
    modalProps.initialFocusRef = initialFocusEl;
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} {...modalProps}>
      {children}
    </Modal>
  );
};

export const DialogFooter = ModalFooter;
export const DialogHeader = ModalHeader;
export const DialogBody = ModalBody;
export const DialogBackdrop = ModalOverlay;
export const DialogTitle = ModalHeader;
export const DialogDescription = ModalBody;

export const DialogTrigger = ({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean; [key: string]: any }) => 
  asChild ? <>{children}</> : <button {...props}>{children}</button>;

export const DialogActionTrigger = ({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean; [key: string]: any }) => 
  asChild ? <>{children}</> : <button {...props}>{children}</button>;
