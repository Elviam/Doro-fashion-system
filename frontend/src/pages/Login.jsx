import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import bgImage from '../assets/login.png';
import Toast from '../components/Toast';
import ModalResetPassword from '../components/ModalResetPassword';
import ModalValidateCode from '../components/ModalValidateCode';
import ModalUserNotFound from '../components/ModalUserNotFound';
import { useAuth } from '../hooks/useAuth';
import useTitulo from '../hooks/useTitulo';

const loginSchema = z.object({
  usuario: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria')
});

export default function Login() {
  useTitulo("Iniciar Sesión");
  const navigate = useNavigate();
  const { login, usuario: usuarioDelContexto, token } = useAuth();
  
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState({ message: "", type: "error" });
  
  const [usuarioLogeado, setUsuarioLogeado] = useState(null);
  const [resetPasswordState, setResetPasswordState] = useState({
    step: null,
    usuario: null
  });

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  useEffect(() => {
    if (token && usuarioDelContexto) {
      const userRole = usuarioDelContexto?.roleId || usuarioDelContexto?.role;
      if (userRole === 'CLIENTE') {
        navigate('/tienda', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [token, usuarioDelContexto, navigate]);

  useEffect(() => {
    if (usuarioLogeado && usuarioDelContexto) {
      const userRole = usuarioDelContexto?.roleId || usuarioDelContexto?.role;
      if (userRole === 'CLIENTE') {
        navigate('/tienda', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [usuarioDelContexto, usuarioLogeado, navigate]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: data.usuario,
          password: data.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Credenciales incorrectas. Verifica tus datos.');
      }

      login(result.token, result.user ?? {});
      setUsuarioLogeado(result.user ?? {});
      navigate('/dashboard');

    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (e) => {
    e.preventDefault();
    setResetPasswordState({ step: null, usuario: null });
    document.getElementById('reset_password_usuario_modal').showModal();
  };

  const handleResetPasswordFlow = (usuario, step) => {
    if (step === 'ADMIN_REQUIRED') {
      document.getElementById('reset_password_usuario_modal').close();
      document.getElementById('forgot_password_modal').showModal();
      setResetPasswordState({ step: 'ADMIN_REQUIRED', usuario: null });
    } else if (step === 'CLIENTE' && usuario) {
      setResetPasswordState({ step: 'CLIENTE', usuario });
      document.getElementById('reset_password_usuario_modal').close();
      document.getElementById('validate_code_modal').showModal();
    } else if (!usuario) {
      document.getElementById('reset_password_usuario_modal').close();
      document.getElementById('user_not_found_modal').showModal();
      setResetPasswordState({ step: 'NOT_FOUND', usuario: null });
    }
  };

  const closeResetPasswordModals = () => {
    document.getElementById('reset_password_usuario_modal')?.close();
    document.getElementById('validate_code_modal')?.close();
    document.getElementById('forgot_password_modal')?.close();
    document.getElementById('user_not_found_modal')?.close();
    setResetPasswordState({ step: null, usuario: null });
  };

  const handleResetSuccess = () => {
    closeResetPasswordModals();
    setToast({ message: 'Tu contraseña ha sido actualizada. Inicia sesión con tu nueva contraseña.', type: 'success' });
  };

  return (
    <div className="flex min-h-screen relative overflow-x-hidden w-full box-border bg-oscuro">
      
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: "", type: "error" })} 
      />

      <ModalResetPassword 
        onClose={closeResetPasswordModals}
        onUserSubmitted={handleResetPasswordFlow}
      />
      <ModalValidateCode 
        usuario={resetPasswordState.usuario}
        onClose={closeResetPasswordModals}
        onSuccess={handleResetSuccess}
      />
      <ModalUserNotFound 
        onClose={closeResetPasswordModals}
      />

      <div className="hidden lg:block lg:w-1/2 relative select-none">
        <img 
          src={bgImage} 
          alt="Aura Storefront" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute top-8 left-12 text-lila text-4xl lg:text-5xl font-cinzel tracking-widest drop-shadow-md">
          <Link to="/">A U R A</Link>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center text-lila p-4 sm:p-8 md:p-12 relative min-h-screen box-border">
        
        <div className="md:hidden absolute top-6 left-6 text-lila text-2xl font-cinzel tracking-widest select-none">
          <Link to="/">AURA</Link>
        </div>

        <div className="w-full max-w-md text-center z-10 py-12 md:py-0">
          <h2 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl tracking-[-0.02em] text-lila mb-4 md:mb-6">
            Iniciar Sesión
          </h2>

          <p className="font-poppins text-xs sm:text-sm tracking-widest uppercase mb-8 md:mb-12 opacity-80">
            Bienvenido de nuevo
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="text-left space-y-5 md:space-y-6 w-full box-border">
            
            <div className="flex flex-col w-full">
              <label className="mb-1.5 font-poppins text-base md:text-lg text-lila tracking-[-0.02em]">
                Usuario
              </label>
              <input 
                type="text"
                {...register('usuario')}
                disabled={isSubmitting || loading}
                autoComplete="username"
                className={`w-full p-3 bg-lila text-oscuro font-medium outline-none rounded-xl focus:ring-2 focus:ring-lila focus:ring-offset-2 focus:ring-offset-oscuro transition-all text-sm sm:text-base box-border ${formErrors.usuario ? 'ring-2 ring-rojo' : 'border border-transparent'}`}
              />
              {formErrors.usuario && <span className="text-rojo text-xs sm:text-sm mt-1.5 font-poppins font-semibold">{formErrors.usuario.message}</span>}
            </div>

            <div className="flex flex-col w-full">
              <label className="mb-1.5 font-poppins text-base md:text-lg text-lila tracking-[-0.02em]">
                Contraseña
              </label>
              <input 
                type={showPass ? "text" : "password"}
                {...register('password')}
                disabled={isSubmitting || loading}
                autoComplete="current-password"
                className={`w-full p-3 bg-lila text-oscuro font-medium outline-none rounded-xl focus:ring-2 focus:ring-lila focus:ring-offset-2 focus:ring-offset-oscuro transition-all text-sm sm:text-base box-border ${formErrors.password ? 'ring-2 ring-rojo' : 'border border-transparent'}`}
              />
              {formErrors.password && <span className="text-rojo text-xs sm:text-sm mt-1.5 font-poppins font-semibold">{formErrors.password.message}</span>}
            </div>

            <div className="pt-4 flex justify-center w-full">
              <button 
                type="submit" 
                disabled={isSubmitting || loading}
                className="w-full h-12 flex justify-center items-center gap-2 bg-transparent border border-lila rounded-xl text-lila font-poppins text-sm md:text-base tracking-widest hover:bg-lila hover:text-oscuro transition-all cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isSubmitting || loading ? 'Cargando...' : 'Iniciar Sesión'}
              </button>
            </div>

            <div className="text-center mt-4">
              <Link 
                to="#" 
                onClick={openModal}
                className="font-poppins text-xs sm:text-sm opacity-70 hover:opacity-100 transition-opacity"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            
            <div className="text-center mt-3">
              <span className="font-poppins text-xs sm:text-sm opacity-60">¿No tienes cuenta? </span>
              <Link 
                to="/Register"
                className="font-poppins text-xs sm:text-sm text-lila opacity-80 hover:opacity-100 transition-opacity underline underline-offset-2 font-semibold">
                Regístrate
              </Link>
            </div>
          </form>
        </div>

        <div className="absolute bottom-6 font-poppins text-[10px] sm:text-xs tracking-widest uppercase opacity-60 text-center w-full px-4 left-0 z-10 box-border select-none pointer-events-none">
          Compromiso con nuestros clientes
        </div>

      </div>

      <dialog id="forgot_password_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-[#1A1730]/95 backdrop-blur-md border border-lila/20 text-lila p-6 sm:p-10 max-w-lg w-full rounded-t-2xl sm:rounded-2xl shadow-2xl box-border">
          <form method="dialog">
            <button 
              type="button"
              onClick={closeResetPasswordModals}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 sm:right-6 sm:top-6 text-lg"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </form>

          <div className="mb-6 flex justify-center sm:justify-start">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-lila flex items-center justify-center">
              <i className="bi bi-lock text-xl sm:text-2xl"></i>
            </div>
          </div>

          <h3 className="font-poppins text-xl sm:text-2xl tracking-widest border-b border-lila/20 pb-3 mb-6 leading-snug text-center sm:text-left font-bold">
            RECUPERACIÓN DE <br className="hidden sm:block"/> CONTRASEÑA
          </h3>

          <div className="font-poppins space-y-4 text-xs sm:text-sm leading-relaxed text-center sm:text-left opacity-90">
            <p>
              Por políticas de seguridad del sistema, el restablecimiento de contraseñas es gestionado exclusivamente por el administrador del sistema.
            </p>
            <p>
              Para obtener nuevas credenciales de acceso, comuníquese con el área de Sistemas o Soporte Técnico de su organización.
            </p>
          </div>

          <div className="mt-6 border-l-2 border-lila/40 pl-3 sm:pl-4 font-poppins text-xs text-left opacity-70">
            <p>Si desconoce quién es el administrador asignado,</p>
            <p>contacte al responsable de su área o departamento.</p>
          </div>

          <div className="mt-8 font-cinzel tracking-widest text-lg sm:text-xl opacity-80 text-center sm:text-left select-none">
            A U R A
          </div>
        </div>
        
        <form method="dialog" className="modal-backdrop bg-black/60 backdrop-blur-sm">
          <button onClick={closeResetPasswordModals}>cerrar</button>
        </form>
      </dialog>

    </div>
  );
}