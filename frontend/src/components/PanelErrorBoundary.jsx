import { Component } from "react";
import { useLocation, useNavigate } from "react-router-dom";

class PanelErrorBoundaryBase extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { if (import.meta.env.DEV) console.error("Error al renderizar el panel:", error); }
  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <section className="m-4 rounded-[2px] border border-rojo/40 bg-[var(--snow)] p-6 text-center shadow-sm dark:bg-[var(--noir-soft)] md:m-6">
      <i className="bi bi-exclamation-triangle text-3xl text-[var(--gold)]" />
      <h1 className="mt-3 font-display text-xl font-semibold text-[var(--noir)] dark:text-[var(--snow)]">Ocurrió un error al mostrar esta sección</h1>
      <p className="mt-2 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">La sesión continúa activa. Puedes intentar cargar nuevamente la página.</p>
      <div className="mt-5 flex justify-center gap-3"><button type="button" onClick={() => this.setState({ error: null })} className="rounded-[2px] bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--noir)]">Reintentar</button><button type="button" onClick={this.props.goDashboard} className="rounded-[2px] border border-[var(--border-gold-40)] px-4 py-2 text-sm font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Ir al Dashboard</button></div>
    </section>;
  }
}

export default function PanelErrorBoundary({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  return <PanelErrorBoundaryBase resetKey={location.pathname} goDashboard={() => navigate("/dashboard")}>{children}</PanelErrorBoundaryBase>;
}
