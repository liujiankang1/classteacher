// 为 antd 提供类型声明
declare module 'antd' {
  export const Button: any;
  export const Card: any;
  export const Col: any;
  export const Row: any;
  export const Table: any;
  export const Space: any;
  export const Select: any;
  export const DatePicker: any;
  export const Spin: any;
  export const Modal: any;
  export const Tabs: any;
  export const Descriptions: any;
  export const Pagination: any;
  export const message: any;
  export const Tag: any;
  // 可以根据需要添加更多组件
}

// 为 @ant-design/icons 提供类型声明
declare module '@ant-design/icons' {
  export const SearchOutlined: any;
  export const ReloadOutlined: any;
  export const DownloadOutlined: any;
  // 可以根据需要添加更多图标
}

// 为 echarts 提供类型声明
declare module 'echarts' {
  export function init(dom: HTMLElement): any;
  export const time: any;
  // 可以根据需要添加更多方法和属性
}

// 为 EChartsType 提供类型声明
export type EChartsType = {
  setOption: (option: any) => void;
  resize: () => void;
  dispose: () => void;
}; 