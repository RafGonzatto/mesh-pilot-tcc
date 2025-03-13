Como funciona?

- Criação de polígonos: No trecho createPolygons(), definimos vários polígonos (regiões navegáveis e obstáculos).
- Geração do NavMesh: Em createNavMesh(), criamos uma instância de NavMesh, adicionamos os polígonos e chamamos buildGraph(). Isso converte cada polígono em um nó do grafo e faz o “link” entre polígonos considerados adjacentes (critério simplificado, mas funcional para nosso exemplo).
- AStar: Instanciamos pathfinder = new AStar(). Para encontrar o caminho, chamamos pathfinder.findPath(agentPosition, targetPos, navMesh.graph). Isso retorna uma lista de waypoints (cada waypoint é o “centro” de um polígono que faz parte do caminho no grafo).
- Movimentação do agente: No gameLoop, chamamos updateAgent(deltaTime), que faz o agente se mover em direção ao próximo waypoint (com uma velocidade de 100 pixels/s). Quando atinge um waypoint, passa para o próximo até chegar ao fim do caminho.
- Desenho:
  - drawPolygons() pinta cada polígono,
  - drawPath() exibe a rota encontrada em azul,
  - drawAgent() desenha um círculo vermelho representando o NPC/Agente.
- Interatividade: O botão “Encontrar Novo Caminho” (#btn-reroute) gera um destino aleatório em outro polígono e chama findNewPath(), recalculando a rota pelo A\*.
