"use client";

import { Button, Input, Text, Box } from "@chakra-ui/react";
import * as React from "react";

export interface FileUploadRootProps {
  children?: React.ReactNode;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  [key: string]: any;
}

export const FileUploadRoot = React.forwardRef<HTMLInputElement, FileUploadRootProps>(
  function FileUploadRoot(props, ref) {
    const { children, inputProps, ...rest } = props;
    return (
      <Box {...rest}>
        <Input type="file" ref={ref} {...inputProps} />
        {children}
      </Box>
    );
  },
);

export interface FileUploadDropzoneProps {
  children?: React.ReactNode;
  label: React.ReactNode;
  description?: React.ReactNode;
  [key: string]: any;
}

export const FileUploadDropzone = React.forwardRef<HTMLInputElement, FileUploadDropzoneProps>(
  function FileUploadDropzone(props, ref) {
    const { children, label, description, ...rest } = props;
    return (
      <Box {...rest}>
        <Text>{label}</Text>
        {description && <Text color="gray.500">{description}</Text>}
        {children}
      </Box>
    );
  },
);

interface VisibilityProps {
  showSize?: boolean;
  clearable?: boolean;
}

interface FileUploadListProps extends VisibilityProps {
  files?: File[];
  [key: string]: any;
}

export const FileUploadList = React.forwardRef<HTMLDivElement, FileUploadListProps>(
  function FileUploadList(props, ref) {
    const { showSize, clearable, files, ...rest } = props;
    return <Box {...rest}>File list placeholder</Box>;
  },
);

interface FileInputProps {
  placeholder?: React.ReactNode;
  [key: string]: any;
}

export const FileInput = React.forwardRef<HTMLButtonElement, FileInputProps>(function FileInput(props, ref) {
  const { placeholder = "Select file(s)", ...rest } = props;
  return (
    <Button ref={ref} {...rest}>
      {placeholder}
    </Button>
  );
});

export const FileUploadLabel = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
  <Text as="label" {...props}>{children}</Text>
);
export const FileUploadClearTrigger = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
  <Button {...props}>{children}</Button>
);
export const FileUploadTrigger = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
  <Button {...props}>{children}</Button>
);
