export interface ReminderSettings {
    email: string;
    days: number[];           // days before deadline, e.g. [7, 3, 1]
    obligationIds: string[] | null; // null = all non-ad-hoc obligations
    enabled: boolean;
}
