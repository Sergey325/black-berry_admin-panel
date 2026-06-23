export const calculateTotalPrice = (price: number, quantity: number, discount: number): number => Math.round((price-price/100*discount) * quantity * 100) / 100

export const calculatePriceWithDiscount = (price: number, discount: number): number => Math.round((price-price/100*discount) * 100) / 100