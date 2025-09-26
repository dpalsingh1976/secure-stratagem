// IUL Digital Twin Types and Interfaces

export interface IULPolicyData {
  // Basic Policy Information
  policyNumber?: string;
  carrierName: string;
  policyType: string;
  issuedDate?: string;
  
  // Insured Information
  insuredAge: number;
  insuredGender: 'Male' | 'Female';
  insuredSmoking: boolean;
  
  // Premium Structure
  initialPremium: number;
  targetPremium: number;
  minimumPremium: number;
  maximumPremium: number;
  premiumMode: 'Annual' | 'Semi-Annual' | 'Quarterly' | 'Monthly';
  
  // Death Benefit
  initialDeathBenefit: number;
  deathBenefitOption: 'Level' | 'Increasing';
  
  // Policy Assumptions
  creditingRate: number;
  capRate: number;
  floorRate: number;
  participationRate: number;
  
  // Costs and Charges
  costOfInsurance: COIStructure[];
  policyFees: FeeStructure[];
  surrenderCharges: SurrenderChargeStructure[];
  
  // Riders and Options
  riders: RiderInfo[];
  
  // Projections
  projectedValues: ProjectionYear[];
}

export interface COIStructure {
  ageRange: { min: number; max: number };
  ratePerThousand: number;
  guaranteedRate: number;
  currentRate: number;
}

export interface FeeStructure {
  feeType: string;
  amount: number;
  frequency: 'Annual' | 'Monthly' | 'Per Transaction';
  isPercentage: boolean;
}

export interface SurrenderChargeStructure {
  year: number;
  chargeRate: number;
}

export interface RiderInfo {
  riderName: string;
  riderType: string;
  premium: number;
  benefit: number;
  isActive: boolean;
}

export interface ProjectionYear {
  year: number;
  age: number;
  premium: number;
  deathBenefit: number;
  cashValue: number;
  cashSurrenderValue: number;
  costOfInsurance: number;
  fees: number;
  netAmount: number;
  cumulativePremium: number;
  endOfYearValue: number;
}

// Stress Testing Types
export interface StressTestScenario {
  id: string;
  name: string;
  description: string;
  parameters: ScenarioParameters;
  results?: StressTestResults;
}

export interface ScenarioParameters {
  premiumReduction?: {
    startYear: number;
    reductionPercentage: number;
  };
  creditingRateChange?: {
    startYear: number;
    newRate: number;
  };
  marketCrashSimulation?: {
    crashYear: number;
    recoveryYears: number;
    crashSeverity: number; // percentage drop
  };
  interestRateShock?: {
    startYear: number;
    rateIncrease: number;
  };
  coiIncrease?: {
    startYear: number;
    increasePercentage: number;
  };
  longevityExtension?: {
    additionalYears: number;
  };
}

export interface StressTestResults {
  lapseYear?: number;
  finalCashValue: number;
  totalPremiumsPaid: number;
  averageIRR: number;
  worstCaseScenario: ProjectionYear[];
  baselineComparison: ProjectionYear[];
  riskMetrics: RiskMetrics;
}

export interface RiskMetrics {
  lapseRisk: number; // percentage
  volatilityScore: number;
  downSideProtection: number;
  maximumDrawdown: number;
  recoveryTimeYears: number;
}

// Market Comparison Types
export interface MarketComparison {
  scenarioName: string;
  iul: InvestmentResults;
  marketOnly: InvestmentResults;
  hybrid: InvestmentResults;
}

export interface InvestmentResults {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  maximumDrawdown: number;
  sharpeRatio: number;
  finalValue: number;
  taxEfficiency: number;
  yearlyValues: YearlyValue[];
}

export interface YearlyValue {
  year: number;
  grossValue: number;
  netValue: number;
  taxes: number;
  fees: number;
}

// Digital Twin Conversation Types
export interface DigitalTwinQuestion {
  id: string;
  question: string;
  timestamp: string;
  response: DigitalTwinResponse;
}

export interface DigitalTwinResponse {
  answer: string;
  updatedProjections?: ProjectionYear[];
  affectedMetrics: string[];
  recommendations: string[];
  charts?: ChartData[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'area';
  title: string;
  data: any[];
  xAxis: string;
  yAxis: string;
}

// Compliance and Documentation Types
export interface ComplianceReport {
  id: string;
  clientName: string;
  advisorName: string;
  generatedDate: string;
  basisForRecommendation: string;
  suitabilityAnalysis: SuitabilityAnalysis;
  disclosures: string[];
  riskFactors: string[];
  alternatives: AlternativeProduct[];
}

export interface SuitabilityAnalysis {
  clientObjectives: string[];
  riskTolerance: string;
  timeHorizon: string;
  liquidityNeeds: string;
  productAlignment: string;
  justification: string;
}

export interface AlternativeProduct {
  productType: string;
  description: string;
  whyNotSuitable: string;
}

// Processing Status Types
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IllustrationUpload {
  id: string;
  fileName: string;
  filePath: string;
  carrierName?: string;
  policyType?: string;
  extractedData: IULPolicyData | null;
  processingStatus: ProcessingStatus;
  createdAt: string;
  updatedAt: string;
}

// Database schema types (snake_case)
export interface DbIllustrationUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  carrier_name?: string;
  policy_type?: string;
  extracted_data: any;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export interface DbStressTestScenario {
  id: string;
  user_id: string;
  illustration_id: string;
  scenario_name: string;
  parameters: any;
  results: any;
  created_at: string;
  updated_at: string;
}

export interface DbDigitalTwinConversation {
  id: string;
  user_id: string;
  illustration_id: string;
  question: string;
  response: any;
  simulation_results: any;
  created_at: string;
}

// Mapper functions
export const mapDbToIllustrationUpload = (db: DbIllustrationUpload): IllustrationUpload => ({
  id: db.id,
  fileName: db.file_name,
  filePath: db.file_path,
  carrierName: db.carrier_name || undefined,
  policyType: db.policy_type || undefined,
  extractedData: db.extracted_data as IULPolicyData | null,
  processingStatus: db.processing_status as ProcessingStatus,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export const mapDbToStressTestScenario = (db: DbStressTestScenario): StressTestScenario => ({
  id: db.id,
  name: db.scenario_name,
  description: '', // Default empty description
  parameters: db.parameters as ScenarioParameters,
  results: db.results as StressTestResults,
});

export const mapDbToDigitalTwinQuestion = (db: DbDigitalTwinConversation): DigitalTwinQuestion => ({
  id: db.id,
  question: db.question,
  timestamp: db.created_at,
  response: db.response as DigitalTwinResponse,
});