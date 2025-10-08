import { toast } from "react-hot-toast";

export const useErrorHandler = () => {
  const handleError = (error: any) => {
    // Parse error messages from different sources
    const message = error?.response?.data?.error || 
                   error?.message || 
                   'Er is iets misgegaan. Probeer het later opnieuw.';
    
    toast.error(message);
  };

  const handleSuccess = (message: string) => {
    toast.success(message);
  };

  return { handleError, handleSuccess };
};