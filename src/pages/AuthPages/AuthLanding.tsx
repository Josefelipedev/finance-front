import { useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import AuthLayout from './AuthPageLayout';
import Button from '../../components/ui/button/Button';
import { CheckCircleIcon, DollarLineIcon, ShootingStarIcon } from '../../icons';

export default function AuthLanding() {
  const navigate = useNavigate();

  return (
    <>
      <PageMeta
        title="FinPlot | Bem-vindo"
        description="Tela inicial para acesso ao FinPlot."
      />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="w-full max-w-md pt-10 mx-auto" />
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800 dark:text-white/90">
                Controle suas financas com clareza
              </h1>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Escolha como voce quer entrar e acompanhe seu dinheiro em um
                unico lugar.
              </p>

              <div className="grid gap-3 mt-8 sm:grid-cols-2">
                <Button onClick={() => navigate('/signin')}>Entrar</Button>
                <Button variant="outline" onClick={() => navigate('/signup')}>
                  Criar conta
                </Button>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 text-brand-600 dark:bg-white/10 dark:text-white/80">
                    <DollarLineIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-white/80">
                      Organize receitas e despesas
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Acompanhe categorias e metas sem planilhas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 text-brand-600 dark:bg-white/10 dark:text-white/80">
                    <CheckCircleIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-white/80">
                      Alertas e lembretes
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Seja avisado sobre vencimentos importantes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 text-brand-600 dark:bg-white/10 dark:text-white/80">
                    <ShootingStarIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-white/80">
                      Visao rapida do seu saldo
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Dashboard simples para decidir com confiança.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
