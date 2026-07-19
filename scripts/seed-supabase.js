const fs = require("node:fs");
const path = require("node:path");

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  loadEnvFile(path.join(projectRoot, ".env.local"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const hospitals = JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "hospitals.json"), "utf8"));
  const surgeries = JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "surgeries.json"), "utf8"));
  const insurancePlans = JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "insurance.json"), "utf8"));

  const hospitalRows = hospitals.map((hospital) => ({
    id: hospital.id,
    name: hospital.name,
    city: hospital.city,
    address: hospital.address,
    type: hospital.type,
    rating: hospital.rating,
    image: hospital.image,
  }));

  const hospitalSurgeryRows = hospitals.flatMap((hospital) =>
    hospital.surgeries.map((surgery) => ({
      hospital_id: hospital.id,
      surgery_name: surgery.name,
      min_price: surgery.minPrice,
      max_price: surgery.maxPrice,
    })),
  );

  const hospitalSlotRows = hospitals.flatMap((hospital) =>
    hospital.availableSlots.map((slot) => ({
      hospital_id: hospital.id,
      slot_date: slot.date,
      slot_time: slot.time,
      is_available: true,
    })),
  );

  const surgeryRows = surgeries.map((surgery) => ({
    name: surgery.name,
    typical_min_price: surgery.typicalMinPrice,
    typical_max_price: surgery.typicalMaxPrice,
  }));

  const insuranceRows = insurancePlans.map((plan) => ({
    id: plan.id,
    insurer_name: plan.insurerName,
    plan_name: plan.planName,
    coverage_cap: plan.coverageCap,
    premium_per_year: plan.premiumPerYear,
    covered_surgeries: plan.coveredSurgeries,
    network_hospital_ids: plan.networkHospitalIds,
  }));

  const deleteStrategies = [
    ["hospital_slots", (query) => query.gt("id", 0)],
    ["hospital_surgeries", (query) => query.gte("min_price", 0)],
    ["insurance_plans", (query) => query.neq("id", "")],
    ["hospitals", (query) => query.neq("id", "")],
    ["surgeries", (query) => query.neq("name", "")],
  ];

  for (const [table, applyCondition] of deleteStrategies) {
    const { error } = await applyCondition(supabase.from(table).delete());
    if (error && !error.message.toLowerCase().includes("no rows")) {
      throw error;
    }
  }

  const operations = [
    ["surgeries", surgeryRows],
    ["hospitals", hospitalRows],
    ["insurance_plans", insuranceRows],
    ["hospital_surgeries", hospitalSurgeryRows],
    ["hospital_slots", hospitalSlotRows],
  ];

  for (const [table, rows] of operations) {
    const { error } = await supabase.from(table).insert(rows);
    if (error) {
      throw error;
    }
    console.log(`Seeded ${rows.length} rows into ${table}.`);
  }

  console.log("Supabase seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});