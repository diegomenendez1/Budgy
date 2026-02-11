import { Transaction } from '../types';

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
    if (transactions.length === 0) return;

    const headers = ['Fecha', 'Descripción', 'Categoría', 'Monto', 'Tipo', 'Excepcional'];
    const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description.replace(/,/g, ''), // Evitar problemas con comas en CSV
        t.category,
        t.amount.toString(),
        t.type,
        t.isExceptional ? 'Sí' : 'No'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `budgy_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
