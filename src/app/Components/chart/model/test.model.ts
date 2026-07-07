export interface Test {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  symbol?: string;  
   data: ChartDataPoint[]; 
  chartData?: ChartDataPoint[];
  dataFile?: {
    name: string;
    type: 'csv' | 'excel' | 'json';
    data: any[];
  };
  isActive?: boolean
  timeframe?: string;        // Optional: Daily, Weekly, Monthly
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';  // Difficulty level
  status?: 'active' | 'archived' | 'draft';               // Test status
  passingScore?: number;      // Minimum passing score (0-100)
  timeLimit?: number;         // Time limit in minutes
  totalPoints?: number;       // Total points available
  
}

export type CreateTestDTO = Omit<Test, 'id' | 'createdAt' | 'updatedAt'>;

// Optional: Create a type for updating tests
export type UpdateTestDTO = Partial<Omit<Test, 'id' | 'createdAt' | 'updatedAt'>>;


export interface ChartDataPoint {
  time: number;  // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CreateChart {
  chart_id: number
  task_id: number
  answer_list: AnswerList[]
}

export interface AnswerList {
  id?: number
  start_price: number|string
  end_price: number|string
  start_time: number|string
  end_time: number|string
  start_x: number|string
  end_x: number|string
  start_y: number|string
  end_y: number|string
}

export interface getChartAnswer{
  chart_id:number;
  task_id:number;
}
export interface UpdateAnswerItem {
  answer_id: number;
  start_price: number;
  end_price: number;
  start_time: number;
  end_time: number;
  start_x: number;
  end_x: number;
  start_y: number;
  end_y: number;
}

export interface UpdateChart {
  chart_id: number;
  task_id: number;
  answer_list: UpdateAnswerItem[];
}