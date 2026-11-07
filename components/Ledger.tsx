"use client";

import { useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  colorSchemeDark,
  type ColDef,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

const darkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: "#0c1744",
  foregroundColor: "#e2e8f0",
  headerBackgroundColor: "#14236a",
  borderColor: "rgba(255,255,255,0.1)",
  accentColor: "#6366f1",
});

type Payout = {
  id: string;
  recipient_name: string;
  recipient_email: string | null;
  amount_cents: number;
  due_at: string;
  status: string;
  paypal_batch_id: string | null;
};

export default function Ledger({ payouts }: { payouts: Payout[] }) {
  const gridRef = useRef<AgGridReact<Payout>>(null);

  const columnDefs = useMemo<ColDef<Payout>[]>(
    () => [
      { field: "recipient_name", headerName: "Recipient" },
      { field: "recipient_email", headerName: "Email", flex: 2 },
      {
        field: "amount_cents",
        headerName: "Amount",
        valueFormatter: (p) => `$${(p.value / 100).toFixed(2)}`,
      },
      {
        field: "due_at",
        headerName: "Due",
        valueFormatter: (p) => new Date(p.value).toLocaleString(),
        flex: 2,
      },
      { field: "status", headerName: "Status" },
      { field: "paypal_batch_id", headerName: "PayPal batch", flex: 2 },
    ],
    []
  );

  function exportCsv() {
    gridRef.current?.api.exportDataAsCsv({ fileName: "smart-payouts-ledger.csv" });
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={exportCsv}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          ⬇ Export CSV
        </button>
      </div>
      <div style={{ height: 380, width: "100%" }}>
        <AgGridReact<Payout>
          ref={gridRef}
          theme={darkTheme}
          rowData={payouts}
          columnDefs={columnDefs}
          defaultColDef={{ sortable: true, filter: true, resizable: true, flex: 1 }}
          pagination
          paginationPageSize={10}
        />
      </div>
    </div>
  );
}