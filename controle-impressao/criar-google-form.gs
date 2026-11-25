/**
 * Cria o Google Forms "Controle de Impressão e Boulevard" + planilha de respostas.
 * Como usar: abra https://script.google.com > Novo projeto > cole este código >
 * clique em Executar (função criarFormulario) > autorize > veja os links em "Registro de execução".
 */

// Preencha com os ministérios para virar uma lista de opções.
// Se deixar vazio [], o campo vira texto livre.
const MINISTERIOS = [
  // 'Louvor', 'Infantil', 'Jovens', 'Mídia', 'Recepção',
];

function criarFormulario() {
  const form = FormApp.create('Controle de Impressão e Boulevard')
    .setDescription('Registre cada solicitação de impressão.')
    .setCollectEmail(false);

  form.addDateItem().setTitle('Data').setRequired(true);
  form.addTextItem().setTitle('Nome do solicitante').setRequired(true);

  if (MINISTERIOS.length) {
    form.addListItem().setTitle('Ministério').setChoiceValues(MINISTERIOS).setRequired(true);
  } else {
    form.addTextItem().setTitle('Ministério').setRequired(true);
  }

  form.addMultipleChoiceItem().setTitle('Serviço')
    .setChoiceValues(['Impressão', 'Boulevard', 'Cópia / Xerox', 'Digitalização'])
    .showOtherOption(true).setRequired(true);

  form.addMultipleChoiceItem().setTitle('Tipo de impressão')
    .setChoiceValues(['Preto e branco', 'Colorida']).setRequired(true);

  form.addListItem().setTitle('Tamanho do papel')
    .setChoiceValues(['A4', 'A3', 'A5', 'Ofício', 'Carta', 'Outro']).setRequired(true);

  form.addMultipleChoiceItem().setTitle('Frente / verso')
    .setChoiceValues(['Só frente', 'Frente e verso']).setRequired(true);

  const numero = FormApp.createTextValidation()
    .setHelpText('Informe um número maior ou igual a 1.')
    .requireNumberGreaterThanOrEqualTo(1).build();
  form.addTextItem().setTitle('Quantidade de páginas do documento')
    .setValidation(numero).setRequired(true);
  form.addTextItem().setTitle('Quantidade de cópias')
    .setValidation(numero).setRequired(true);

  form.addTextItem().setTitle('Documento / finalidade');
  form.addTextItem().setTitle('Responsável pela impressão');
  form.addParagraphTextItem().setTitle('Observações');

  const planilha = SpreadsheetApp.create('Controle de Impressão (respostas)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilha.getId());

  Logger.log('Link para responder: ' + form.getPublishedUrl());
  Logger.log('Editar formulário:   ' + form.getEditUrl());
  Logger.log('Planilha de respostas: ' + planilha.getUrl());
}
