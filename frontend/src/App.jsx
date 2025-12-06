import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

import Intro from './components/Intro';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

import Home from './pages/Home/Home';
import LoginForm from './components/Login';
import RegisterForm from './components/RegisterForm';
import Logout from './components/Logout';
import BookingForm from './components/BookingForm';
import Admin from './components/Admin';
import Success from './components/Success';
import Cancel from './components/Cancel';
import History from './components/History';
import Curiosidades from './pages/Curiosidades/curiosidades';
import PaymentSuccess from './components/PaymentSuccess';
import CartModal from './components/CartModal';
import FloatingCart from './components/FloatingCart';
import FloatingAi from './components/FloatingAI';

export const ApiContext = React.createContext();

const ScrollHandler = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' && location.state?.scrollTo) {
      const { scrollTo } = location.state;

      const scrollTimeout = setTimeout(() => {
        const targetId = scrollTo === 'products' ? 'link_produtos' : 'link_reservas';
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          setTimeout(() => {
            const retryElement = document.getElementById(targetId);
            if (retryElement) {
              retryElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }, 1000);
        }
      }, 300);

      return () => clearTimeout(scrollTimeout);
    }
  }, [location]);

  return null;
};

// Componente para renderizar elementos flutuantes condicionalmente
const FloatingElementsWrapper = ({ cartItemsCount, onCartClick }) => {
  const location = useLocation();
  
  // Rotas onde os elementos flutuantes NÃO devem aparecer
  const hiddenRoutes = ['/login', '/register'];
  
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }
  
  return (
    <>
      <FloatingCart
        itemCount={cartItemsCount}
        onClick={onCartClick}
      />
      <FloatingAi />
    </>
  );
};

function App() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? saved === "true" : false;
  });

  const [cartItems, setCartItems] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para controlar quando mostrar a intro
  const [shouldShowIntro, setShouldShowIntro] = useState(true);

  useEffect(() => {
    // Verifica se já mostrou a intro nesta sessão
    const hasShownIntro = sessionStorage.getItem('hasShownIntro');
    const comingFromIA = sessionStorage.getItem('comingFromIA');
    
    // Se está voltando da IA, não mostra intro
    if (comingFromIA) {
      setShouldShowIntro(false);
      sessionStorage.removeItem('comingFromIA');
      sessionStorage.setItem('hasShownIntro', 'true');
    } 
    // Se nunca mostrou, mostra
    else if (!hasShownIntro) {
      setShouldShowIntro(true);
      
      // Mostra a intro apenas por 3 segundos
      const timer = setTimeout(() => {
        setShouldShowIntro(false);
        sessionStorage.setItem('hasShownIntro', 'true');
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShouldShowIntro(false);
    }
    
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const usuario_id = localStorage.getItem('usuario_id');
      const usuario_nome = localStorage.getItem('usuario_nome');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.usuario);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario_id');
        localStorage.removeItem('usuario_nome');
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, senha) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario_id', data.usuario.id);
        localStorage.setItem('usuario_nome', data.usuario.nome);
        setUser(data.usuario);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Erro de conexão com o servidor' };
    }
  };

  const handleRegister = async (nome, email, senha) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, email, senha })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario_id', data.usuario.id);
        localStorage.setItem('usuario_nome', data.usuario.nome);
        setUser(data.usuario);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Erro de conexão com o servidor' };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('carrinho');
    setUser(null);
  };

  useEffect(() => {
    const savedCart = localStorage.getItem('carrinho');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
      } catch (error) {
        setCartItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('carrinho', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    if (!product || !product.nome) return;

    setCartItems(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id || item.nome === product.nome);
      let updatedCart;

      if (existingItem) {
        updatedCart = prevCart.map(item =>
          (item.id === product.id || item.nome === product.nome)
            ? {
                ...item,
                quantidade: (item.quantidade || 0) + (product.quantidade || 1)
              }
            : item
        );
      } else {
        updatedCart = [...prevCart, {
          ...product,
          quantidade: product.quantidade || 1
        }];
      }

      return updatedCart;
    });
  };

  const updateCartItem = (productName, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productName);
      return;
    }

    setCartItems(prevCart => prevCart.map(item =>
      item.nome === productName
        ? { ...item, quantidade: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productName) => {
    setCartItems(prevCart => prevCart.filter(item => item.nome !== productName));
  };

  const limparCarrinhoCompleto = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (item.quantidade || 0), 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.preco || 0) * (item.quantidade || 0);
    }, 0);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
  };

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const apiContextValue = {
    API_BASE_URL,
    user,
    loading,
    onLogin: handleLogin,
    onRegister: handleRegister,
    onLogout: handleLogout
  };

  return (
    <ApiContext.Provider value={apiContextValue}>
      <Router>
        <ScrollHandler />
        
        <div className="App">
          {/* Renderiza Intro condicionalmente */}
          {shouldShowIntro && <Intro />}
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={
                <Home
                  onAddToCart={addToCart}
                  darkMode={darkMode}
                  toggleDarkMode={toggleDarkMode}
                  onCartClick={() => setShowCartModal(true)}
                  cartItemsCount={getTotalItems()}
                  user={user}
                  onLogout={handleLogout}
                />
              } />

              <Route path="/curiosidades" element={
                <>
                  <Header
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    cartItemsCount={getTotalItems()}
                    onCartClick={() => setShowCartModal(true)}
                    user={user}
                    onLogout={handleLogout}
                  />
                  <Curiosidades onAddToCart={addToCart} />
                  <Footer />
                </>
              } />

              <Route path="/agendar" element={
                <>
                  <Header
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    cartItemsCount={getTotalItems()}
                    onCartClick={() => setShowCartModal(true)}
                    user={user}
                    onLogout={handleLogout}
                  />
                  <BookingForm
                    user={user}
                    onAddToCart={addToCart}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    onCartClick={() => setShowCartModal(true)}
                    cartItemsCount={getTotalItems()}
                    onLogout={handleLogout}
                  />
                  <Footer />
                </>
              } />

              <Route path="/payment-success" element={
                <>
                  <Header
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    cartItemsCount={getTotalItems()}
                    onCartClick={() => setShowCartModal(true)}
                    user={user}
                    onLogout={handleLogout}
                  />
                  <PaymentSuccess />
                  <Footer />
                </>
              } />

              <Route path="/success" element={
                <>
                  <Header
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    cartItemsCount={getTotalItems()}
                    onCartClick={() => setShowCartModal(true)}
                    user={user}
                    onLogout={handleLogout}
                  />
                  <Success />
                  <Footer />
                </>
              } />

              <Route path="/cancel" element={
                <>
                  <Header
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    cartItemsCount={getTotalItems()}
                    onCartClick={() => setShowCartModal(true)}
                    user={user}
                    onLogout={handleLogout}
                  />
                  <Cancel />
                  <Footer />
                </>
              } />

              <Route path="/admin" element={
                <>
                  <Header
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    cartItemsCount={getTotalItems()}
                    onCartClick={() => setShowCartModal(true)}
                    user={user}
                    onLogout={handleLogout}
                  />
                  <Admin />
                  <Footer />
                </>
              } />

              <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
              <Route path="/register" element={<RegisterForm onRegister={handleRegister} />} />

              <Route path="/logout" element={
                <>
                  <Header
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    cartItemsCount={getTotalItems()}
                    onCartClick={() => setShowCartModal(true)}
                    user={user}
                    onLogout={handleLogout}
                  />
                  <Logout onLogout={handleLogout} />
                  <Footer />
                </>
              } />

              <Route path="/historico" element={
                <>
                  <Header
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    cartItemsCount={getTotalItems()}
                    onCartClick={() => setShowCartModal(true)}
                    user={user}
                    onLogout={handleLogout}
                  />
                  <History user={user} />
                  <Footer />
                </>
              } />
            </Routes>
          </main>

          {/* Renderiza elementos flutuantes (exceto em login/register) */}
          <FloatingElementsWrapper
            cartItemsCount={getTotalItems()}
            onCartClick={() => setShowCartModal(true)}
          />

          {/* CartModal global */}
          <CartModal
            show={showCartModal}
            onHide={() => setShowCartModal(false)}
            cartItems={cartItems}
            onUpdateItem={updateCartItem}
            onRemoveItem={removeFromCart}
            onLimparCarrinho={limparCarrinhoCompleto}
            totalPrice={getTotalPrice()}
            user={user}
          />
        </div>
      </Router>
    </ApiContext.Provider>
  );
}

export default App;