const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Cidades iniciais cadastradas com suas coordenadas (Latitude e Longitude)
let cidadesCadastradas = [
  { id: 1, cidade: 'Sao Paulo', lat: -23.55, lon: -46.63 },
  { id: 2, cidade: 'Rio de Janeiro', lat: -22.90, lon: -43.17 },
  { id: 3, cidade: 'Curitiba', lat: -25.42, lon: -49.27 }
];

// Função auxiliar para buscar o clima real na API Open-Meteo
async function obterClimaReal(lat, lon) {
  // CORRIGIDO: Garantido o uso do &current_weather=true correto
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  
  const resposta = await fetch(url);
  
  if (!resposta.ok) {
    throw new Error(`Erro na API externa: ${resposta.statusText}`);
  }

  const dados = await resposta.json();
  
  return {
    temperatura: dados.current_weather.temperature,
    vento: dados.current_weather.windspeed,
    codigoTempo: dados.current_weather.weathercode
  };
}

// ROTA 1: Listar todas as cidades com clima atualizado em tempo real
app.get('/clima', async (req, res) => {
  try {
    const listaComClima = await Promise.all(
      cidadesCadastradas.map(async (item) => {
        const climaReal = await obterClimaReal(item.lat, item.lon);
        return {
          id: item.id,
          cidade: item.cidade,
          temperatura: climaReal.temperatura,
          vento: climaReal.vento
        };
      })
    );
    res.json(listaComClima);
  } catch (erro) {
    console.error('Erro detalhado no servidor:', erro);
    res.status(500).json({ 
      mensagem: 'Erro ao buscar clima em tempo real',
      detalhe: erro.message 
    });
  }
});

// ROTA 2: Cadastrar uma nova cidade (POST)
app.post('/clima', (req, res) => {
  const { cidade, lat, lon } = req.body;

  if (!cidade || lat === undefined || lon === undefined) {
    return res.status(400).json({ mensagem: 'Por favor, informe cidade, latitude e longitude!' });
  }

  const novaCidade = {
    id: cidadesCadastradas.length + 1,
    cidade,
    lat: parseFloat(lat),
    lon: parseFloat(lon)
  };

  cidadesCadastradas.push(novaCidade);
  res.status(201).json(novaCidade);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});