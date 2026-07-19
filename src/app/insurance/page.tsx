import { getInsurancePlans, getSearchFilters } from "@/lib/search";
import InsuranceClient from "./insurance-client";

export default async function InsurancePage() {
  const [plans, filters] = await Promise.all([getInsurancePlans(), getSearchFilters()]);

  return <InsuranceClient plans={plans} surgeries={filters.surgeries} />;
}
