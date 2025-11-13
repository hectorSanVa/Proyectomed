import { Comunicacion } from "../models/Comunicacion";
import { ComunicacionDAO } from "../dao/ComunicacionDAO";
import { UsuarioService } from "./UsuarioService";
import { SeguimientoService } from "./SeguimientoService";
import { EstadoService } from "./EstadoService";
import { calcularPrioridadAutomatica } from "../utils/prioridadUtils";
import { CategoriaService } from "./CategoriaService";

export class ComunicacionService {
  static async getAll(): Promise<Comunicacion[]> {
    return await ComunicacionDAO.getAll();
  }

  static async getById(id: number): Promise<Comunicacion | null> {
    return await ComunicacionDAO.getById(id);
  }

  static async getByUsuarioId(idUsuario: number): Promise<Comunicacion[]> {
    return await ComunicacionDAO.getByUsuarioId(idUsuario);
  }

  static async getByFolio(folio: string): Promise<Comunicacion | null> {
    return await ComunicacionDAO.getByFolio(folio);
  }

  static async create(
    com: Omit<Comunicacion, "id_comunicacion" | "folio" | "fecha_recepcion"> & { 
      medio?: 'F' | 'D'; 
      correo?: string;
      anonimo?: boolean; // Si es true, no se crea/usuario (id_usuario = null)
    }
  ): Promise<Comunicacion> {
    if (!com.descripcion) {
      throw new Error("La descripción es obligatoria");
    }
    
    let idUsuario: number | null = null;
    
    // Si se proporcionó un correo y NO es anónimo, crear/obtener usuario para seguimiento
    if (com.correo && !com.anonimo) {
      try {
        const usuario = await UsuarioService.createOrGetByCorreo(com.correo);
        idUsuario = usuario.id_usuario!;
        console.log(`✅ Usuario creado/obtenido para seguimiento: ${com.correo} (ID: ${idUsuario})`);
      } catch (error: any) {
        console.warn(`⚠️ Error al crear/obtener usuario para seguimiento:`, error.message);
        // Si falla, continuamos con comunicación anónima
        idUsuario = null;
      }
    } else {
      console.log(`ℹ️ Comunicación anónima: correo=${com.correo || 'N/A'}, anonimo=${com.anonimo}`);
    }
    
    // Crear la comunicación con el id_usuario (puede ser null para anonimato)
    // Remover campos que no van en la tabla comunicaciones
    const { correo, anonimo, ...comunicacionData } = com;
    const dataParaBD = {
      ...comunicacionData,
      id_usuario: idUsuario
    };
    
    console.log(`📤 Enviando datos a DAO: id_usuario=${dataParaBD.id_usuario}, tipo=${dataParaBD.tipo}`);
    const comunicacion = await ComunicacionDAO.create(dataParaBD);
    console.log(`✅ Comunicación creada exitosamente: Folio=${comunicacion.folio}, id_usuario=${comunicacion.id_usuario}`);
    
    // Crear seguimiento inicial automáticamente con prioridad calculada
    try {
      // Obtener el estado "Pendiente"
      const estados = await EstadoService.getAll();
      const estadoPendiente = estados.find(e => e.nombre_estado.toLowerCase() === 'pendiente');
      
      if (estadoPendiente) {
        // Obtener información de la categoría para el análisis
        let nombreCategoria = '';
        try {
          const categorias = await CategoriaService.getAll();
          const categoria = categorias.find(c => c.id_categoria === comunicacion.id_categoria);
          nombreCategoria = categoria?.nombre_categoria || '';
        } catch (err) {
          console.warn('⚠️ No se pudo obtener la categoría para cálculo de prioridad:', err);
        }
        
        // Calcular prioridad automática
        const prioridad = calcularPrioridadAutomatica({
          tipo: comunicacion.tipo as 'Queja' | 'Sugerencia' | 'Reconocimiento',
          descripcion: comunicacion.descripcion,
          categoria: nombreCategoria,
          areaInvolucrada: comunicacion.area_involucrada || undefined
        });
        
        console.log(`📊 Prioridad automática calculada: ${prioridad} para comunicación ${comunicacion.folio}`);
        
        // Crear seguimiento inicial con prioridad automática
        await SeguimientoService.create({
          id_comunicacion: comunicacion.id_comunicacion!,
          id_estado: estadoPendiente.id_estado!,
          id_miembro: null,
          responsable: null,
          fecha_resolucion: null,
          notas: `Comunicación recibida. Prioridad ${prioridad} asignada automáticamente según análisis del contenido.`,
          prioridad: prioridad
        });
        
        console.log(`✅ Seguimiento inicial creado con prioridad ${prioridad}`);
      } else {
        console.warn('⚠️ No se encontró el estado "Pendiente", no se creó seguimiento automático');
      }
    } catch (error: any) {
      // No fallar la creación de la comunicación si falla el seguimiento
      console.error('❌ Error al crear seguimiento automático:', error.message);
      console.log('ℹ️ La comunicación se creó exitosamente, pero el seguimiento deberá crearse manualmente');
    }
    
    return comunicacion;
  }

  static async update(
    id: number,
    com: Partial<Comunicacion>
  ): Promise<Comunicacion | null> {
    return await ComunicacionDAO.update(id, com);
  }

  static async delete(id: number): Promise<boolean> {
    return await ComunicacionDAO.delete(id);
  }

  static async getReconocimientosPublicos(): Promise<Comunicacion[]> {
    return await ComunicacionDAO.getReconocimientosPublicos();
  }
}
