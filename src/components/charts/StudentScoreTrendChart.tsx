import React, { useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import * as echarts from 'echarts/core';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { ScoreTrendPoint } from '../../types/scoreStatistics';

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
]);

interface StudentScoreTrendChartProps {
  data: {
    [subjectId: string]: ScoreTrendPoint[];
  };
  subjectNames: { [key: string]: string };
  loading?: boolean;
  height?: number | string;
  title?: string;
}

const StudentScoreTrendChart: React.FC<StudentScoreTrendChartProps> = ({
  data,
  subjectNames,
  loading = false,
  height = 400,
  title = '学生成绩趋势'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 初始化和更新图表
  useEffect(() => {
    // 如果正在加载或没有数据，不渲染图表
    if (loading || !data || Object.keys(data).length === 0) return;

    // 如果DOM元素不存在，不渲染图表
    if (!chartRef.current) return;

    // 初始化图表实例
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // 准备数据
    const series: any[] = [];
    const xAxisData: string[] = [];
    const subjectIds = Object.keys(data);
    
    // 收集所有考试名称及其日期，用于排序
    const examDataMap = new Map<string, { name: string, date: string, index: number }>();

    // 收集所有考试数据用于排序
    subjectIds.forEach(subjectId => {
      data[subjectId].forEach(point => {
        if (!examDataMap.has(`${point.examId}`)) {
          examDataMap.set(`${point.examId}`, {
            name: point.examName,
            date: point.examDate,
            index: examDataMap.size
          });
        }
      });
    });

    // 按日期排序考试
    const sortedExams = Array.from(examDataMap.entries()).sort((a, b) => {
      // 优先按日期排序，如果日期相同则按原始顺序排序
      const dateA = new Date(a[1].date).getTime();
      const dateB = new Date(b[1].date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a[1].index - b[1].index;
    });

    // 获取排序后的考试名称作为X轴
    sortedExams.forEach(exam => {
      xAxisData.push(exam[1].name);
    });

    // 为每个科目创建一个数据系列
    subjectIds.forEach(subjectId => {
      const subjectData = data[subjectId];
      const examScoreMap = new Map<string, any>();

      // 先按考试ID组织数据
      subjectData.forEach(point => {
        examScoreMap.set(`${point.examId}`, {
          value: point.score,
          fullScore: point.fullScore,
          examDate: point.examDate,
          rank: point.rank,
          totalStudents: point.totalStudents,
          examName: point.examName
        });
      });

      // 按照排序后的考试顺序创建系列数据
      const seriesData = sortedExams.map(exam => {
        const examId = exam[0];
        const pointData = examScoreMap.get(examId);
        
        // 如果该考试没有这个科目的数据，返回null
        if (!pointData) {
          return {
            value: null,
            fullScore: null,
            examDate: exam[1].date,
            examName: exam[1].name
          };
        }
        
        return pointData;
      });

      const subjectName = subjectNames[subjectId] || `科目${subjectId}`;
      
      series.push({
        name: subjectName,
        type: 'line',
        data: seriesData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        },
        itemStyle: {
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'top',
          formatter: function(params: any) {
            if (params.value === null) return '';
            return params.value;
          },
          fontSize: 12,
          color: '#333'
        },
        connectNulls: true, // 连接空值点
        emphasis: {
          itemStyle: {
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          },
          label: {
            fontSize: 14,
            fontWeight: 'bold'
          }
        }
      });
    });

    // 配置选项
    const option = {
      title: {
        text: title,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function (params: any) {
          if (params.length === 0) return '';
          
          const dataIndex = params[0].dataIndex;
          const examName = xAxisData[dataIndex];
          let tooltipText = `<div style="font-weight:bold;margin-bottom:5px">${examName}</div>`;
          
          params.forEach((param: any) => {
            if (param.value === null) return;
            
            const { fullScore, rank, totalStudents } = param.data;
            if (!fullScore) return;
            
            const percentage = (param.value / fullScore * 100).toFixed(2);
            tooltipText += `<div style="margin: 3px 0">${param.seriesName}: <span style="font-weight:bold;color:${param.color}">${param.value}</span> / ${fullScore} (${percentage}%)</div>`;
            
            if (rank && totalStudents) {
              tooltipText += `<div style="margin-left:15px">排名: ${rank} / ${totalStudents}</div>`;
            }
          });
          
          return tooltipText;
        }
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        bottom: 30,
        data: subjectIds.map(id => subjectNames[id] || `科目${id}`)
      },
      toolbox: {
        feature: {
          saveAsImage: { title: '保存为图片' }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      dataZoom: [
        {
          type: 'slider',
          show: xAxisData.length > 5,
          bottom: 5,
          height: 20,
          start: 0,
          end: xAxisData.length <= 5 ? 100 : 80
        }
      ],
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: xAxisData,
        axisLabel: {
          rotate: 30,
          fontSize: 12,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: '分数',
        nameLocation: 'middle',
        nameGap: 40,
        min: 0,
        max: function(value: { max: number }) {
          return Math.max(100, Math.ceil(value.max / 10) * 10);
        }
      },
      series: series
    };

    // 设置选项并渲染图表
    chartInstance.current.setOption(option);

    // 响应窗口大小变化
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, loading, subjectNames, title]);

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {!data || Object.keys(data).length === 0 && !loading ? (
        <Paper
          sx={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5'
          }}
        >
          <Typography variant="body1" color="textSecondary">
            暂无数据
          </Typography>
        </Paper>
      ) : (
        <Box ref={chartRef} sx={{ width: '100%', height }} />
      )}
    </Box>
  );
};

export default StudentScoreTrendChart; 