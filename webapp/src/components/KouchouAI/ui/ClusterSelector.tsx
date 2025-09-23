"use client";

import { NativeSelectField, NativeSelectRoot } from "@/components/KouchouAI/ui/native-select";
import type { Cluster } from "@/type";
import { Box, Button, HStack, Text, Checkbox } from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface ClusterSelectorProps {
  clusters: Cluster[];
  selectedClusterIds: string[];
  onSelectionChange: (clusterIds: string[]) => void;
  multiSelectMode: boolean;
  onToggleMultiSelect: (enabled: boolean) => void;
}

export function ClusterSelector({
  clusters,
  selectedClusterIds,
  onSelectionChange,
  multiSelectMode,
  onToggleMultiSelect,
}: ClusterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSingleSelect = (clusterId: string) => {
    if (clusterId === "all") {
      onSelectionChange([]);
    } else {
      onSelectionChange([clusterId]);
    }
  };

  const handleMultiSelect = (clusterId: string, checked: boolean) => {
    if (clusterId === "all") {
      onSelectionChange(checked ? clusters.map(c => c.id) : []);
    } else {
      const newSelection = checked
        ? [...selectedClusterIds, clusterId]
        : selectedClusterIds.filter(id => id !== clusterId);
      onSelectionChange(newSelection);
    }
  };

  const selectedClusters = clusters.filter(c => selectedClusterIds.includes(c.id));
  const displayText = selectedClusterIds.length === 0 
    ? "全てのクラスター" 
    : selectedClusterIds.length === 1
    ? selectedClusters[0]?.label || "クラスター選択"
    : `${selectedClusterIds.length}個のクラスター選択`;

  return (
    <Box position="relative" w="300px" mb={4}>
      <HStack mb={2}>
        <Text fontSize="sm" fontWeight="medium">クラスター表示:</Text>
        <Checkbox 
          isChecked={multiSelectMode}
          onChange={(e) => onToggleMultiSelect(e.target.checked)}
          size="sm"
        >
          複数選択
        </Checkbox>
      </HStack>
      
      {multiSelectMode ? (
        <Box border="1px solid" borderColor="gray.300" borderRadius="md" p={2} maxH="200px" overflowY="auto">
          <Checkbox
            isChecked={selectedClusterIds.length === clusters.length}
            isIndeterminate={selectedClusterIds.length > 0 && selectedClusterIds.length < clusters.length}
            onChange={(e) => handleMultiSelect("all", e.target.checked)}
            mb={2}
          >
            全て選択
          </Checkbox>
          {clusters.map((cluster) => (
            <Checkbox
              key={cluster.id}
              isChecked={selectedClusterIds.includes(cluster.id)}
              onChange={(e) => handleMultiSelect(cluster.id, e.target.checked)}
              display="block"
              mb={1}
            >
              {cluster.label} ({cluster.value}件)
            </Checkbox>
          ))}
        </Box>
      ) : (
        <NativeSelectRoot>
          <NativeSelectField
            value={selectedClusterIds[0] || "all"}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSingleSelect(e.target.value)}
            items={[
              { value: "all", label: "全てのクラスター" },
              ...clusters.map(cluster => ({
                value: cluster.id,
                label: `${cluster.label} (${cluster.value}件)`
              }))
            ]}
          />
        </NativeSelectRoot>
      )}
    </Box>
  );
}
