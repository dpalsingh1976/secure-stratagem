
export type IulCharges = {
  premium_load_pct?: number;
  monthly_admin_fee?: number;
  expense_charge_pct?: number;
  surrender_schedule?: { year: number; pct: number }[];
  coi_table?: { age: number; per_1000: number }[];
  rider_charges?: { name: string; annual: number }[];
};

export type IulIndex = {
  name: string;
  cap?: number | null;
  floor?: number | null;
  spread?: number | null;
  par?: number | null;
  multiplier_fee_pct?: number | null;
  declared_rate?: number | null;
};

export type IulPolicy = {
  id: string;
  carrier?: string | null;
  product_name?: string | null;
  charges?: IulCharges;
  indices?: IulIndex[];
  projected_values?: { year: number; cash?: number; surrender?: number; death_benefit?: number }[];
  ratings?: Record<string, string>;
  sources?: { field: string; file: string; page?: number; note?: string }[];
};

export type IulCase = {
  case_assumptions?: any;
  policies: IulPolicy[];
};
