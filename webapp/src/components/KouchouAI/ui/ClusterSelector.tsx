"use client";

import { NativeSelectField, NativeSelectRoot } from "@/components/KouchouAI/ui/native-select";
import type { Cluster } from "@/type";
import { Box, Text } from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import type React from "react";

type Props = {
  clusters: Cluster[];
  selectedClusterIds: string[];
  onSelectionChange: (clusterIds: string[]) => void;
  targetLevel: number;
};

export function ClusterSelector({ clusters, selectedClusterIds, onSelectionChange, targetLevel }: Props) {
  const targetClusters = clusters.filter(cluster => cluster.level === targetLevel);
  
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === "all") {
      onSelectionChange([]);
    } else {
      onSelectionChange([value]);
    }
  };

  const currentValue = selectedClusterIds.length === 0 ? "all" : selectedClusterIds[0];

  return (
    <Box mb={4}>
      <Text fontSize="sm" fontWeight="bold" mb={2}>
        表示するクラスター
      </Text>
      <NativeSelectRoot>
        <NativeSelectField
          value={currentValue}
          onChange={handleChange}
          items={[
            { value: "all", label: "すべてのクラスター" },
            ...targetClusters.map(cluster => ({
              value: cluster.id,
              label: cluster.label
            }))
          ]}
        />
        <ChevronDown />
      </NativeSelectRoot>
    </Box>
  );
}
