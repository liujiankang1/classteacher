import React, { useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import * as echarts from 'echarts/core';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
  DatasetComponent
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
  ToolboxComponent,
  DatasetComponent
]);

interface ClassStats {
  className: string;
  subjectStats: {
    [subjectId: string]: {
      subjectName: string;
      avgScore: number;
      passRate: number;
      excellentRate: number;
    }
  };
  totalStats: {
    avgScore: number;
    passRate: number;
    excellentRate: number;
  }
}

interface GradeScoreComparisonChartProps {
  data: {
    [classId: string]: ClassStats;
  };
  subjects: {
    id: number;
    name: string;
  }[];
  classes: {
    id: number;
    name: string;
  }[];
  selectedSubjectId?: number | string;
  loading?: boolean;
  height?: number | string;
  title?: string;
  showType?: 'score' | 'rate' | 'both';
}

const GradeScoreComparisonChart: React.FC<GradeScoreComparisonChartProps> = ({
  data,
  subjects,
  classes,
  selectedSubjectId = '',
  loading = false,
  height = 400,
  title = '年级成绩对比',
  showType = 'both'
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
    const classIds = Object.keys(data);
    const classNames = classIds.map(id => data[id].className);

    // 获取指定科目或总分的数据
    const isTotal = !selectedSubjectId || selectedSubjectId === '';
    
    // 准备系列数据
    let avgScores: number[] = [];
    let passRates: number[] = [];
    let excellentRates: number[] = [];
    
    if (isTotal) {
      // 显示总分数据
      avgScores = classIds.map(id => data[id].totalStats.avgScore);
      passRates = classIds.map(id => (data[id].totalStats.passRate * 100));
      excellentRates = classIds.map(id => (data[id].totalStats.excellentRate * 100));
    } else {
      // 显示指定科目数据
      const subjectId = selectedSubjectId.toString();
      avgScores = classIds.map(id => {
        const stats = data[id].subjectStats[subjectId];
        return stats ? stats.avgScore : 0;
      });
      
      passRates = classIds.map(id => {
        const stats = data[id].subjectStats[subjectId];
        return stats ? (stats.passRate * 100) : 0;
      });
      
      excellentRates = classIds.map(id => {
        const stats = data[id].subjectStats[subjectId];
        return stats ? (stats.excellentRate * 100) : 0;
      });
    }

    // 获取科目名称
    let subjectName = '总分';
    if (!isTotal && subjects.length > 0) {
      const subject = subjects.find(s => s.id.toString() === selectedSubjectId.toString());
      if (subject) {
        subjectName = subject.name;
      }
    }

    // 配置选项
    const scoreOption = {
      title: {
        text: `${title} - ${subjectName} - 平均分对比`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      toolbox: {
        feature: {
          saveAsImage: { title: '保存为图片' }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: classNames,
        axisLabel: {
          rotate: 30,
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: '平均分',
        nameLocation: 'middle',
        nameGap: 40
      },
      series: [
        {
          name: '平均分',
          type: 'bar',
          data: avgScores,
          itemStyle: {
            color: '#5470c6'
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}'
          }
        }
      ]
    };

    const rateOption = {
      title: {
        text: `${title} - ${subjectName} - 及格率/优秀率对比`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function (params: any) {
          const className = params[0].name;
          let tooltipText = `<div style="font-weight:bold;margin-bottom:5px">${className}</div>`;
          
          params.forEach((param: any) => {
            tooltipText += `<div style="margin: 3px 0">${param.seriesName}: <span style="font-weight:bold;color:${param.color}">${param.value.toFixed(2)}%</span></div>`;
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
        data: classNames,
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
            color: '#91cc75'
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%'
          }
        },
        {
          name: '优秀率',
          type: 'bar',
          data: excellentRates,
          itemStyle: {
            color: '#fac858'
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%'
          }
        }
      ]
    };

    // 根据显示类型设置选项
    if (showType === 'score') {
      chartInstance.current.setOption(scoreOption);
    } else if (showType === 'rate') {
      chartInstance.current.setOption(rateOption);
    } else {
      // 分数和比率都显示，需要调整布局
      const bothOption = {
        title: {
          text: `${title} - ${subjectName}`,
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function (params: any) {
            const className = params[0].name;
            let tooltipText = `<div style="font-weight:bold;margin-bottom:5px">${className}</div>`;
            
            params.forEach((param: any) => {
              const unit = ['及格率', '优秀率'].includes(param.seriesName) ? '%' : '';
              tooltipText += `<div style="margin: 3px 0">${param.seriesName}: <span style="font-weight:bold;color:${param.color}">${param.value.toFixed(2)}${unit}</span></div>`;
            });
            
            return tooltipText;
          }
        },
        legend: {
          data: ['平均分', '及格率', '优秀率'],
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
          data: classNames,
          axisLabel: {
            rotate: 30,
            fontSize: 12
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '平均分',
            position: 'left',
            alignTicks: true,
            axisLine: {
              show: true,
              lineStyle: {
                color: '#5470c6'
              }
            },
            axisLabel: {
              formatter: '{value}'
            }
          },
          {
            type: 'value',
            name: '百分比',
            position: 'right',
            alignTicks: true,
            max: 100,
            axisLine: {
              show: true,
              lineStyle: {
                color: '#91cc75'
              }
            },
            axisLabel: {
              formatter: '{value}%'
            }
          }
        ],
        series: [
          {
            name: '平均分',
            type: 'bar',
            data: avgScores,
            itemStyle: {
              color: '#5470c6'
            },
            label: {
              show: true,
              position: 'top',
              formatter: '{c}'
            }
          },
          {
            name: '及格率',
            type: 'bar',
            yAxisIndex: 1,
            data: passRates,
            itemStyle: {
              color: '#91cc75'
            },
            label: {
              show: true,
              position: 'top',
              formatter: '{c}%'
            }
          },
          {
            name: '优秀率',
            type: 'bar',
            yAxisIndex: 1,
            data: excellentRates,
            itemStyle: {
              color: '#fac858'
            },
            label: {
              show: true,
              position: 'inside',
              formatter: '{c}%'
            }
          }
        ]
      };

      chartInstance.current.setOption(bothOption);
    }

    // 响应窗口大小变化
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, loading, title, showType, selectedSubjectId, subjects, classes]);

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

export default GradeScoreComparisonChart; 