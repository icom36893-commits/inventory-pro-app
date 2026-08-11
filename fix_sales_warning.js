const fs = require('fs');
const path = 'd:\\os\\inventory-pro-app\\src\\pages\\Sales.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add original_price and update_sale_price to the inserted item in addProductToInvoice
const addMatch = `is_initial: product.is_initial`;
if (content.includes(addMatch) && !content.includes('original_price: product.sale_price')) {
    content = content.replace(addMatch, `is_initial: product.is_initial,
  original_price: product.sale_price,
  update_sale_price: false`);
}

// 2. Add checkPriceChange and confirmPriceWarning after removeItem
const removeItemMatch = `const removeItem = (index: number) => {
  setItems(items.filter((_, i) => i !== index));
  };`;
const functionsToAdd = `
  const checkPriceChange = (index: number) => {
    const currentItem = items[index];
    if (currentItem && currentItem.unit_price !== currentItem.original_price && currentItem.original_price !== undefined) {
      setPriceWarning({ isOpen: true, itemIndex: index, oldPrice: currentItem.original_price, newPrice: currentItem.unit_price });
    }
  };

  const confirmPriceWarning = (confirm: boolean) => {
    if (!priceWarning) return;
    const newItems = [...items];
    if (confirm) {
      newItems[priceWarning.itemIndex].update_sale_price = true;
      newItems[priceWarning.itemIndex].original_price = priceWarning.newPrice;
    } else {
      newItems[priceWarning.itemIndex].update_sale_price = false;
      newItems[priceWarning.itemIndex].original_price = priceWarning.newPrice;
    }
    setItems(newItems);
    setPriceWarning(null);
  };`;

if (content.includes(removeItemMatch) && !content.includes('checkPriceChange')) {
    content = content.replace(removeItemMatch, removeItemMatch + functionsToAdd);
}

// 3. Update the unit_price input field to include onBlur={() => checkPriceChange(idx)}
const inputMatch = `updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-gray-200 p-2 rounded-xl text-center font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-shadow" /></td>`;
if (content.includes(inputMatch)) {
    content = content.replace(inputMatch, `updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} onBlur={() => checkPriceChange(idx)} className="w-full bg-white border border-gray-200 p-2 rounded-xl text-center font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-shadow" /></td>`);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed Sales.tsx");
