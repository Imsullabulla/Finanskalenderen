export interface ReminderSettings {
    email: string;
    days: number[];
    obligationIds: string[] | null;
    enabled: boolean;
}
