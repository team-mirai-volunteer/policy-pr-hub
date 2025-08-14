import type { Argument, Cluster } from "@/type";
import type { PlotData } from "plotly.js";
import { ChartCore } from "./ChartCore";

type Props = {
  clusterList: Cluster[];
  argumentList: Argument[];
  onHover?: () => void;
  level: string;
  onTreeZoom: (level: string) => void;
  filteredArgumentIds?: string[];
};

export function SunburstChart({ clusterList, argumentList, onHover, level, onTreeZoom, filteredArgumentIds }: Props) {
  const isFilteringActive = !!filteredArgumentIds;

  const convertedArgumentList = argumentList.map((arg) => {
    const converted = convertArgumentToCluster(arg);

    if (filteredArgumentIds && !filteredArgumentIds.includes(arg.arg_id)) {
      return {
        ...converted,
        filtered: true,
      };
    }
    return converted;
  });

  const clusterCounts: Record<string, number> = {};

  for (const cluster of clusterList) {
    clusterCounts[cluster.id] = 0;
  }

  for (const arg of argumentList) {
    if (isFilteringActive && !filteredArgumentIds.includes(arg.arg_id)) {
      continue;
    }

    for (const clusterId of arg.cluster_ids) {
      if (clusterCounts[clusterId] !== undefined) {
        clusterCounts[clusterId]++;
      }
    }
  }

  const list = [{ ...clusterList[0], parent: "" }, ...clusterList.slice(1), ...convertedArgumentList];
  const ids = list.map((node) => node.id);
  const labels = list.map((node) => {
    return node.id === level ? node.label.replace(/(.{50})/g, "$1<br />") : node.label.replace(/(.{15})/g, "$1<br />");
  });
  const parents = list.map((node) => node.parent);
  const values = list.map((node) => {
    if (clusterCounts[node.id] !== undefined) {
      return isFilteringActive ? clusterCounts[node.id] : node.value;
    }
    return node.filtered ? 0 : 1;
  });
  const customdata = list.map((node) => {
    let takeaway = node.takeaway.replace(/(.{15})/g, "$1<br />");

    if (clusterCounts[node.id] !== undefined && isFilteringActive) {
      const originalCount = node.value;
      const filteredCount = clusterCounts[node.id];

      if (filteredCount < originalCount) {
        takeaway = `${takeaway}<br><br>元の件数: ${originalCount}<br>フィルター後: ${filteredCount}`;
      }
    }

    return node.filtered
      ? ""
      : takeaway;
  });

  const colors = list.map((node) => {
    return node.filtered ? "#cccccc" : "";
  });

  const data: Partial<PlotData & { maxdepth: number }> = {
    type: "sunburst",
    ids: ids,
    labels: labels,
    parents: parents,
    values: values,
    customdata: customdata,
    branchvalues: "total",
    marker: {
      colors: colors,
      line: {
        width: 1,
        color: "white",
      },
      opacity: list.map((node) => {
        return node.filtered ? 0.5 : 1;
      }),
    },
    hoverinfo: "text",
    hovertemplate: "%{customdata}<extra></extra>",
    hoverlabel: {
      align: "left",
    },
    texttemplate: isFilteringActive
      ? "%{label}<br>%{value:,}件 (フィルター後)<br>%{percentEntry:.2%}"
      : "%{label}<br>%{value:,}件<br>%{percentEntry:.2%}",
    maxdepth: 2,
  };

  const layout = {
    margin: { l: 10, r: 10, b: 10, t: 30 },
    colorway: [
      "#b3daa1",
      "#f5c5d7",
      "#d5e5f0",
      "#fbecc0",
      "#80b8ca",
      "#dabeed",
      "#fad1af",
      "#fbb09d",
      "#a6e3ae",
      "#f1e4d6",
    ],
  };

  return (
    <ChartCore
      data={[data]}
      layout={layout}
      useResizeHandler={true}
      style={{ width: "100%", height: "100%" }}
      config={{
        responsive: true,
        displayModeBar: false,
        locale: "ja",
      }}
      onHover={() => {
        onHover?.();
      }}
      onClick={(event) => {
        const clickedNode = event.points[0];
        const newLevel = clickedNode.data.ids[clickedNode.pointNumber]?.toString() || "0";
        onTreeZoom(newLevel);
      }}
    />
  );
}

function convertArgumentToCluster(argument: Argument): Cluster {
  return {
    level: 3,
    id: argument.arg_id,
    label: argument.argument,
    takeaway: "",
    value: 1,
    parent: argument.cluster_ids[2],
    density_rank_percentile: 0,
  };
}
