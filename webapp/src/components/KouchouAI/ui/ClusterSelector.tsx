"use client";

import { NativeSelectField, NativeSelectRoot } from "@/components/KouchouAI/ui/native-select";
import type { Cluster } from "@/type";
import { Box, HStack, Text, Checkbox } from "@chakra-ui/react";
import type React from "react";
import { useMemo } from "react";

type Props = {
  clusters: Cluster[];
  selectedClusterIds: string[];
  onSelectionChange: (clusterIds: string[]) => void;
  targetLevel?: number; // オプション: 指定されたレベルのクラスターのみを表示
  multiSelectMode?: boolean; // オプション: 複数選択モードを有効化
  onToggleMultiSelect?: (enabled: boolean) => void; // オプション: 複数選択モード切り替え
};

export function ClusterSelector({
  clusters,
  selectedClusterIds,
  onSelectionChange,
  targetLevel,
  multiSelectMode = false,
  onToggleMultiSelect,
}: Props) {
  // targetLevelが指定されている場合は、そのレベルのクラスターのみをフィルタリング
  // また、densityFilteredのクラスターは除外
  const filteredClusters = useMemo(() => {
    let result = clusters;
    if (targetLevel !== undefined) {
      result = result.filter(cluster => cluster.level === targetLevel);
    }
    // densityFilteredのクラスターを除外
    result = result.filter(cluster => !cluster.densityFiltered);
    return result;
  }, [clusters, targetLevel]);

  const handleSingleSelect = (clusterId: string) => {
    if (clusterId === "all") {
      onSelectionChange([]);
    } else {
      onSelectionChange([clusterId]);
    }
  };

  const handleMultiSelect = (clusterId: string, checked: boolean) => {
    if (clusterId === "all") {
      onSelectionChange(checked ? filteredClusters.map(c => c.id) : []);
    } else {
      const newSelection = checked
        ? [...selectedClusterIds, clusterId]
        : selectedClusterIds.filter(id => id !== clusterId);
      onSelectionChange(newSelection);
    }
  };

  // 複数選択モードが有効な場合
  if (multiSelectMode && onToggleMultiSelect) {
    return (
      <Box mb={4}>
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

        <Box border="1px solid" borderColor="gray.300" borderRadius="md" p={2} maxH="200px" overflowY="auto">
          <Checkbox
            isChecked={selectedClusterIds.length === filteredClusters.length && filteredClusters.length > 0}
            isIndeterminate={selectedClusterIds.length > 0 && selectedClusterIds.length < filteredClusters.length}
            onChange={(e) => handleMultiSelect("all", e.target.checked)}
            mb={2}
          >
            全て選択
          </Checkbox>
          {filteredClusters.map((cluster) => (
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
      </Box>
    );
  }

  // 単一選択モード（デフォルト）
  const currentValue = selectedClusterIds.length === 0 ? "all" : selectedClusterIds[0];

  return (
    <Box mb={4}>
      {onToggleMultiSelect && (
        <HStack mb={2}>
          <Text fontSize="sm" fontWeight="medium">クラスター表示:</Text>
          <Checkbox
            isChecked={false}
            onChange={(e) => onToggleMultiSelect(e.target.checked)}
            size="sm"
          >
            複数選択
          </Checkbox>
        </HStack>
      )}
      <Text fontSize="sm" fontWeight="bold" mb={2}>
        表示するクラスター
      </Text>
      <NativeSelectRoot>
        <NativeSelectField
          value={currentValue}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSingleSelect(e.target.value)}
          items={[
            { value: "all", label: "すべてのクラスター" },
            ...filteredClusters.map(cluster => ({
              value: cluster.id,
              label: `${cluster.label} (${cluster.value}件)`
            }))
          ]}
        />
      </NativeSelectRoot>
    </Box>
  );
}
