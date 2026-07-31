import { useRef, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PanelErrorBoundary from "./PanelErrorBoundary";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tirandoParaActualizar, setTirandoParaActualizar] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [distanciaTiro, setDistanciaTiro] = useState(0);
  const [versionSeccion, setVersionSeccion] = useState(0);
  const inicioTiro = useRef(null);
  const tirandoRef = useRef(false);
  const distanciaRef = useRef(0);
  const mainRef = useRef(null);
  const UMBRAL_ACTUALIZAR = 22;

  const iniciarTiro = (clientY) => {
    if (actualizando || (mainRef.current?.scrollTop ?? 0) > 1) return;
    inicioTiro.current = clientY;
    tirandoRef.current = true;
    setTirandoParaActualizar(true);
  };

  const moverTiro = (clientY, event) => {
    if (!tirandoRef.current || inicioTiro.current === null || actualizando) return;
    const delta = clientY - inicioTiro.current;
    if (delta <= 0) {
      distanciaRef.current = 0;
      setDistanciaTiro(0);
      return;
    }
    event.preventDefault();
    const distancia = Math.min(UMBRAL_ACTUALIZAR + 18, delta * 0.72);
    distanciaRef.current = distancia;
    setDistanciaTiro(distancia);
  };

  const actualizarSeccion = () => {
    if (actualizando) return;
    setActualizando(true);
    setDistanciaTiro(UMBRAL_ACTUALIZAR);
    window.setTimeout(() => {
      setVersionSeccion((version) => version + 1);
      setDistanciaTiro(0);
      distanciaRef.current = 0;
      setActualizando(false);
    }, 320);
  };

  const terminarTiro = () => {
    if (!tirandoRef.current) return;
    const debeActualizar = distanciaRef.current >= UMBRAL_ACTUALIZAR;
    tirandoRef.current = false;
    setTirandoParaActualizar(false);
    inicioTiro.current = null;
    if (!debeActualizar) {
      distanciaRef.current = 0;
      setDistanciaTiro(0);
      return;
    }
    actualizarSeccion();
  };

  return (
    <div className="flex h-screen font-poppins overflow-hidden w-full transition-colors duration-300 bg-[var(--snow)] dark:bg-[var(--noir-soft)]">
      
      {sidebarOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        onClick={() => setSidebarOpen(false)}
      />
    )}

    <div
      className={`
        fixed lg:static inset-y-0 left-0 z-40
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      <Sidebar onCerrar={() => setSidebarOpen(false)} />
    </div>
 

      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen((open) => !open)} onActualizar={actualizarSeccion} actualizando={actualizando} />
        
        <main
          ref={mainRef}
          className="relative flex-1 overflow-y-auto overscroll-y-contain"
          onTouchStart={(event) => iniciarTiro(event.touches[0]?.clientY)}
          onTouchMove={(event) => moverTiro(event.touches[0]?.clientY ?? 0, event)}
          onTouchEnd={terminarTiro}
          onTouchCancel={terminarTiro}
          onMouseDown={(event) => iniciarTiro(event.clientY)}
          onMouseMove={(event) => { if (event.buttons === 1) moverTiro(event.clientY, event); }}
          onMouseUp={terminarTiro}
          onMouseLeave={terminarTiro}
        >
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center transition-opacity ${distanciaTiro > 0 || actualizando ? "opacity-100" : "opacity-0"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-[var(--snow)] shadow-md dark:bg-[var(--noir)] ${actualizando ? "animate-spin" : ""}`}
              style={{ transform: `translateY(${Math.max(6, Math.min(distanciaTiro, UMBRAL_ACTUALIZAR + 8))}px) rotate(${actualizando ? 0 : distanciaTiro * 4}deg)` }}
            >
              <span className="h-4 w-4 rounded-full border-2 border-[var(--gold)] border-t-transparent" />
            </div>
          </div>
          <div key={versionSeccion} className="contents">
            <PanelErrorBoundary>{children}</PanelErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
