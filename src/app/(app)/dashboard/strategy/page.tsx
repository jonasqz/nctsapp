"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

/* ─── Types ─── */

interface KPI {
  id: string;
  name: string;
  targetValue: string;
  currentValue: string | null;
  unit: string;
}

interface Pillar {
  id: string;
  title: string;
  description: string;
  order: number;
  status: string;
  kpis: KPI[];
  narrativeCount: number;
}

interface StrategyData {
  vision: string;
  strategyDocUrl: string;
  pillars: Pillar[];
}

interface PillarFormData {
  title: string;
  description: string;
  kpiName: string;
  kpiTarget: string;
  kpiUnit: string;
}

interface KPIFormData {
  name: string;
  targetValue: string;
  currentValue: string;
  unit: string;
}

const EMPTY_PILLAR_FORM: PillarFormData = {
  title: "",
  description: "",
  kpiName: "",
  kpiTarget: "",
  kpiUnit: "",
};

const EMPTY_KPI_FORM: KPIFormData = {
  name: "",
  targetValue: "",
  currentValue: "",
  unit: "",
};

/* ─── Helpers ─── */

function currentYear(): number {
  return new Date().getFullYear();
}

/* ─── Skeleton ─── */

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 rounded-lg bg-navy-100" />
        <div className="h-9 w-28 rounded-lg bg-navy-50" />
      </div>

      {/* Vision card */}
      <div className="rounded-xl border border-navy-100 bg-white p-6">
        <div className="h-4 w-16 rounded bg-navy-100" />
        <div className="mt-3 h-5 w-3/4 rounded bg-navy-50" />
        <div className="mt-4 h-4 w-48 rounded bg-navy-50" />
      </div>

      {/* Pillars header */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-20 rounded bg-navy-100" />
        <div className="h-9 w-28 rounded-lg bg-navy-50" />
      </div>

      {/* Pillar cards */}
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-navy-100 bg-white p-6"
          >
            <div className="h-5 w-56 rounded bg-navy-100" />
            <div className="mt-3 h-4 w-full max-w-md rounded bg-navy-50" />
            <div className="mt-4 flex gap-4">
              <div className="h-4 w-40 rounded bg-navy-50" />
              <div className="h-4 w-32 rounded bg-navy-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Empty State ─── */

function EmptyState({ onStartEditing }: { onStartEditing: () => void }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-navy-200 bg-white p-12">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-200">
          <svg
            className="h-7 w-7 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
            />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-semibold text-navy-950">
          No strategy defined yet
        </h2>
        <p className="mt-2 text-sm text-navy-600">
          Start by defining your vision and strategic pillars. This will give
          your narratives and commitments the context they need.
        </p>
        <button
          onClick={onStartEditing}
          className="mt-6 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400"
        >
          Define Your Strategy
        </button>
      </div>
    </div>
  );
}

/* ─── KPI Row ─── */

function KPIRow({
  kpi,
  editingKpiId,
  kpiForm,
  saving,
  onEdit,
  onCancel,
  onSave,
  onFormChange,
}: {
  kpi: KPI;
  editingKpiId: string | null;
  kpiForm: KPIFormData;
  saving: boolean;
  onEdit: (kpi: KPI) => void;
  onCancel: () => void;
  onSave: () => void;
  onFormChange: (form: KPIFormData) => void;
}) {
  const isEditing = editingKpiId === kpi.id;

  if (isEditing) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            type="text"
            value={kpiForm.name}
            onChange={(e) => onFormChange({ ...kpiForm, name: e.target.value })}
            placeholder="KPI name"
            className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
          <input
            type="text"
            value={kpiForm.targetValue}
            onChange={(e) =>
              onFormChange({ ...kpiForm, targetValue: e.target.value })
            }
            placeholder="Target"
            className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
          <input
            type="text"
            value={kpiForm.currentValue}
            onChange={(e) =>
              onFormChange({ ...kpiForm, currentValue: e.target.value })
            }
            placeholder="Current (optional)"
            className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
          <input
            type="text"
            value={kpiForm.unit}
            onChange={(e) => onFormChange({ ...kpiForm, unit: e.target.value })}
            placeholder="Unit (e.g. %)"
            className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-100"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !kpiForm.name.trim()}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-navy-50">
      <span className="text-sm text-navy-600">
        <span className="font-medium text-navy-800">{kpi.name}</span>
        {kpi.currentValue ? (
          <>
            {" "}
            <span className="text-navy-400">
              {kpi.currentValue}
              {kpi.unit ? ` ${kpi.unit}` : ""} / {kpi.targetValue}
              {kpi.unit ? ` ${kpi.unit}` : ""}
            </span>
          </>
        ) : (
          <>
            {" "}
            <span className="text-navy-400">
              Target: {kpi.targetValue}
              {kpi.unit ? ` ${kpi.unit}` : ""}
            </span>
          </>
        )}
      </span>
      <button
        onClick={() => onEdit(kpi)}
        className="ml-auto shrink-0 rounded p-1 text-navy-300 opacity-0 transition-opacity hover:text-navy-600 group-hover:opacity-100"
        title="Edit KPI"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
          />
        </svg>
      </button>
    </div>
  );
}

/* ─── Pillar Card ─── */

function PillarCard({
  pillar,
  editingPillarId,
  editingKpiId,
  addingKpiToPillarId,
  kpiForm,
  saving,
  onEditPillar,
  onDeletePillar,
  onSavePillar,
  onCancelEditPillar,
  onEditKpi,
  onCancelEditKpi,
  onSaveKpi,
  onAddKpi,
  onCancelAddKpi,
  onSaveNewKpi,
  onKpiFormChange,
  pillarEditTitle,
  pillarEditDescription,
  onPillarEditTitleChange,
  onPillarEditDescriptionChange,
}: {
  pillar: Pillar;
  editingPillarId: string | null;
  editingKpiId: string | null;
  addingKpiToPillarId: string | null;
  kpiForm: KPIFormData;
  saving: boolean;
  onEditPillar: (pillar: Pillar) => void;
  onDeletePillar: (pillar: Pillar) => void;
  onSavePillar: () => void;
  onCancelEditPillar: () => void;
  onEditKpi: (kpi: KPI) => void;
  onCancelEditKpi: () => void;
  onSaveKpi: () => void;
  onAddKpi: (pillarId: string) => void;
  onCancelAddKpi: () => void;
  onSaveNewKpi: () => void;
  onKpiFormChange: (form: KPIFormData) => void;
  pillarEditTitle: string;
  pillarEditDescription: string;
  onPillarEditTitleChange: (v: string) => void;
  onPillarEditDescriptionChange: (v: string) => void;
}) {
  const isEditing = editingPillarId === pillar.id;
  const isAddingKpi = addingKpiToPillarId === pillar.id;

  if (isEditing) {
    return (
      <div className="rounded-xl border border-amber-300 bg-white p-6">
        <div className="space-y-3">
          <input
            type="text"
            value={pillarEditTitle}
            onChange={(e) => onPillarEditTitleChange(e.target.value)}
            placeholder="Pillar title"
            className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
          <textarea
            value={pillarEditDescription}
            onChange={(e) => onPillarEditDescriptionChange(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancelEditPillar}
            disabled={saving}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-100"
          >
            Cancel
          </button>
          <button
            onClick={onSavePillar}
            disabled={saving || !pillarEditTitle.trim()}
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-xl border border-navy-100 bg-white p-6 transition-all hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg font-semibold text-navy-950">
            {pillar.title}
          </h3>
          {pillar.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-navy-600">
              {pillar.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEditPillar(pillar)}
            className="rounded-lg p-2 text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700"
            title="Edit pillar"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
          </button>
          <button
            onClick={() => onDeletePillar(pillar)}
            className="rounded-lg p-2 text-navy-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete pillar"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* KPIs */}
      {pillar.kpis.length > 0 && (
        <div className="mt-4 space-y-1">
          {pillar.kpis.map((kpi) => (
            <KPIRow
              key={kpi.id}
              kpi={kpi}
              editingKpiId={editingKpiId}
              kpiForm={kpiForm}
              saving={saving}
              onEdit={onEditKpi}
              onCancel={onCancelEditKpi}
              onSave={onSaveKpi}
              onFormChange={onKpiFormChange}
            />
          ))}
        </div>
      )}

      {/* Add KPI inline form */}
      {isAddingKpi && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/30 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input
              type="text"
              value={kpiForm.name}
              onChange={(e) =>
                onKpiFormChange({ ...kpiForm, name: e.target.value })
              }
              placeholder="KPI name"
              className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <input
              type="text"
              value={kpiForm.targetValue}
              onChange={(e) =>
                onKpiFormChange({ ...kpiForm, targetValue: e.target.value })
              }
              placeholder="Target"
              className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <input
              type="text"
              value={kpiForm.currentValue}
              onChange={(e) =>
                onKpiFormChange({ ...kpiForm, currentValue: e.target.value })
              }
              placeholder="Current (optional)"
              className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <input
              type="text"
              value={kpiForm.unit}
              onChange={(e) =>
                onKpiFormChange({ ...kpiForm, unit: e.target.value })
              }
              placeholder="Unit (e.g. %)"
              className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={onCancelAddKpi}
              disabled={saving}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-100"
            >
              Cancel
            </button>
            <button
              onClick={onSaveNewKpi}
              disabled={saving || !kpiForm.name.trim()}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add KPI"}
            </button>
          </div>
        </div>
      )}

      {/* Footer: narrative count + add KPI button */}
      <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-4">
        <div className="flex items-center gap-2">
          {pillar.narrativeCount > 0 ? (
            <span className="flex items-center gap-1.5 text-sm text-green-700">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 0 0-1.242-7.244l4.5-4.5a4.5 4.5 0 0 1 6.364 6.364l-1.757 1.757"
                />
              </svg>
              {pillar.narrativeCount} linked{" "}
              {pillar.narrativeCount === 1 ? "narrative" : "narratives"}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-amber-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              No linked narratives
            </span>
          )}
        </div>
        {!isAddingKpi && (
          <button
            onClick={() => onAddKpi(pillar.id)}
            className="text-sm font-medium text-navy-400 transition-colors hover:text-amber-500"
          >
            + Add KPI
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Add Pillar Form ─── */

function AddPillarForm({
  form,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  form: PillarFormData;
  saving: boolean;
  onChange: (form: PillarFormData) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/20 p-6">
      <h3 className="mb-4 font-heading text-base font-semibold text-navy-950">
        New Pillar
      </h3>
      <div className="space-y-3">
        <input
          type="text"
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="Pillar title"
          className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          autoFocus
        />
        <textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Description (optional)"
          rows={2}
          className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
        />
        <div className="border-t border-navy-100 pt-3">
          <p className="mb-2 text-xs font-medium text-navy-400">
            Initial KPI (optional)
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="text"
              value={form.kpiName}
              onChange={(e) => onChange({ ...form, kpiName: e.target.value })}
              placeholder="KPI name"
              className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <input
              type="text"
              value={form.kpiTarget}
              onChange={(e) => onChange({ ...form, kpiTarget: e.target.value })}
              placeholder="Target value"
              className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <input
              type="text"
              value={form.kpiUnit}
              onChange={(e) => onChange({ ...form, kpiUnit: e.target.value })}
              placeholder="Unit (e.g. %, customers)"
              className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-100"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving || !form.title.trim()}
          className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Pillar"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function StrategyPage() {
  // Core data
  const [data, setData] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vision editing
  const [editingVision, setEditingVision] = useState(false);
  const [visionDraft, setVisionDraft] = useState("");

  // Strategy doc URL editing
  const [editingDocUrl, setEditingDocUrl] = useState(false);
  const [docUrlDraft, setDocUrlDraft] = useState("");

  // Pillar states
  const [addingPillar, setAddingPillar] = useState(false);
  const [pillarForm, setPillarForm] = useState<PillarFormData>(EMPTY_PILLAR_FORM);
  const [editingPillarId, setEditingPillarId] = useState<string | null>(null);
  const [pillarEditTitle, setPillarEditTitle] = useState("");
  const [pillarEditDescription, setPillarEditDescription] = useState("");

  // Delete confirmation
  const [deletingPillar, setDeletingPillar] = useState<Pillar | null>(null);

  // KPI states
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null);
  const [addingKpiToPillarId, setAddingKpiToPillarId] = useState<string | null>(
    null
  );
  const [kpiForm, setKpiForm] = useState<KPIFormData>(EMPTY_KPI_FORM);

  // Operation state
  const [saving, setSaving] = useState(false);

  /* ─── Data fetching ─── */

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/strategy");
      if (!res.ok) throw new Error("Failed to load strategy data");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load strategy");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─── Vision handlers ─── */

  function handleStartEditVision() {
    setVisionDraft(data?.vision ?? "");
    setEditingVision(true);
  }

  async function handleSaveVision() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/strategy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vision: visionDraft.trim(),
          strategyDocUrl: data?.strategyDocUrl ?? "",
        }),
      });
      if (!res.ok) throw new Error("Failed to save vision");
      const updated = await res.json();
      setData((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditingVision(false);
      toast.success("Vision updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      toast.error("Failed to save vision");
    } finally {
      setSaving(false);
    }
  }

  /* ─── Doc URL handlers ─── */

  function handleStartEditDocUrl() {
    setDocUrlDraft(data?.strategyDocUrl ?? "");
    setEditingDocUrl(true);
  }

  async function handleSaveDocUrl() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/strategy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vision: data?.vision ?? "",
          strategyDocUrl: docUrlDraft.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to save strategy doc URL");
      const updated = await res.json();
      setData((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditingDocUrl(false);
      toast.success("Strategy document URL updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      toast.error("Failed to save strategy document URL");
    } finally {
      setSaving(false);
    }
  }

  /* ─── Pillar handlers ─── */

  function handleStartEditPillar(pillar: Pillar) {
    setEditingPillarId(pillar.id);
    setPillarEditTitle(pillar.title);
    setPillarEditDescription(pillar.description);
  }

  async function handleSaveEditPillar() {
    if (saving || !editingPillarId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pillars/${editingPillarId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pillarEditTitle.trim(),
          description: pillarEditDescription.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to update pillar");
      setEditingPillarId(null);
      await fetchData();
      toast.success("Pillar updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      toast.error("Failed to update pillar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePillar(pillar: Pillar) {
    setSaving(true);
    try {
      const res = await fetch(`/api/pillars/${pillar.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete pillar");
      await fetchData();
      toast.success("Pillar deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      toast.error("Failed to delete pillar");
    } finally {
      setSaving(false);
      setDeletingPillar(null);
    }
  }

  async function handleAddPillar() {
    if (saving || !pillarForm.title.trim()) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: pillarForm.title.trim(),
        description: pillarForm.description.trim(),
      };
      if (pillarForm.kpiName.trim()) {
        body.kpi = {
          name: pillarForm.kpiName.trim(),
          targetValue: pillarForm.kpiTarget.trim(),
          unit: pillarForm.kpiUnit.trim(),
        };
      }
      const res = await fetch("/api/pillars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create pillar");
      setAddingPillar(false);
      setPillarForm(EMPTY_PILLAR_FORM);
      await fetchData();
      toast.success("Pillar created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
      toast.error("Failed to create pillar");
    } finally {
      setSaving(false);
    }
  }

  /* ─── KPI handlers ─── */

  function handleStartEditKpi(kpi: KPI) {
    setEditingKpiId(kpi.id);
    setAddingKpiToPillarId(null);
    setKpiForm({
      name: kpi.name,
      targetValue: kpi.targetValue,
      currentValue: kpi.currentValue ?? "",
      unit: kpi.unit,
    });
  }

  async function handleSaveEditKpi() {
    if (saving || !editingKpiId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/kpis/${editingKpiId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: kpiForm.name.trim(),
          targetValue: kpiForm.targetValue.trim(),
          currentValue: kpiForm.currentValue.trim() || null,
          unit: kpiForm.unit.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to update KPI");
      setEditingKpiId(null);
      setKpiForm(EMPTY_KPI_FORM);
      await fetchData();
      toast.success("KPI updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save KPI");
      toast.error("Failed to update KPI");
    } finally {
      setSaving(false);
    }
  }

  function handleStartAddKpi(pillarId: string) {
    setAddingKpiToPillarId(pillarId);
    setEditingKpiId(null);
    setKpiForm(EMPTY_KPI_FORM);
  }

  async function handleSaveNewKpi() {
    if (saving || !addingKpiToPillarId || !kpiForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pillars/${addingKpiToPillarId}/kpis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: kpiForm.name.trim(),
          targetValue: kpiForm.targetValue.trim(),
          currentValue: kpiForm.currentValue.trim() || null,
          unit: kpiForm.unit.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to add KPI");
      setAddingKpiToPillarId(null);
      setKpiForm(EMPTY_KPI_FORM);
      await fetchData();
      toast.success("KPI added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add KPI");
      toast.error("Failed to add KPI");
    } finally {
      setSaving(false);
    }
  }

  /* ─── Render ─── */

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
        <p className="text-sm font-medium text-red-700">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchData();
          }}
          className="mt-4 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  const hasContent =
    data &&
    (data.vision || data.strategyDocUrl || data.pillars.length > 0);

  if (!hasContent && !addingPillar && !editingVision) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-semibold text-navy-950">
            Strategy &middot; {currentYear()}
          </h1>
          <p className="mt-1 text-sm text-navy-400">
            Define your strategic vision and pillars.
          </p>
        </div>
        <EmptyState
          onStartEditing={() => {
            setEditingVision(true);
            setVisionDraft("");
          }}
        />
      </div>
    );
  }

  const pillars = data?.pillars ?? [];

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-sm font-medium text-red-700 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy-950">
            Strategy &middot; {currentYear()}
          </h1>
          <p className="mt-1 text-sm text-navy-400">
            Your strategic vision and pillars for the year.
          </p>
        </div>
        {!editingVision && (
          <button
            onClick={handleStartEditVision}
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            Edit Vision
          </button>
        )}
      </div>

      {/* Vision section */}
      <div className="mt-8 rounded-xl border border-navy-100 bg-white p-6">
        {editingVision ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-navy-400">
              Vision
            </label>
            <textarea
              value={visionDraft}
              onChange={(e) => setVisionDraft(e.target.value)}
              placeholder="What is your strategic vision?"
              rows={3}
              autoFocus
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setEditingVision(false)}
                disabled={saving}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVision}
                disabled={saving}
                className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Vision"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-navy-400">Vision</p>
            {data?.vision ? (
              <p className="mt-2 font-heading text-lg font-medium text-navy-950">
                &ldquo;{data.vision}&rdquo;
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-navy-400">
                No vision set yet.{" "}
                <button
                  onClick={handleStartEditVision}
                  className="font-medium text-amber-500 underline hover:no-underline"
                >
                  Add one
                </button>
              </p>
            )}
          </div>
        )}

        {/* Strategy doc URL */}
        <div className="mt-5 border-t border-navy-50 pt-5">
          {editingDocUrl ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-navy-400">
                Strategy Document URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={docUrlDraft}
                  onChange={(e) => setDocUrlDraft(e.target.value)}
                  placeholder="https://notion.so/..."
                  autoFocus
                  className="flex-1 rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  onClick={() => setEditingDocUrl(false)}
                  disabled={saving}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDocUrl}
                  disabled={saving}
                  className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy-400">
                  Strategy Document
                </p>
                {data?.strategyDocUrl ? (
                  <a
                    href={data.strategyDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-amber-600 underline decoration-amber-200 underline-offset-2 hover:text-amber-500 hover:decoration-amber-400"
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                    <span className="truncate">{data.strategyDocUrl}</span>
                  </a>
                ) : (
                  <p className="mt-1 text-sm italic text-navy-400">
                    No document linked.
                  </p>
                )}
              </div>
              <button
                onClick={handleStartEditDocUrl}
                className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pillars section */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-navy-950">
            Pillars
          </h2>
          {!addingPillar && (
            <button
              onClick={() => {
                setAddingPillar(true);
                setPillarForm(EMPTY_PILLAR_FORM);
              }}
              className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400"
            >
              + Add Pillar
            </button>
          )}
        </div>

        {pillars.length === 0 && !addingPillar && (
          <div className="mt-6 rounded-xl border-2 border-dashed border-navy-200 bg-white p-10 text-center">
            <p className="text-sm text-navy-400">
              No pillars yet. Add your first strategic pillar to get started.
            </p>
            <button
              onClick={() => {
                setAddingPillar(true);
                setPillarForm(EMPTY_PILLAR_FORM);
              }}
              className="mt-4 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400"
            >
              + Add Pillar
            </button>
          </div>
        )}

        {pillars.length > 0 && (
          <div className="mt-6 grid gap-4">
            {pillars.map((pillar) => (
              <PillarCard
                key={pillar.id}
                pillar={pillar}
                editingPillarId={editingPillarId}
                editingKpiId={editingKpiId}
                addingKpiToPillarId={addingKpiToPillarId}
                kpiForm={kpiForm}
                saving={saving}
                onEditPillar={handleStartEditPillar}
                onDeletePillar={setDeletingPillar}
                onSavePillar={handleSaveEditPillar}
                onCancelEditPillar={() => setEditingPillarId(null)}
                onEditKpi={handleStartEditKpi}
                onCancelEditKpi={() => {
                  setEditingKpiId(null);
                  setKpiForm(EMPTY_KPI_FORM);
                }}
                onSaveKpi={handleSaveEditKpi}
                onAddKpi={handleStartAddKpi}
                onCancelAddKpi={() => {
                  setAddingKpiToPillarId(null);
                  setKpiForm(EMPTY_KPI_FORM);
                }}
                onSaveNewKpi={handleSaveNewKpi}
                onKpiFormChange={setKpiForm}
                pillarEditTitle={pillarEditTitle}
                pillarEditDescription={pillarEditDescription}
                onPillarEditTitleChange={setPillarEditTitle}
                onPillarEditDescriptionChange={setPillarEditDescription}
              />
            ))}
          </div>
        )}

        {/* Add Pillar form */}
        {addingPillar && (
          <div className="mt-6">
            <AddPillarForm
              form={pillarForm}
              saving={saving}
              onChange={setPillarForm}
              onSave={handleAddPillar}
              onCancel={() => {
                setAddingPillar(false);
                setPillarForm(EMPTY_PILLAR_FORM);
              }}
            />
          </div>
        )}
      </div>

      {/* Delete pillar confirmation */}
      <ConfirmDialog
        open={deletingPillar !== null}
        title="Delete pillar"
        description={`Are you sure you want to delete "${deletingPillar?.title}"? This will also remove all associated KPIs. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
        onConfirm={() => {
          if (deletingPillar) handleDeletePillar(deletingPillar);
        }}
        onCancel={() => setDeletingPillar(null)}
      />
    </div>
  );
}
