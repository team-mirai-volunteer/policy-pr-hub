import { AllViewIcon, DenseViewIcon, HierarchyViewIcon } from "@/components/KouchouAI/icons/ViewIcons";
import { Tooltip } from "@/components/KouchouAI/ui/tooltip";
import { Box, Button, HStack, Icon, Stack, ButtonGroup } from "@chakra-ui/react";
import { CogIcon, Filter, FullscreenIcon } from "lucide-react"; // Filter アイコンをインポート
import type React from "react";
import type { ComponentType } from "react";

type Props = {
  selected: string;
  onChange: (value: string) => void;
  onClickDensitySetting: () => void;
  onClickFullscreen: () => void;
  isDenseGroupEnabled: boolean;
  onClickAttentionFilter?: () => void;
  isAttentionFilterEnabled?: boolean;
  showAttentionFilterBadge?: boolean;
  attentionFilterBadgeCount?: number;
};

const SegmentItemWithIcon = (icon: ComponentType, text: string, selected: boolean) => {
  return (
    <Stack
      direction={["column", null, "row"]}
      gap={2}
      alignItems="center"
      justifyContent="center"
      color={selected ? "blue.600" : "gray.500"}
    >
      <Icon as={icon} />
      <Box fontSize={["14px", null, "16px"]} fontWeight={selected ? "bold" : "normal"} lineHeight="1">
        {text}
      </Box>
    </Stack>
  );
};

export function SelectChartButton({
  selected,
  onChange,
  onClickDensitySetting,
  onClickFullscreen,
  isDenseGroupEnabled,
  onClickAttentionFilter,
  isAttentionFilterEnabled,
  showAttentionFilterBadge,
  attentionFilterBadgeCount,
}: Props) {
  const items = [
    {
      value: "scatterAll",
      label: SegmentItemWithIcon(AllViewIcon, "全体", selected === "scatterAll"),
      isDisabled: false,
    },
    {
      value: "scatterDensity",
      label: SegmentItemWithIcon(DenseViewIcon, "濃い意見", selected === "scatterDensity"),
      isDisabled: !isDenseGroupEnabled,
      tooltip: !isDenseGroupEnabled ? "この設定条件では抽出できませんでした" : undefined,
    },
    {
      value: "treemap",
      label: SegmentItemWithIcon(HierarchyViewIcon, "階層", selected === "treemap"),
      isDisabled: false,
    },
  ];

  return (
    <Box maxW="1200px" mx="auto" mb={2}>
      <Box display="grid" gridTemplateColumns={["1fr", null, "1fr auto"]} gap="3">
        <ButtonGroup 
          isAttached 
          variant="outline"
          justifySelf={["center", null, "left", "center"]}
          ml={[0, null, null, "104px"]}
        >
          {items.map((item) => (
            <Tooltip 
              key={item.value} 
              content={item.tooltip} 
              isDisabled={!item.tooltip}
              openDelay={0} 
              closeDelay={0}
            >
              <Button
                onClick={() => onChange(item.value)}
                isActive={selected === item.value}
                isDisabled={item.isDisabled}
                w={["calc(33.33%)", null, "162px"]}
                h={["80px", null, "56px"]}
                position="relative"
              >
                {item.label}
              </Button>
            </Tooltip>
          ))}
        </ButtonGroup>

        <HStack gap={1} justifySelf={["end"]} alignSelf={"center"}>
          {isAttentionFilterEnabled && onClickAttentionFilter && (
            <Tooltip content={"フィルタ"} openDelay={0} closeDelay={0}>
              <Button onClick={onClickAttentionFilter} variant="outline" h={"50px"}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Icon>
                    <Filter size={16} />
                  </Icon>
                  {showAttentionFilterBadge && (
                    <Box as="span" fontSize="xs" bg="cyan.500" color="white" p="1" borderRadius="md" minW="5">
                      {attentionFilterBadgeCount}
                    </Box>
                  )}
                </Box>
              </Button>
            </Tooltip>
          )}

          <Tooltip content={"表示設定"} openDelay={0} closeDelay={0}>
            <Button onClick={onClickDensitySetting} variant={"outline"} h={"50px"} w={"50px"} p={0}>
              <Icon as={CogIcon} />
            </Button>
          </Tooltip>

          <Tooltip content={"全画面表示"} openDelay={0} closeDelay={0}>
            <Button onClick={onClickFullscreen} variant={"outline"} h={"50px"} w={"50px"} p={0}>
              <Icon as={FullscreenIcon} />
            </Button>
          </Tooltip>
        </HStack>
      </Box>
    </Box>
  );
}
