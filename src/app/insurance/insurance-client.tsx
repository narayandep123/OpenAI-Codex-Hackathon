"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InsurancePlan } from "@/lib/types";

interface InsuranceClientProps {
  plans: InsurancePlan[];
  surgeries: string[];
}

interface PlanConfirmation {
  policyId: string;
  insurerName: string;
  planName: string;
  premiumPerYear: number;
  coverageCap: number;
  status: "confirmed";
  createdAt: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function generatePolicyId(): string {
  const stamp = new Date().getFullYear();
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `SF-POL-${stamp}-${randomPart}`;
}

export default function InsuranceClient({ plans, surgeries }: InsuranceClientProps) {
  const [selectedSurgery, setSelectedSurgery] = useState("");
  const [budget, setBudget] = useState(() =>
    plans.length > 0 ? Math.max(...plans.map((plan) => plan.premiumPerYear)) : 50000,
  );

  const [selectedPlan, setSelectedPlan] = useState<InsurancePlan | null>(null);
  const [confirmation, setConfirmation] = useState<PlanConfirmation | null>(null);

  const minPremium = plans.length > 0 ? Math.min(...plans.map((plan) => plan.premiumPerYear)) : 10000;
  const maxPremium = plans.length > 0 ? Math.max(...plans.map((plan) => plan.premiumPerYear)) : 60000;

  const filteredPlans = useMemo(() => {
    return plans
      .filter((plan) => {
        const matchesSurgery = selectedSurgery
          ? plan.coveredSurgeries.some((surgery) => surgery === selectedSurgery)
          : true;

        const matchesBudget = plan.premiumPerYear <= budget;

        return matchesSurgery && matchesBudget;
      })
      .sort((a, b) => {
        if (b.coverageCap !== a.coverageCap) {
          return b.coverageCap - a.coverageCap;
        }

        return a.premiumPerYear - b.premiumPerYear;
      });
  }, [budget, plans, selectedSurgery]);

  const openModal = (plan: InsurancePlan) => {
    setSelectedPlan(plan);
    setConfirmation(null);
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setConfirmation(null);
  };

  const confirmPlan = () => {
    if (!selectedPlan) {
      return;
    }

    setConfirmation({
      policyId: generatePolicyId(),
      insurerName: selectedPlan.insurerName,
      planName: selectedPlan.planName,
      premiumPerYear: selectedPlan.premiumPerYear,
      coverageCap: selectedPlan.coverageCap,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-lg backdrop-blur sm:p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Insurance Matching</h1>
        <p className="mt-2 text-slate-600">
          Filter by surgery coverage and annual premium budget to find plans that match your treatment needs.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Surgery Type
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              value={selectedSurgery}
              onChange={(event) => setSelectedSurgery(event.target.value)}
            >
              <option value="">All covered surgeries</option>
              {surgeries.map((surgery) => (
                <option key={surgery} value={surgery}>
                  {surgery}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Annual Premium Budget: {formatCurrency(budget)}
            <input
              type="range"
              min={minPremium}
              max={maxPremium}
              step={500}
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="flex items-center justify-between">
        <p className="text-sm text-slate-700">Showing {filteredPlans.length} matching plans</p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredPlans.map((plan) => (
          <Card key={plan.id} className="transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader>
              <CardDescription className="font-semibold uppercase tracking-wide text-cyan-700">
                {plan.insurerName}
              </CardDescription>
              <CardTitle>{plan.planName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-slate-700">
                <p>
                  Coverage Cap: <span className="font-semibold">{formatCurrency(plan.coverageCap)}</span>
                </p>
                <p>
                  Premium / Year: <span className="font-semibold">{formatCurrency(plan.premiumPerYear)}</span>
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-slate-100 p-3 text-xs text-slate-700">
                <p className="font-semibold">Covers</p>
                <p className="mt-1">{plan.coveredSurgeries.slice(0, 4).join(", ")}</p>
              </div>

              <Button type="button" onClick={() => openModal(plan)} className="mt-4 w-full">
                Get This Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      {filteredPlans.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No insurance plans found for this surgery within your premium budget.
        </section>
      ) : null}

      <Dialog open={Boolean(selectedPlan)} onOpenChange={(open) => (open ? null : closeModal())}>
        <DialogContent>
          {selectedPlan ? (
            confirmation ? (
              <section className="space-y-4">
                <Badge variant="success">Plan confirmed</Badge>
                <DialogHeader>
                  <DialogTitle>Your insurance plan is reserved</DialogTitle>
                </DialogHeader>
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">Policy ID: {confirmation.policyId}</p>
                  <p className="mt-1">Insurer: {confirmation.insurerName}</p>
                  <p className="mt-1">Plan: {confirmation.planName}</p>
                  <p className="mt-1">Coverage Cap: {formatCurrency(confirmation.coverageCap)}</p>
                  <p className="mt-1">Premium / Year: {formatCurrency(confirmation.premiumPerYear)}</p>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={closeModal}>Close</Button>
                </DialogFooter>
              </section>
            ) : (
              <section className="space-y-4">
                <Badge variant="outline">Plan confirmation</Badge>
                <DialogHeader>
                  <DialogTitle>Get {selectedPlan.planName}</DialogTitle>
                  <DialogDescription>Review plan details and confirm your mock purchase.</DialogDescription>
                </DialogHeader>

                <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">Insurer:</span> {selectedPlan.insurerName}
                  </p>
                  <p>
                    <span className="font-semibold">Coverage Cap:</span> {formatCurrency(selectedPlan.coverageCap)}
                  </p>
                  <p>
                    <span className="font-semibold">Premium / Year:</span> {formatCurrency(selectedPlan.premiumPerYear)}
                  </p>
                </div>

                <DialogFooter>
                  <Button type="button" onClick={confirmPlan}>Confirm Plan</Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </section>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
