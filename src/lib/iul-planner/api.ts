/**
 * The planner's only contact with a backend.
 *
 * Every figure the client sees is computed on the device by the engine, so the
 * tool is fully functional with the local-only default and no server at all.
 * Supply a real implementation when you want sessions captured.
 */

export interface IulPlannerLead {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  age: number;
  annualIncome: number;
  monthlyBudget: number;
  termFace: number;
  termYears: number;
  permanentFace: number;
  projectedValueAt65: number;
  suitability: string;
  questionsRaised: string[];
  scenariosPlayed: string[];
}

export interface IulPlannerApi {
  submitLead(lead: IulPlannerLead): Promise<{ id?: string }>;
  explain(topic: string, facts: Record<string, string | number | boolean>): Promise<string>;
}

/**
 * No network. Submitting resolves so the flow completes; the explainer says
 * plainly that it is unavailable rather than inventing text, because a wrong
 * explanation of a financial product is worse than no explanation.
 */
export const localOnlyApi: IulPlannerApi = {
  async submitLead(lead) {
    console.info("[iul-planner] session captured locally (no backend wired):", lead);
    return {};
  },
  async explain() {
    return "The explainer isn't connected yet. Every figure on screen is calculated on your device and is unaffected.";
  },
};

/**
 * Supabase-backed implementation. Expects a table `iul_planner_leads` and an
 * edge function `iul-planner-explain`.
 *
 *   import { supabase } from "@/integrations/supabase/client";
 *   <IULPlanner api={createSupabaseApi(supabase)} />
 */
export function createSupabaseApi(supabase: {
  from: (t: string) => { insert: (rows: unknown[]) => Promise<{ error: unknown }> };
  functions: { invoke: (n: string, o: unknown) => Promise<{ data: unknown; error: unknown }> };
}): IulPlannerApi {
  return {
    async submitLead(lead) {
      const { error } = await supabase.from("iul_planner_leads").insert([lead]);
      if (error) throw error;
      return {};
    },
    async explain(topic, facts) {
      const { data, error } = await supabase.functions.invoke("iul-planner-explain", {
        body: { topic, facts },
      });
      if (error) throw error;
      return (data as { explanation?: string })?.explanation ?? "";
    },
  };
}
