import { useEffect } from 'react';

const BASE_TITLE = 'Buzón UNACH';

/**
 * Hook para establecer el título de la página dinámicamente
 * @param title - El título específico de la página
 * @param includeBase - Si incluir el título base (por defecto: true)
 */
export const usePageTitle = (title: string, includeBase: boolean = true) => {
  useEffect(() => {
    const previousTitle = document.title;
    // Formato: "Título - Buzón UNACH" o solo "Buzón UNACH" si no se especifica título
    document.title = includeBase ? `${BASE_TITLE} - ${title}` : title;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title, includeBase]);
};

