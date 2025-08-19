'use client'

import React, { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

interface PRData {
  No: number
  subject: string
  link: string
  label: string
  body: string | null
  summary: string | null
  stance_val: number
  assert_val: number
  category: string
  priority: string
  [key: string]: unknown
}

interface ScatterChartProps {
  data: PRData[]
  onPointClick?: (prNumber: number) => void
}

export default function ScatterChart({ data, onPointClick }: ScatterChartProps) {
  const [plotData, setPlotData] = useState<Array<Record<string, unknown>>>([])
  const [layout, setLayout] = useState<Record<string, unknown>>({})

  const extractPRNumber = (url: string): number => {
    const match = url.match(/\/pull\/(\d+)$/)
    return match ? parseInt(match[1]) : 0
  }

  const stableOnPointClick = useCallback((prNumber: number) => {
    if (onPointClick) {
      onPointClick(prNumber)
    }
  }, [onPointClick])

  useEffect(() => {
    const labels = [...new Set(data.map(d => d.label).filter(Boolean))].sort()
    const traces: Array<Record<string, unknown>> = []
    
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ]
    
    labels.forEach((label, i) => {
      const labelData = data.filter(d => d.label === label)
      if (labelData.length === 0) return
      
      const trace: Record<string, unknown> = {
        x: labelData.map(d => d.stance_val),
        y: labelData.map(d => d.assert_val),
        mode: 'markers',
        type: 'scatter',
        name: label,
        marker: {
          size: 10,
          color: colors[i % colors.length],
          line: { width: 1, color: 'white' },
          opacity: 0.8
        },
        text: labelData.map(d => {
          let text = `スタンス: ${d.stance_val}<br>主張強度: ${d.assert_val}`
          if (d.subject) text += `<br>件名: ${d.subject}`
          if (d.category) text += `<br>カテゴリ: ${d.category}`
          return text
        }),
        hoverinfo: 'text',
        customdata: labelData.map(d => extractPRNumber(d.link))
      }
      traces.push(trace)
    })
    
    setPlotData(traces)
    
    setLayout({
      title: 'スタンス vs 主張強度 分析（ラベル別色分け）',
      xaxis: {
        title: 'スタンス（← 否定的 ／ 肯定的 →）',
        range: [-5.5, 5.5],
        zeroline: true,
        zerolinecolor: 'lightgray',
        zerolinewidth: 2
      },
      yaxis: {
        title: '主張の強さ（↓ 弱い ／ 強い ↑）',
        range: [-5.5, 5.5],
        zeroline: true,
        zerolinecolor: 'lightgray',
        zerolinewidth: 2
      },
      plot_bgcolor: 'var(--card-bg)',
      height: 600,
      font: { family: 'Arial, sans-serif' },
      shapes: [
        { type: 'line', x0: 0, x1: 0, y0: -5.5, y1: 5.5, 
          line: { color: 'gray', width: 2, dash: 'dash' } },
        { type: 'line', x0: -5.5, x1: 5.5, y0: 0, y1: 0, 
          line: { color: 'gray', width: 2, dash: 'dash' } }
      ]
    })

  }, [data, stableOnPointClick])

  const handleClick = (event: { points?: Array<{ customdata?: unknown }> }) => {
    console.log('Plot clicked:', event)
    if (event.points && event.points.length > 0) {
      const point = event.points[0]
      const prNumber = point.customdata as number
      console.log('PR Number from click:', prNumber)
      if (prNumber) {
        console.log('Navigating to PR:', prNumber)
        stableOnPointClick(prNumber)
      }
    }
  }

  return (
    <div className="w-full">
      <Plot
        data={plotData}
        layout={layout}
        onClick={handleClick}
        style={{ width: '100%', height: '600px' }}
        config={{ responsive: true }}
        useResizeHandler={true}
      />
    </div>
  )
}
