export default function Encabezado({ titulo, tabs }) {

  return (
    <>
      <div
        className=" top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 -mt-3 sm:-mt-4 lg:-mt-5
          px-4 sm:px-6 lg:px-8 pt-3 sm:pt-3.5 lg:pt-4 pb-2
          flex flex-col sm:flex-row sm:items-center justify-between gap-4
          bg-[var(--snow)]/95 dark:bg-[var(--noir-soft)]/95 backdrop-blur-sm
          "
      >
        {/* Lado Izquierdo: Título */}
        <h1 className="text-2xl lg:text-3xl font-display font-extrabold tracking-widest text-[var(--noir)] dark:text-[var(--snow)] uppercase m-0 transition-colors duration-300">
          {titulo}
        </h1>

        {/* Lado Derecho: Pestañas (solo sm+) */}
        {tabs && tabs.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] bg-[var(--gold-08)] shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={tab.onClick}
                className={`px-3.5 py-2 text-xs lg:text-sm font-bold font-body rounded-[1px] transition-all duration-300 cursor-pointer active:scale-95 ${
                  tab.active
                    ? "bg-[var(--gold)] text-[var(--noir)]"
                    : "bg-transparent text-[var(--gold-dark)] dark:text-[var(--gold-light)] hover:bg-[var(--gold-15)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pestañas en móvil: barra fija tipo Facebook, pegada abajo de la pantalla */}
      {tabs && tabs.length > 0 && (
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 z-20 flex
            bg-[var(--snow)]/95 dark:bg-[var(--noir-soft)]/95 backdrop-blur-sm
            border-t border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]
            pb-[env(safe-area-inset-bottom)]"
        >
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={tab.onClick}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-bold font-body transition-colors duration-300 cursor-pointer active:scale-95 ${
                tab.active
                  ? "text-[var(--gold-dark)] dark:text-[var(--gold-light)]"
                  : "text-[var(--noir-soft)]/70 dark:text-[var(--ash)]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  tab.active ? "bg-[var(--gold)]" : "bg-transparent"
                }`}
              />
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}