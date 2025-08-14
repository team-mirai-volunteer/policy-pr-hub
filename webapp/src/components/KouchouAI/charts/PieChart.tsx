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
  
  const total = values.reduce((sum, value) => sum + value, 0);
  const percentages = values.map(value => (value / total) * 100);
  
  const wrapText = (text: string, maxLength: number = 25): string => {
    if (text.length <= maxLength) return text;
    
    const breakPoints = /([、。！？\s])/;
    const segments = text.split(breakPoints).filter(s => s.length > 0);
    
    let result = '';
    let currentLine = '';
    
    for (const segment of segments) {
      if (currentLine.length + segment.length > maxLength && currentLine.length > 0) {
        result += currentLine + '<br>';
        currentLine = segment;
      } else {
        currentLine += segment;
      }
    }
    result += currentLine;
    return result;
  };
  
  const wrappedLabels = labels.map(label => wrapText(label, isMobile ? 15 : 25));
  
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
    textinfo: "text",
    textposition: "auto",
    text: percentages.map((pct, index) => pct < 2 ? "" : (isMobile ? `${pct.toFixed(1)}%` : `${labels[index]} ${pct.toFixed(1)}%`)),
    hovertemplate: wrappedLabels.map((wrappedLabel, index) => 
      `${wrappedLabel}<br>%{value:,}件<br>%{percent}<extra></extra>`
    ),
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
