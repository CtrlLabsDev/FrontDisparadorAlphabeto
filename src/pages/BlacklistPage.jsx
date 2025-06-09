import { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import api from "../services/api";

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newReason, setNewReason] = useState("");
  const toast = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/blacklist/", {
        params: {
          page: page + 1,
          per_page: rows,
          search: globalFilter,
        },
      });
      setBlacklist(res.data.data);
      setTotalRecords(res.data.total);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Erro", detail: "Falha ao buscar blacklist" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, rows, globalFilter]);

  const adicionarNumero = async () => {
    try {
      await api.post("/blacklist/", {
        telefone: newPhone,
        motivo: newReason || "Adicionado manualmente",
      });
      toast.current.show({ severity: "success", summary: "Sucesso", detail: "Número adicionado" });
      setShowDialog(false);
      setNewPhone("");
      setNewReason("");
      fetchData();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Erro", detail: "Não foi possível adicionar" });
    }
  };

  const removerNumero = async (id) => {
    try {
      await api.delete(`/blacklist/${id}/`);
      toast.current.show({ severity: "info", summary: "Removido", detail: "Número removido da blacklist" });
      fetchData();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Erro", detail: "Erro ao remover número" });
    }
  };

  const exportarCSV = () => {
    window.open("/api/blacklist/exportar-csv/", "_blank");
  };

  const importarCSV = async ({ files }) => {
    const formData = new FormData();
    formData.append("arquivo", files[0]);
    try {
      await api.post("/blacklist/importar-csv/", formData);
      toast.current.show({ severity: "success", summary: "Importado", detail: "CSV importado com sucesso" });
      fetchData();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Erro", detail: "Falha na importação do CSV" });
    }
  };

  const actionsBody = (rowData) => (
    <Button icon="pi pi-trash" severity="danger" rounded onClick={() => removerNumero(rowData.id)} />
  );

  return (
    <div className="p-5">
      <Toast ref={toast} />
      <div className="flex justify-between mb-3">
        <Button label="Adicionar" icon="pi pi-plus" onClick={() => setShowDialog(true)} />
        <div className="flex gap-2">
          <FileUpload name="csv" accept=".csv" customUpload uploadHandler={importarCSV} chooseLabel="Importar CSV" mode="basic" auto />
          <Button label="Exportar CSV" icon="pi pi-download" onClick={exportarCSV} severity="secondary" />
        </div>
      </div>

      <DataTable
        value={blacklist}
        lazy
        paginator
        first={page * rows}
        rows={rows}
        totalRecords={totalRecords}
        loading={loading}
        onPage={(e) => {
          setPage(e.first / e.rows);
          setRows(e.rows);
        }}
        globalFilter={globalFilter}
        header={<InputText placeholder="Buscar..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-full" />}
      >
        <Column field="telefone" header="Telefone" />
        <Column field="motivo" header="Motivo" />
        <Column field="data_adicao" header="Data de Adição" />
        <Column field="adicionado_por" header="Adicionado Por" />
        <Column body={actionsBody} header="Ações" style={{ width: "100px" }} />
      </DataTable>

      <Dialog header="Adicionar à Blacklist" visible={showDialog} onHide={() => setShowDialog(false)}>
        <div className="flex flex-col gap-3">
          <InputText placeholder="Telefone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          <InputText placeholder="Motivo (opcional)" value={newReason} onChange={(e) => setNewReason(e.target.value)} />
          <Button label="Salvar" onClick={adicionarNumero} disabled={!newPhone} />
        </div>
      </Dialog>
    </div>
  );
}