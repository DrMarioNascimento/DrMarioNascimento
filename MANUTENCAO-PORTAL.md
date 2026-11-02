# Manutenção técnica do portal

[Voltar ao perfil](README.md) · [Inventário de acesso](DISPONIBILIDADE.md) · [Regras para agentes](AGENTS.md)

## Manutenção do portal

A página inicial apresenta o autor e três frentes — Fisiologia, Ética e formação em pesquisa, Dragon Games — antes do convite à Célula Viva em RA. O catálogo público usa capas e descrições da experiência; os requisitos de Google e convite permanecem identificados. A biografia completa aparece depois das experiências, seguida dos jogos em desenvolvimento e dos caminhos para parcerias. A apresentação profissional combina docência universitária, design e desenvolvimento de tecnologias educacionais e jogos digitais, com uma síntese na abertura e a descrição do processo assistido por IA em Quem sou. As versões em português e inglês mantêm o mesmo sentido.

`portal.css` e `portal.js` cuidam da apresentação, menu móvel e filtros progressivos. As atividades ficam em HTML e continuam acessíveis sem JavaScript. O universo 3D é opcional: sem WebGL2, durante o carregamento ou após perda de contexto, os quatro sistemas e seus planetas continuam navegáveis em uma versão leve. No celular, há atalhos diretos, tolerância maior para toques, ajuste de câmera após rotação e menor custo de renderização. O canvas deixa de renderizar quando fica fora da área inicial da página.

As novas ilustrações estão documentadas em [assets/cards/README.md](assets/cards/README.md). Ao revisar a página, conferir PT/EN, navegação por teclado, filtros e links para cards ocultos, menu em 360–760 px, modo `?lite=1`, rotação do celular e os controles do universo. A câmera e a RA precisam de validação em aparelhos compatíveis; uma prévia no navegador não substitui esse teste.

`index.html` e `universo-hero.html` usam a mesma fonte, `universo-dados.js`. A disponibilidade está documentada em `disponibilidade.json` e `DISPONIBILIDADE.md`; os acessos principais também ficam em HTML para funcionar sem JavaScript. Ao alterar o acesso de um projeto, atualize essas apresentações juntas.

A seção Novidades consulta commits e tem histórico salvo como alternativa. Datas de commits indicam atividade do repositório, não aprovação de todos os fluxos. A conferência desta revisão inspecionou rotas e controles implementados; não repetiu login Google real nem sessões entre dispositivos.

## Autoria e condições de uso

Dragon/MOSAICO e Mosaico Card preservam a autoria conjunta de **Mário César Nascimento e Osana Melo Nascimento**. Componentes de terceiros conservam seus créditos e licenças. O acesso público aos materiais educacionais não equivale a licença aberta de reutilização. Consulte [LICENSE.md](LICENSE.md) e as condições específicas de cada projeto, inclusive as permissões próprias do Eita! para uso pelos endereços oficiais.

Os recursos de saúde são educacionais e não substituem diagnóstico, prescrição ou orientação clínica individual.

**English:** Physiology, Ethical Cases 1 and 2, both Trolley Problem versions and the Research Labs are publicly available. Physiology Escape/Pathways are public without Google sign-in. Eita! is in open testing. Teacher-only activities and invitation-based rooms retain their access controls. See the availability inventory and each project's license.

**Prof. Mário César Nascimento, PhD ©**

### Resiliência do universo de planetas

O motor Three.js 0.184.0 é servido pelo próprio portal em `assets/vendor/three/`, com a licença MIT preservada. A cena mantém o giro, o zoom e a seleção originais. Não é criado um segundo contexto WebGL apenas para testar compatibilidade.

`universo-leve.js` oferece quatro planetas navegáveis com o mesmo catálogo enquanto o 3D carrega ou quando WebGL falha. Ao iniciar a cena, a navegação leve é ocultada automaticamente. `?lite` permite verificar esse caminho sem depender de uma falha de hardware. Os links de projetos e atividades vêm exclusivamente de `universo-dados.js`.

Todos os astros menores da navegação leve são botões com área de toque de 44 px. Na cena 3D, o disco de um planeta ou lua tem prioridade sobre as partículas de atividades; áreas de toque ampliadas usam proximidade na tela.

Saída do universo: botão Voltar ao início, Esc, links de seção do cabeçalho (inclusive Início) ou rolagem fora do painel. Na versão leve, deslizar verticalmente no celular também sai. A rolagem dentro dos detalhes continua normal; no 3D, arrastar e pinçar mantêm seus controles originais.

### Verificação de regressão do universo

Os controles essenciais ficam no bloco `#universe-controls` do HTML, antes dos recursos opcionais. Início encerra diretamente a exploração, fecha detalhes, solta o arraste e retorna ao topo mesmo se o estado visual estiver inconsistente. A versão leve aceita cliques também na apresentação e anima as órbitas quando a preferência por movimento reduzido não está ativa. Os dois renderizadores retomam o ciclo ao voltar à aba; o 3D também trata a restauração do contexto gráfico.

Para repetir os testes: `cd tests && npm install && npm test`. A suíte cobre entradas/saídas repetidas, todos os planetas leves, cliques na apresentação, movimento, suspensão/retomada, perda/restauração de contexto e saída por Início/Esc/rolagem. A cena Three.js é executada com um renderer simulado; a suíte verifica estado, posições e agendamento, não a renderização GPU. A conferência visual continua necessária em navegador com WebGL.

O buffer do 3D limita-se a 3 milhões de pixels no computador e 1,5 milhão em dispositivos de toque, recalculados no redimensionamento, para conter o uso de memória gráfica em telas grandes.
