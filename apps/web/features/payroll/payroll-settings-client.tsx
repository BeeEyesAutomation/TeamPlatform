"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { AllowanceType, TaxBracket, TaxSetting } from "../../types/payroll";
import {
  activateTaxSetting,
  deleteAllowanceType,
  deleteTaxBracket,
  fetchAllowanceTypes,
  fetchTaxBrackets,
  fetchTaxSettings,
  saveAllowanceType,
  saveTaxBracket,
  saveTaxSetting
} from "./payroll-api";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const calculationTypeLabels = {
  fixed_monthly: "Co dinh hang thang",
  per_working_day: "Theo ngay cong",
  attendance_rate: "Theo ty le cham cong",
  manual_bonus: "Thuong thu cong",
  project_bonus: "Thuong du an",
  deduction: "Khau tru"
};

const scopeLabels = {
  company: "Cong ty",
  department: "Phong ban",
  position: "Chuc vu",
  employee: "Nhan vien"
};

const defaultTaxForm = {
  personalDeduction: "11000000",
  dependentDeduction: "4400000",
  socialInsuranceRate: "8",
  healthInsuranceRate: "1.5",
  unemploymentInsuranceRate: "1",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  status: "inactive"
};

const defaultBracketForm = {
  taxSettingId: "",
  level: "1",
  incomeFrom: "0",
  incomeTo: "",
  taxRate: "5"
};

const defaultAllowanceForm = {
  code: "",
  name: "",
  calculationType: "fixed_monthly",
  amount: "0",
  unit: "VND/month",
  isTaxable: false,
  isInsuranceBased: false,
  applyScope: "company",
  status: "active"
};

export function PayrollSettingsClient() {
  const user = getStoredUser();
  const canManage = hasPermission(user, "payroll.configure");
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([]);
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [selectedTaxSettingId, setSelectedTaxSettingId] = useState("");
  const [taxForm, setTaxForm] = useState(defaultTaxForm);
  const [editingTaxSettingId, setEditingTaxSettingId] = useState<string | undefined>();
  const [bracketForm, setBracketForm] = useState(defaultBracketForm);
  const [editingBracketId, setEditingBracketId] = useState<string | undefined>();
  const [allowanceForm, setAllowanceForm] = useState(defaultAllowanceForm);
  const [editingAllowanceId, setEditingAllowanceId] = useState<string | undefined>();
  const [error, setError] = useState("");

  const selectedTaxSetting = useMemo(
    () => taxSettings.find((item) => item.id === selectedTaxSettingId),
    [selectedTaxSettingId, taxSettings]
  );

  async function loadAll() {
    const [taxResponse, allowanceResponse] = await Promise.all([
      fetchTaxSettings({ pageSize: 100 }),
      fetchAllowanceTypes({ pageSize: 100 })
    ]);
    const taxItems = taxResponse.data.items;
    const nextSelectedId = selectedTaxSettingId || taxItems.find((item) => item.status === "active")?.id || taxItems[0]?.id || "";
    setTaxSettings(taxItems);
    setAllowanceTypes(allowanceResponse.data.items);
    setSelectedTaxSettingId(nextSelectedId);

    if (nextSelectedId) {
      const bracketResponse = await fetchTaxBrackets({ taxSettingId: nextSelectedId, pageSize: 100 });
      setTaxBrackets(bracketResponse.data.items);
    }
  }

  useEffect(() => {
    if (canManage) {
      loadAll().catch((err) => setError(err instanceof Error ? err.message : "Cannot load payroll settings"));
    }
  }, [canManage]);

  useEffect(() => {
    if (!selectedTaxSettingId || !canManage) {
      return;
    }

    fetchTaxBrackets({ taxSettingId: selectedTaxSettingId, pageSize: 100 })
      .then((response) => {
        setTaxBrackets(response.data.items);
        setBracketForm((current) => ({ ...current, taxSettingId: selectedTaxSettingId }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Cannot load tax brackets"));
  }, [canManage, selectedTaxSettingId]);

  async function submitTaxSetting(event: FormEvent) {
    event.preventDefault();
    try {
      await saveTaxSetting(taxForm, editingTaxSettingId);
      setTaxForm(defaultTaxForm);
      setEditingTaxSettingId(undefined);
      await loadAll();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save tax setting");
    }
  }

  async function submitTaxBracket(event: FormEvent) {
    event.preventDefault();
    try {
      await saveTaxBracket(
        {
          ...bracketForm,
          taxSettingId: bracketForm.taxSettingId || selectedTaxSettingId,
          level: Number(bracketForm.level),
          incomeTo: bracketForm.incomeTo || undefined
        },
        editingBracketId
      );
      setBracketForm({ ...defaultBracketForm, taxSettingId: selectedTaxSettingId });
      setEditingBracketId(undefined);
      await loadAll();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save tax bracket");
    }
  }

  async function submitAllowanceType(event: FormEvent) {
    event.preventDefault();
    try {
      await saveAllowanceType(allowanceForm, editingAllowanceId);
      setAllowanceForm(defaultAllowanceForm);
      setEditingAllowanceId(undefined);
      await loadAll();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save allowance type");
    }
  }

  function editTaxSetting(item: TaxSetting) {
    setEditingTaxSettingId(item.id);
    setTaxForm({
      personalDeduction: String(item.personalDeduction),
      dependentDeduction: String(item.dependentDeduction),
      socialInsuranceRate: String(item.socialInsuranceRate),
      healthInsuranceRate: String(item.healthInsuranceRate),
      unemploymentInsuranceRate: String(item.unemploymentInsuranceRate),
      effectiveFrom: item.effectiveFrom.slice(0, 10),
      status: item.status
    });
  }

  function editTaxBracket(item: TaxBracket) {
    setEditingBracketId(item.id);
    setBracketForm({
      taxSettingId: item.taxSettingId,
      level: String(item.level),
      incomeFrom: String(item.incomeFrom),
      incomeTo: item.incomeTo === null || item.incomeTo === undefined ? "" : String(item.incomeTo),
      taxRate: String(item.taxRate)
    });
  }

  function editAllowanceType(item: AllowanceType) {
    setEditingAllowanceId(item.id);
    setAllowanceForm({
      code: item.code,
      name: item.name,
      calculationType: item.calculationType,
      amount: String(item.amount),
      unit: item.unit ?? "",
      isTaxable: item.isTaxable,
      isInsuranceBased: item.isInsuranceBased,
      applyScope: item.applyScope,
      status: item.status
    });
  }

  if (!canManage) {
    return <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">Ban khong co quyen cau hinh bang luong.</div>;
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-semibold">Cau hinh bang luong</h1>
        <p className="mt-2 text-sm text-muted">Thiet lap thue, bao hiem va cac loai phu cap. Khong tinh bang luong trong giai doan nay.</p>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold">Thiet lap thue va bao hiem</h2>
              <button className="rounded-md border border-border px-3 py-2 text-sm" type="button" onClick={() => void loadAll()}>
                Tai lai
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-surface text-left text-muted">
                  <tr>
                    <th className="p-3">Hieu luc</th>
                    <th className="p-3">Giam tru ca nhan</th>
                    <th className="p-3">Giam tru phu thuoc</th>
                    <th className="p-3">BHXH</th>
                    <th className="p-3">BHYT</th>
                    <th className="p-3">BHTN</th>
                    <th className="p-3">Trang thai</th>
                    <th className="p-3">Thao tac</th>
                  </tr>
                </thead>
                <tbody>
                  {taxSettings.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="p-3">{item.effectiveFrom.slice(0, 10)}</td>
                      <td className="p-3">{money.format(Number(item.personalDeduction))}</td>
                      <td className="p-3">{money.format(Number(item.dependentDeduction))}</td>
                      <td className="p-3">{item.socialInsuranceRate}%</td>
                      <td className="p-3">{item.healthInsuranceRate}%</td>
                      <td className="p-3">{item.unemploymentInsuranceRate}%</td>
                      <td className="p-3">{item.status}</td>
                      <td className="space-x-2 p-3">
                        <button className="rounded-md border border-border px-3 py-1" type="button" onClick={() => setSelectedTaxSettingId(item.id)}>Bac thue</button>
                        <button className="rounded-md border border-border px-3 py-1" type="button" onClick={() => editTaxSetting(item)}>Sua</button>
                        <button className="rounded-md border border-border px-3 py-1" type="button" onClick={() => activateTaxSetting(item.id).then(() => loadAll()).catch((err) => setError(err instanceof Error ? err.message : "Cannot activate"))}>Kich hoat</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-md border border-border bg-white">
            <div className="border-b border-border p-4">
              <h2 className="text-lg font-semibold">Bac thue {selectedTaxSetting ? selectedTaxSetting.effectiveFrom.slice(0, 10) : ""}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-surface text-left text-muted">
                  <tr>
                    <th className="p-3">Bac</th>
                    <th className="p-3">Tu</th>
                    <th className="p-3">Den</th>
                    <th className="p-3">Ty le</th>
                    <th className="p-3">Thao tac</th>
                  </tr>
                </thead>
                <tbody>
                  {taxBrackets.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="p-3">{item.level}</td>
                      <td className="p-3">{money.format(Number(item.incomeFrom))}</td>
                      <td className="p-3">{item.incomeTo ? money.format(Number(item.incomeTo)) : "Khong gioi han"}</td>
                      <td className="p-3">{item.taxRate}%</td>
                      <td className="space-x-2 p-3">
                        <button className="rounded-md border border-border px-3 py-1" type="button" onClick={() => editTaxBracket(item)}>Sua</button>
                        <button className="rounded-md border border-border px-3 py-1" type="button" onClick={() => deleteTaxBracket(item.id).then(() => loadAll()).catch((err) => setError(err instanceof Error ? err.message : "Cannot delete bracket"))}>Xoa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-md border border-border bg-white">
            <div className="border-b border-border p-4">
              <h2 className="text-lg font-semibold">Loai phu cap</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-surface text-left text-muted">
                  <tr>
                    <th className="p-3">Ma</th>
                    <th className="p-3">Ten</th>
                    <th className="p-3">Kieu tinh</th>
                    <th className="p-3">So tien</th>
                    <th className="p-3">Thue</th>
                    <th className="p-3">Bao hiem</th>
                    <th className="p-3">Pham vi</th>
                    <th className="p-3">Thao tac</th>
                  </tr>
                </thead>
                <tbody>
                  {allowanceTypes.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="p-3 font-medium">{item.code}</td>
                      <td className="p-3">{item.name}</td>
                      <td className="p-3">{calculationTypeLabels[item.calculationType]}</td>
                      <td className="p-3">{money.format(Number(item.amount))}</td>
                      <td className="p-3">{item.isTaxable ? "Co" : "Khong"}</td>
                      <td className="p-3">{item.isInsuranceBased ? "Co" : "Khong"}</td>
                      <td className="p-3">{scopeLabels[item.applyScope]}</td>
                      <td className="space-x-2 p-3">
                        <button className="rounded-md border border-border px-3 py-1" type="button" onClick={() => editAllowanceType(item)}>Sua</button>
                        <button className="rounded-md border border-border px-3 py-1" type="button" onClick={() => deleteAllowanceType(item.id).then(() => loadAll()).catch((err) => setError(err instanceof Error ? err.message : "Cannot deactivate allowance"))}>Ngung</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <form className="space-y-3 rounded-md border border-border bg-white p-4" onSubmit={(event) => void submitTaxSetting(event)}>
            <h2 className="text-base font-semibold">{editingTaxSettingId ? "Sua thiet lap thue" : "Them thiet lap thue"}</h2>
            <input className="h-10 w-full rounded-md border border-border px-3" type="date" value={taxForm.effectiveFrom} onChange={(event) => setTaxForm({ ...taxForm, effectiveFrom: event.target.value })} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <input className="h-10 rounded-md border border-border px-3" min="0" placeholder="Giam tru ca nhan" type="number" value={taxForm.personalDeduction} onChange={(event) => setTaxForm({ ...taxForm, personalDeduction: event.target.value })} />
              <input className="h-10 rounded-md border border-border px-3" min="0" placeholder="Giam tru phu thuoc" type="number" value={taxForm.dependentDeduction} onChange={(event) => setTaxForm({ ...taxForm, dependentDeduction: event.target.value })} />
              <input className="h-10 rounded-md border border-border px-3" max="100" min="0" placeholder="BHXH %" type="number" value={taxForm.socialInsuranceRate} onChange={(event) => setTaxForm({ ...taxForm, socialInsuranceRate: event.target.value })} />
              <input className="h-10 rounded-md border border-border px-3" max="100" min="0" placeholder="BHYT %" type="number" value={taxForm.healthInsuranceRate} onChange={(event) => setTaxForm({ ...taxForm, healthInsuranceRate: event.target.value })} />
              <input className="h-10 rounded-md border border-border px-3" max="100" min="0" placeholder="BHTN %" type="number" value={taxForm.unemploymentInsuranceRate} onChange={(event) => setTaxForm({ ...taxForm, unemploymentInsuranceRate: event.target.value })} />
            </div>
            <select className="h-10 w-full rounded-md border border-border px-3" value={taxForm.status} onChange={(event) => setTaxForm({ ...taxForm, status: event.target.value })}>
              <option value="active">Dang hoat dong</option>
              <option value="inactive">Ngung hoat dong</option>
            </select>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" type="submit">Luu thue</button>
          </form>

          <form className="space-y-3 rounded-md border border-border bg-white p-4" onSubmit={(event) => void submitTaxBracket(event)}>
            <h2 className="text-base font-semibold">{editingBracketId ? "Sua bac thue" : "Them bac thue"}</h2>
            <input className="h-10 w-full rounded-md border border-border px-3" min="1" placeholder="Bac" type="number" value={bracketForm.level} onChange={(event) => setBracketForm({ ...bracketForm, level: event.target.value })} />
            <input className="h-10 w-full rounded-md border border-border px-3" min="0" placeholder="Thu nhap tu" type="number" value={bracketForm.incomeFrom} onChange={(event) => setBracketForm({ ...bracketForm, incomeFrom: event.target.value })} />
            <input className="h-10 w-full rounded-md border border-border px-3" min="0" placeholder="Thu nhap den" type="number" value={bracketForm.incomeTo} onChange={(event) => setBracketForm({ ...bracketForm, incomeTo: event.target.value })} />
            <input className="h-10 w-full rounded-md border border-border px-3" max="100" min="0" placeholder="Ty le %" type="number" value={bracketForm.taxRate} onChange={(event) => setBracketForm({ ...bracketForm, taxRate: event.target.value })} />
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" disabled={!selectedTaxSettingId} type="submit">Luu bac thue</button>
          </form>

          <form className="space-y-3 rounded-md border border-border bg-white p-4" onSubmit={(event) => void submitAllowanceType(event)}>
            <h2 className="text-base font-semibold">{editingAllowanceId ? "Sua phu cap" : "Them phu cap"}</h2>
            <input className="h-10 w-full rounded-md border border-border px-3" placeholder="Ma" value={allowanceForm.code} onChange={(event) => setAllowanceForm({ ...allowanceForm, code: event.target.value })} />
            <input className="h-10 w-full rounded-md border border-border px-3" placeholder="Ten" value={allowanceForm.name} onChange={(event) => setAllowanceForm({ ...allowanceForm, name: event.target.value })} />
            <select className="h-10 w-full rounded-md border border-border px-3" value={allowanceForm.calculationType} onChange={(event) => setAllowanceForm({ ...allowanceForm, calculationType: event.target.value })}>
              {Object.entries(calculationTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input className="h-10 w-full rounded-md border border-border px-3" min="0" placeholder="So tien" type="number" value={allowanceForm.amount} onChange={(event) => setAllowanceForm({ ...allowanceForm, amount: event.target.value })} />
            <input className="h-10 w-full rounded-md border border-border px-3" placeholder="Don vi" value={allowanceForm.unit} onChange={(event) => setAllowanceForm({ ...allowanceForm, unit: event.target.value })} />
            <select className="h-10 w-full rounded-md border border-border px-3" value={allowanceForm.applyScope} onChange={(event) => setAllowanceForm({ ...allowanceForm, applyScope: event.target.value })}>
              {Object.entries(scopeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm"><input checked={allowanceForm.isTaxable} type="checkbox" onChange={(event) => setAllowanceForm({ ...allowanceForm, isTaxable: event.target.checked })} /> Chiu thue</label>
            <label className="flex items-center gap-2 text-sm"><input checked={allowanceForm.isInsuranceBased} type="checkbox" onChange={(event) => setAllowanceForm({ ...allowanceForm, isInsuranceBased: event.target.checked })} /> Tinh dong bao hiem</label>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" type="submit">Luu phu cap</button>
          </form>
        </div>
      </div>
    </section>
  );
}

