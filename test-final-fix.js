const { spawn } = require('child_process');

// Função para fazer requisição usando curl (que sabemos que funciona)
async function makeCurlRequest(url, headers, body) {
  return new Promise((resolve, reject) => {
    const curlArgs = [
      '-4', // Forçar IPv4
      '-X', 'POST',
      url,
      '--connect-timeout', '60',
      '--max-time', '120',
      '-H', 'Content-Type: application/json',
      '-d', body
    ];
    
    // Adicionar headers
    Object.entries(headers).forEach(([key, value]) => {
      curlArgs.push('-H', `${key}: ${value}`);
    });
    
    curlArgs.push('-w', '%{http_code}'); // Adicionar código de status
    curlArgs.push('-s'); // Silent mode
    
    console.log('Executando curl:', curlArgs.join(' '));
    
    const curl = spawn('curl', curlArgs);
    let stdout = '';
    let stderr = '';
    
    curl.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    curl.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    curl.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Curl failed with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        // O último número é o status code
        const statusMatch = stdout.match(/(\d{3})$/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 0;
        
        // Remover o status code do final
        const responseBody = stdout.replace(/(\d{3})$/, '');
        
        let data;
        try {
          data = JSON.parse(responseBody);
        } catch {
          data = responseBody;
        }
        
        resolve({
          status,
          data,
          statusText: status >= 200 && status < 300 ? 'OK' : 'Error'
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

const BFL_API_KEY = "42dbe2e7-b294-49af-89e4-3ef00d616cc5";
const BFL_BASE_URL = "https://api.bfl.ai/v1";
const endpoint = "/flux-dev";

const requestBody = {
  prompt: "A beautiful sunset over mountains",
  width: 1024,
  height: 1024,
  prompt_upsampling: false,
  seed: Math.floor(Math.random() * 1000000),
  safety_tolerance: 2,
  output_format: "jpeg",
  guidance: 3.5
};

async function testBFLConnection() {
  console.log('=== Teste de Conexão BFL API com Curl ===');
  
  const requestUrl = `${BFL_BASE_URL}${endpoint}`;
  console.log(`URL: ${requestUrl}`);
  console.log(`Request body:`, JSON.stringify(requestBody, null, 2));
  
  const headers = {
    "x-key": BFL_API_KEY,
    "accept": "application/json",
    "User-Agent": "Pixoo/1.0",
    "Connection": "close"
  };
  
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`\n--- Tentativa ${attempt}/${maxRetries} ---`);

    try {
      console.log('🚀 Iniciando requisição via curl...');
      
      const startTime = Date.now();
      const response = await makeCurlRequest(
        requestUrl,
        headers,
        JSON.stringify(requestBody)
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Resposta recebida em ${duration}ms`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status >= 200 && response.status < 300) {
        console.log('📄 Resposta:', JSON.stringify(response.data, null, 2));
        console.log('🎉 Teste bem-sucedido!');
        return;
      } else {
        console.log(`❌ Erro HTTP: ${response.status} - ${JSON.stringify(response.data)}`);
        
        if (response.status === 402) {
          console.log('💳 Créditos insuficientes na conta BFL');
          return;
        }
        
        if (response.status === 429) {
          console.log('⏱️ Limite de taxa excedido');
          if (attempt < maxRetries) {
            const waitTime = Math.min(Math.pow(2, attempt) * 2000, 10000);
            console.log(`⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        if (attempt === maxRetries) {
          throw new Error(`Falha após ${maxRetries} tentativas: ${response.statusText}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Erro na tentativa ${attempt}:`, error.message);
      
      // Se for erro de timeout ou conectividade, tenta novamente
      if (error.message.includes('timeout') ||
          error.message.includes('ConnectTimeoutError') ||
          error.message.includes('Curl failed')) {
        
        if (attempt < maxRetries) {
          const waitTime = Math.min(Math.pow(2, attempt) * 2000, 10000);
          console.log(`⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      if (attempt === maxRetries) {
        console.log(`💥 Falha final após ${maxRetries} tentativas`);
        throw error;
      }
    }
  }
}

testBFLConnection()
  .then(() => {
    console.log('\n🏁 Teste concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💀 Teste falhou:', error.message);
    process.exit(1);
  });