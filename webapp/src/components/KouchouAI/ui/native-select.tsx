"use client";

import { Select, Box } from "@chakra-ui/react";
import * as React from "react";

interface NativeSelectRootProps {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  [key: string]: any;
}

export const NativeSelectRoot = React.forwardRef<HTMLDivElement, NativeSelectRootProps>(
  function NativeSelect(props, ref) {
    const { icon, children, ...rest } = props;
    return (
      <Box ref={ref} {...rest}>
        {children}
        {icon}
      </Box>
    );
  },
);

interface NativeSelectItem {
  value: string;
  label: string;
  disabled?: boolean;
}

interface NativeSelectField {
  children?: React.ReactNode;
  items?: Array<string | NativeSelectItem>;
  [key: string]: any;
}

export const NativeSelectField = React.forwardRef<HTMLSelectElement, NativeSelectField>(
  function NativeSelectField(props, ref) {
    const { items: itemsProp, children, ...rest } = props;

    const items: NativeSelectItem[] = React.useMemo(() => {
      if (!itemsProp) return [];
      return itemsProp.map((item: string | NativeSelectItem) => {
        if (typeof item === "string") {
          return { label: item, value: item };
        }
        return item;
      });
    }, [itemsProp]);

    return (
      <Select ref={ref} {...rest}>
        {children}
        {items.map((item: NativeSelectItem) => (
          <option key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </option>
        ))}
      </Select>
    );
  },
);
