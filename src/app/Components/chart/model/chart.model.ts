
export interface Apiresponse<T> {
  status: boolean
  message: string
  data: T
}

export interface ListData {
  totalRecords: number
  taskList: List[]
}

export interface List {
  id: number
  title: string
  description: string
  chart_id: number
  chart_title: string
  json_path: string
  status: boolean
  created_at: string
}
