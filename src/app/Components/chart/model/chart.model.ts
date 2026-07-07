import { DBSchema } from "idb";

export interface ChartDB extends DBSchema {
  answerChart: {
    key: number,
    value: Answers
  };
}

export interface Answers {
  id?: any;                    // uuid — in-memory tracking id (used for selection/hit-test)
  localDbId?: number | null;   // IndexedDB row key — persists across drag/extend edits
  answer_id?: number | null;   // server id — null until synced to API
  chart_id?: number;
  task_id?: number;
  start_price: number;
  end_price: number;
  start_time: number;
  end_time: number;
  start_x: number | any;
  end_x: number | any;
  start_y: number |any;
  end_y: number |any;
  is_edit: boolean;
  is_delete?: boolean;
}
export interface EditAnswerItem {
  answer_id: number;
  start_time: number;
  end_time: number;
  start_price: number;
  end_price: number;
  start_x: number;
  end_x: number;
  start_y: number;
  end_y: number;
}

export interface EditChart {
  chart_id: number;
  task_id: number;
  answer_list: EditAnswerItem[];
}
export interface LineRecord {
  id: number;
  answer_id: number | any;
  chart_id: number;
  task_id: number;
  start_price: number;
  end_price: number;
  start_time: number;
  end_time: number;
  start_x: number;
  end_x: number;
  start_y: number;
  end_y: number;
  is_edit: boolean;
  is_delete: boolean;
  created_at: string;
  updated_at: string;
}