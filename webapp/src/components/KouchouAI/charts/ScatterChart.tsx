// filepath: c:\Users\shinta\Documents\GitHub\kouchou-ai\client\components\charts\ScatterChart.tsx
import type { Argument, Cluster, Config } from "@/type";
import { Box } from "@chakra-ui/react";
import type { Annotations, Data, Layout } from "plotly.js";
import { Delaunay } from "d3-delaunay";
// @ts-expect-error - polybooljs doesn't have TypeScript definitions
import PolyBool from "polybooljs";
import { ChartCore } from "./ChartCore";

type Props = {
  clusterList: Cluster[];
  argumentList: Argument[];
  targetLevel: number;
  onHover?: () => void;
  showClusterLabels?: boolean;
  // フィルター適用後の引数IDのリストを受け取り、フィルターに該当しないポイントの表示を変更する
  filteredArgumentIds?: string[];
  config?: Config; // ソースリンク機能の有効/無効を制御するため
  isFullScreen?: boolean; // 全体画面表示かどうかの制御フラグ
};

export function ScatterChart({
  clusterList,
  argumentList,
  targetLevel,
  onHover,
  showClusterLabels,
  filteredArgumentIds, // フィルター済みIDリスト（フィルター条件に合致する引数のID）
  config,
  isFullScreen = false, // デフォルトは非全画面
}: Props) {
  // 全ての引数を表示するため、argumentListをそのまま使用
  // フィルター条件に合致しないものは後で灰色表示する
  const allArguments = argumentList;

  // クラスター別の引数インデックス（パフォーマンス向上）
  const byCluster: Record<string, Argument[]> = allArguments.reduce((m, a) => {
    for (const cid of a.cluster_ids) (m[cid] ??= []).push(a);
    return m;
  }, {} as Record<string, Argument[]>);

  const targetClusters = clusterList.filter((cluster) => cluster.level === targetLevel);
  const softColors = [
    "#7ac943",
    "#3fa9f5",
    "#ff7997",
    "#e0dd02",
    "#d6410f",
    "#b39647",
    "#7cccc3",
    "#a147e6",
    "#ff6b6b",
    "#4ecdc4",
    "#ffbe0b",
    "#fb5607",
    "#8338ec",
    "#3a86ff",
    "#ff006e",
    "#8ac926",
    "#1982c4",
    "#6a4c93",
    "#f72585",
    "#7209b7",
    "#00b4d8",
    "#e76f51",
    "#606c38",
    "#9d4edd",
    "#457b9d",
    "#bc6c25",
    "#2a9d8f",
    "#e07a5f",
    "#5e548e",
    "#81b29a",
    "#f4a261",
    "#9b5de5",
    "#f15bb5",
    "#00bbf9",
    "#98c1d9",
    "#84a59d",
    "#f28482",
    "#00afb9",
    "#cdb4db",
    "#fcbf49",
  ];

  const clusterColorMap = targetClusters.reduce(
    (acc, cluster, index) => {
      acc[cluster.id] = softColors[index % softColors.length];
      return acc;
    },
    {} as Record<string, string>,
  );

  const clusterColorMapA = targetClusters.reduce(
    (acc, cluster, index) => {
      const alpha = 0.8; // アルファ値を指定
      acc[cluster.id] =
        softColors[index % softColors.length] +
        Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, "0");
      return acc;
    },
    {} as Record<string, string>,
  );

  const annotationLabelWidth = 228; // ラベルの最大横幅を指定
  const annotationFontsize = 14; // フォントサイズを指定

  // ラベルのテキストを折り返すための関数
  const wrapLabelText = (text: string): string => {
    // 英語と日本語の文字数を考慮して、適切な長さで折り返す

    const alphabetWidth = 0.6; // 英字の幅

    let result = "";
    let currentLine = "";
    let currentLineLength = 0;

    // 文字ごとに処理
    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // 英字と日本語で文字幅を考慮
      // ASCIIの範囲（半角文字）かそれ以外（全角文字）かで幅を判定
      const charWidth = /[!-~]/.test(char) ? alphabetWidth : 1;
      const charLength = charWidth * annotationFontsize;
      currentLineLength += charLength;

      if (currentLineLength > annotationLabelWidth) {
        // 現在の行が最大幅を超えた場合、改行
        result += `${currentLine}<br>`;
        currentLine = char; // 新しい行の開始
        currentLineLength = charLength; // 新しい行の長さをリセット
      } else {
        currentLine += char; // 現在の行に文字を追加
      }
    }

    // 最後の行を追加
    if (currentLine) {
      result += `${currentLine}`;
    }

    return result;
  };

  const onUpdate = () => {
    // Plotly単体で設定できないデザインを、onUpdateのタイミングでHTMLをオーバーライドして解決する

    // アノテーションの角を丸にする
    const bgRound = 4;
    try {
      for (const g of document.querySelectorAll("g.annotation")) {
        const bg = g.querySelector("rect.bg");
        if (bg) {
          bg.setAttribute("rx", `${bgRound}px`);
          bg.setAttribute("ry", `${bgRound}px`);
        }
      }
    } catch (error) {
      console.error("アノテーション要素の角丸化に失敗しました:", error);
    }

    // プロット操作用アイコンのエリアを「全画面終了」ボタンの下に移動する
    avoidModBarCoveringShrinkButton();
  };

  // フィルターが適用されている場合、フィルター条件に合致するアイテムと合致しないアイテムを分離
  const separateDataByFilter = (cluster: Cluster) => {
    if (!filteredArgumentIds) {
      // フィルターなしの場合は通常表示
      const clusterArguments = allArguments.filter((arg) => arg.cluster_ids.includes(cluster.id));
      return {
        matching: clusterArguments,
        notMatching: [] as Argument[],
      };
    }

    // フィルター条件に合致するアイテム（前面に表示）
    const matchingArguments = allArguments.filter(
      (arg) => arg.cluster_ids.includes(cluster.id) && filteredArgumentIds.includes(arg.arg_id),
    );

    // フィルター条件に合致しないアイテム（背面に表示）
    const notMatchingArguments = allArguments.filter(
      (arg) => arg.cluster_ids.includes(cluster.id) && !filteredArgumentIds.includes(arg.arg_id),
    );

    return {
      matching: matchingArguments,
      notMatching: notMatchingArguments,
    };
  };

  console.time('Voronoi polygon generation');
  
  const globalVoronoi = createGlobalVoronoi();
  if (!globalVoronoi) {
    console.error('Failed to create global Voronoi diagram');
    return <div>Error: Unable to generate Voronoi diagram</div>;
  }

  const radius = calculateCircleRadius();
  
  const clusterPolygonSets = targetClusters.map((cluster) => {
    const clusterPoints = allArguments.filter(arg => arg.cluster_ids.includes(cluster.id));
    const polygons: any[] = [];
    
    clusterPoints.forEach((point) => {
      const pointIndex = allArguments.findIndex(arg => arg.arg_id === point.arg_id);
      if (pointIndex === -1) return;
      
      const voronoiCell = globalVoronoi.voronoi.cellPolygon(pointIndex);
      if (!voronoiCell) return;
      
      const intersection = intersectCircleWithVoronoi(point.x, point.y, radius, voronoiCell);
      if (intersection && intersection.length >= 3) {
        polygons.push({
          type: 'scatter',
          mode: 'lines',
          fill: 'toself',
          x: intersection.map((p: any) => p[0]).concat([intersection[0][0]]),
          y: intersection.map((p: any) => p[1]).concat([intersection[0][1]]),
          fillcolor: clusterColorMapA[cluster.id],
          line: { color: clusterColorMap[cluster.id], width: 1 },
          showlegend: false,
          hoverinfo: 'skip'
        });
      }
    });
    
    return { cluster, polygons };
  }).filter((item): item is { cluster: Cluster; polygons: any[] } => item !== null);

  const plotData: any[] = [];
  clusterPolygonSets.forEach(({ cluster, polygons }) => {
    if (!cluster.densityFiltered) {
      plotData.push(...polygons);
    }
  });
  
  clusterPolygonSets.forEach(({ cluster }) => {
    if (!cluster.densityFiltered) {
      const center = getClusterAnchor(cluster.id);
      plotData.push({
        x: [center.x],
        y: [center.y],
        mode: 'markers',
        marker: {
          size: 8,
          color: clusterColorMap[cluster.id],
          opacity: 0.8
        },
        text: cluster.label,
        hoverinfo: 'text',
        showlegend: false,
        customdata: [{ cluster_id: cluster.id }]
      });
    }
  });

  console.timeEnd('Voronoi polygon generation');

  // === ラベル配置のためのヘルパー関数群 ===

  /** 
   * 全データ点のバウンディングボックスを計算
   * @returns データ点を囲む矩形の座標
   */
  function calculateDataBounds() {
    if (allArguments.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    let minX = allArguments[0].x;
    let maxX = allArguments[0].x;
    let minY = allArguments[0].y;
    let maxY = allArguments[0].y;

    allArguments.forEach(arg => {
      minX = Math.min(minX, arg.x);
      maxX = Math.max(maxX, arg.x);
      minY = Math.min(minY, arg.y);
      maxY = Math.max(maxY, arg.y);
    });

    // バウンディングボックスにマージンを追加してデータ点から離す
    const margin = 0;
    return {
      minX: minX - margin,
      maxX: maxX + margin,
      minY: minY - margin,
      maxY: maxY + margin,
    };
  }

  /**
   * 対象クラスタのデータ点ごとにバウンディングボックスを計算し、その中央点を返す
   * @param targetClusterId 対象クラスタID
   * @returns バウンディングボックスの中央点座標
   */
  function calculateClusterBoundingBoxCenter(targetClusterId: string): { centerX: number; centerY: number } | null {
    // 対象クラスタに属するデータ点を取得
    const clusterArguments = allArguments.filter(arg => arg.cluster_ids.includes(targetClusterId));

    if (clusterArguments.length === 0) {
      console.warn(`クラスタ ${targetClusterId} にデータ点が見つかりません`);
      return null;
    }

    // バウンディングボックスを計算
    let minX = clusterArguments[0].x;
    let maxX = clusterArguments[0].x;
    let minY = clusterArguments[0].y;
    let maxY = clusterArguments[0].y;

    clusterArguments.forEach(arg => {
      minX = Math.min(minX, arg.x);
      maxX = Math.max(maxX, arg.x);
      minY = Math.min(minY, arg.y);
      maxY = Math.max(maxY, arg.y);
    });

    // バウンディングボックスの中央点を計算
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;


    return { centerX, centerY };
  }

  /**
   * クラスター内で重心に最も近い点をアンカーとして取得（メドイド近傍）
   * 外れ値に引っ張られない、より密な中心点を提供
   * @param clusterId 対象クラスタID
   * @returns メドイド近傍の座標
   */
  function getClusterAnchor(clusterId: string): { x: number; y: number } {
    const pts = byCluster[clusterId] ?? [];
    if (!pts.length) return { x: 0, y: 0 };
    
    // 重心を計算
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    
    // 重心に最も近い実際の点を見つける
    let best = pts[0];
    let bd = Infinity;
    for (const p of pts) {
      const d = (p.x - cx) ** 2 + (p.y - cy) ** 2;
      if (d < bd) { 
        bd = d; 
        best = p; 
      }
    }
    return { x: best.x, y: best.y };
  }

  /**
   * Calculate bounding box dimensions and circle radius
   */
  function calculateCircleRadius() {
    const bounds = calculateDataBounds();
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    return Math.min(width, height) * 0.1;
  }

  /**
   * Generate circle around a point
   */
  function generateCircle(centerX: number, centerY: number, radius: number, segments = 32) {
    const points = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      points.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ]);
    }
    return points;
  }

  /**
   * Create global Voronoi diagram for all points
   */
  function createGlobalVoronoi() {
    if (allArguments.length < 3) return null;
    
    const points = allArguments.map(arg => [arg.x, arg.y] as [number, number]);
    const bounds = calculateDataBounds();
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([bounds.minX, bounds.minY, bounds.maxX, bounds.maxY]);
    
    return { voronoi, points: allArguments };
  }

  /**
   * Convert circle to polygon format for PolyBool
   */
  function circleToPolygon(centerX: number, centerY: number, radius: number, segments = 32) {
    const points = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      points.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ]);
    }
    return { regions: [points], inverted: false };
  }

  /**
   * Convert Voronoi cell to PolyBool polygon format
   */
  function voronoiCellToPolygon(cell: [number, number][]) {
    if (!cell || cell.length < 3) return null;
    return { regions: [cell], inverted: false };
  }

  /**
   * Intersect circle with Voronoi cell using PolyBool
   */
  function intersectCircleWithVoronoi(centerX: number, centerY: number, radius: number, voronoiCell: [number, number][]) {
    const circle = circleToPolygon(centerX, centerY, radius);
    const voronoi = voronoiCellToPolygon(voronoiCell);
    
    if (!voronoi) return null;
    
    try {
      const intersection = PolyBool.intersect(circle, voronoi);
      return intersection.regions[0] || null;
    } catch (error) {
      console.warn('PolyBool intersection failed:', error);
      return null;
    }
  }



  /**
   * 表示対象のクラスターを取得（密度フィルターされたものは除外）
   * @returns 表示すべきクラスターのリスト
   */
  function getValidClustersForLabels() {
    return clusterPolygonSets.filter((dataSet: any) => {
      return !dataSet.cluster.densityFiltered;
    });
  }


  /**
   * 制約付きラベル配置：左右各10まで、あふれは上下へ退避
   * 単調対応により交差をゼロにして視認性を向上
   * @returns 各クラスターのラベル位置情報
   */
  function calcLabelPositionsConstrained() {
    const valid = getValidClustersForLabels();
    if (!valid.length) return [];

    const b = calculateDataBounds();
    const midX = (b.minX + b.maxX) / 2;
    const midY = (b.minY + b.maxY) / 2;
    const dx = (b.maxX - b.minX) * 0.06; // ラベルを外側へ
    const dy = (b.maxY - b.minY) * 0.06;

    const withCenter = valid.map((ds: any) => {
      const a = getClusterAnchor(ds.cluster.id);
      return { ...ds, centerX: a.x, centerY: a.y };
    });

    const left  = withCenter.filter((c: any) => c.centerX <= midX).sort((a: any, b: any)=>a.centerY-b.centerY);
    const right = withCenter.filter((c: any) => c.centerX >  midX).sort((a: any, b: any)=>a.centerY-b.centerY);

    const MAX_SIDE = 10;
    
    // まず左右に配置（各10まで）
    const keepLeft  = left.slice(0,  Math.min(MAX_SIDE, left.length));
    const keepRight = right.slice(0, Math.min(MAX_SIDE, right.length));
    
    // 左右に置ききれなかった分を集める
    const leftOverflow = left.slice(MAX_SIDE);
    const rightOverflow = right.slice(MAX_SIDE);
    
    // 左右あわせて20個まで配置できるので、空きがあれば反対側に回す
    const totalUsed = keepLeft.length + keepRight.length;
    const remainingCapacity = 20 - totalUsed;
    
    let finalLeft = [...keepLeft];
    let finalRight = [...keepRight];
    
    if (remainingCapacity > 0) {
      // 左側に空きがある場合、右のあふれを左に回す
      if (keepLeft.length < MAX_SIDE && rightOverflow.length > 0) {
        const canMoveToLeft = Math.min(MAX_SIDE - keepLeft.length, rightOverflow.length);
        finalLeft = [...keepLeft, ...rightOverflow.slice(0, canMoveToLeft)];
        rightOverflow.splice(0, canMoveToLeft);
      }
      
      // 右側に空きがある場合、左のあふれを右に回す
      if (keepRight.length < MAX_SIDE && leftOverflow.length > 0) {
        const canMoveToRight = Math.min(MAX_SIDE - keepRight.length, leftOverflow.length);
        finalRight = [...keepRight, ...leftOverflow.slice(0, canMoveToRight)];
        leftOverflow.splice(0, canMoveToRight);
      }
    }
    
    const overflow = [...leftOverflow, ...rightOverflow];

    // スロット生成ヘルパ
    const makeVerticalSlots = (n: number, x: number) => {
      // 縦の間隔を20%増やすため、表示範囲を1.2倍に拡張
      const expandedHeight = (b.maxY - b.minY) * 1.2;
      const startY = b.minY - expandedHeight * 0.1;
      return Array.from({length: n}, (_, i) => ({
        labelX: x,
        labelY: startY + (expandedHeight / (n + 1)) * (i + 1),
      }));
    };

    const makeHorizontalSlots = (n: number, y: number) =>
      Array.from({length: n}, (_, i) => ({
        labelX: b.minX + (b.maxX - b.minX) * ((i + 1) / (n + 1)),
        labelY: y,
      }));

    // 左右スロット（単調対応で交差ゼロ）
    const leftSlots  = makeVerticalSlots(finalLeft.length,  b.minX - dx);
    const rightSlots = makeVerticalSlots(finalRight.length, b.maxX + dx);

    const assignments: Array<{ dataSet: { cluster: Cluster; centerX: number; centerY: number }; labelX:number; labelY:number; side:'left'|'right'|'top'|'bottom' }> = [];
    finalLeft.forEach((ds, i)  => assignments.push({ dataSet: ds, ...leftSlots[i],  side: 'left'  }));
    finalRight.forEach((ds, i) => assignments.push({ dataSet: ds, ...rightSlots[i], side: 'right' }));

    // あふれは上下へ：midY 基準で分配し、各列で x 昇順にして単調対応
    const top = overflow.filter(c => c.centerY >= midY).sort((a,b)=>a.centerX-b.centerX);
    const bottom = overflow.filter(c => c.centerY <  midY).sort((a,b)=>a.centerX-b.centerX);

    const MAX_TOP = 10, MAX_BOTTOM = 10;
    const topSlots    = makeHorizontalSlots(Math.min(MAX_TOP, top.length),    b.maxY + dy);
    const bottomSlots = makeHorizontalSlots(Math.min(MAX_BOTTOM, bottom.length), b.minY - dy);

    top.slice(0, MAX_TOP).forEach((ds, i)    => assignments.push({ dataSet: ds, ...topSlots[i],    side: 'top' }));
    bottom.slice(0, MAX_BOTTOM).forEach((ds, i)=> assignments.push({ dataSet: ds, ...bottomSlots[i], side: 'bottom' }));

    // 40超の超過分は表示しない
    const hidden = top.slice(MAX_TOP).length + bottom.slice(MAX_BOTTOM).length;
    if (hidden > 0) console.info(`ラベル上限を超過: 非表示 ${hidden} 件`);

    return assignments;
  }




  /**
   * 単一アノテーションオブジェクトを作成（引き出し線でのラベル作り）
   * 4つのサイド（left/right/top/bottom）に対応し、適切なアンカリングを提供
   */
  function createSingleAnnotation(
    dataSet: { cluster: Cluster; centerX: number; centerY: number },
    labelX: number, 
    labelY: number, 
    side: 'left' | 'right' | 'top' | 'bottom',
    isFullScreen: boolean = false
  ): Partial<Annotations> {
    // フィルター状態の判定
    const isAllFiltered = filteredArgumentIds &&
      (separateDataByFilter(dataSet.cluster).matching.length === 0 || dataSet.cluster.allFiltered);

    // 背景色の決定
    const bgColor = isAllFiltered
      ? clusterColorMapA[dataSet.cluster.id].replace(/[0-9a-f]{2}$/i, "cc")
      : clusterColorMapA[dataSet.cluster.id];

    // メドイド近傍のアンカー点を取得
    const a = getClusterAnchor(dataSet.cluster.id);
    const cx = a.x ?? dataSet.centerX;
    const cy = a.y ?? dataSet.centerY;
    
    const arrowColor = clusterColorMap[dataSet.cluster.id];

    return {
      // 【重要】Plotlyアノテーションの正しい仕組み：
      // - (x, y): 引き出し線の先端（データポイント）
      // - (ax, ay): テキストが配置される位置＋引き出し線の起点
      
      // 引き出し線の先端（クラスター中央点を指す）
      x: cx,
      y: cy,
      xref: "x",
      yref: "y",

      // ラベルの内容
      text: wrapLabelText(dataSet.cluster.label),

      // 引き出し線の設定
      showarrow: isFullScreen,
      arrowhead: 0,
      arrowsize: 1,
      arrowwidth: 1.5,
      arrowcolor: arrowColor,

      // 引き出し線の起点＋テキスト表示位置（ラベル位置）
      ax: labelX,
      ay: labelY,
      axref: "x",
      ayref: "y",

      // サイドに応じたアンカリング（テキストボックスの基準点）
      xanchor: side === 'left' ? 'right' : side === 'right' ? 'left' : 'center',
      yanchor: side === 'top'  ? 'bottom' : side === 'bottom' ? 'top' : 'middle',

      // ラベルのスタイル
      font: {
        color: "white",
        size: annotationFontsize,
        weight: 700,
      },
      bgcolor: bgColor,
      borderpad: 8,
      width: annotationLabelWidth,
      align: "left" as const,
      opacity: 0.97,
    };
  }

  // === メインのアノテーション生成 ===
  const annotations: Partial<Annotations>[] = showClusterLabels
    ? calcLabelPositionsConstrained().map(({ dataSet, labelX, labelY, side }) =>
      createSingleAnnotation(dataSet, labelX, labelY, side, true) // 常に引き出し線を表示
    )
    : [];

  return (
    <Box width="100%" height="100%" display="flex" flexDirection="column">
      <Box position="relative" flex="1">
        <ChartCore
          data={plotData as unknown as Data[]}
          layout={
            {
              margin: { l: 0, r: 0, b: 0, t: 0 },
              xaxis: {
                zeroline: false,
                showticklabels: false,
                showgrid: false,
              },
              yaxis: {
                zeroline: false,
                showticklabels: false,
                showgrid: false,
                scaleanchor: "x", // x軸に対してy軸のスケールを固定してアスペクト比を保つ
                scaleratio: 1, // 1:1の比率を維持
              },
              hovermode: "closest",
              dragmode: "pan", // ドラッグによる移動（パン）を有効化
              annotations,
              showlegend: false,
            } as Partial<Layout>
          }
          useResizeHandler={true}
          style={{ width: "100%", height: "100%", cursor: config?.enable_source_link ? "pointer" : "default" }}
          config={{
            responsive: true,
            displayModeBar: "hover", // 操作時にツールバーを表示
            scrollZoom: true, // マウスホイールによるズームを有効化
            locale: "ja",
          }}
          onHover={onHover}
          onUpdate={onUpdate}
          onClick={(event: any) => {
            if (!config?.enable_source_link) return;

            try {
              if (event.points && event.points.length > 0) {
                const point = event.points[0];

                // customdataから直接argumentの情報を取得
                if (point.customdata) {
                  const customData = point.customdata as unknown as { arg_id: string; url?: string };

                  if (customData.url) {
                    window.open(customData.url, "_blank", "noopener,noreferrer");
                  } else {
                    // customdataにURLがない場合、argumentListから検索
                    const matchedArgument = argumentList.find((arg) => arg.arg_id === customData.arg_id);
                    if (matchedArgument?.url) {
                      window.open(matchedArgument.url, "_blank", "noopener,noreferrer");
                    } else {
                      console.log("No URL found for argument:", customData.arg_id);
                    }
                  }
                } else {
                  console.log("No customdata found in clicked point");
                }
              }
            } catch (error) {
              console.error("Error in click handler:", error);
            }
          }}
        />
      </Box>
    </Box>
  );
}

function avoidModBarCoveringShrinkButton(): void {
  const modeBarContainer = document.querySelector(".modebar-container") as HTMLElement;
  if (!modeBarContainer) return;
  const modeBar = modeBarContainer.children[0] as HTMLElement;
  const shrinkButton = document.getElementById("fullScreenButtons");
  if (!modeBar || !shrinkButton) return;
  const modeBarPos = modeBar.getBoundingClientRect();
  const btnPos = shrinkButton.getBoundingClientRect();
  const isCovered = !(
    btnPos.top > modeBarPos.bottom ||
    btnPos.bottom < modeBarPos.top ||
    btnPos.left > modeBarPos.right ||
    btnPos.right < modeBarPos.left
  );
  if (!isCovered) return;

  const diff = btnPos.bottom - modeBarPos.top;
  modeBarContainer.style.top = `${Number.parseInt(modeBarContainer.style.top.slice(0, -2)) + diff + 10}px`;
}
