import { HStack, Progress, Text, Box } from "@chakra-ui/react";
import React from "react";

type Props = {
  loaded: number;
  max: number;
  isVisualizing?: boolean;
};

export function LoadingBar({ loaded, max, isVisualizing }: Props) {
  const percentage = max > 0 ? (loaded / max) * 100 : 0;

  if (isVisualizing) {
    return (
      <Box mx="auto" p={5} maxW="800px">
        <HStack spacing={5}>
          <Progress 
            value={undefined} 
            isIndeterminate 
            size="lg" 
            colorScheme="cyan" 
            flex="1"
          />
          <Text>Visualizing...</Text>
        </HStack>
      </Box>
    );
  }
  
  return (
    <Box mx="auto" p={5} maxW="800px">
      <HStack spacing={5}>
        <Progress 
          value={percentage} 
          size="lg" 
          colorScheme="cyan" 
          flex="1"
        />
        <Text>
          {Math.floor(loaded / 1024).toLocaleString()} KB / {Math.floor(max / 1024).toLocaleString()} KB
        </Text>
      </HStack>
    </Box>
  );
}
