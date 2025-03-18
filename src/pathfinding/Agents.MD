# Como Usar Agentes

## Criando Perfis de Agente:

```javascript
// Criar perfis de agentes diferentes
const humanProfile = new AgentProfile({
  radius: 0.5,
  minPathWidth: 1.2,
  maxSlope: 45,
  allowedLayers: new Set(["ground", "stairs"]),
  stepHeight: 0.7,
});

const vehicleProfile = new AgentProfile({
  radius: 2,
  minPathWidth: 4.5,
  maxSlope: 30,
  allowedLayers: new Set(["road"]),
  stepHeight: 0.2,
});

// Registrar perfis no NavMesh
const agentManager = navMesh.createAgentManager();
agentManager.registerProfile("human", humanProfile);
agentManager.registerProfile("vehicle", vehicleProfile);
```

## Criando e Gerenciando Agentes:

```javascript
// Criar agentes com diferentes perfis
agentManager.createAgent("player1", "human", { x: 10, y: 20 });
agentManager.createAgent("car1", "vehicle", { x: 50, y: 30 });

// Atualizar caminho para um agente
agentManager.updateAgentPath("player1", { x: 200, y: 300 });

// Atualizar em tempo real (no gameloop)
function gameLoop() {
  agentManager.activeAgents.forEach((agent) => {
    if (shouldUpdatePath(agent)) {
      agentManager.updateAgentPath(agent.id, getCurrentTarget(agent));
    }
    moveAgentAlongPath(agent);
  });
}
```

## Debug Visual para Multi-Agentes:

```javascript
// Visualizar áreas acessíveis
debug.highlightAccessibleAreas(vehicleProfile);

// Visualizar caminhos de todos os agentes
debug.updateConfig({
  drawAgentPaths: true,
  agentPathColors: {
    human: "#00ff00",
    vehicle: "#ff0000",
  },
});
```

# O que é

## Este sistema permite:

- Agentes com diferentes características compartilharem o mesmo ambiente
- Restrições de movimento realistas
- Comportamentos complexos baseados em terreno
- Otimizações específicas por tipo de agente
- Debug detalhado por perfil

## Os agentes podem ser extendidos com:

- Sistemas de percepção
- Dinâmicas de movimento complexas
- Interações com o ambiente
- Comportamentos de grupo
- Adaptação dinâmica a mudanças
