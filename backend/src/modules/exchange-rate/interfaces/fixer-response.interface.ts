export interface FixerLatestResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: {
    [currency: string]: number;
  };
}

export interface FixerErrorResponse {
  success: false;
  error: {
    code: number;
    type: string;
    info: string;
  };
}
