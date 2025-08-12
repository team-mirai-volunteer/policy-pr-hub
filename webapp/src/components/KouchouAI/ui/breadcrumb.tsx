import { Breadcrumb, BreadcrumbItem, BreadcrumbLink as ChakraBreadcrumbLink, BreadcrumbSeparator } from "@chakra-ui/react";
import * as React from "react";

export interface BreadcrumbRootProps {
  children?: React.ReactNode;
  separator?: React.ReactNode;
  [key: string]: any;
}

export const BreadcrumbRoot = React.forwardRef<HTMLDivElement, BreadcrumbRootProps>(
  function BreadcrumbRoot(props, ref) {
    const { separator = "/", children, ...rest } = props;

    const validChildren = React.Children.toArray(children).filter(React.isValidElement);

    return (
      <Breadcrumb ref={ref} separator={separator} {...rest}>
        {validChildren.map((child, index) => (
          <BreadcrumbItem key={child.key || index}>
            {child}
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
    );
  },
);

export const BreadcrumbLink = ChakraBreadcrumbLink;
export const BreadcrumbCurrentLink = ChakraBreadcrumbLink;
export const BreadcrumbEllipsis = BreadcrumbSeparator;
