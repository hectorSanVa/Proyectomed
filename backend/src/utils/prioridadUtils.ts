/**
 * Utilidad para calcular la prioridad automática de una comunicación
 * basándose en análisis del contenido, tipo y categoría
 */

export type TipoComunicacion = 'Queja' | 'Sugerencia' | 'Reconocimiento';
export type Prioridad = 'Baja' | 'Media' | 'Alta' | 'Urgente';

interface CriteriosPrioridad {
  tipo: TipoComunicacion;
  descripcion: string;
  categoria?: string;
  areaInvolucrada?: string;
}

/**
 * Calcula la prioridad automática basándose en criterios profesionales
 */
export function calcularPrioridadAutomatica(criterios: CriteriosPrioridad): Prioridad {
  const { tipo, descripcion, categoria, areaInvolucrada } = criterios;
  
  // Normalizar texto para búsqueda (sin acentos, minúsculas)
  const textoCompleto = `${descripcion} ${areaInvolucrada || ''} ${categoria || ''}`.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remover acentos

  // RECONOCIMIENTOS siempre son Baja prioridad
  if (tipo === 'Reconocimiento') {
    return 'Baja';
  }

  // SUGERENCIAS generalmente son Baja o Media
  if (tipo === 'Sugerencia') {
    // Si la sugerencia menciona problemas graves, puede ser Media
    const palabrasGraves = ['problema', 'grave', 'importante', 'necesario', 'urgente'];
    const tienePalabrasGraves = palabrasGraves.some(palabra => textoCompleto.includes(palabra));
    return tienePalabrasGraves ? 'Media' : 'Baja';
  }

  // QUEJAS: Análisis más detallado
  if (tipo === 'Queja') {
    // PRIORIDAD URGENTE: Emergencias, seguridad, accidentes
    const palabrasUrgentes = [
      'emergencia', 'urgente', 'inmediato', 'inmediata', 'ahora mismo',
      'accidente', 'accidentado', 'herido', 'herida', 'sangre',
      'riesgo', 'peligro', 'peligroso', 'peligrosa',
      'incendio', 'fuego', 'humo',
      'desmayo', 'desmayado', 'inconsciente',
      'violencia', 'agresion', 'agresión', 'pelea',
      'robo', 'hurto', 'asalto',
      'amenaza', 'amenazado', 'amenazada',
      'evacuacion', 'evacuación', 'evacuar'
    ];
    
    const tieneUrgencia = palabrasUrgentes.some(palabra => textoCompleto.includes(palabra));
    if (tieneUrgencia) {
      return 'Urgente';
    }

    // PRIORIDAD ALTA: Problemas graves, daños, situaciones críticas
    const palabrasAltas = [
      'grave', 'gravisimo', 'gravísimo', 'gravisima', 'gravísima',
      'critico', 'crítico', 'critica', 'crítica',
      'daño', 'daños', 'dano', 'danos',
      'destruccion', 'destrucción', 'destruido', 'destruida',
      'roto', 'rota', 'quebrado', 'quebrada',
      'no funciona', 'no sirve', 'no trabaja',
      'imposible', 'imposible de',
      'muchos', 'muchas', 'varios', 'varias', 'todos', 'todas',
      'afecta a', 'afectando', 'afectados', 'afectadas',
      'salud', 'medico', 'médico', 'medica', 'médica', 'hospital',
      'alimento', 'comida', 'agua', 'bebida',
      'electricidad', 'luz', 'energia', 'energía',
      'gas', 'fuga', 'escape',
      'estructura', 'edificio', 'techo', 'pared', 'colapso',
      'inundacion', 'inundación', 'agua', 'lluvia',
      'seguridad', 'inseguro', 'insegura'
    ];
    
    const tieneAlta = palabrasAltas.some(palabra => textoCompleto.includes(palabra));
    if (tieneAlta) {
      return 'Alta';
    }

    // PRIORIDAD MEDIA: Problemas normales (por defecto para quejas)
    return 'Media';
  }

  // Por defecto, prioridad Media
  return 'Media';
}

/**
 * Obtiene una descripción del criterio usado para asignar la prioridad
 */
export function obtenerRazonPrioridad(criterios: CriteriosPrioridad): string {
  const prioridad = calcularPrioridadAutomatica(criterios);
  const { tipo } = criterios;

  if (tipo === 'Reconocimiento') {
    return 'Reconocimientos tienen prioridad baja por defecto';
  }

  if (tipo === 'Sugerencia') {
    return prioridad === 'Media' 
      ? 'Sugerencia con términos que indican importancia'
      : 'Sugerencia estándar';
  }

  if (tipo === 'Queja') {
    switch (prioridad) {
      case 'Urgente':
        return 'Queja con términos de emergencia, seguridad o accidentes';
      case 'Alta':
        return 'Queja con términos que indican problemas graves o críticos';
      case 'Media':
        return 'Queja estándar';
      default:
        return 'Prioridad asignada automáticamente';
    }
  }

  return 'Prioridad asignada automáticamente';
}



