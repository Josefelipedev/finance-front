export default function SidebarWidget() {
  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]
      `}
    >
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Planos em breve</h3>

      <p className="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
        Estamos preparando planos personalizados para oferecer a melhor experiência para você.
      </p>

      <div className="flex items-center justify-center p-3 font-medium text-gray-400 rounded-lg bg-gray-200 text-theme-sm dark:bg-white/[0.06] dark:text-gray-500 cursor-not-allowed">
        Em desenvolvimento
      </div>
    </div>
  );
}
