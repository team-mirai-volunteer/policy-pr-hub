import type { HierarchicalCluster } from "@/types/hierarchical";
import type { PlotData } from "plotly.js";
import { ChartCore } from "./ChartCore";
import { useState, useEffect } from "react";

type Props = {
  clusters: HierarchicalCluster[];
  onHover?: () => void;
};

export function PieChart({ clusters, onHover }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const level1Clusters = clusters.filter(cluster => cluster.level === 0);
  
  const labels = level1Clusters.map(cluster => cluster.label);
  const values = level1Clusters.map(cluster => cluster.value || cluster.count || 0);
  
  const colors = [
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
  ];

  const data: Partial<PlotData> = {
    type: "pie",
    labels: labels,
    values: values,
    marker: {
      colors: colors,
      line: {
        color: "white",
        width: 2,
      },
    },
    textinfo: isMobile ? "percent" : "label+percent",
    textposition: "auto",
    hovertemplate: "%{label}<br>%{value:,}件<br>%{percent}<extra></extra>",
    hoverlabel: {
      align: "left",
    },
  };

  const layout = {
    margin: isMobile 
      ? { l: 10, r: 10, b: 10, t: 40 }
      : { l: 20, r: 20, b: 20, t: 40 },
    showlegend: true,
    legend: isMobile 
      ? {
          orientation: "h" as const,
          x: 0,
          y: -0.2,
          xanchor: "left" as const,
          yanchor: "top" as const,
        }
      : {
          orientation: "v" as const,
          x: 1.02,
          y: 0.5,
        },
    title: {
      text: "政策分野別の提案数",
      font: {
        size: isMobile ? 14 : 16,
        color: "#333",
      },
    },
  };

  return (
    <ChartCore
      data={[data]}
      layout={layout}
      useResizeHandler={true}
      style={{ width: "100%", height: isMobile ? "500px" : "400px" }}
      config={{
        responsive: true,
        displayModeBar: false,
        locale: "ja",
      }}
      onHover={() => {
        onHover?.();
      }}
    />
  );
}
