/**
 * Formatea una fecha de timestamp a string
 */
export const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return 'Fecha desconocida';
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  /**
   * Formatea un balance de token según sus decimales
   */
  export const formatTokenAmount = (amount: string, decimals: number): string => {
    return (parseInt(amount) / Math.pow(10, decimals)).toFixed(
      decimals > 4 ? 4 : decimals
    );
  };
  
  /**
   * Acorta una dirección para mostrar
   */
  export const shortenAddress = (address: string, chars = 4): string => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };