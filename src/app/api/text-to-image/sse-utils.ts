// Store para conexões SSE ativas
const activeConnections = new Map<string, ReadableStreamDefaultController>();

// Função para notificar clientes sobre atualizações
export function notifyTaskUpdate(taskId: string, data: any) {
  const controller = activeConnections.get(taskId);
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      
      // Se a tarefa estiver completa, fechar a conexão
      if (data.status === 'Ready' || data.status === 'Error' || data.status === 'Content Moderated') {
        activeConnections.delete(taskId);
        controller.close();
      }
    } catch (error) {
      console.error('Erro ao enviar SSE:', error);
      activeConnections.delete(taskId);
    }
  }
}

export { activeConnections };