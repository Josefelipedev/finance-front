import { useCallback, useEffect, useState } from 'react';
import { usePlanning } from '../../../hooks/usePlanning';
import YearPlanTab from './YearPlanTab';

/**
 * Quanto se decide gastar em cada categoria, por ano.
 *
 * É o mesmo gesto dos limites mensais que vivem ao lado, com outro horizonte —
 * e é por serem o mesmo gesto que passaram a ser duas abas do Orçamento. Um
 * limite de 400 por mês e um plano de 4.800 no ano são a mesma decisão dita de
 * duas maneiras, e vê-las em ecrãs diferentes escondia quando se contradiziam.
 */
export default function YearPlanPanel() {
  const [year, setYear] = useState(() => new Date().getFullYear() + 1);
  const { yearPlan, isLoading, isSaving, loadYearPlan, saveYearPlan, deleteYearPlanItem } =
    usePlanning();

  const refresh = useCallback(
    (y: number) => loadYearPlan(y).catch(() => {}),
    [loadYearPlan],
  );

  useEffect(() => {
    void refresh(year);
  }, [refresh, year]);

  return (
    <YearPlanTab
      yearPlan={yearPlan}
      year={year}
      isLoading={isLoading}
      isSaving={isSaving}
      onChangeYear={setYear}
      onSave={async (y, items) => {
        await saveYearPlan(y, items);
      }}
      onDeleteItem={async (y, categoryId) => {
        await deleteYearPlanItem(y, categoryId);
        await refresh(y);
      }}
    />
  );
}
