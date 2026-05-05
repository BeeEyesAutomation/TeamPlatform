"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { Department, Position } from "../../types/hr";
import { fetchDepartments, fetchEmployee, fetchPositions, saveEmployee } from "./hr-api";
import { formatVnd } from "./format";

const initialForm = {
  employeeCode: "",
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  avatarUrl: "",
  citizenIdNumber: "",
  citizenIdIssueDate: "",
  citizenIdIssuePlace: "",
  citizenIdFrontImageUrl: "",
  citizenIdBackImageUrl: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountHolder: "",
  bankBranch: "",
  departmentId: "",
  positionId: "",
  salaryLevel: "0",
  employmentType: "official",
  status: "active",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: ""
};

export function EmployeeForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState("");
  const user = getStoredUser();
  const canViewSensitive = hasPermission(user, "employees.view_sensitive");

  useEffect(() => {
    async function load() {
      try {
        const [departmentResponse, positionResponse] = await Promise.all([
          fetchDepartments({ pageSize: 100 }),
          fetchPositions({ pageSize: 100 })
        ]);
        setDepartments(departmentResponse.data.items);
        setPositions(positionResponse.data.items);

        if (id) {
          const employeeResponse = await fetchEmployee(id);
          const employee = employeeResponse.data;
          setForm({
            ...initialForm,
            employeeCode: employee.employeeCode,
            fullName: employee.fullName,
            phone: employee.phone ?? "",
            email: employee.email ?? "",
            dateOfBirth: employee.dateOfBirth?.slice(0, 10) ?? "",
            gender: employee.gender ?? "",
            address: employee.address ?? "",
            avatarUrl: employee.avatarUrl ?? "",
            citizenIdNumber: employee.citizenIdNumber ?? "",
            citizenIdIssueDate: employee.citizenIdIssueDate?.slice(0, 10) ?? "",
            citizenIdIssuePlace: employee.citizenIdIssuePlace ?? "",
            citizenIdFrontImageUrl: employee.citizenIdFrontImageUrl ?? "",
            citizenIdBackImageUrl: employee.citizenIdBackImageUrl ?? "",
            bankName: employee.bankName ?? "",
            bankAccountNumber: employee.bankAccountNumber ?? "",
            bankAccountHolder: employee.bankAccountHolder ?? "",
            bankBranch: employee.bankBranch ?? "",
            departmentId: employee.departmentId ?? "",
            positionId: employee.positionId ?? "",
            salaryLevel: String(employee.salaryLevel ?? 0),
            employmentType: employee.employmentType,
            status: employee.status,
            emergencyContactName: employee.emergencyContactName ?? "",
            emergencyContactPhone: employee.emergencyContactPhone ?? "",
            emergencyContactRelation: employee.emergencyContactRelation ?? ""
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Cannot load employee form");
      }
    }

    void load();
  }, [id]);

  const selectedPosition = positions.find((position) => position.id === form.positionId);
  const salaryPreview = useMemo(() => {
    if (!selectedPosition) {
      return 0;
    }

    return Number(selectedPosition.baseSalary ?? 0) + Number(selectedPosition.salaryStepAmount ?? 0) * Number(form.salaryLevel || 0);
  }, [form.salaryLevel, selectedPosition]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(
        Object.entries({
          ...form,
          salaryLevel: Number(form.salaryLevel)
        }).filter(([, value]) => value !== "")
      );

      if (!canViewSensitive) {
        for (const key of [
          "citizenIdNumber",
          "citizenIdIssueDate",
          "citizenIdIssuePlace",
          "citizenIdFrontImageUrl",
          "citizenIdBackImageUrl",
          "bankName",
          "bankAccountNumber",
          "bankAccountHolder",
          "bankBranch",
          "salaryLevel"
        ]) {
          delete payload[key];
        }
      }

      await saveEmployee(payload, id);
      router.push("/employees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save employee");
    }
  }

  const inputClass = "mt-1 h-10 w-full rounded-md border border-border px-3";

  return (
    <form className="space-y-5 rounded-md border border-border bg-white p-5" onSubmit={(event) => void submit(event)}>
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-medium">Ma nhan vien<input className={inputClass} required value={form.employeeCode} onChange={(event) => setForm({ ...form, employeeCode: event.target.value })} /></label>
        <label className="block text-sm font-medium">Ho ten<input className={inputClass} required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
        <label className="block text-sm font-medium">Dien thoai<input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
        <label className="block text-sm font-medium">Email<input className={inputClass} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label className="block text-sm font-medium">Ngay sinh<input className={inputClass} type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} /></label>
        <label className="block text-sm font-medium">Gioi tinh<input className={inputClass} value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} /></label>
        <label className="block text-sm font-medium md:col-span-3">Dia chi<input className={inputClass} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
        <label className="block text-sm font-medium">Phong ban<select className={inputClass} value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}><option value="">Chon phong ban</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
        <label className="block text-sm font-medium">Chuc vu<select className={inputClass} value={form.positionId} onChange={(event) => setForm({ ...form, positionId: event.target.value })}><option value="">Chon chuc vu</option>{positions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}</select></label>
        {canViewSensitive ? <label className="block text-sm font-medium">Bac luong<input className={inputClass} min="0" type="number" value={form.salaryLevel} onChange={(event) => setForm({ ...form, salaryLevel: event.target.value })} /></label> : null}
        {canViewSensitive ? <div className="rounded-md border border-border bg-surface p-3 text-sm md:col-span-3">Luong du kien: <span className="font-semibold">{formatVnd(salaryPreview)}</span></div> : null}
        <label className="block text-sm font-medium">Loai hop dong<select className={inputClass} value={form.employmentType} onChange={(event) => setForm({ ...form, employmentType: event.target.value })}><option value="official">Chinh thuc</option><option value="probation">Thu viec</option><option value="seasonal">Thoi vu</option><option value="part_time">Ban thoi gian</option></select></label>
        <label className="block text-sm font-medium">Trang thai<select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="probation">Thu viec</option><option value="active">Dang lam</option><option value="temporarily_inactive">Tam nghi</option><option value="resigned">Da nghi</option></select></label>
        <label className="block text-sm font-medium">Avatar URL<input className={inputClass} value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} /></label>
      </div>

      {canViewSensitive ? <div className="border-t border-border pt-5">
        <h2 className="text-base font-semibold">Thong tin nhay cam</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-medium">So CCCD<input className={inputClass} value={form.citizenIdNumber} onChange={(event) => setForm({ ...form, citizenIdNumber: event.target.value })} /></label>
          <label className="block text-sm font-medium">Ngay cap<input className={inputClass} type="date" value={form.citizenIdIssueDate} onChange={(event) => setForm({ ...form, citizenIdIssueDate: event.target.value })} /></label>
          <label className="block text-sm font-medium">Noi cap<input className={inputClass} value={form.citizenIdIssuePlace} onChange={(event) => setForm({ ...form, citizenIdIssuePlace: event.target.value })} /></label>
          <label className="block text-sm font-medium">CCCD mat truoc URL<input className={inputClass} value={form.citizenIdFrontImageUrl} onChange={(event) => setForm({ ...form, citizenIdFrontImageUrl: event.target.value })} /></label>
          <label className="block text-sm font-medium">CCCD mat sau URL<input className={inputClass} value={form.citizenIdBackImageUrl} onChange={(event) => setForm({ ...form, citizenIdBackImageUrl: event.target.value })} /></label>
          <label className="block text-sm font-medium">Ngan hang<input className={inputClass} value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} /></label>
          <label className="block text-sm font-medium">So tai khoan<input className={inputClass} value={form.bankAccountNumber} onChange={(event) => setForm({ ...form, bankAccountNumber: event.target.value })} /></label>
          <label className="block text-sm font-medium">Chu tai khoan<input className={inputClass} value={form.bankAccountHolder} onChange={(event) => setForm({ ...form, bankAccountHolder: event.target.value })} /></label>
          <label className="block text-sm font-medium">Chi nhanh<input className={inputClass} value={form.bankBranch} onChange={(event) => setForm({ ...form, bankBranch: event.target.value })} /></label>
        </div>
      </div> : null}

      <div className="border-t border-border pt-5">
        <h2 className="text-base font-semibold">Lien he khan cap</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-medium">Ho ten<input className={inputClass} value={form.emergencyContactName} onChange={(event) => setForm({ ...form, emergencyContactName: event.target.value })} /></label>
          <label className="block text-sm font-medium">Dien thoai<input className={inputClass} value={form.emergencyContactPhone} onChange={(event) => setForm({ ...form, emergencyContactPhone: event.target.value })} /></label>
          <label className="block text-sm font-medium">Quan he<input className={inputClass} value={form.emergencyContactRelation} onChange={(event) => setForm({ ...form, emergencyContactRelation: event.target.value })} /></label>
        </div>
      </div>

      <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" type="submit">
        Luu
      </button>
    </form>
  );
}
