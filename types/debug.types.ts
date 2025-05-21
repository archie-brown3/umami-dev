export interface APIStatus {
  status: string;
  timestamp: string;
  error?: string;
}

export interface LogEntry {
  message: string;
  timestamp: string;
  type?: "info" | "error" | "success";
}

export interface APIHealthCheckProps {
  title: string;
  status: APIStatus | null;
  logs: string[];
  onCheck: () => Promise<void>;
  isLoading: boolean;
}

export interface LogViewerProps {
  logs: string[];
  title?: string;
  maxHeight?: number;
}
