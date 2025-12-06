import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { agendamentoAPI, authHelper } from '../services/api';
import PaymentModalMP from './PaymentModalMP';
import '../styles/BookingForm.css';

const BookingForm = () => {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [observations, setObservations] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [agendamentoParaPagamento, setAgendamentoParaPagamento] = useState(null);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  
  const isProcessingRef = useRef(false);
  
  const navigate = useNavigate();
  const userInfo = authHelper.getUserInfo();

  // Função auxiliar para formatar data para exibição (DD/MM/YYYY)
  const formatarDataParaExibicao = (dateString) => {
    try {
      const date = new Date(dateString);
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      return `${dia}/${mes}/${ano}`; // Formato brasileiro explícito
    } catch (error) {
      console.error('❌ Erro ao formatar data para exibição:', error);
      return 'Data inválida';
    }
  };

  // Função auxiliar para formatar data e hora completas
  const formatarDataHoraCompleta = (dateString) => {
    try {
      const date = new Date(dateString);
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      const horas = String(date.getHours()).padStart(2, '0');
      const minutos = String(date.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
    } catch (error) {
      console.error('❌ Erro ao formatar data e hora:', error);
      return 'Data/hora inválida';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (userInfo.id && userInfo.nome && userInfo.email) {
      setCustomerName(userInfo.nome);
      setCustomerEmail(userInfo.email);
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    const getServices = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      setLoading(true);
      try {
        const response = await fetch('http://localhost:3000/agendamentos/servicos');
        
        if (response.ok) {
          const servicesData = await response.json();
          const formattedServices = servicesData.map(service => ({
            id: service.id,
            nome: service.nome,
            descricao: service.descricao || '',
            preco: service.preco || 0,
            duracao_minutos: service.duracao_minutos || 60
          }));
          
          setServices(formattedServices);
          if (formattedServices.length > 0) {
            setSelectedService(formattedServices[0].id.toString());
          }
        } else {
          throw new Error('Erro ao carregar serviços');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar serviços:', error);
        const fallbackServices = [
          { id: 1, nome: "Banho e Tosa", descricao: "Banho completo e tosa higiênica", preco: 80.00, duracao_minutos: 90 },
          { id: 2, nome: "Consulta Veterinária", descricao: "Consulta com veterinário especializado", preco: 120.00, duracao_minutos: 60 },
          { id: 3, nome: "Vacinação", descricao: "Aplicação de vacinas essenciais", preco: 60.00, duracao_minutos: 30 }
        ];
        setServices(fallbackServices);
        if (fallbackServices.length > 0) {
          setSelectedService(fallbackServices[0].id.toString());
        }
      }
      setLoading(false);
    };

    getServices();

    // Configurar data padrão (amanhã)
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const defaultDate = `${year}-${month}-${day}`;
    setSelectedDate(defaultDate);

    loadHorariosOcupados();
  }, [navigate]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      loadSlots();
    }
  }, [selectedDate, selectedService]);

  const loadHorariosOcupados = async () => {
    try {
      const response = await fetch('http://localhost:3000/agendamentos/horarios-ocupados');
      
      if (response.ok) {
        const horariosOcupadosBackend = await response.json();
        console.log(`📊 ${horariosOcupadosBackend.length} horários ocupados carregados`);
        setHorariosOcupados(horariosOcupadosBackend);
      } else {
        setHorariosOcupados([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar horários ocupados:', error);
      setHorariosOcupados([]);
    }
  };

  const isHorarioOcupado = (slotStart) => {
    try {
      if (!horariosOcupados || horariosOcupados.length === 0) return false;

      const slotDate = new Date(slotStart);
      const slotDateStr = slotDate.toISOString().slice(0, 19);
      
      return horariosOcupados.some(ocupadoISO => {
        try {
          const ocupadoDate = new Date(ocupadoISO);
          const ocupadoStr = ocupadoDate.toISOString().slice(0, 19);
          return slotDateStr === ocupadoStr;
        } catch {
          return false;
        }
      });
    } catch (error) {
      return false;
    }
  };

  const formatDateForBackend = (dateString) => {
    try {
      const date = new Date(dateString);
      
      // Usar valores UTC para consistência com o backend
      const ano = date.getUTCFullYear();
      const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(date.getUTCDate()).padStart(2, '0');
      const horas = String(date.getUTCHours()).padStart(2, '0');
      const minutos = String(date.getUTCMinutes()).padStart(2, '0');
      const segundos = String(date.getUTCSeconds()).padStart(2, '0');
      
      return `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
    } catch (error) {
      console.error('❌ Erro ao formatar data para backend:', error);
      return dateString;
    }
  };

  const salvarAgendamentoBackend = async (agendamentoData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado');

    console.log('📤 Enviando para backend:', {
      dataOriginal: selectedSlot?.start_at,
      dataFormatadaBackend: agendamentoData.data_agendamento,
      dataParaExibicao: formatarDataParaExibicao(selectedSlot?.start_at)
    });

    const response = await fetch('http://localhost:3000/agendamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(agendamentoData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    return await response.json();
  };

  const generateSlots = () => {
    if (!selectedDate) return [];

    const slots = [];
    const [year, month, day] = selectedDate.split('-').map(Number);
    const baseDate = new Date(year, month - 1, day);
    
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute of [0, 30]) {
        if (hour === 17 && minute === 30) break;
        
        const slotDate = new Date(baseDate);
        slotDate.setHours(hour, minute, 0, 0);
        
        const slotISO = slotDate.toISOString();
        
        if (slotDate > new Date()) {
          const ocupado = isHorarioOcupado(slotISO);
          
          slots.push({
            start_at: slotISO,
            end_at: new Date(slotDate.getTime() + 60 * 60000).toISOString(),
            disponivel: !ocupado,
            ocupado: ocupado,
            label: formatTime(slotISO)
          });
        }
      }
    }
    
    console.log(`🕒 ${slots.length} slots gerados para ${selectedDate}`);
    return slots;
  };

  const loadSlots = async () => {
    if (!selectedDate || !selectedService) return;

    setSelectedSlot(null);
    setSlotsLoading(true);

    try {
      await loadHorariosOcupados();
      
      const generatedSlots = generateSlots();
      setSlots(generatedSlots);
    } catch (error) {
      console.error('❌ Erro ao carregar horários:', error);
    }
    
    setSlotsLoading(false);
  };

  // CORREÇÃO AQUI: Função handlePaymentClose modificada
  const handlePaymentClose = (action, url, agendamentoData) => {
    console.log('🔍 Modal de pagamento fechado com ação:', action);
    
    // Sempre fecha o modal
    setShowPayment(false);
    
    // Verificar o tipo de ação
    if (action === true || action === 'confirm' || action === 'success') {
      // Usuário confirmou o pagamento
      if (url) {
        // Tem URL de pagamento - redireciona para Mercado Pago
        setMessage('✅ Redirecionando para pagamento...');
        setTimeout(() => {
          loadHorariosOcupados();
          resetForm();
          navigate('/success', { state: { agendamento: agendamentoData || agendamentoParaPagamento } });
        }, 1000);
      } else {
        // Confirmou sem URL (pagamento direto) - vai para histórico
        setMessage('✅ Agendamento confirmado!');
        setTimeout(() => {
          loadHorariosOcupados();
          resetForm();
          navigate('/historico');
        }, 2000);
      }
    } else {
      // Usuário cancelou (action === false, 'cancel', ou undefined)
      // APENAS fecha o modal, NÃO redireciona
      console.log('🔄 Usuário cancelou o pagamento, mantendo na página de agendamento');
      
      // Mensagem opcional
      setMessage('Pagamento cancelado. Você pode finalizar quando quiser.');
      
      // Recarregar horários para garantir que o slot ainda está disponível
      setTimeout(() => {
        loadHorariosOcupados();
        loadSlots();
      }, 500);
      
      // NÃO chama navigate() - usuário permanece na mesma página
    }
  };

  // Função separada para cancelamento explícito (se o PaymentModalMP suportar)
  const handlePaymentCancel = () => {
    console.log('❌ Cancelamento explícito do pagamento');
    setShowPayment(false);
    setMessage('Pagamento cancelado. Seu agendamento ainda não foi finalizado.');
    
    // Recarregar disponibilidade
    setTimeout(() => {
      loadHorariosOcupados();
      loadSlots();
    }, 300);
  };

  const handleBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('🔐 Você precisa estar logado!');
      navigate('/login');
      return;
    }

    if (isProcessingRef.current) return;

    if (!selectedSlot) {
      alert('Selecione um horário');
      return;
    }
    if (!customerName || !customerEmail || !validateEmail(customerEmail) || !selectedService) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (selectedSlot.ocupado) {
      await loadHorariosOcupados();
      await loadSlots();
      return;
    }

    isProcessingRef.current = true;
    setLoading(true);
    setMessage('Salvando agendamento...');

    try {
      const dataFormatadaBackend = formatDateForBackend(selectedSlot.start_at);
      const dataFormatadaExibicao = formatarDataParaExibicao(selectedSlot.start_at);
      const dataHoraCompleta = formatarDataHoraCompleta(selectedSlot.start_at);
      
      const agendamentoData = {
        servico_id: parseInt(selectedService),
        data_agendamento: dataFormatadaBackend,
        observacoes: observations,
        nome_cliente: customerName,
        email_cliente: customerEmail,
        usuario_id: userInfo.id || null
      };

      console.log('📅 Dados do agendamento:', {
        slotOriginal: selectedSlot.start_at,
        dataBackend: dataFormatadaBackend,
        dataExibicao: dataFormatadaExibicao,
        dataHoraCompleta: dataHoraCompleta
      });

      const resultadoBackend = await salvarAgendamentoBackend(agendamentoData);

      const selectedServiceObj = services.find(service => service.id.toString() === selectedService);
      
      // Criar objeto com datas formatadas corretamente
      const agendamentoCompleto = {
        ...resultadoBackend.agendamento,
        servico_nome: selectedServiceObj?.nome || 'Serviço Pet',
        valor_total: parseFloat(selectedServiceObj?.preco || 0),
        nome_cliente: customerName,
        email_cliente: customerEmail,
        // DATAS FORMATADAS CORRETAMENTE PARA EXIBIÇÃO
        data_formatada: dataFormatadaExibicao, // "04/12/2025"
        horario_formatado: formatTime(selectedSlot.start_at), // "14:00"
        data_hora_completa: dataHoraCompleta, // "04/12/2025 14:00"
        data_original_iso: selectedSlot.start_at, // ISO para referência
        data_backend: dataFormatadaBackend, // Formato do backend
        status: 'pendente'
      };

      console.log('📋 Dados enviados para PaymentModal:', agendamentoCompleto);

      // Marcar horário como ocupado localmente
      const novoOcupado = new Date(selectedSlot.start_at).toISOString();
      setHorariosOcupados(prev => [...prev, novoOcupado]);

      setAgendamentoParaPagamento(agendamentoCompleto);
      setShowPayment(true);
      setMessage('');
      
    } catch (error) {
      console.error('❌ ERRO NO AGENDAMENTO:', error);
      if (error.message.includes('Horário já ocupado')) {
        await loadHorariosOcupados();
        await loadSlots();
        setMessage('❌ Este horário foi ocupado enquanto você agendava. Por favor, selecione outro.');
      } else {
        setMessage(`❌ Erro: ${error.message || 'Tente novamente.'}`);
      }
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const resetForm = () => {
    setCustomerName(userInfo.nome || '');
    setCustomerEmail(userInfo.email || '');
    setObservations('');
    setSelectedSlot(null);
    setMessage('');
    
    // Resetar data para amanhã
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const defaultDate = `${year}-${month}-${day}`;
    setSelectedDate(defaultDate);
    
    // Recarregar slots
    loadSlots();
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    } catch (error) {
      return '--:--';
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.ocupado || loading) {
      return;
    }
    
    console.log('🎯 Slot selecionado:', {
      horario: formatTime(slot.start_at),
      dataCompleta: formatarDataHoraCompleta(slot.start_at),
      dataExibicao: formatarDataParaExibicao(slot.start_at)
    });
    setSelectedSlot(slot);
  };

  const selectedServiceObj = services.find(service => service.id.toString() === selectedService);

  const token = localStorage.getItem('token');
  if (!token) {
    return (
      <div className="booking-form-container">
        <div className="booking-container">
          <button onClick={() => navigate('/')} className="back-button">
            ← Voltar para Home
          </button>
          <h2 className="booking-title">Agende um serviço</h2>
          <div className="booking-login-required">
            <div className="login-message">
              <h3>🔐 Login Necessário</h3>
              <p>Você precisa estar logado para agendar serviços.</p>
              <button onClick={() => navigate('/login')} className="booking-button primary">
                Fazer Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-form-container">
      <div className="booking-container">
        <button onClick={() => navigate('/')} className="back-button">
          ← Voltar para Home
        </button>

        <h2 className="booking-title">Agende um serviço</h2>

        {message && (
          <div className={`booking-message ${message.includes('❌') ? 'booking-error' : 'booking-success'}`}>
            {message}
          </div>
        )}

        <div className="booking-form-group">
          <label className="booking-label">Serviço *</label>
          <select 
            value={selectedService} 
            onChange={(e) => setSelectedService(e.target.value)}
            className="booking-select"
            disabled={loading}
          >
            <option value="">Selecione um serviço</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.nome} - {formatPrice(service.preco)} ({service.duracao_minutos} min)
              </option>
            ))}
          </select>
          {selectedServiceObj && (
            <p className="booking-service-description">{selectedServiceObj.descricao}</p>
          )}
        </div>

        <div className="booking-form-group">
          <label className="booking-label">Data *</label>
          <div className="booking-flex booking-gap-2">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
              className="booking-input"
              disabled={loading}
            />
            <button 
              onClick={loadSlots}
              className="booking-button secondary"
              disabled={loading || !selectedDate || !selectedService}
            >
              {slotsLoading ? 'Carregando...' : 'Carregar Horários'}
            </button>
          </div>
        </div>

        <div className="booking-form-group">
          <label className="booking-label">Horários disponíveis *</label>
          
          <div style={{ marginBottom: '10px' }}>
            <button 
              onClick={loadHorariosOcupados}
              className="booking-button secondary small"
              disabled={slotsLoading}
            >
              🔄 Atualizar
            </button>
            <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
              {slots.filter(s => !s.ocupado).length} de {slots.length} horários disponíveis
            </span>
          </div>
          
          {slotsLoading ? (
            <div className="booking-loading">Carregando horários...</div>
          ) : (
            <div className="booking-slots-container">
              {slots.length === 0 ? (
                <div className="booking-no-slots">
                  {selectedDate && selectedService ? 'Nenhum horário disponível' : 'Selecione data e serviço'}
                </div>
              ) : (
                slots.map((slot, index) => {
                  const ocupado = slot.ocupado;
                  const selecionado = selectedSlot?.start_at === slot.start_at;
                  
                  return (
                    <div
                      key={index}
                      className={`booking-slot 
                        ${ocupado ? 'booking-slot-ocupado' : ''} 
                        ${selecionado ? 'booking-slot-selected' : ''}
                        ${!ocupado ? 'booking-slot-disponivel' : ''}`}
                      onClick={() => handleSlotClick(slot)}
                      title={ocupado ? 
                        `⛔ Horário ocupado - ${formatTime(slot.start_at)}` : 
                        selecionado ? `✅ Selecionado - ${formatTime(slot.start_at)}` : `⏰ Disponível - ${formatTime(slot.start_at)}`}
                    >
                      {ocupado && <span className="slot-indicator ocupado">⛔</span>}
                      {!ocupado && selecionado && <span className="slot-indicator selecionado">✅</span>}
                      {!ocupado && !selecionado && <span className="slot-indicator disponivel">⏰</span>}
                      {formatTime(slot.start_at)}
                      {ocupado && <span className="slot-badge">OCUPADO</span>}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="booking-form-group">
          <label className="booking-label">Seu nome *</label>
          <input 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="booking-input" 
            placeholder="Digite seu nome completo"
            disabled={loading}
          />
        </div>

        <div className="booking-form-group">
          <label className="booking-label">Seu e-mail *</label>
          <input 
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="booking-input" 
            placeholder="seu@email.com" 
            type="email"
            disabled={loading}
          />
        </div>

        <div className="booking-form-group">
          <label className="booking-label">Observações (opcional)</label>
          <textarea 
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="booking-textarea" 
            placeholder="Alguma observação especial sobre seu pet..."
            rows="3"
            disabled={loading}
          />
        </div>

        {selectedServiceObj && selectedSlot && !selectedSlot.ocupado && (
          <div className="booking-summary">
            <h3>Resumo do Agendamento</h3>
            <div className="booking-summary-content">
              <p><strong>Serviço:</strong> {selectedServiceObj.nome}</p>
              <p><strong>Valor:</strong> {formatPrice(selectedServiceObj.preco)}</p>
              <p><strong>Data:</strong> {formatarDataParaExibicao(selectedSlot.start_at)}</p>
              <p><strong>Horário:</strong> {formatTime(selectedSlot.start_at)}</p>
              <p><strong>Duração:</strong> {selectedServiceObj.duracao_minutos} minutos</p>
            </div>
          </div>
        )}

        <div className="booking-actions">
          <button 
            onClick={handleBooking}
            className="booking-button primary"
            disabled={loading || !selectedSlot || !customerName || !customerEmail || !selectedService || selectedSlot?.ocupado}
          >
            {loading ? 'Salvando...' : 'Confirmar Agendamento'}
          </button>
        </div>

        <PaymentModalMP
          isOpen={showPayment}
          onClose={handlePaymentClose}
          onCancel={handlePaymentCancel} // Passar função de cancelamento se suportado
          agendamento={agendamentoParaPagamento}
          tipo="agendamento"
        />
      </div>
    </div>
  );
};

export default BookingForm;