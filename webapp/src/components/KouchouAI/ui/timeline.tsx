import { Box, Flex, VStack, HStack, Text, Icon } from "@chakra-ui/react";
import * as React from "react";

interface TimelineRootProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

interface TimelineItemProps {
  children: React.ReactNode;
}

interface TimelineConnectorProps {
  children: React.ReactNode;
}

interface TimelineContentProps {
  children: React.ReactNode;
}

interface TimelineTitleProps {
  children: React.ReactNode;
  fontWeight?: string;
}

interface TimelineDescriptionProps {
  children: React.ReactNode;
}

export const TimelineRoot = React.forwardRef<HTMLDivElement, TimelineRootProps>(
  function TimelineRoot({ children, size = "md", ...props }, ref) {
    return (
      <VStack 
        ref={ref} 
        align="start" 
        spacing={size === "lg" ? 6 : size === "md" ? 4 : 2} 
        {...props}
      >
        {children}
      </VStack>
    );
  }
);

export const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  function TimelineItem({ children, ...props }, ref) {
    return (
      <HStack ref={ref} align="start" spacing={4} w="full" {...props}>
        {children}
      </HStack>
    );
  }
);

export const TimelineConnector = React.forwardRef<HTMLDivElement, TimelineConnectorProps>(
  function TimelineConnector({ children, ...props }, ref) {
    return (
      <Flex ref={ref} direction="column" align="center" {...props}>
        <Box 
          w="40px" 
          h="40px" 
          borderRadius="full" 
          bg="blue.100" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          border="2px solid"
          borderColor="blue.300"
        >
          {children}
        </Box>
        <Box 
          w="2px" 
          h="20px" 
          bg="blue.200" 
          mt={2}
        />
      </Flex>
    );
  }
);

export const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  function TimelineContent({ children, ...props }, ref) {
    return (
      <Box ref={ref} flex={1} {...props}>
        {children}
      </Box>
    );
  }
);

export const TimelineTitle = React.forwardRef<HTMLHeadingElement, TimelineTitleProps>(
  function TimelineTitle({ children, fontWeight = "semibold", ...props }, ref) {
    return (
      <Text 
        ref={ref} 
        fontSize="lg" 
        fontWeight={fontWeight} 
        mb={2} 
        {...props}
      >
        {children}
      </Text>
    );
  }
);

export const TimelineDescription = React.forwardRef<HTMLParagraphElement, TimelineDescriptionProps>(
  function TimelineDescription({ children, ...props }, ref) {
    return (
      <Text ref={ref} color="gray.600" {...props}>
        {children}
      </Text>
    );
  }
);

export const TimelineIndicator = TimelineConnector;
