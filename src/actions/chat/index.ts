/**
 * Barrel: reexporta acciones del módulo chat.
 */
export {
  puedeAccederChatAvistamiento,
  puedeAccederPanelCoordinacionMascota,
} from "@/actions/chat/acceso";

export {
  obtenerChatPrivadoAvistamiento,
  listarMensajesChatAvistamiento,
  sincronizarResumenChatsMascota,
  marcarChatLeido,
  type ResumenChatAvistamiento,
} from "@/actions/chat/conversacion";

export {
  listarConversaciones,
  contarChatsNoLeidos,
  type ConversacionHub,
} from "@/actions/chat/hub";
