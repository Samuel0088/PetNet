import React, { useState, useEffect } from 'react';
import '../styles/Intro.css';

const Intro = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Verifica se já mostrou a intro nesta sessão
    const hasShownIntro = sessionStorage.getItem('hasShownIntro');
    
    if (hasShownIntro) {
      setIsVisible(false);
      return;
    }

    // Inicia animação de saída após 2 segundos
    const startAnimationTimer = setTimeout(() => {
      setIsAnimating(true);
    }, 2000);

    // Remove completamente após animação
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('hasShownIntro', 'true');
      // Garante que o scroll seja liberado
      document.body.style.overflow = 'auto';
    }, 3000); // 2000ms + 1000ms de animação

    // Bloqueia scroll durante a intro
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(startAnimationTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = 'auto'; // Cleanup
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`intro ${isAnimating ? 'fade-out' : ''}`}>
      <img src="/imagens/logo.png" alt="Pet.Net" className="img-fluid" width="300" />
    </div>
  );
};

export default Intro;