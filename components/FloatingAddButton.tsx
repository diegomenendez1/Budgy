import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Check, ArrowDown, ArrowUp } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';

const FloatingAddButton: React.FC = () => {
  const { addTransaction, categories, addCategory, activeCycle, cycleMetrics, transferSavingsToBudget } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  
  // Transaction Type State
  const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);

  // Form State
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [isExceptional, setIsExceptional] = useState(false);

  // New Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Emergency / Overspending State
  const [showSavingsAlert, setShowSavingsAlert] = useState(false);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!amount) return;
    
    const numAmount = parseFloat(amount);

    // Check for Overspending Logic
    // Only if: It's an Expense, Cycle is active, We have Savings, Amount > Remaining, and Alert not shown yet
    if (
        txType === TransactionType.EXPENSE && 
        activeCycle && 
        activeCycle.savingsGoal > 0 && 
        numAmount > cycleMetrics.remainingBudget &&
        !showSavingsAlert 
    ) {
        setShowSavingsAlert(true);
        return;
    }
    
    addTransaction({
      description: desc || (txType === TransactionType.INCOME ? 'Ingreso Extra' : category),
      amount: numAmount,
      category: txType === TransactionType.INCOME ? 'Ingreso' : category,
      date: new Date().toISOString(),
      type: txType,
      isExceptional: txType === TransactionType.EXPENSE ? isExceptional : false
    });
    
    // Reset form
    setAmount('');
    setDesc('');
    setIsExceptional(false);
    setIsOpen(false);
    setShowSavingsAlert(false);
    setTxType(TransactionType.EXPENSE);
  };

  const handleUseSavings = () => {
      transferSavingsToBudget();
      // Small delay to ensure state updates before adding transaction
      setTimeout(() => {
          handleSubmit(); 
      }, 50);
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName);
      setCategory(newCategoryName.trim()); // Select the new category
      setIsAddingCategory(false);
      setNewCategoryName('');
    } else {
      setIsAddingCategory(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-black text-white p-4 rounded-full shadow-xl shadow-black/20 active:scale-95 transition-transform z-[60] hover:bg-gray-800 flex items-center justify-center"
        aria-label="Agregar Gasto"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center backdrop-blur-sm animate-fade-in">
          {/* Overlay click to close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
          
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 pb-safe sm:pb-6 shadow-2xl relative z-10 overflow-hidden">
            
            {/* --- EMERGENCY SAVINGS ALERT VIEW --- */}
            {showSavingsAlert ? (
                <div className="animate-in flex flex-col items-center text-center pt-2">
                    <div className="bg-amber-100 p-4 rounded-full mb-4 text-amber-600 shadow-lg shadow-amber-500/20">
                        <AlertTriangle size={32} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                        Presupuesto Excedido
                    </h3>
                    <p className="text-gray-500 mb-6 text-sm px-4">
                        Este gasto de <strong className="text-gray-900">${parseFloat(amount).toLocaleString()}</strong> supera tu disponible actual de <strong className="text-red-500">${cycleMetrics.remainingBudget.toLocaleString()}</strong>.
                        <br/><br/>
                        ¿Quieres usar tu fondo de ahorro de <strong className="text-blue-600">${activeCycle?.savingsGoal.toLocaleString()}</strong> para cubrirlo?
                    </p>

                    <div className="w-full space-y-3">
                        <button 
                            onClick={handleUseSavings}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Check size={20} /> Sí, usar mis ahorros
                        </button>
                        <button 
                            onClick={() => handleSubmit()} 
                            className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl active:scale-[0.98] transition-all"
                        >
                            No, dejar saldo en negativo
                        </button>
                    </div>
                </div>
            ) : (
                /* --- NORMAL FORM VIEW --- */
                <>
                <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                    {txType === TransactionType.INCOME ? 'Nuevo Ingreso' : 'Nuevo Gasto'}
                </h3>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="text-gray-500 font-medium p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    Cancelar
                </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Type Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => setTxType(TransactionType.EXPENSE)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${txType === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        <ArrowUp size={16} /> Gasto
                    </button>
                    <button
                        type="button"
                        onClick={() => setTxType(TransactionType.INCOME)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${txType === TransactionType.INCOME ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        <ArrowDown size={16} /> Ingreso
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-1">Monto</label>
                    <div className="relative">
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold ${txType === TransactionType.INCOME ? 'text-green-500' : 'text-gray-400'}`}>$</span>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={`w-full text-4xl font-bold border-b-2 border-gray-100 focus:border-black focus:outline-none py-2 pl-6 bg-transparent transition-colors placeholder:text-gray-300 ${txType === TransactionType.INCOME ? 'text-green-600' : 'text-gray-900'}`}
                        placeholder="0"
                        autoFocus
                        inputMode="decimal"
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
                    placeholder={txType === TransactionType.INCOME ? "Venta, Regalo, etc." : "¿En qué gastaste?"}
                    />
                </div>

                {txType === TransactionType.EXPENSE && (
                    <>
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
                        
                        {/* Button to add new category */}
                        {isAddingCategory ? (
                            <div className="flex items-center bg-gray-100 rounded-full px-2 pl-3 py-1">
                            <input 
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onBlur={handleAddNewCategory}
                                onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddNewCategory();
                                }
                                }}
                                className="bg-transparent border-none focus:outline-none text-sm font-bold text-gray-900 w-24"
                                placeholder="Nueva..."
                                autoFocus
                            />
                            <button 
                                type="button" 
                                onMouseDown={handleAddNewCategory} // onMouseDown fires before onBlur
                                className="bg-black text-white p-1 rounded-full ml-1"
                            >
                                <Check size={12} strokeWidth={3} />
                            </button>
                            </div>
                        ) : (
                            <button
                            type="button"
                            onClick={() => setIsAddingCategory(true)}
                            className="px-3 py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-400 hover:bg-gray-200 border border-dashed border-gray-300"
                            >
                            <Plus size={16} />
                            </button>
                        )}
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
                    </>
                )}

                <button 
                    type="submit" 
                    className={`w-full font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all text-lg mt-2 ${txType === TransactionType.INCOME ? 'bg-green-600 text-white shadow-green-500/30' : 'bg-ios-blue text-white shadow-blue-500/30'}`}
                >
                    {txType === TransactionType.INCOME ? 'Registrar Ingreso' : 'Agregar Gasto'}
                </button>
                </form>
                </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAddButton;