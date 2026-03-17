import { CheckCircle2, CalendarCheck, FileCheck } from "lucide-react";

interface WeeklyProductivityProps {
  tasksCompleted: number;
  appointmentsConfirmed: number;
  invoicesSettled: number;
}

const WeeklyProductivity = ({ tasksCompleted, appointmentsConfirmed, invoicesSettled }: WeeklyProductivityProps) => {
  const stats = [
    {
      label: "Tâches complétées",
      value: tasksCompleted,
      icon: CheckCircle2,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      label: "Rendez-vous confirmés",
      value: appointmentsConfirmed,
      icon: CalendarCheck,
      color: "text-accent",
      bg: "bg-accent/10 border-accent/20",
    },
    {
      label: "Factures réglées",
      value: invoicesSettled,
      icon: FileCheck,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
  ];

  return (
    <div>
      <h3 className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">
        Productivité de la semaine
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`border rounded-xl p-2.5 sm:p-4 text-center ${stat.bg}`}>
            <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} mx-auto mb-1 sm:mb-2`} />
            <p className="font-display text-xl sm:text-2xl font-bold">{stat.value}</p>
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyProductivity;
