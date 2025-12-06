import React from 'react';
import '../styles/FloatingAI.css';  

const FloatingAI = () => {
  const handleClick = (e) => {
    // Salva no sessionStorage que estamos indo para IA
    sessionStorage.setItem('comingFromIA', 'true');
    // O link normal seguirá normalmente
  };

  return (
    <div id="floating-icon-container">
      <a href="/IA/index.html" id="floating-icon-link" onClick={handleClick}>  
        <img src="/IA/imagem/icon-pata.png" alt="Assistente IA Pet.Net" id="floating-icon"/>  
      </a>
    </div>
  );
};

export default FloatingAI;