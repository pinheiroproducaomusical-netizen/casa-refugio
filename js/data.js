/* Desafios: objeto sumido + esconderijo + 3 dicas (da mais vaga para a mais clara).
   Temas: 🎵 música · 🩺 enfermagem · 🐦 aves brasileiras · 💡 conhecimentos gerais */
var CHALLENGES = [
  { item: 'papel', spot: 'forno', hints: [
    '🐦 O joão-de-barro também é chamado de forneiro: a casinha dele parece com o esconderijo.',
    '🩺 Na higiene das mãos ele serve para secar... mas aqui ele ia pegar fogo a 180 °C!',
    '💡 É onde se assa o pão de queijo.' ] },
  { item: 'tv', spot: 'banheira', hints: [
    '🎵 "Água de beber, camará..." — Tom Jobim e Vinicius.',
    '🩺 Hidroterapia: água morna e bolhas relaxam a musculatura.',
    '💡 Fica num deque de madeira, perto da porta de entrada.' ] },
  { item: 'cd', spot: 'adega', hints: [
    '🎵 Disco bom é como vinho: melhora com o tempo.',
    '🐦 Como ovos no ninho, as garrafas dormem deitadas em casinhas de barro.',
    '💡 Debaixo da escada, nos favos de terracota.' ] },
  { item: 'quest', spot: 'sofa', hints: [
    '🐦 O urutau passa o dia imóvel e camuflado... onde a família descansa.',
    '🎵 "Deixa a vida me levar..." — Zeca Pagodinho, de preferência deitado.',
    '💡 Embaixo de onde a gente se joga para ver TV.' ] },
  { item: 'chaleira', spot: 'geladeira', hints: [
    '🩺 Rede de frio: vacinas ficam guardadas entre +2 °C e +8 °C.',
    '🐦 O pinguim-de-magalhães às vezes aparece no litoral sul do Brasil. Ele ia adorar esse lugar.',
    '💡 A água quente foi parar no lugar mais gelado da cozinha.' ] },
  { item: 'quadro', spot: 'banheiro', hints: [
    '🩺 No hospital, banho de chuveiro se chama banho de aspersão.',
    '🎵 "Singin\' in the Rain" — cantando debaixo d\'água.',
    '💡 Atrás da porta de madeira, ao lado da escada.' ] },
  { item: 'chapeu', spot: 'lareira', hints: [
    '🐦 O tiê-sangue é vermelho vivo, da cor das chamas.',
    '🎵 "Fogo e Paixão" — Wando.',
    '💡 Onde a lenha queima no inverno, do lado da TV.' ] },
  { item: 'ventilador', spot: 'cristaleira', hints: [
    '🎵 "Libiamo ne\' lieti calici" — o brinde de La Traviata, de Verdi.',
    '🩺 Material frágil: manusear com cuidado. Vidro!',
    '💡 Atrás da porta de vidro, junto com as taças.' ] },
  { item: 'vinho', spot: 'lavanderia', hints: [
    '🐦 A lavadeira-mascarada é um passarinho branco e preto: o nome dela entrega o cômodo.',
    '🩺 Roupa de cama usada vai para a rouparia... aqui em casa ela tem outro nome.',
    '💡 Tem aquecedor Rinnai e tanquinho — a porta fica ao lado da geladeira.' ] },
  { item: 'lanterna', spot: 'pia', hints: [
    '🐦 O martim-pescador vive perto da água... aqui tem água, mas não tem peixe.',
    '🎵 "É pau, é pedra, é o fim do caminho..." — Águas de Março.',
    '🩺 Lavagem das mãos com água e sabão: de 40 a 60 segundos.' ] },
  { item: 'controle', spot: 'tapete', hints: [
    '🐦 A única ave deste esconderijo é uma corujinha estampada.',
    '🎵 "Baby shark, doo doo doo..." toca bastante por aqui.',
    '💡 O cantinho colorido do João e da Aria, perto do vidro.' ] },
  { item: 'escultura', spot: 'mesa', hints: [
    '🐦 A rolinha cata migalhas... debaixo de onde a gente come.',
    '🩺 Para examinar, às vezes é preciso se abaixar bastante.',
    '💡 Sob a mesa redonda, entre as cadeiras.' ] },
  { item: 'tigela', spot: 'cooler', hints: [
    '🐦 O cardeal tem um topete vermelho, da cor do esconderijo.',
    '🩺 Hidratação é importante — de preferência geladinha.',
    '💡 Um mini refrigerador vermelho da Consul, ao lado do quadro do vinho.' ] }
];
