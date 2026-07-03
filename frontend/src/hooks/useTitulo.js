import { useEffect } from 'react';

export default function useTitulo(titulo) {
  useEffect(() => {
    document.title = `${titulo} | DORO`;

    return () => {
      document.title = "AURA";
    };
  }, [titulo]);
}