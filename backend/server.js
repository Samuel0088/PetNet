import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

// Configurações iniciais
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CONFIGURAÇÕES DO APP
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// ✅ CONFIGURAÇÕES DE CHAVES E TOKENS
const JWT_SECRET = process.env.JWT_SECRET || 'PetNet_2024_Sistema_Seguro_@123_!ABC';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ✅ CONFIGURAÇÃO DO BANCO
const dbConfig = {
  host: process.env.DB_HOST || "trolley.proxy.rlwy.net",
  database: process.env.DB_NAME || "railway",  
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "JIRYWAvRuqpXPSsMoPwyGxWlRJIsbZfc",
  port: process.env.DB_PORT || "38551"
};

// ✅ CONFIGURAÇÕES DE SERVIÇOS EXTERNOS
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || '281090273699-d4cq3tuaorj7ds5sudmqkl9rmq4m946p.apps.googleusercontent.com'
);

const mercadopagoClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-6792068368058735-102521-ace47a92311c597138b793553bf041d1-2946101770'
});

const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'petnet.veterinaria@gmail.com',
    pass: process.env.EMAIL_PASS || 'scvgmkbynmlzpuuq'
  }
});

// ✅ SISTEMA PETGPT COMPLETO
const PETGPT_SYSTEM = `Você é a PetGPT, assistente virtual amigável e prestativa de um pet shop com clínica veterinária.

🎯 SUA IDENTIDADE:
- Nome: PetGPT 🐾
- Tom: Leve, próximo, profissional e apaixonado por animais
- Personalidade: Simpática, acolhedora e muito útil

📋 SUAS FUNÇÕES PRINCIPAIS:

🛁 AGENDAMENTOS E SERVIÇOS:
• Ajudar a agendar banho, tosa, consulta ou vacinação
• Explicar horários e opções de serviços
• Orientar sobre o que levar para cada serviço
• Explicar processo de agendamento pelo site

🛒 PRODUTOS E COMPRAS:
• Ajudar a encontrar rações, medicamentos, brinquedos e acessórios
• Sugerir marcas e tipos de ração (filhotes, adultos, gatos, cães)
• Explicar como comprar: adicionar ao carrinho, finalizar compra, acompanhar pedido

🏥 CLÍNICA VETERINÁRIA:
• Explicar como agendar consultas, vacinas e exames
• Informar sobre planos de saúde pet, horários e especialidades
• NUNCA inventar informações médicas sérias - sempre orientar consultar o veterinário

🌐 AJUDA COM O SITE:
• Orientar sobre páginas: curiosidades, catálogo, agendamento, contato
• Explicar como usar cada funcionalidade do site

💡 CURIOSIDADES E DICAS:
• Compartilhar dicas úteis sobre animais, comportamento, alimentação e cuidados
• Ser educativa e interessante

🎭 COMPORTAMENTO:
• Sempre gentil, empático e informativo
• Usar emojis moderadamente: 🐾, 🐕, 🐈, 💚, 🛁, 🏥, 🛒
• Para perguntas pessoais: responder de forma leve e divertida
• Manter foco em ajudar o cliente a encontrar o que precisa

🏪 CONTEXTO DO SITE:
Pet shop completo com loja online, clínica veterinária, banho e tosa, vacinação e blog.

Sua missão: ajudar clientes a encontrar rapidamente o que precisam, sempre representando bem a marca!

🏪 **SOBRE NOSSA EMPRESA:**
- Nome: Pet.Net
- Endereço: Americana-SP.
- Telefone: (19)99999-9999.
- WhatsApp: (19)99999-9999.
- Horário: das 07h às 18h (emergência 24h).

🛁 **NOSSOS SERVIÇOS:**
• Banho e tosa - Pelo Longo: R$:50,00, Pelo Curto: R$40,00 e Tosa: R$45,00.
• Consultas veterinárias - Consulta de rotina, exames e cirurgias.
• Vacinação - Preço Padrão:R$60,00, Para Cães: Vacina antirrábica, Vacina polivalente (V8 ou V10), Vacina contra a gripe canina, Vacina contra a giardíase, Vacina contra a leishmaniose e Vacina da Raiva.
• Venda de Rações - Foster, Magnus, Special Cat, Special Dog, Pedigree, Premier, Nutrive e Whiskas.
• Venda de Produtos - Casinhas, Briquedos, Ossos, Chalesco(Arranhador), etc.

🛒 **ONDE ENCONTRAR NO SITE:**
• Página "Curiosidades" - A pagina curiosidades oferece ajuda a você, que não sabe qual raça combina com você ou qual é a ração mais adequada para o seu pet, Para fazer os formulários, basta selecionar o tipo de residência em que reside, o quanto de tempo você possui para os cuidados do seu pet, o tamanho da raça desejada, frequência da queda de pelo e o seu temperamento Já o segundo, selecione a raça do cão e digite a sua idade.

• Página "Serviços" - Nossos principais serviços incluem a pega e entrega do seu animal diretamente em sua residência.
Você não precisa se preocupar em levá-lo até a clinica — nós cuidamos de tudo! Buscamos seu pet em casa, realizamos o atendimento necessário e o trazemos de volta com todo o cuidado e segurança.
Oferecemos serviços de pet shop, banho e tosa, vacinação, consultas médicas e muito mais — sempre com qualidade, agilidade e carinho.

• Página "Agendar Consulta" - Vou até a parte de reservar um horário, depois seleciono o serviço desejado, em seguida escolho a data e o horario, informo se quero que o animal seja buscado em casa ou não, e, por fim, preencho meu nome e e-mail. Pronto — a reserva está feita!

💡 **INFORMAÇÕES ESPECÍFICAS:**
Diferencial é a busca e entrega dos animais.`;

// ✅ FUNÇÕES AUXILIARES
async function getDBConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SELECT 1');
    return connection;
  } catch (error) {
    console.error('❌ Erro na conexão MySQL:', error.message);
    throw error;
  }
}

// ✅ CONFIGURAR FUSO HORÁRIO DO BANCO
async function configurarTimezone() {
  let connection;
  try {
    connection = await getDBConnection();
    // Configurar para horário de Brasília
    await connection.execute("SET time_zone = '-03:00'");
    console.log('✅ Timezone configurado para America/Sao_Paulo (-03:00)');
  } catch (error) {
    console.error('❌ Erro ao configurar timezone:', error);
  } finally {
    if (connection) await connection.end();
  }
}

async function enviarEmailConfirmacao(agendamento, servico) {
  try {
    const preco = parseFloat(servico.preco) || 0;
    const precoFormatado = preco.toFixed(2);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: agendamento.email_cliente,
      subject: 'Confirmação de Agendamento - PetNet',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Agendamento Confirmado! 🐾</h2>
          
          <p>Olá <strong>${agendamento.nome_cliente}</strong>,</p>
          
          <p>Seu agendamento foi confirmado com sucesso!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333;">Detalhes do Agendamento:</h3>
            <ul>
              <li><strong>Serviço:</strong> ${servico.nome}</li>
              <li><strong>Data e Horário:</strong> ${new Date(agendamento.data_agendamento).toLocaleString('pt-BR')}</li>
              <li><strong>Preço:</strong> R$ ${precoFormatado}</li>
              <li><strong>Observações:</strong> ${agendamento.observacoes || 'Nenhuma'}</li>
            </ul>
          </div>
          
          <p>Se precisar alterar ou cancelar o agendamento, entre em contato conosco.</p>
          
          <p>Atenciosamente,<br>
          <strong>Equipe PetNet</strong></p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}

function gerarHorariosDisponiveis(data, duracao, agendamentosExistentes) {
  const horarios = [];
  const horaInicio = 8;
  const horaFim = 18;
  
  const dataBase = new Date(data);
  
  for (let hora = horaInicio; hora < horaFim; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 30) {
      const horario = new Date(dataBase);
      horario.setHours(hora, minuto, 0, 0);
      
      const ano = horario.getFullYear();
      const mes = String(horario.getMonth() + 1).padStart(2, '0');
      const dia = String(horario.getDate()).padStart(2, '0');
      const horasStr = String(horario.getHours()).padStart(2, '0');
      const minutosStr = String(horario.getMinutes()).padStart(2, '0');
      const segundosStr = String(horario.getSeconds()).padStart(2, '0');
      
      const horarioMySQL = `${ano}-${mes}-${dia} ${horasStr}:${minutosStr}:${segundosStr}`;
      
      const conflito = agendamentosExistentes.some(ag => {
        const agendamentoStr = ag.data_agendamento.toISOString().slice(0, 19).replace('T', ' ');
        return agendamentoStr === horarioMySQL;
      });
      
      if (!conflito && horario > new Date()) {
        horarios.push({
          start_at: horario.toISOString(),
          end_at: new Date(horario.getTime() + duracao * 60000).toISOString()
        });
      }
    }
  }
  
  return horarios;
}

// ✅ MIDDLEWARE DE AUTENTICAÇÃO
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const connection = await getDBConnection();
    const [users] = await connection.execute('SELECT id, nome, email FROM usuarios WHERE id = ?', [decoded.id]);
    await connection.end();
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
    }
    
    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

// ✅ FUNÇÃO PARA ATUALIZAR A TABELA PEDIDOS NO RAILWAY
async function atualizarTabelaPedidos() {
  let connection;
  try {
    connection = await getDBConnection();
    
    console.log('🔄 Verificando estrutura da tabela pedidos no Railway...');
    
    // Verificar colunas existentes
    const columnsToCheck = [
      'metodo_pagamento',
      'frete', 
      'external_reference',
      'subtotal'
    ];
    
    for (const columnName of columnsToCheck) {
      try {
        const [columns] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = ?
        `, [dbConfig.database, columnName]);
        
        if (columns.length === 0) {
          console.log(`🔄 Adicionando coluna "${columnName}"...`);
          
          if (columnName === 'metodo_pagamento') {
            await connection.execute(`
              ALTER TABLE pedidos 
              ADD COLUMN metodo_pagamento VARCHAR(50) DEFAULT 'cartao'
            `);
          } else if (columnName === 'frete') {
            await connection.execute(`
              ALTER TABLE pedidos 
              ADD COLUMN frete DECIMAL(10,2) DEFAULT 9.90
            `);
          } else if (columnName === 'external_reference') {
            await connection.execute(`
              ALTER TABLE pedidos 
              ADD COLUMN external_reference VARCHAR(255)
            `);
          } else if (columnName === 'subtotal') {
            await connection.execute(`
              ALTER TABLE pedidos 
              ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0
            `);
          }
          
          console.log(`✅ Coluna "${columnName}" adicionada!`);
        } else {
          console.log(`✅ Coluna "${columnName}" já existe`);
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar coluna ${columnName}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao atualizar tabela pedidos:', error);
  } finally {
    if (connection) await connection.end();
  }
}

// ✅ INICIALIZAÇÃO DO BANCO DE DADOS
async function createTables() {
  let connection;
  try {
    connection = await getDBConnection();
    
    // Tabela de usuários
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255),
        google_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de serviços
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS servicos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        preco DECIMAL(10,2) NOT NULL,
        duracao_minutos INT DEFAULT 60,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de agendamentos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        servico_id INT NOT NULL,
        data_agendamento DATETIME NOT NULL,
        duracao_minutos INT DEFAULT 60,
        status ENUM('pendente', 'confirmado', 'cancelado', 'concluido') DEFAULT 'pendente',
        valor_total DECIMAL(10,2) NOT NULL,
        observacoes TEXT,
        nome_cliente VARCHAR(255),
        email_cliente VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
        FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE
      )
    `);

    // ✅ TABELA DE PEDIDOS SIMPLIFICADA
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        items JSON NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status ENUM('pendente', 'pago', 'cancelado', 'entregue') DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // Inserir serviços padrão se não existirem
    const [existingServices] = await connection.execute('SELECT COUNT(*) as count FROM servicos');
    if (existingServices[0].count === 0) {
      await connection.execute(`
        INSERT INTO servicos (nome, descricao, preco, duracao_minutos) VALUES
        ('Banho e Tosa - Pelo Longo', 'Banho completo e tosa para pets de pelo longo', 50.00, 90),
        ('Banho e Tosa - Pelo Curto', 'Banho completo e tosa para pets de pelo curto', 40.00, 90),
        ('Tosa Higiênica', 'Tosa específica para higiene', 45.00, 60),
        ('Consulta Veterinária', 'Consulta de rotina com veterinário', 120.00, 60),
        ('Vacinação', 'Aplicação de vacinas essenciais', 60.00, 30)
      `);
    }
    
    console.log('✅ Tabelas base criadas/verificadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

// ✅ ROTAS DO SISTEMA PRINCIPAL

// Health Check
app.get('/health', async (req, res) => {
  let connection;
  try {
    connection = await getDBConnection();
    await connection.execute('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      message: 'Sistema completo Pet.Net funcionando!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  } finally {
    if (connection) await connection.end();
  }
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: "Bem-vindo ao Pet.Net API - Sistema Completo",
    version: "2.0.0",
    features: ["Sistema de Agendamentos", "PetGPT IA", "Autenticação", "Pagamentos", "Email"]
  });
});

// ✅ ROTAS DE AUTENTICAÇÃO
app.post('/auth/register', async (req, res) => {
  let connection;
  try {
    const { nome, email, senha } = req.body;
    
    if (!nome || !email || !senha) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome, email e senha são obrigatórios' 
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Senha deve ter pelo menos 6 caracteres' 
      });
    }

    connection = await getDBConnection();
    
    const [existingUsers] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?', 
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email já cadastrado!' 
      });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    
    const [result] = await connection.execute(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );

    const [newUsers] = await connection.execute(
      'SELECT id, nome, email FROM usuarios WHERE id = ?',
      [result.insertId]
    );

    const usuario = newUsers[0];
    
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      usuario,
      token
    });

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/auth/login', async (req, res) => {
  let connection;
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
    }
    connection = await getDBConnection();
    const [users] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado!' });
    }
    const usuario = users[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ success: false, message: 'Senha incorreta!' });
    }
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/auth/google', async (req, res) => {
  let connection;
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token do Google é obrigatório' });
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    
    connection = await getDBConnection();
    const [existingUsers] = await connection.execute(
      'SELECT * FROM usuarios WHERE email = ? OR google_id = ?',
      [email, googleId]
    );
    
    let usuario;
    if (existingUsers.length > 0) {
      usuario = existingUsers[0];
      await connection.execute(
        'UPDATE usuarios SET nome = ?, google_id = ? WHERE id = ?',
        [name, googleId, usuario.id]
      );
    } else {
      const [result] = await connection.execute(
        'INSERT INTO usuarios (nome, email, google_id) VALUES (?, ?, ?)',
        [name, email, googleId]
      );
      const [newUsers] = await connection.execute('SELECT * FROM usuarios WHERE id = ?', [result.insertId]);
      usuario = newUsers[0];
    }
    
    const jwtToken = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login com Google realizado com sucesso!',
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
      token: jwtToken
    });
  } catch (error) {
    console.error('Erro no login com Google:', error);
    res.status(500).json({ success: false, message: 'Erro no login com Google' });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/auth/verify', authenticateToken, async (req, res) => {
  res.json({ success: true, usuario: req.user });
});

// ✅ ROTAS DE AGENDAMENTOS
app.get('/agendamentos/servicos', async (req, res) => {
  let connection;
  try {
    connection = await getDBConnection();
    const [servicos] = await connection.execute(
      'SELECT * FROM servicos WHERE ativo = true ORDER BY nome'
    );
    res.json(servicos);
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  } finally {
    if (connection) await connection.end();
  }
});

// ✅ ROTA CORRIGIDA: BUSCAR HORÁRIOS OCUPADOS COM FUSO CORRETO
app.get('/agendamentos/horarios-ocupados', async (req, res) => {
  let connection;
  try {
    connection = await getDBConnection();
    
    // ✅ CONFIGURAR TIMEZONE PARA ESTA CONEXÃO
    await connection.execute("SET time_zone = '-03:00'");
    
    // ✅ BUSCAR AGENDAMENTOS COM FUSO HORÁRIO CORRETO
    const [agendamentos] = await connection.execute(
      `SELECT 
        DATE_FORMAT(CONVERT_TZ(data_agendamento, '+00:00', '-03:00'), '%Y-%m-%dT%H:%i:%s.000Z') as data_iso
       FROM agendamentos 
       WHERE status IN ('pendente', 'confirmado')
       AND data_agendamento > NOW()
       ORDER BY data_agendamento`
    );
    
    console.log(`📊 ${agendamentos.length} horários ocupados encontrados (timezone: -03:00)`);
    
    // ✅ EXTRAIR DATAS CORRETAMENTE
    const horariosOcupados = agendamentos.map(ag => ag.data_iso);
    
    res.json(horariosOcupados);
    
  } catch (error) {
    console.error('❌ Erro ao buscar horários ocupados:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/agendamentos/horarios', async (req, res) => {
  let connection;
  try {
    const { data, servico_id } = req.body;
    
    if (!data || !servico_id) {
      return res.status(400).json({ success: false, message: 'Data e serviço são obrigatórios' });
    }
    
    connection = await getDBConnection();
    
    // ✅ CONFIGURAR TIMEZONE
    await connection.execute("SET time_zone = '-03:00'");
    
    const [servico] = await connection.execute(
      'SELECT duracao_minutos FROM servicos WHERE id = ? AND ativo = true',
      [servico_id]
    );
    
    if (servico.length === 0) {
      return res.status(404).json({ success: false, message: 'Serviço não encontrado' });
    }
    
    const duracao = servico[0].duracao_minutos;
    const [agendamentos] = await connection.execute(
      `SELECT data_agendamento, duracao_minutos 
       FROM agendamentos 
       WHERE DATE(data_agendamento) = DATE(?) 
       AND status IN ('pendente', 'confirmado')`,
      [data]
    );
    
    const horariosDisponiveis = gerarHorariosDisponiveis(data, duracao, agendamentos);
    res.json(horariosDisponiveis);
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/agendamentos', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { servico_id, data_agendamento, observacoes, nome_cliente, email_cliente } = req.body;
    
    if (!servico_id || !data_agendamento || !nome_cliente || !email_cliente) {
      return res.status(400).json({ 
        success: false, 
        message: 'Serviço, data, nome e email são obrigatórios' 
      });
    }

    connection = await getDBConnection();
    
    // ✅ CONFIGURAR TIMEZONE
    await connection.execute("SET time_zone = '-03:00'");
    
    const [servico] = await connection.execute(
      'SELECT * FROM servicos WHERE id = ? AND ativo = true',
      [servico_id]
    );
    
    if (servico.length === 0) {
      return res.status(404).json({ success: false, message: 'Serviço não encontrado' });
    }

    // ✅ CORRIGIR: Converter data mantendo o horário correto
    const dataObj = new Date(data_agendamento);
    
    // Ajustar para timezone local (-03:00)
    const offset = dataObj.getTimezoneOffset() * 60000;
    const dataLocal = new Date(dataObj.getTime() - offset);
    
    const ano = dataLocal.getFullYear();
    const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(dataLocal.getDate()).padStart(2, '0');
    const horas = String(dataLocal.getHours()).padStart(2, '0');
    const minutos = String(dataLocal.getMinutes()).padStart(2, '0');
    const segundos = String(dataLocal.getSeconds()).padStart(2, '0');
    
    const dataMySQL = `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;

    console.log('🕒 Data recebida:', data_agendamento);
    console.log('🕒 Data convertida MySQL:', dataMySQL);

    const [conflitos] = await connection.execute(
      `SELECT id FROM agendamentos 
       WHERE data_agendamento = ? 
       AND status IN ('pendente', 'confirmado')`,
      [dataMySQL]
    );
    
    if (conflitos.length > 0) {
      return res.status(400).json({ success: false, message: 'Horário já ocupado' });
    }

    const [result] = await connection.execute(
      `INSERT INTO agendamentos 
       (usuario_id, servico_id, data_agendamento, duracao_minutos, valor_total, observacoes, nome_cliente, email_cliente) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        servico_id,
        dataMySQL,
        servico[0].duracao_minutos,
        servico[0].preco,
        observacoes || '',
        nome_cliente,
        email_cliente
      ]
    );

    const [agendamento] = await connection.execute(
      `SELECT a.*, s.nome as servico_nome, s.descricao as servico_descricao
       FROM agendamentos a 
       JOIN servicos s ON a.servico_id = s.id 
       WHERE a.id = ?`,
      [result.insertId]
    );

    // ✅ ENVIAR EMAIL DE CONFIRMAÇÃO
    const emailEnviado = await enviarEmailConfirmacao(agendamento[0], servico[0]);

    res.status(201).json({
      success: true,
      message: 'Agendamento criado com sucesso!' + (emailEnviado ? ' Email de confirmação enviado.' : ''),
      agendamento: agendamento[0],
      emailEnviado
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor: ' + error.message 
    });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/agendamentos/meus-agendamentos', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await getDBConnection();
    
    // ✅ CONFIGURAR TIMEZONE
    await connection.execute("SET time_zone = '-03:00'");
    
    const [agendamentos] = await connection.execute(
      `SELECT a.*, s.nome as servico_nome, s.descricao as servico_descricao
       FROM agendamentos a 
       JOIN servicos s ON a.servico_id = s.id 
       WHERE a.usuario_id = ? 
       ORDER BY a.data_agendamento DESC`,
      [req.user.id]
    );
    
    res.json(agendamentos);
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  } finally {
    if (connection) await connection.end();
  }
});

app.put('/agendamentos/:id', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status é obrigatório' 
      });
    }

    connection = await getDBConnection();
    
    // ✅ CONFIGURAR TIMEZONE
    await connection.execute("SET time_zone = '-03:00'");
    
    // Verificar se o agendamento pertence ao usuário
    const [agendamentos] = await connection.execute(
      'SELECT * FROM agendamentos WHERE id = ? AND usuario_id = ?',
      [id, req.user.id]
    );

    if (agendamentos.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Agendamento não encontrado ou não pertence ao usuário' 
      });
    }

    // Atualizar status
    await connection.execute(
      'UPDATE agendamentos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Agendamento atualizado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/agendamentos/todos', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await getDBConnection();
    
    // ✅ CONFIGURAR TIMEZONE
    await connection.execute("SET time_zone = '-03:00'");
    
    const [agendamentos] = await connection.execute(
      `SELECT a.*, s.nome as servico_nome, u.nome as usuario_nome, u.email as usuario_email
       FROM agendamentos a 
       JOIN servicos s ON a.servico_id = s.id 
       LEFT JOIN usuarios u ON a.usuario_id = u.id 
       ORDER BY a.data_agendamento DESC`
    );
    
    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  } finally {
    if (connection) await connection.end();
  }
});

// =============================================
// ✅ ROTAS DE PEDIDOS
// =============================================

app.post('/pedidos', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { items, total, frete = 9.90, metodo_pagamento = 'cartao', external_reference } = req.body;
    
    console.log('🛒 RECEBENDO PEDIDO - Usuário:', req.user.id);

    // ✅ VERIFICAR SE JÁ EXISTE PEDIDO COM MESMO external_reference
    if (external_reference) {
      connection = await getDBConnection();
      const [existingPedidos] = await connection.execute(
        'SELECT id FROM pedidos WHERE external_reference = ? AND usuario_id = ?',
        [external_reference, req.user.id]
      );
      
      if (existingPedidos.length > 0) {
        console.log('⚠️  Pedido já existe com este external_reference:', external_reference);
        
        const [pedidos] = await connection.execute(
          'SELECT * FROM pedidos WHERE id = ?',
          [existingPedidos[0].id]
        );
        
        const pedido = pedidos[0];
        const pedidoFormatado = {
          id: pedido.id,
          usuario_id: pedido.usuario_id,
          items: typeof pedido.items === 'string' ? JSON.parse(pedido.items) : pedido.items,
          total: parseFloat(pedido.total),
          frete: parseFloat(pedido.frete || 0),
          subtotal: parseFloat(pedido.subtotal || total),
          status: pedido.status,
          metodo_pagamento: pedido.metodo_pagamento || 'cartao',
          external_reference: pedido.external_reference,
          created_at: pedido.created_at
        };

        return res.status(200).json({
          success: true,
          message: 'Pedido já existe',
          pedido: pedidoFormatado,
          alreadyExists: true
        });
      }
    }

    if (!items || (Array.isArray(items) && items.length === 0)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items do pedido são obrigatórios' 
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Total do pedido é obrigatório' 
      });
    }

    if (!connection) connection = await getDBConnection();
    
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pedidos'
    `, [dbConfig.database]);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    
    let itemsJson = typeof items === 'string' ? items : JSON.stringify(items);

    const totalFinal = parseFloat(total);
    const subtotal = parseFloat(total) - parseFloat(frete);

    let sqlColumns = ['usuario_id', 'items', 'total', 'status'];
    let sqlValues = [req.user.id, itemsJson, totalFinal, 'pendente'];
    let sqlPlaceholders = ['?', '?', '?', '?'];
    
    if (columnNames.includes('frete')) {
      sqlColumns.push('frete');
      sqlValues.push(parseFloat(frete));
      sqlPlaceholders.push('?');
    }
    
    if (columnNames.includes('subtotal')) {
      sqlColumns.push('subtotal');
      sqlValues.push(subtotal);
      sqlPlaceholders.push('?');
    }
    
    if (columnNames.includes('metodo_pagamento')) {
      sqlColumns.push('metodo_pagamento');
      sqlValues.push(metodo_pagamento);
      sqlPlaceholders.push('?');
    }

    if (external_reference && columnNames.includes('external_reference')) {
      sqlColumns.push('external_reference');
      sqlValues.push(external_reference);
      sqlPlaceholders.push('?');
    }
    
    const sql = `INSERT INTO pedidos (${sqlColumns.join(', ')}) VALUES (${sqlPlaceholders.join(', ')})`;
    
    const [result] = await connection.execute(sql, sqlValues);

    console.log(`✅ NOVO PEDIDO SALVO - ID: ${result.insertId}`);

    const [pedidos] = await connection.execute(
      `SELECT * FROM pedidos WHERE id = ?`,
      [result.insertId]
    );

    const pedido = pedidos[0];
    
    const pedidoFormatado = {
      id: pedido.id,
      usuario_id: pedido.usuario_id,
      items: typeof pedido.items === 'string' ? JSON.parse(pedido.items) : pedido.items,
      total: parseFloat(pedido.total),
      frete: parseFloat(pedido.frete || 0),
      subtotal: parseFloat(pedido.subtotal || subtotal),
      status: pedido.status,
      metodo_pagamento: pedido.metodo_pagamento || 'cartao',
      external_reference: pedido.external_reference,
      created_at: pedido.created_at
    };

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso!',
      pedido: pedidoFormatado,
      alreadyExists: false
    });

  } catch (error) {
    console.error('❌ ERRO AO CRIAR PEDIDO:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor: ' + error.message 
    });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/pedidos/meus-pedidos', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await getDBConnection();
    
    console.log(`🔍 BUSCANDO PEDIDOS ATIVOS - Usuário: ${req.user.id}`);
    
    const [pedidos] = await connection.execute(
      `SELECT * FROM pedidos WHERE usuario_id = ? AND status != 'cancelado' ORDER BY created_at DESC`,
      [req.user.id]
    );
    
    console.log(`📦 PEDIDOS ATIVOS ENCONTRADOS: ${pedidos.length} para usuário ${req.user.id}`);
    
    const pedidosFormatados = pedidos.map(pedido => {
      try {
        let itemsArray = [];
        try {
          if (typeof pedido.items === 'string') {
            itemsArray = JSON.parse(pedido.items || '[]');
          } else {
            itemsArray = pedido.items || [];
          }
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse dos items:', parseError);
          itemsArray = [];
        }
        
        return {
          id: pedido.id,
          usuario_id: pedido.usuario_id,
          items: itemsArray,
          produtos: itemsArray,
          total: parseFloat(pedido.total || 0),
          frete: parseFloat(pedido.frete || 0),
          subtotal: parseFloat(pedido.subtotal || (pedido.total - (pedido.frete || 0))),
          status: pedido.status || 'pendente',
          metodo_pagamento: pedido.metodo_pagamento || 'cartao',
          external_reference: pedido.external_reference,
          data_criacao: pedido.created_at,
          created_at: pedido.created_at
        };
      } catch (error) {
        console.error('❌ Erro ao formatar pedido:', error);
        return null;
      }
    }).filter(pedido => pedido !== null);
    
    console.log('📋 PEDIDOS ATIVOS FORMATADOS:', pedidosFormatados.length);
    
    res.json(pedidosFormatados);
  } catch (error) {
    console.error('❌ ERRO AO BUSCAR PEDIDOS:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  } finally {
    if (connection) await connection.end();
  }
});

app.put('/pedidos/:id/status', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status é obrigatório' 
      });
    }

    connection = await getDBConnection();
    
    const [pedidos] = await connection.execute(
      'SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?',
      [id, req.user.id]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido não encontrado ou não pertence ao usuário' 
      });
    }

    await connection.execute(
      'UPDATE pedidos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Status do pedido atualizado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  } finally {
    if (connection) await connection.end();
  }
});

app.delete('/pedidos/:id', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await getDBConnection();
    
    const [pedidos] = await connection.execute(
      'SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?',
      [id, req.user.id]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido não encontrado ou não pertence ao usuário' 
      });
    }

    await connection.execute(
      'DELETE FROM pedidos WHERE id = ?',
      [id]
    );

    console.log(`🗑️ Pedido ${id} excluído permanentemente`);

    res.json({
      success: true,
      message: 'Pedido excluído permanentemente com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao excluir pedido:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  } finally {
    if (connection) await connection.end();
  }
});

app.delete('/pedidos/limpar-cancelados', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await getDBConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM pedidos WHERE usuario_id = ? AND status = "cancelado"',
      [req.user.id]
    );

    console.log(`🗑️ ${result.affectedRows} pedidos cancelados excluídos para usuário ${req.user.id}`);

    res.json({
      success: true,
      message: `${result.affectedRows} pedidos cancelados foram excluídos permanentemente!`
    });

  } catch (error) {
    console.error('❌ Erro ao limpar pedidos cancelados:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  } finally {
    if (connection) await connection.end();
  }
});

// ✅ ROTAS DE PAGAMENTOS
app.post('/api/pagamentos/create-preference', authenticateToken, async (req, res) => {
  try {
    const { items, tipo } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items de pagamento são obrigatórios' 
      });
    }

    const preference = new Preference(mercadopagoClient);
    
    const itemsValidados = items.map(item => {
      if (!item.title || !item.quantity || item.unit_price === undefined) {
        throw new Error(`Item inválido: ${JSON.stringify(item)}`);
      }
      
      return {
        title: item.title.substring(0, 255),
        quantity: Number(item.quantity),
        currency_id: 'BRL',
        unit_price: Number(item.unit_price),
        picture_url: item.picture_url || ''
      };
    });

    const preferenceData = {
      items: itemsValidados,
      back_urls: {
        success: "http://localhost:5173/payment-success",
        failure: "http://localhost:5173/error", 
        pending: "http://localhost:5173/pending"
      },
      external_reference: `user_${req.user.id}_${Date.now()}`,
      metadata: {
        user_id: req.user.id,
        tipo: tipo,
        timestamp: new Date().toISOString()
      }
    };

    const result = await preference.create({
      body: preferenceData
    });

    res.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    });

  } catch (error) {
    console.error('❌ Erro ao criar preferência:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar pagamento'
    });
  }
});

// ✅ ROTAS DA PETGPT
app.post("/chat", async (req, res) => {
  const { message, isFirstMessage = false } = req.body;

  if (!message) {
    return res.status(400).json({ 
      reply: "Olá! Sou a PetGPT 🐾 Como posso ajudar você e seu pet hoje?" 
    });
  }

  try {
    let userMessage = message;
    if (isFirstMessage) {
      userMessage = `[PRIMEIRA MENSAGEM DO USUÁRIO - DÊ BOAS-VINDAS UMA VEZ] ${message}`;
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: PETGPT_SYSTEM
            },
            {
              role: "user", 
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 600,
          top_p: 0.9
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("❌ Erro da API Groq:", data.error);
      return res.status(500).json({ 
        reply: "🐾 Oops! Estou com alguns probleminhas técnicos. Pode tentar novamente em um minutinho?" 
      });
    }

    const reply = data.choices?.[0]?.message?.content ||
                 "🐕 Não consegui entender direito. Pode reformular sua pergunta?";

    res.json({ 
      reply,
      assistant: "PetGPT"
    });

  } catch (err) {
    console.error("❌ Erro ao conectar ao Groq:", err);
    res.status(500).json({ 
      reply: "💚 No momento estou ocupada cuidando de outros pets! Volte em alguns instantes ou entre em contato diretamente conosco." 
    });
  }
});

app.post("/start-chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ 
      reply: "🐾 Olá! Eu sou a PetGPT, sua assistente virtual do pet shop! Estou aqui para ajudar você e seu pet com agendamentos, produtos, veterinária e muito more. Como posso ajudar hoje? 💚" 
    });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `${PETGPT_SYSTEM}

IMPORTANTE: Esta é a PRIMEIRA MENSAGEM do usuário. Dê boas-vindas uma vez e depois responda à pergunta específica.`
            },
            {
              role: "user", 
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 600,
          top_p: 0.9
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.json({ 
        reply: "🐾 Olá! Sou a PetGPT! Como posso ajudar você e seu pet hoje? 🐕🐈" 
      });
    }

    const reply = data.choices?.[0]?.message?.content ||
                 "🐾 Olá! Sou a PetGPT! Em que posso ajudar?";

    res.json({ 
      reply,
      assistant: "PetGPT",
      firstMessage: true
    });

  } catch (err) {
    res.json({ 
      reply: "🐾 Olá! Sou a PetGPT! Estou aqui para ajudar com agendamentos, produtos e cuidados do seu pet! 💚" 
    });
  }
});

app.post("/quick-help", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ 
      reply: "🐾 Em que posso ajudar?" 
    });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `Você é a PetGPT. Responda DIRETAMENTE à pergunta, sem saudações iniciais. Seja útil e direto.`
            },
            {
              role: "user", 
              content: message
            }
          ],
          temperature: 0.6,
          max_tokens: 300
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.json({ 
        reply: "Pode me contar como posso ajudar?" 
      });
    }

    const reply = data.choices?.[0]?.message?.content || 
                 "Como posso ajudar?";

    res.json({ 
      reply,
      type: "quick_help" 
    });

  } catch (err) {
    res.json({ 
      reply: "Como posso auxiliar você e seu pet?" 
    });
  }
});

app.get("/petgpt-info", (req, res) => {
  res.json({
    assistant: "PetGPT 🐾",
    description: "Sua assistente virtual do pet shop",
    services: [
      "🛁 Agendamento de banho e tosa",
      "🏥 Consultas veterinárias", 
      "🛒 Produtos e rações",
      "💉 Vacinação e exames",
      "📅 Horários e disponibilidade",
      "💚 Dicas e cuidados com pets"
    ],
    tone: "Amigável, prestativa e apaixonada por animais",
    status: "✅ Online e pronta para ajudar!"
  });
});

// ✅ MIDDLEWARE PARA ROTAS NÃO ENCONTRADAS
app.use((req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    availableRoutes: [
      "GET  /",
      "POST /auth/login",
      "POST /auth/register",
      "POST /auth/google", 
      "GET  /auth/verify",
      "GET  /agendamentos/servicos",
      "GET  /agendamentos/horarios-ocupados",
      "POST /agendamentos/horarios",
      "POST /agendamentos",
      "GET  /agendamentos/meus-agendamentos",
      "PUT  /agendamentos/:id",
      "GET  /agendamentos/todos",
      "POST /pedidos",
      "GET  /pedidos/meus-pedidos",
      "PUT  /pedidos/:id/status",
      "DELETE /pedidos/:id",
      "DELETE /pedidos/limpar-cancelados",
      "POST /api/pagamentos/create-preference",
      "POST /chat",
      "POST /start-chat",
      "POST /quick-help",
      "GET  /petgpt-info",
      "GET  /health"
    ]
  });
});

// ✅ INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, async () => {
  console.log(`\n🚀 Pet.Net API rodando em http://localhost:${PORT}`);
  console.log('📊 Inicializando banco de dados...');
  
  try {
    await createTables();
    await configurarTimezone(); // ✅ NOVA FUNÇÃO
    await atualizarTabelaPedidos();
    console.log('✅ Sistema inicializado com sucesso!');
    console.log('🐾 PetGPT está online e pronta para ajudar!');
    console.log('💳 Sistema de pagamentos configurado');
    console.log('📧 Sistema de emails funcionando');
    console.log('🕒 FUSO HORÁRIO CONFIGURADO: America/Sao_Paulo (-03:00)');
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
  }
});