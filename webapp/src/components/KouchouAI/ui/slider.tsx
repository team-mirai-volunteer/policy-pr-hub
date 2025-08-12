import { 
  Slider as ChakraSlider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  HStack,
  Text,
  Box
} from "@chakra-ui/react";
import * as React from "react";

export interface SliderProps {
  marks?: Array<number | { value: number; label: React.ReactNode }>;
  label?: React.ReactNode;
  showValue?: boolean;
  value?: number[];
  defaultValue?: number[];
  onChange?: (value: number | number[]) => void;
  onValueChange?: (details: { value: number[] }) => void;
  min?: number;
  max?: number;
  step?: number;
  [key: string]: any;
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(function Slider(props, ref) {
  const { marks: marksProp, label, showValue, onValueChange, ...rest } = props;
  const [value, setValue] = React.useState(props.defaultValue ?? props.value ?? [0]);

  const marks = marksProp?.map((mark: number | { value: number; label: React.ReactNode }) => {
    if (typeof mark === "number") return { value: mark, label: undefined };
    return mark;
  });

  const handleChange = (newValue: number | number[]) => {
    const valueArray = Array.isArray(newValue) ? newValue : [newValue];
    setValue(valueArray);
    if (props.onChange) {
      props.onChange(newValue);
    }
    if (onValueChange) {
      onValueChange({ value: valueArray });
    }
  };

  return (
    <Box>
      {label && !showValue && <Text mb={2}>{label}</Text>}
      {label && showValue && (
        <HStack justify="space-between" mb={2}>
          <Text>{label}</Text>
          <Text>{Array.isArray(value) ? value[0] : value}</Text>
        </HStack>
      )}
      <ChakraSlider ref={ref} onChange={handleChange} {...rest}>
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
        {marks?.map((mark: { value: number; label: React.ReactNode | undefined }) => {
          const markValue = typeof mark === "number" ? mark : mark.value;
          const markLabel = typeof mark === "number" ? undefined : mark.label;
          return (
            <SliderMark key={markValue} value={markValue} mt="1" ml="-2.5" fontSize="sm">
              {markLabel}
            </SliderMark>
          );
        })}
      </ChakraSlider>
    </Box>
  );
});
