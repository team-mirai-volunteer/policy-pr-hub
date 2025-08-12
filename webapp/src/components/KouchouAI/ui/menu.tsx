"use client";

import { Menu, MenuButton, MenuList, MenuItem as ChakraMenuItem, MenuDivider, Box, Text } from "@chakra-ui/react";
import * as React from "react";
import { LuCheck, LuChevronRight } from "react-icons/lu";

interface MenuContentProps {
  children?: React.ReactNode;
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
  [key: string]: any;
}

export const MenuContent = React.forwardRef<HTMLDivElement, MenuContentProps>(function MenuContent(props, ref) {
  const { portalled = true, portalRef, children, ...rest } = props;
  return (
    <MenuList ref={ref} {...rest}>
      {children}
    </MenuList>
  );
});

export const MenuArrow = React.forwardRef<HTMLDivElement, any>(function MenuArrow(props, ref) {
  return <Box ref={ref} {...props} />;
});

export const MenuCheckboxItem = React.forwardRef<HTMLButtonElement, any>(
  function MenuCheckboxItem(props, ref) {
    return (
      <ChakraMenuItem ref={ref} {...props}>
        <LuCheck />
        {props.children}
      </ChakraMenuItem>
    );
  },
);

export const MenuRadioItem = React.forwardRef<HTMLButtonElement, any>(
  function MenuRadioItem(props, ref) {
    const { children, ...rest } = props;
    return (
      <ChakraMenuItem ref={ref} {...rest}>
        <LuCheck />
        {children}
      </ChakraMenuItem>
    );
  },
);

export const MenuItemGroup = React.forwardRef<HTMLDivElement, any>(
  function MenuItemGroup(props, ref) {
    const { title, children, ...rest } = props;
    return (
      <Box ref={ref} {...rest}>
        {title && <Text fontWeight="bold">{title}</Text>}
        {children}
      </Box>
    );
  },
);

export interface MenuTriggerItemProps {
  startIcon?: React.ReactNode;
  children?: React.ReactNode;
  [key: string]: any;
}

export const MenuTriggerItem = React.forwardRef<HTMLButtonElement, MenuTriggerItemProps>(
  function MenuTriggerItem(props, ref) {
    const { startIcon, children, ...rest } = props;
    return (
      <ChakraMenuItem ref={ref} {...rest}>
        {startIcon}
        {children}
        <LuChevronRight />
      </ChakraMenuItem>
    );
  },
);

export const MenuRadioItemGroup = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
  <Box {...props}>{children}</Box>
);
export const MenuContextTrigger = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
  <Box {...props}>{children}</Box>
);
export const MenuRoot = Menu;
export const MenuSeparator = MenuDivider;

export const MenuItem = ChakraMenuItem;
export const MenuItemText = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
  <Text {...props}>{children}</Text>
);
export const MenuItemCommand = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
  <Text {...props}>{children}</Text>
);
export const MenuTrigger = MenuButton;
