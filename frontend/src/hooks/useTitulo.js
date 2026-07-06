import { useEffect } from 'react';

export default function useTitulo(titulo) {
  useEffect(() => {
    document.title = `${titulo} | D'ORO`;

    return () => {
      document.title = "D'ORO";
    };
  }, [titulo]);
}