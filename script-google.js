
const SPREADSHEET_ID = '1K7nQ_Vd4HHBNCd1uxTajMMHQZQ4R4gFZLA8jOlVan9Q';

// IDs das abas (gid) informados no seu código atual.
const ABA_BANNERS_ID = 0;
const ABA_NOTICIAS_ID = 385839452;

function doGet(e) {
  const tipo = String(e.parameter.tipo || '').toLowerCase();
  const callback = String(e.parameter.callback || '');

  let resultado;

  try {
    if (tipo !== 'banners' && tipo !== 'noticias') {
      resultado = {
        sucesso: false,
        erro: 'Tipo inválido. Use banners ou noticias.'
      };
    } else {
      resultado = {
        sucesso: true,
        tipo: tipo,
        dados: obterDados(tipo)
      };
    }
  } catch (erro) {
    resultado = {
      sucesso: false,
      erro: 'Não foi possível consultar a planilha.'
    };

    console.error(erro);
  }

  // JSONP permite a leitura no navegador sem depender de CORS.
  // Só aceita nomes simples de callback, nunca código arbitrário.
  if (callback) {
    if (!/^[a-zA-Z_$][0-9a-zA-Z_$.[\]]*$/.test(callback)) {
      return ContentService
        .createTextOutput('/* Callback inválido */')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(resultado) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

function obterDados(tipo) {
  const cache = CacheService.getScriptCache();
  const chave = 'dados_' + tipo;
  const guardado = cache.get(chave);

  if (guardado) {
    return JSON.parse(guardado);
  }

  const planilha = SpreadsheetApp.openById(SPREADSHEET_ID);
  const gid = tipo === 'banners' ? ABA_BANNERS_ID : ABA_NOTICIAS_ID;

  const aba = planilha.getSheets().find(
    sheet => sheet.getSheetId() === gid
  );

  if (!aba) {
    throw new Error('Aba não encontrada: ' + gid);
  }

  const valores = aba.getDataRange().getDisplayValues();

  if (valores.length < 2) {
    return [];
  }

  const linhas = valores.slice(1);

  const dados = linhas
    .filter(linha => linha.some(celula => celula.trim() !== ''))
    .map(colunas => {
      if (tipo === 'banners') {
        return {
          data: colunas[0] || '',
          titulo: colunas[1] || '',
          subtitulo: colunas[2] || '',
          botaoTexto: colunas[3] || '',
          linkDestino: colunas[4] || '',
          imagemUrl: colunas[5] || ''
        };
      }

      return {
        data: colunas[0] || '',
        categoria: colunas[1] || '',
        titulo: colunas[2] || '',
        textoCompleto: colunas[3] || '',
        linkDestino: colunas[4] || '',
        imagemUrl: colunas[5] || ''
      };
    });

  // Cache de 60 segundos para refletir alterações rapidamente.
  cache.put(chave, JSON.stringify(dados), 60);

  return dados;
}
