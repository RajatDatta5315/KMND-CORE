import React from 'react';

// Isse copy karke kisi bhi app me daal sakte ho
export const KMNDPayButton = ({ amount, appId, userId }: any) => {
  const processPayment = async () => {
    const res = await fetch('https://gateway.kryv.network/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, appId, userId })
    });
    const data = await res.json();
    if (data.success) alert(`⟁${amount} KMND Transacted!`);
    else alert("Low Energy (⟁KMND)");
  };

  return (
    <button 
      onClick={processPayment}
      className="px-6 py-2 border-2 border-cyan-500 text-cyan-500 font-bold hover:bg-cyan-500 hover:text-black transition-all"
    >
      PAY ⟁{amount} KMND
    </button>
  );
};
