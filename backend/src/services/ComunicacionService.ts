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
      usuario?: {
        nombre?: string;
        telefono?: string;
        semestre_area?: string;
        tipo_usuario?: 'Estudiante' | 'Docente' | 'Administrativo' | 'Servicios Generales';
        sexo?: 'Mujer' | 'Hombre' | 'Prefiero no responder';
        confidencial?: boolean;
        autorizo_contacto?: boolean;
      };
      propuesta_mejora?: string; // Para quejas y sugerencias
    }
  ): Promise<Comunicacion> {
    if (!com.descripcion) {
      throw new Error("La descripción es obligatoria");
    }
    
    let idUsuario: number | null = null;
    let propuestaMejoraTexto = '';
    
    // Si se proporcionó un correo y NO es anónimo, crear/obtener y actualizar usuario con datos completos
    if (com.correo && !com.anonimo) {
      try {
        console.log(`📝 Procesando usuario: correo=${com.correo}, anonimo=${com.anonimo}, tiene datos usuario=${!!com.usuario}`);
        
        // Crear/obtener usuario primero
        let usuario = await UsuarioService.createOrGetByCorreo(com.correo);
        idUsuario = usuario.id_usuario!;
        console.log(`✅ Usuario obtenido/creado: ID=${idUsuario}, correo=${usuario.correo}, confidencial=${usuario.confidencial}, autorizo_contacto=${usuario.autorizo_contacto}`);
        
        // CRÍTICO: Si NO es anónimo y hay correo, el usuario DEBE tener confidencial=false
        // Esto es porque si llegamos aquí, significa que el usuario NO marcó confidencial
        // Por lo tanto, SIEMPRE debemos actualizar confidencial a false si no es anónimo
        const debeActualizarConfidencial = !com.anonimo && com.correo;
        
        // Si se proporcionaron datos completos del usuario O si no es anónimo, actualizar el usuario
        // IMPORTANTE: Si autoriza contacto, confidencial DEBE ser false
        if (com.usuario || debeActualizarConfidencial) {
          try {
            // Preparar datos de actualización - PRIORIZAR datos del formulario sobre datos existentes
            const datosActualizacion: Partial<Usuario> = {};
            
            // Solo actualizar campos que vienen del formulario (no undefined)
            if (com.usuario) {
              if (com.usuario.nombre !== undefined) datosActualizacion.nombre = com.usuario.nombre || '';
              if (com.usuario.telefono !== undefined) datosActualizacion.telefono = com.usuario.telefono || '';
              if (com.usuario.semestre_area !== undefined) datosActualizacion.semestre_area = com.usuario.semestre_area || '';
              if (com.usuario.tipo_usuario !== undefined) datosActualizacion.tipo_usuario = com.usuario.tipo_usuario;
              if (com.usuario.sexo !== undefined) datosActualizacion.sexo = com.usuario.sexo;
            }
            
            // CRÍTICO: Si el usuario autoriza contacto, confidencial DEBE ser false
            // Si el usuario marca confidencial, autorizo_contacto DEBE ser false
            // Lógica simplificada: usar los valores del formulario directamente
            // IMPORTANTE: Los valores del formulario tienen prioridad absoluta
            
            // PRIORIDAD 1: Si NO es anónimo, confidencial DEBE ser false (SIEMPRE)
            // Si llegamos aquí con correo y no es anónimo, significa que el usuario NO marcó confidencial
            if (!com.anonimo) {
              datosActualizacion.confidencial = false; // FORZAR a false si NO es anónimo
              console.log('✅ Comunicación NO es anónima → confidencial FORZADO a false');
              
              // Si el usuario explícitamente autoriza contacto, establecerlo a true
              if (com.usuario?.autorizo_contacto === true) {
                datosActualizacion.autorizo_contacto = true;
                console.log('✅ Usuario autoriza contacto explícitamente → autorizo_contacto establecido a true');
              } else if (com.usuario?.autorizo_contacto === false) {
                datosActualizacion.autorizo_contacto = false;
                console.log('✅ Usuario NO autoriza contacto explícitamente → autorizo_contacto establecido a false');
              } else {
                // Si no se especifica, pero confidencial es false, asumir que autoriza contacto
                datosActualizacion.autorizo_contacto = true;
                console.log('✅ Autorizo_contacto no especificado pero confidencial=false → autorizo_contacto establecido a true por defecto');
              }
            }
            // PRIORIDAD 2: Si marca confidencial explícitamente (aunque no debería llegar aquí si anonimo=true)
            else if (com.usuario?.confidencial === true) {
              datosActualizacion.confidencial = true;
              datosActualizacion.autorizo_contacto = false; // FORZAR a false si es confidencial
              console.log('✅ Usuario marca confidencial explícitamente → autorizo_contacto FORZADO a false');
            }
            
            // Validación final de consistencia: confidencial y autorizo_contacto no pueden ser ambos true
            if (datosActualizacion.confidencial === true && datosActualizacion.autorizo_contacto === true) {
              console.warn('⚠️ Inconsistencia detectada: confidencial y autorizo_contacto son ambos true. Corrigiendo...');
              datosActualizacion.confidencial = false;
              console.log('✅ Inconsistencia corregida: confidencial establecido a false');
            }
            
            console.log(`🔄 Actualizando usuario con datos:`, JSON.stringify(datosActualizacion, null, 2));
            console.log(`📝 Usuario ANTES de actualizar: confidencial=${usuario.confidencial}, autorizo_contacto=${usuario.autorizo_contacto}`);
            
            if (Object.keys(datosActualizacion).length === 0) {
              console.warn('⚠️ No hay datos para actualizar, pero debería haber al menos confidencial y autorizo_contacto');
              // Forzar actualización de confidencial y autorizo_contacto si no es anónimo
              if (!com.anonimo) {
                datosActualizacion.confidencial = false;
                datosActualizacion.autorizo_contacto = com.usuario?.autorizo_contacto !== false;
                console.log('🔧 Forzando actualización de confidencial y autorizo_contacto');
              }
            }
            
            usuario = await UsuarioService.update(usuario.id_usuario!, datosActualizacion);
            console.log(`✅ Usuario actualizado exitosamente: ID=${usuario.id_usuario}`);
            console.log(`📊 Usuario DESPUÉS de actualizar: confidencial=${usuario.confidencial}, autorizo_contacto=${usuario.autorizo_contacto}, nombre=${usuario.nombre}`);
            
            // Verificar que la actualización fue exitosa
            if (usuario.confidencial === true && !com.anonimo) {
              console.error('❌ ERROR: Usuario sigue teniendo confidencial=true después de actualizar. Esto no debería pasar.');
              console.error('❌ Intentando actualización forzada...');
              try {
                usuario = await UsuarioService.update(usuario.id_usuario!, {
                  confidencial: false,
                  autorizo_contacto: true
                });
                console.log('✅ Actualización forzada exitosa');
              } catch (forceError: any) {
                console.error('❌ Error en actualización forzada:', forceError.message);
              }
            }
          } catch (updateError: any) {
            console.error(`❌ Error al actualizar datos del usuario:`, updateError.message);
            console.error(`❌ Stack:`, updateError.stack);
            // Continuar aunque falle la actualización - el usuario ya existe
          }
        } else {
          // Si no se proporcionaron datos del usuario pero NO es anónimo y hay correo,
          // significa que el usuario ya existe y solo necesitamos asociarlo
          console.log(`ℹ️ No se proporcionaron datos adicionales del usuario, usando usuario existente`);
          // Asegurar que si no es anónimo, confidencial sea false
          if (usuario.confidencial) {
            console.log(`⚠️ Usuario existente tiene confidencial=true pero la comunicación NO es anónima. Actualizando...`);
            try {
              usuario = await UsuarioService.update(usuario.id_usuario!, {
                confidencial: false,
                autorizo_contacto: true
              });
              console.log(`✅ Usuario actualizado: confidencial=false, autorizo_contacto=true`);
            } catch (updateError: any) {
              console.warn(`⚠️ No se pudo actualizar confidencial del usuario existente:`, updateError.message);
            }
          }
        }
        
        console.log(`✅ Usuario listo para seguimiento: ${com.correo} (ID: ${idUsuario})`);
      } catch (error: any) {
        console.error(`❌ Error al crear/obtener usuario para seguimiento:`, error.message);
        console.error(`❌ Stack:`, error.stack);
        // Si falla, continuamos con comunicación anónima
        idUsuario = null;
      }
    } else {
      console.log(`ℹ️ Comunicación anónima: correo=${com.correo || 'N/A'}, anonimo=${com.anonimo}`);
    }
    
    // Preparar texto de propuesta de mejora si existe
    if (com.propuesta_mejora && com.propuesta_mejora.trim()) {
      propuestaMejoraTexto = `\n\nPropuesta de mejora:\n${com.propuesta_mejora}`;
    }
    
    // Crear la comunicación con el id_usuario (puede ser null para anonimato)
    // Remover campos que no van en la tabla comunicaciones
    const { correo, anonimo, usuario, propuesta_mejora, ...comunicacionData } = com;
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
        
        // Crear notas del seguimiento incluyendo propuesta de mejora si existe
        let notasSeguimiento = `Comunicación recibida. Prioridad ${prioridad} asignada automáticamente según análisis del contenido.`;
        if (propuestaMejoraTexto) {
          notasSeguimiento += propuestaMejoraTexto;
        }
        
        // Crear seguimiento inicial con prioridad automática
        await SeguimientoService.create({
          id_comunicacion: comunicacion.id_comunicacion!,
          id_estado: estadoPendiente.id_estado!,
          id_miembro: null,
          responsable: null,
          fecha_resolucion: null,
          notas: notasSeguimiento,
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
