export type HealthResponse = {
  status: string;
  service: string;
  database: "connected" | "disconnected";
  uptime: number;
  timestamp: string;
};

export type ApiError = {
  message: string;
};
