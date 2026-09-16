import { User, MoreHorizontal, Edit, Trash2 } from 'lucide-react'

interface CustomerTableProps {
  customers: any[]
  onEdit: (customer: any) => void
  onDelete: (customer: any) => void
}

export function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-400">
            <th className="px-5 py-3 font-medium">Client</th>
            <th className="px-3 py-3 font-medium">Téléphone</th>
            <th className="px-3 py-3 font-medium">Email</th>
            <th className="px-3 py-3 font-medium">Adresse</th>
            <th className="px-3 py-3 font-medium">Notes</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{customer.name}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 text-slate-500">{customer.phone || '-'}</td>
              <td className="px-3 py-4 text-slate-500">{customer.email || '-'}</td>
              <td className="px-3 py-4 text-slate-500">{customer.address || '-'}</td>
              <td className="px-3 py-4 text-slate-500">{customer.notes || '-'}</td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(customer)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(customer)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {customers.length === 0 && (
        <div className="p-12 text-center">
          <User className="mx-auto text-slate-300" size={28} />
          <p className="mt-3 text-sm font-semibold text-slate-600">Aucun client trouvé</p>
          <p className="mt-1 text-xs text-slate-400">Commencez par ajouter votre premier client</p>
        </div>
      )}
    </div>
  )
}
