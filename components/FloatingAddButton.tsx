import React, { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';

const categories = ["Comida", "Transporte", "Ocio", "Salud", "Compras", "Otros"];

const FloatingAddButton: React.FC = () => {
  const { addTransaction } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [isExceptional, setIsExceptional] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return; // Solo validamos que haya monto
    
    addTransaction({
      description: desc,
      amount: parseFloat(amount),
      category: category,
      date: new Date().toISOString(),
      type: TransactionType.EXPENSE,
      isExceptional
    });
    // Reset form
    setAmount('');
    setDesc('');
    setIsExceptional(false);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-black text-white p-4 rounded-full shadow-xl shadow-black/20 active:scale-95 transition-transform z-40 hover:bg-gray-800 flex items-center justify-center"
        aria-label="Agregar Gasto"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center backdrop-blur-sm animate-fade-in">
          {/* Overlay click to close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
          
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-safe sm:pb-6 shadow-2xl relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Nuevo Gasto</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-500 font-medium p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                Cancelar
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1">Monto</label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 text-2xl font-bold">$</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-4xl font-bold text-gray-900 border-b-2 border-gray-100 focus:border-black focus:outline-none py-2 pl-6 bg-transparent transition-colors placeholder:text-gray-300"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">Descripción <span className="text-gray-300 font-normal">(Opcional)</span></label>
                <input 
                  type="text" 
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 font-medium text-lg"
                  placeholder="¿En qué gastaste?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${category === c ? 'bg-black text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exceptional Toggle */}
              <div 
                onClick={() => setIsExceptional(!isExceptional)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isExceptional ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isExceptional ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-500'}`}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isExceptional ? 'text-amber-900' : 'text-gray-700'}`}>Gasto Excepcional</p>
                    <p className="text-xs text-gray-500">No afecta el ritmo diario habitual</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isExceptional ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                  {isExceptional && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-ios-blue text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all text-lg mt-2"
              >
                Agregar Gasto
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAddButton;