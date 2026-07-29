import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ==========================================
// EXPORT CSV
// ==========================================

export function exportToCSV<T extends object>(
  data: T[],
  filename: string,
  headers: { key: keyof T; label: string }[]
) {
  if (data.length === 0) {
    alert("Nessun dato da esportare");
    return;
  }

  const csvHeaders = headers.map((h) => `"${h.label}"`).join(",");

  const csvRows = data.map((row) => {
    return headers
      .map((h) => {
        const value = row[h.key];
        if (value === null || value === undefined) return '""';
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",");
  });

  const csv = [csvHeaders, ...csvRows].join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// EXPORT PDF - REPORT CLIENTE (NON FISCALE)
// ==========================================

interface InvoicePDFData {
  number: string;
  amount: number;
  status: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  notes: string | null;
  clientName: string | null;
}

interface UserPDFData {
  name: string;
  email: string;
}

export function exportInvoiceToPDF(invoice: InvoicePDFData, user: UserPDFData) {
  const doc = new jsPDF();

  const primaryColor: [number, number, number] = [79, 70, 229];
  const darkColor: [number, number, number] = [15, 23, 42];
  const grayColor: [number, number, number] = [100, 116, 139];
  const warningBg: [number, number, number] = [254, 243, 199];
  const warningText: [number, number, number] = [146, 64, 14];

  // ==== DISCLAIMER IN CIMA ====
  doc.setFillColor(...warningBg);
  doc.rect(0, 0, 210, 12, "F");
  doc.setTextColor(...warningText);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(
    "DOCUMENTO RIEPILOGATIVO NON FISCALE - Non sostituisce la fattura elettronica obbligatoria",
    105,
    8,
    { align: "center" }
  );

  // ==== HEADER ====
  doc.setFillColor(...primaryColor);
  doc.rect(0, 12, 210, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("REPORT CLIENTE", 20, 30);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Riferimento: ${invoice.number}`, 20, 40);

  // Info emittente (a destra)
  doc.setFontSize(10);
  doc.text(user.name, 190, 25, { align: "right" });
  doc.text(user.email, 190, 31, { align: "right" });
  doc.setFontSize(8);
  doc.text(`Report generato il ${new Date().toLocaleDateString("it-IT")}`, 190, 40, { align: "right" });

  // ==== INFO CLIENTE ====
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESTINATARIO:", 20, 62);

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.clientName || "Cliente non specificato", 20, 70);

  // ==== DATE ====
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text("PERIODO DI RIFERIMENTO", 130, 62);
  doc.text("SCADENZA CONCORDATA", 130, 77);

  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.text(
    invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString("it-IT") : "—",
    130,
    69
  );
  doc.text(
    invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString("it-IT") : "—",
    130,
    84
  );

  // ==== STATO ====
  const statusMap: Record<string, { label: string; color: [number, number, number] }> = {
    draft: { label: "IN LAVORAZIONE", color: [148, 163, 184] },
    sent: { label: "INVIATO AL CLIENTE", color: [59, 130, 246] },
    paid: { label: "INCASSATO", color: [16, 185, 129] },
    overdue: { label: "IN ATTESA", color: [239, 68, 68] },
  };

  const st = statusMap[invoice.status] || statusMap.draft;
  doc.setFillColor(...st.color);
  doc.roundedRect(130, 90, 60, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(st.label, 160, 95.5, { align: "center" });

  // ==== TABELLA ATTIVITÀ ====
  autoTable(doc, {
    startY: 108,
    head: [["Descrizione attività", "Compenso"]],
    body: [
      [
        `Prestazione professionale - Riferimento ${invoice.number}${invoice.clientName ? `\nCliente: ${invoice.clientName}` : ""}`,
        `€ ${invoice.amount.toFixed(2).replace(".", ",")}`,
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 11,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 40, halign: "right", fontStyle: "bold" },
    },
  });

  // ==== TOTALE ====
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(120, finalY, 190, finalY);

  doc.setTextColor(...darkColor);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("COMPENSO CONCORDATO:", 122, finalY + 10);

  doc.setTextColor(...primaryColor);
  doc.setFontSize(17);
  doc.text(`€ ${invoice.amount.toFixed(2).replace(".", ",")}`, 190, finalY + 10, {
    align: "right",
  });

  // ==== NOTE ====
  if (invoice.notes) {
    doc.setTextColor(...grayColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("NOTE:", 20, finalY + 30);
    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(notesLines, 20, finalY + 37);
  }

  // ==== DISCLAIMER FONDO PAGINA ====
  doc.setFillColor(...warningBg);
  doc.rect(0, 265, 210, 32, "F");

  doc.setTextColor(...warningText);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("IMPORTANTE - AVVISO LEGALE", 105, 273, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Questo documento e un semplice riepilogo delle attivita svolte e ha valore puramente informativo tra le parti.", 105, 279, { align: "center" });
  doc.text("NON costituisce fattura fiscale valida ai sensi della normativa italiana (DPR 633/72).", 105, 284, { align: "center" });
  doc.text("Per la fatturazione ufficiale, e obbligatorio emettere fattura elettronica tramite il Sistema di Interscambio (SdI)", 105, 289, { align: "center" });
  doc.text("dell'Agenzia delle Entrate, utilizzando un software di fatturazione elettronica autorizzato.", 105, 294, { align: "center" });

  // Download
  doc.save(`Report_${invoice.number}_${new Date().toISOString().slice(0, 10)}.pdf`);
}