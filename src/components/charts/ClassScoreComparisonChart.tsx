import React, { useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import * as echarts from 'echarts/core';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent
} from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  BarChart,
  CanvasRenderer,
  UniversalTransition,
  LegendComponent,
  ToolboxComponent
]);

interface ClassScoreData {
  subjectName: string;
  avgScore: number;
  maxScore: number;
  minScore: number;
  passRate: number;
  excellentRate: number;
  fullScore: number;
}

interface ClassScoreComparisonChartProps {
  data: {
    [subjectId: string]: ClassScoreData;
  };
  totalStats?: {
    avgScore: number;
    maxScore: number;
    minScore: number;
    passRate: number;
    excellentRate: number;
  };
  loading?: boolean;
  height?: number | string;
  title?: string;
  showType?: 'score' | 'rate' | 'both';
  scoreType?: 'total' | 'average';
}

const ClassScoreComparisonChart: React.FC<ClassScoreComparisonChartProps> = ({
  data,
  totalStats,
  loading = false,
  height = 400,
  title = '班级成绩对比',
  showType = 'both',
  scoreType = 'total'
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
    const subjectIds = Object.keys(data);
    const xAxisData = subjectIds.map(id => data[id].subjectName);
    
    // 如果包括总分，则添加到末尾
    if (totalStats) {
      xAxisData.push('总分');
    }

    // 准备系列数据
    const avgScores = subjectIds.map(id => data[id].avgScore);
    const maxScores = subjectIds.map(id => data[id].maxScore);
    const minScores = subjectIds.map(id => data[id].minScore);
    const passRates = subjectIds.map(id => (data[id].passRate * 100).toFixed(2));
    const excellentRates = subjectIds.map(id => (data[id].excellentRate * 100).toFixed(2));
    
    // 如果包括总分，添加总分数据
    if (totalStats) {
      avgScores.push(totalStats.avgScore);
      maxScores.push(totalStats.maxScore);
      minScores.push(totalStats.minScore);
      passRates.push((totalStats.passRate * 100).toFixed(2));
      excellentRates.push((totalStats.excellentRate * 100).toFixed(2));
    }

    // 配置选项
    const scoreOption = {
      title: {
        text: `${title} - ${scoreType === 'total' ? '总分' : '平均分'}统计`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function (params: any) {
          const subjectName = params[0].name;
          let tooltipText = `<div style="font-weight:bold;margin-bottom:5px">${subjectName}</div>`;
          
          params.forEach((param: any) => {
            tooltipText += `<div style="margin: 3px 0">${param.seriesName}: <span style="font-weight:bold;color:${param.color}">${param.value}</span></div>`;
          });
          
          return tooltipText;
        }
      },
      legend: {
        data: scoreType === 'total' ? ['平均分', '最高分', '最低分'] : ['平均分'],
        bottom: 10
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
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          rotate: 30,
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: '分数',
        nameLocation: 'middle',
        nameGap: 40
      },
      series: scoreType === 'total' ? [
        {
          name: '平均分',
          type: 'bar',
          data: avgScores,
          itemStyle: {
            color: '#5470c6'
          }
        },
        {
          name: '最高分',
          type: 'bar',
          data: maxScores,
          itemStyle: {
            color: '#91cc75'
          }
        },
        {
          name: '最低分',
          type: 'bar',
          data: minScores,
          itemStyle: {
            color: '#ee6666'
          }
        }
      ] : [
        {
          name: '平均分',
          type: 'bar',
          data: avgScores,
          itemStyle: {
            color: '#5470c6'
          }
        }
      ]
    };

    const rateOption = {
      title: {
        text: `${title} - 比率统计`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function (params: any) {
          const subjectName = params[0].name;
          let tooltipText = `<div style="font-weight:bold;margin-bottom:5px">${subjectName}</div>`;
          
          params.forEach((param: any) => {
            tooltipText += `<div style="margin: 3px 0">${param.seriesName}: <span style="font-weight:bold;color:${param.color}">${param.value}%</span></div>`;
          });
          
          return tooltipText;
        }
      },
      legend: {
        data: ['及格率', '优秀率'],
        bottom: 10
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
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          rotate: 30,
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: '百分比',
        nameLocation: 'middle',
        nameGap: 40,
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: '及格率',
          type: 'bar',
          data: passRates,
          itemStyle: {
            color: '#5470c6'
          }
        },
        {
          name: '优秀率',
          type: 'bar',
          data: excellentRates,
          itemStyle: {
            color: '#91cc75'
          }
        }
      ]
    };

    // 根据显示类型设置选项
    let option;
    if (showType === 'score') {
      option = scoreOption;
    } else if (showType === 'rate') {
      option = rateOption;
    } else {
      // 显示类型为 'both'，使用 Grid 组件显示两个图表
      option = {
        title: [
          {
            text: `${title} - ${scoreType === 'total' ? '总分' : '平均分'}统计`,
            left: 'center',
            top: '5%'
          },
          {
            text: `${title} - 比率统计`,
            left: 'center',
            top: '55%'
          }
        ],
        tooltip: [
          {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            formatter: function (params: any) {
              const subjectName = params[0].name;
              let tooltipText = `<div style="font-weight:bold;margin-bottom:5px">${subjectName}</div>`;
              
              params.forEach((param: any) => {
                tooltipText += `<div style="margin: 3px 0">${param.seriesName}: <span style="font-weight:bold;color:${param.color}">${param.value}</span></div>`;
              });
              
              return tooltipText;
            }
          },
          {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            formatter: function (params: any) {
              const subjectName = params[0].name;
              let tooltipText = `<div style="font-weight:bold;margin-bottom:5px">${subjectName}</div>`;
              
              params.forEach((param: any) => {
                tooltipText += `<div style="margin: 3px 0">${param.seriesName}: <span style="font-weight:bold;color:${param.color}">${param.value}%</span></div>`;
              });
              
              return tooltipText;
            }
          }
        ],
        grid: [
          {
            left: '3%',
            right: '4%',
            top: '15%',
            height: '30%',
            containLabel: true
          },
          {
            left: '3%',
            right: '4%',
            top: '65%',
            height: '30%',
            containLabel: true
          }
        ],
        xAxis: [
          {
            type: 'category',
            data: xAxisData,
            gridIndex: 0,
            axisLabel: {
              rotate: 30,
              fontSize: 12
            }
          },
          {
            type: 'category',
            data: xAxisData,
            gridIndex: 1,
            axisLabel: {
              rotate: 30,
              fontSize: 12
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '分数',
            nameLocation: 'middle',
            nameGap: 40,
            gridIndex: 0
          },
          {
            type: 'value',
            name: '百分比',
            nameLocation: 'middle',
            nameGap: 40,
            min: 0,
            max: 100,
            axisLabel: {
              formatter: '{value}%'
            },
            gridIndex: 1
          }
        ],
        legend: [
          {
            data: scoreType === 'total' ? ['平均分', '最高分', '最低分'] : ['平均分'],
            bottom: '40%'
          },
          {
            data: ['及格率', '优秀率'],
            bottom: '0%'
          }
        ],
        toolbox: {
          feature: {
            saveAsImage: { title: '保存为图片' }
          }
        },
        series: scoreType === 'total' ? [
          {
            name: '平均分',
            type: 'bar',
            data: avgScores,
            itemStyle: {
              color: '#5470c6'
            },
            xAxisIndex: 0,
            yAxisIndex: 0
          },
          {
            name: '最高分',
            type: 'bar',
            data: maxScores,
            itemStyle: {
              color: '#91cc75'
            },
            xAxisIndex: 0,
            yAxisIndex: 0
          },
          {
            name: '最低分',
            type: 'bar',
            data: minScores,
            itemStyle: {
              color: '#ee6666'
            },
            xAxisIndex: 0,
            yAxisIndex: 0
          },
          {
            name: '及格率',
            type: 'bar',
            data: passRates,
            itemStyle: {
              color: '#5470c6'
            },
            xAxisIndex: 1,
            yAxisIndex: 1
          },
          {
            name: '优秀率',
            type: 'bar',
            data: excellentRates,
            itemStyle: {
              color: '#91cc75'
            },
            xAxisIndex: 1,
            yAxisIndex: 1
          }
        ] : [
          {
            name: '平均分',
            type: 'bar',
            data: avgScores,
            itemStyle: {
              color: '#5470c6'
            },
            xAxisIndex: 0,
            yAxisIndex: 0
          },
          {
            name: '及格率',
            type: 'bar',
            data: passRates,
            itemStyle: {
              color: '#5470c6'
            },
            xAxisIndex: 1,
            yAxisIndex: 1
          },
          {
            name: '优秀率',
            type: 'bar',
            data: excellentRates,
            itemStyle: {
              color: '#91cc75'
            },
            xAxisIndex: 1,
            yAxisIndex: 1
          }
        ]
      };
    }

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
  }, [data, loading, title, showType, scoreType, totalStats]);

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

export default ClassScoreComparisonChart; 