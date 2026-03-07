// Finanskalenderen – Complete Danish Compliance Obligations Database

export type Frequency = 'monthly' | 'quarterly' | 'annual' | 'semi-annual' | 'ad-hoc' | 'ongoing';
export type Category = 'skat' | 'miljø' | 'eu' | 'afgifter' | 'hr' | 'regnskab';
export type CompanySize = 'all' | 'micro' | 'small' | 'medium' | 'large';

export interface Obligation {
  id: string;
  name: Record<string, string>;
  category: Category;
  frequency: Frequency;
  description: Record<string, string>;
  authority: string;
  groupId?: string;
  deadlineDay?: number; // day of month
  deadlineMonth?: number; // 1-12 for annual
  monthOffset?: number; // months after period end
  triggerRules?: {
    minEmployees?: number;
    minRevenue?: number;
    requiresImport?: boolean;
    requiresExport?: boolean;
    requiresProduction?: boolean;
    companySize?: CompanySize[];
  };
  url?: string;
  fiscalYearDependent?: boolean; // deadline depends on company's fiscal year end
  adjustBackward?: boolean; // adjust for weekends/holidays by moving BACKWARD (before deadline), not forward
  customDeadlines?: { month: number; day: number }[]; // multiple fixed dates per year (month 1-12, day 1-31)
}

export interface ObligationGroup {
  id: string;
  name: Record<string, string>;
  category: Category;
}

export const obligationGroups: ObligationGroup[] = [
  {
    id: 'punktafgifter',
    name: { da: 'Punktafgifter', en: 'Excise Duties' },
    category: 'afgifter',
  },
  {
    id: 'transfer-pricing',
    name: { da: 'Transfer Pricing', en: 'Transfer Pricing' },
    category: 'skat',
  },
  {
    id: 'dac',
    name: { da: 'DAC-direktiver', en: 'DAC Directives' },
    category: 'eu',
  },
  {
    id: 'producentansvar',
    name: { da: 'Producentansvar', en: 'Producer Responsibility' },
    category: 'miljø',
  },
  {
    id: 'loensumsafgift',
    name: { da: 'Lønsumsafgift', en: 'Payroll Tax' },
    category: 'skat',
  },
  {
    id: 'atp',
    name: { da: 'ATP', en: 'ATP (Labour Market Pension)' },
    category: 'hr',
  },
];

export const obligations: Obligation[] = [
  // ═══════════════════════════════════════
  // SKAT (Tax)
  // ═══════════════════════════════════════
  {
    id: 'a-skat',
    name: { da: 'A-skat & AM-bidrag', en: 'A-tax & Labour Market Contribution' },
    category: 'skat',
    frequency: 'monthly',
    deadlineDay: 10,
    monthOffset: 1,
    description: {
      da: 'Indberetning og betaling af A-skat (forskudsskat) for ansatte via eIndkomst. Skal indberettes senest den 10. i måneden efter lønperioden.',
      en: 'Reporting and payment of withholding tax (PAYE) for employees via eIndkomst. Must be reported by the 10th of the month following the pay period.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://eindkomst.skat.dk',
  },
  {
    id: 'moms-maaned',
    name: { da: 'Moms (månedlig)', en: 'VAT (Monthly)' },
    category: 'skat',
    frequency: 'monthly',
    deadlineDay: 25,
    monthOffset: 1,
    description: {
      da: 'Momsangivelse for virksomheder med årlig omsætning over 50 mio. kr. Indberettes månedligt senest den 25. i måneden efter afgiftsperioden.\n\nGodtgørelse af energiafgifter indberettes på momsangivelsen:\n• Olie- og flaskegasafgift\n• Elafgift\n• Kulafgift\n• CO2-afgift\n• Vandafgift',
      en: 'VAT return for companies with annual revenue exceeding DKK 50 million. Reported monthly by the 25th of the month following the tax period.\n\nEnergy duty refunds reported on the VAT return:\n• Oil and bottled gas duty\n• Electricity duty\n• Coal duty\n• CO2 duty\n• Water duty',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { minRevenue: 50000000 },
  },
  {
    id: 'moms-kvartal',
    name: { da: 'Moms (kvartal)', en: 'VAT (Quarterly)' },
    category: 'skat',
    frequency: 'quarterly',
    deadlineDay: 1,
    monthOffset: 3,
    description: {
      da: 'Momsangivelse for virksomheder med årlig omsætning mellem 5–50 mio. kr. Indberettes kvartalsvis.\n\nGodtgørelse af energiafgifter indberettes på momsangivelsen:\n• Olie- og flaskegasafgift\n• Elafgift\n• Kulafgift\n• CO2-afgift\n• Vandafgift',
      en: 'VAT return for companies with annual revenue between DKK 5–50 million. Reported quarterly.\n\nEnergy duty refunds reported on the VAT return:\n• Oil and bottled gas duty\n• Electricity duty\n• Coal duty\n• CO2 duty\n• Water duty',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { minRevenue: 5000000 },
  },
  {
    id: 'moms-halvaar',
    name: { da: 'Moms (halvårlig)', en: 'VAT (Semi-annual)' },
    category: 'skat',
    frequency: 'semi-annual',
    deadlineDay: 1,
    monthOffset: 3,
    description: {
      da: 'Momsangivelse for virksomheder med årlig omsætning under 5 mio. kr. Indberettes halvårligt.\n\nGodtgørelse af energiafgifter indberettes på momsangivelsen:\n• Olie- og flaskegasafgift\n• Elafgift\n• Kulafgift\n• CO2-afgift\n• Vandafgift',
      en: 'VAT return for companies with annual revenue under DKK 5 million. Reported semi-annually.\n\nEnergy duty refunds reported on the VAT return:\n• Oil and bottled gas duty\n• Electricity duty\n• Coal duty\n• CO2 duty\n• Water duty',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'selskabsskat',
    name: { da: 'Selskabsskat', en: 'Corporate Tax' },
    category: 'skat',
    frequency: 'annual',
    deadlineMonth: 7,
    deadlineDay: 1,
    description: {
      da: 'Selvangivelse for selskabsskat. Skal indberettes senest den 1. juli i året efter indkomståret. Selskabsskatteprocenten er 22%.',
      en: 'Corporate tax return. Must be filed by July 1 of the year following the income year. The corporate tax rate is 22%.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    fiscalYearDependent: true,
  },
  {
    id: 'genoptagelse-skat',
    name: { da: 'Genoptagelse af skatteansættelse – ordinær frist', en: 'Tax Assessment Reopening – Ordinary Deadline' },
    category: 'skat',
    frequency: 'annual',
    deadlineMonth: 5,
    deadlineDay: 1,
    description: {
      da: 'Ordinær frist for at anmode om genoptagelse af en skatteansættelse efter skatteforvaltningslovens § 26, stk. 2.\n\nFristen er den 1. maj i det fjerde år efter indkomstårets udløb:\n• Indkomstår 2022 → frist 1. maj 2026\n• Indkomstår 2023 → frist 1. maj 2027\n• Indkomstår 2024 → frist 1. maj 2028\n\nFor at opnå genoptagelse skal der foreligge nye oplysninger af faktisk eller retlig karakter, der kan begrunde en ændret ansættelse.\n\nBemærk: Ekstraordinær genoptagelse (§ 27) kan under særlige omstændigheder ske efter den ordinære frist, men er betinget af særlige betingelser og kræver som udgangspunkt, at Skattestyrelsen varsles inden for 6 måneder fra, at selskabet er kommet til kundskab om det forhold, der begrunder anmodningen.\n\nHvis fristen falder på en weekend eller helligdag, rykkes den til næstkommende hverdag.',
      en: 'Ordinary deadline for requesting reopening of a tax assessment under section 26(2) of the Tax Administration Act (Skatteforvaltningsloven).\n\nThe deadline is 1 May of the fourth year following the end of the income year:\n• Income year 2022 → deadline 1 May 2026\n• Income year 2023 → deadline 1 May 2027\n• Income year 2024 → deadline 1 May 2028\n\nTo obtain reopening, new factual or legal information must exist that justifies a revised assessment.\n\nNote: Extraordinary reopening (§ 27) may in special circumstances occur after the ordinary deadline, but is subject to strict conditions and generally requires that Skattestyrelsen be notified within 6 months of the company becoming aware of the matter justifying the request.\n\nIf the deadline falls on a weekend or public holiday, it moves to the next business day.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'ophørspension',
    name: { da: 'Ophørspension – indbetaling ved virksomhedssalg', en: 'Business Cessation Pension – Contribution upon Sale' },
    category: 'skat',
    frequency: 'ad-hoc',
    description: {
      da: 'Ved salg af virksomhed kan ejeren indskyde et ekstraordinært beløb på en ratepension eller livrente (ophørspension) og opnå fradrag i salgsåret.\n\nFrist: Indbetaling skal ske senest den 1. juli i året efter salgsåret for at give fradrag i salgsåret.\n\nMaksimumbeløb:\n• 2025: 3.285.400 kr.\n• Beløbsgrænsen reguleres årligt\n\nBetingelser (pensionsbeskatningslovens § 15 A):\n• Du skal være fyldt 55 år ved afståelsen\n• Virksomheden skal have været drevet i personlig regi i mindst 10 ud af de seneste 15 år\n• Fradraget kan ikke overstige den skattepligtige fortjeneste ved salget\n• Gælder ved salg af selvstændig virksomhed, anparter eller aktier i eget selskab (under visse betingelser)\n\nBemærk: Fradraget er personligt og kan ikke overdrages. Ordningen gælder ikke for holdingselskaber.\n\nHvis fristen falder på en lørdag, søndag eller helligdag, rykkes den til næstkommende hverdag.',
      en: 'Upon the sale of a business, the owner may make an extraordinary contribution to a pension scheme (business cessation pension) and claim a deduction in the year of sale.\n\nDeadline: The contribution must be made no later than 1 July of the year following the year of sale to obtain a deduction in the year of sale.\n\nMaximum contribution:\n• 2025: DKK 3,285,400\n• The limit is adjusted annually\n\nConditions (section 15 A of the Pension Taxation Act):\n• The owner must be at least 55 years old at the time of sale\n• The business must have been operated on a personal basis for at least 10 of the last 15 years\n• The deduction cannot exceed the taxable gain from the sale\n• Applies to the sale of sole proprietorships, shares in own company (under certain conditions)\n\nNote: The deduction is personal and non-transferable. The scheme does not apply to holding companies.\n\nIf the deadline falls on a Saturday, Sunday or public holiday, it moves to the next business day.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk/borger/pension/fradrag-for-indskud-paa-pension/ophørspension',
  },
  {
    id: 'vso',
    name: { da: 'Virksomhedsskatteordningen (VSO) – Årsopgørelse', en: 'Business Tax Scheme (VSO) – Annual Return' },
    category: 'skat',
    frequency: 'annual',
    deadlineMonth: 7,
    deadlineDay: 1,
    description: {
      da: 'Virksomhedsskatteordningen (VSO) giver selvstændigt erhvervsdrivende mulighed for at beskatte virksomhedens overskud på selskabsskattesats og udskyde privat beskatning af opsparet overskud.\n\nFrist: Oplysningsskema med VSO-oplysninger skal indsendes senest den 1. juli i året efter indkomståret.\n\nNøgleelementer der skal opgøres og dokumenteres hvert år:\n• Indskudskonto: Opgjort ved VSO-indtrædelse og fremføres uændret (medmindre der foretages indskud/hævninger på kontoen)\n• Kapitalafkastgrundlag: Gennemsnit af primo- og ultimoværdi af virksomhedens erhvervsmæssige aktiver fratrukket gæld\n• Kapitalafkast: Kapitalafkastgrundlaget × kapitalafkastsatsen (2024: 5 %, 2025: fastsættes af Skatteministeriet)\n• Opsparet overskud: Ikke-hævet overskud beskattes med 22 % virksomhedsskat. Resten beskattes som personlig indkomst ved hævning\n• Hæverækkefølgen: Privat hævning skal følge lovbestemt rækkefølge: kapitalafkast → årets restoverskud → opsparet overskud → indskudskonto\n• Mellemregningskonto: Bruges til rentefri overførsler mellem virksomhed og privatøkonomi\n\nVigtigt: Erhvervsmæssig og privat økonomi skal holdes strengt adskilt. Blandede konti er ikke tilladt. Bilen, ejendommen og øvrige aktiver skal placeres enten fuldt ud i VSO eller fuldt ud privat (med visse undtagelser).\n\nHvis fristen falder på en lørdag, søndag eller helligdag, rykkes den til næstkommende hverdag.',
      en: 'The Business Tax Scheme (VSO) allows self-employed individuals to have business profits taxed at the corporate tax rate and defer personal taxation of retained profits.\n\nDeadline: The tax return including VSO information must be submitted by 1 July of the year following the income year.\n\nKey elements to calculate and document each year:\n• Capital account (indskudskonto): Established upon entering VSO and carried forward unchanged (unless contributions/withdrawals are made)\n• Capital return basis (kapitalafkastgrundlag): Average of opening and closing value of business assets minus debt\n• Capital return (kapitalafkast): Capital return basis × the capital return rate (2024: 5%; 2025: set by the Ministry of Taxation)\n• Retained profits (opsparet overskud): Profits not withdrawn are taxed at 22% business tax; the remainder is taxed as personal income upon withdrawal\n• Withdrawal order (hæverækkefølgen): Private withdrawals must follow the statutory order: capital return → current year residual profit → retained profits → capital account\n• Current account (mellemregningskonto): Used for interest-free transfers between business and personal finances\n\nImportant: Business and personal finances must be kept strictly separate. Mixed accounts are not permitted. Cars, property and other assets must be placed either fully within VSO or fully in private ownership (with certain exceptions).\n\nIf the deadline falls on a Saturday, Sunday or public holiday, it moves to the next business day.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk/erhverv/selvstaendig/skatteordninger/virksomhedsskatteordningen',
    fiscalYearDependent: true,
  },
  {
    id: 'frivillig-acontoskat',
    name: { da: 'Frivillig acontoskat', en: 'Voluntary Tax on Account' },
    category: 'skat',
    frequency: 'annual',
    customDeadlines: [
      { month: 2, day: 1 },   // 3. rate – 1. februar (året efter indkomståret)
      { month: 3, day: 20 },  // 1. rate – 20. marts
      { month: 11, day: 20 }, // 2. rate – 20. november
    ],
    description: {
      da: 'Frivillig acontoskat for selskaber. Selskabet kan betale frivillig acontoskat, hvis den ordinære acontoskat er sat for lavt. Den frivillige acontoskat skal først indberettes i TastSelv Erhverv, hvorefter beløbet betales via Skattekontoen.\n\nFrister:\n• 1. rate: 20. marts\n• 2. rate: 20. november\n• 3. rate: 1. februar året efter indkomståret\n\nHvis fristen falder på en weekend eller helligdag, rykkes den til næstkommende hverdag.',
      en: 'Voluntary tax on account for companies. Companies may pay voluntary tax on account if the ordinary tax on account is set too low. The voluntary tax must first be reported in TastSelv Erhverv, after which payment is made via the Tax Account.\n\nDeadlines:\n• 1st instalment: 20 March\n• 2nd instalment: 20 November\n• 3rd instalment: 1 February of the year following the income year\n\nIf the deadline falls on a weekend or public holiday, it moves to the next business day.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk/erhverv/selskaber-fonde-og-foreninger/selskaber-og-fonde/betal-acontoskat-og-selskabsskat',
  },
  {
    id: 'frivillig-forskudsskat',
    name: { da: 'Frivillig forskudsskat – indbetaling inden årets udgang', en: 'Voluntary Provisional Tax – Payment Before Year End' },
    category: 'skat',
    frequency: 'annual',
    deadlineMonth: 12,
    deadlineDay: 31,
    description: {
      da: 'Selvstændigt erhvervsdrivende og øvrige personlige skatteydere kan indbetale frivillig forskudsskat inden den 31. december for at undgå rentetillæg på eventuel restskat.\n\nFrist: 31. december i indkomståret\n• Indkomståret 2025 → frist 31. december 2025\n• Indkomståret 2026 → frist 31. december 2026\n\nRentekonsekvenser:\n• Indbetaling inden 31. december: Ingen rentetillæg på det indbetalte beløb\n• Indbetaling 1. januar – 1. juli (året efter): Lille procenttillæg (godskrives som frivillig indbetaling)\n• Restskat opkrævet via årsopgørelse (efter 1. juli): Fuldt rentetillæg på restskatten\n\nSådan indbetaler du:\n1. Log ind på TastSelv på skat.dk\n2. Gå til "Forskudsopgørelse" og tilret evt. din forskudsopgørelse\n3. Indbetal via din skattekonto (Skattekontoen) inden 31. december\n\nBemærk: Det er ikke muligt at indbetale mere end den forventede restskat og dermed opnå "overskud" på skattekontoen med tilbagevirkende kraft.\n\nHvis fristen falder på en lørdag, søndag eller helligdag, rykkes den til næstkommende hverdag.',
      en: 'Self-employed individuals and other personal taxpayers can pay voluntary provisional tax by 31 December to avoid interest surcharges on any residual tax.\n\nDeadline: 31 December of the income year\n• Income year 2025 → deadline 31 December 2025\n• Income year 2026 → deadline 31 December 2026\n\nInterest consequences:\n• Payment by 31 December: No interest surcharge on the amount paid\n• Payment 1 January – 1 July (following year): Small percentage surcharge (credited as voluntary payment)\n• Residual tax collected via annual tax assessment (after 1 July): Full interest surcharge on the residual tax\n\nHow to pay:\n1. Log in to TastSelv at skat.dk\n2. Go to "Forskudsopgørelse" and adjust your provisional tax assessment if needed\n3. Pay via your tax account (Skattekontoen) before 31 December\n\nNote: It is not possible to overpay and create a "surplus" on the tax account that earns retroactive interest.\n\nIf the deadline falls on a Saturday, Sunday or public holiday, it moves to the next business day.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'b-skat',
    name: { da: 'B-skat – månedlig rate', en: 'B-tax – Monthly Instalment' },
    category: 'skat',
    frequency: 'annual',
    // B-skat betales i 10 rater: den 20. i månederne jan–maj og jul–nov (ingen rate i jun og dec)
    customDeadlines: [
      { month: 1,  day: 20 },
      { month: 2,  day: 20 },
      { month: 3,  day: 20 },
      { month: 4,  day: 20 },
      { month: 5,  day: 20 },
      { month: 7,  day: 20 },
      { month: 8,  day: 20 },
      { month: 9,  day: 20 },
      { month: 10, day: 20 },
      { month: 11, day: 20 },
    ],
    description: {
      da: 'B-skat betales af selvstændigt erhvervsdrivende og andre med B-indkomst i 10 lige store rater hen over året.\n\nFrister: Den 20. i måneden (januar–maj og juli–november). Juni og december er ratefrie måneder.\n\nRaterne beregnes automatisk ud fra din forskudsopgørelse. Du kan se og tilpasse dine rater i TastSelv på skat.dk.\n\nBetaling:\n• Betal via Skattekontoen i TastSelv\n• Raternes størrelse fastsættes på baggrund af det forventede årsoverskud\n• Betaler du for lidt i løbet af året, kan der komme restskat med rentetillæg\n• Betaler du for meget, får du overskydende skat udbetalt efter årsopgørelsen\n\nTip: Husk at justere din forskudsopgørelse løbende, hvis din indkomst ændrer sig, så du undgår en stor restskat ved årets udgang.\n\nHvis fristen falder på en lørdag, søndag eller helligdag, rykkes den til næstkommende hverdag.',
      en: 'B-tax is paid by self-employed individuals and others with B-income in 10 equal instalments throughout the year.\n\nDeadlines: The 20th of each month (January–May and July–November). June and December have no instalment.\n\nInstalments are calculated automatically based on your provisional tax assessment. You can view and adjust your instalments in TastSelv at skat.dk.\n\nPayment:\n• Pay via the Tax Account (Skattekontoen) in TastSelv\n• Instalment amounts are based on your expected annual profit\n• Paying too little during the year may result in residual tax with an interest surcharge\n• Paying too much results in a refund after the annual tax assessment\n\nTip: Remember to update your provisional tax assessment as your income changes to avoid a large residual tax bill at year end.\n\nIf the deadline falls on a Saturday, Sunday or public holiday, it moves to the next business day.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'gaveanmeldelse',
    name: { da: 'Gaveanmeldelse', en: 'Gift Declaration' },
    category: 'skat',
    frequency: 'annual',
    deadlineMonth: 5,
    deadlineDay: 1,
    description: {
      da: 'Anmeldelse af gaver til nærtstående familiemedlemmer, der overstiger det afgiftsfrie beløb. Gaveafgiften skal betales samme dag, som gaveanmeldelsen indsendes.\n\nFrist: 1. maj året efter, at gaven er modtaget.\n\nAfgiftsfrie beløb:\n• Nærmeste familie (ekskl. svigerbørn): 80.600 kr. (2026) / 76.900 kr. (2025)\n• Svigerbørn: 28.200 kr. (2026) / 26.900 kr. (2025)\n\nGaveafgiften er som hovedregel 15 % af det beløb, der overstiger det afgiftsfrie beløb.\n\nHvis fristen falder på en weekend eller helligdag, rykkes den til næstkommende hverdag.',
      en: 'Declaration of gifts to close family members exceeding the tax-free amount. Gift tax must be paid on the same day the gift declaration is submitted.\n\nDeadline: 1 May of the year following the year the gift was received.\n\nTax-free amounts:\n• Close family (excl. children-in-law): DKK 80,600 (2026) / DKK 76,900 (2025)\n• Children-in-law: DKK 28,200 (2026) / DKK 26,900 (2025)\n\nThe gift tax rate is generally 15% of the amount exceeding the tax-free threshold.\n\nIf the deadline falls on a weekend or public holiday, it moves to the next business day.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'frivillig-restskat',
    name: { da: 'Frivillig indbetaling af restskat', en: 'Voluntary Residual Tax Payment' },
    category: 'skat',
    frequency: 'annual',
    customDeadlines: [
      { month: 7, day: 1 },   // Senest 1. juli året efter – undgå procenttillæg
      { month: 12, day: 31 }, // Senest 31. december – rentefri indbetaling
    ],
    description: {
      da: 'Frivillig indbetaling af forventet restskat (personlig skat).\n\nFrister:\n• Inden 1. januar (årets udgang): Indbetaling er rentefri\n• Inden 1. juli året efter indkomståret: Undgå procenttillæg, men der kan forekomme en daglig rente (f.eks. 3,7 % for 2025-opgørelsen)\n\nDu kan til enhver tid vælge at foretage en frivillig indbetaling af forventet restskat.\n\nHvis fristen falder på en weekend eller helligdag, rykkes den til næstkommende hverdag.',
      en: 'Voluntary payment of expected residual tax (personal tax).\n\nDeadlines:\n• Before 1 January (year-end): Payment is interest-free\n• Before 1 July of the year following the income year: Avoid surcharge, but daily interest may apply (e.g. 3.7% for the 2025 assessment)\n\nYou can choose to make a voluntary payment of expected residual tax at any time.\n\nIf the deadline falls on a weekend or public holiday, it moves to the next business day.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'udbytteskat',
    name: { da: 'Udbytteskat', en: 'Dividend Tax' },
    category: 'skat',
    frequency: 'ad-hoc',
    description: {
      da: 'Indberetning og indeholdelse af udbytteskat ved udbetaling af udbytte.\n\nFrister:\n• Senest den 10. i måneden efter den måned, hvor udbytteudlodningen er vedtaget\n• I januar er fristen den 17. i måneden\n• Falder fristen på en lørdag, søndag eller helligdag, rykkes den til nærmest følgende hverdag\n\nUndtagelse: Hvis selskabets frist for betaling af A-skat er den sidste bankdag i måneden, er fristen for indberetning og betaling af udbytteskat den sidste bankdag i måneden efter den måned, hvor udlodningen er vedtaget.',
      en: 'Reporting and withholding of dividend tax upon distribution.\n\nDeadlines:\n• By the 10th of the month following the month in which the dividend distribution was decided\n• In January the deadline is the 17th\n• If the deadline falls on a Saturday, Sunday, or public holiday, it moves to the next business day\n\nException: If the company\'s A-tax deadline is the last banking day of the month, the dividend tax deadline is also the last banking day of the month following the month of distribution.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'loensumsafgift-aarlig',
    name: { da: 'Lønsumsafgift (årlig)', en: 'Payroll Tax (Annual)' },
    category: 'skat',
    frequency: 'annual',
    deadlineMonth: 3,
    deadlineDay: 15,
    groupId: 'loensumsafgift',
    description: {
      da: 'Årlig lønsumsafgift (metode 4) for mindre virksomheder med momsfritagne aktiviteter. Indberettes i marts det efterfølgende kalenderår.',
      en: 'Annual payroll tax (method 4) for smaller companies with VAT-exempt activities. Filed in March of the following calendar year.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'loensumsafgift-kvartal',
    name: { da: 'Lønsumsafgift (kvartalsvis)', en: 'Payroll Tax (Quarterly)' },
    category: 'skat',
    frequency: 'quarterly',
    deadlineDay: 10,
    monthOffset: 1,
    groupId: 'loensumsafgift',
    description: {
      da: 'Kvartalsvis lønsumsafgift (metode 1 og 3) for virksomheder med momsfritagne aktiviteter. Fristen er ca. 1 måned og 10 dage efter kvartalets udløb.',
      en: 'Quarterly payroll tax (method 1 and 3) for companies with VAT-exempt activities. Deadline is approx. 1 month and 10 days after the quarter ends.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'loensumsafgift-maaned',
    name: { da: 'Lønsumsafgift (månedlig)', en: 'Payroll Tax (Monthly)' },
    category: 'skat',
    frequency: 'monthly',
    deadlineDay: 15,
    groupId: 'loensumsafgift',
    description: {
      da: 'Månedlig lønsumsafgift (metode 2) for finansielle virksomheder. Fristen er den 15. i måneden efter.',
      en: 'Monthly payroll tax (method 2) for financial companies. Deadline is the 15th of the following month.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'forskerskat',
    name: { da: 'Forskerskatteordningen', en: 'Researcher Tax Scheme' },
    category: 'skat',
    frequency: 'monthly',
    deadlineDay: 10,
    monthOffset: 1,
    description: {
      da: 'Særlig skatteordning for højt kvalificerede udenlandske medarbejdere og forskere. Indberetning via eIndkomst med særlig kode.',
      en: 'Special tax scheme for highly qualified foreign employees and researchers. Reported via eIndkomst with a special code.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://eindkomst.skat.dk',
    triggerRules: { minEmployees: 1 },
  },

  // ═══════════════════════════════════════
  // TRANSFER PRICING
  // ═══════════════════════════════════════
  {
    id: 'tp-lokalfil',
    name: { da: 'Transfer Pricing – Lokalfil', en: 'Transfer Pricing – Local File' },
    category: 'skat',
    frequency: 'annual',
    deadlineMonth: 8,
    deadlineDay: 30,
    groupId: 'transfer-pricing',
    description: {
      da: 'Indgivelse af Transfer Pricing-dokumentation (lokalfil) til Skattestyrelsen.\n\nFor indkomstår påbegyndt den 1. januar 2021 eller senere skal den skriftlige dokumentation indgives senest 60 dage efter oplysningsfristen.\n\nFor selskaber med kalenderårsregnskab (31. december) er fristen den 30. august i året efter indkomståret.\n\nLokalfilen skal indeholde oplysninger om den danske enhed i koncernen og dennes kontrollerede transaktioner med tilknyttede parter.',
      en: 'Submission of Transfer Pricing documentation (local file) to Skattestyrelsen.\n\nFor income years beginning on or after 1 January 2021, the documentation must be submitted within 60 days after the tax return filing deadline (oplysningsfristen).\n\nFor companies with a calendar year (31 December), the deadline is 30 August of the year following the income year.\n\nThe local file must contain information about the Danish entity in the group and its controlled transactions with related parties.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { companySize: ['medium', 'large'] },
    fiscalYearDependent: true,
  },
  {
    id: 'tp-masterfile',
    name: { da: 'Transfer Pricing – Masterfile', en: 'Transfer Pricing – Master File' },
    category: 'skat',
    frequency: 'annual',
    deadlineMonth: 8,
    deadlineDay: 30,
    groupId: 'transfer-pricing',
    description: {
      da: 'Indgivelse af Transfer Pricing-dokumentation (masterfile) til Skattestyrelsen.\n\nFor indkomstår påbegyndt den 1. januar 2021 eller senere skal den skriftlige dokumentation indgives senest 60 dage efter oplysningsfristen.\n\nFor selskaber med kalenderårsregnskab (31. december) er fristen den 30. august i året efter indkomståret.\n\nMasterfilen udarbejdes på koncernniveau og skal indeholde overordnede oplysninger om den multinationale koncernstruktur, forretningsaktiviteter og internprispolitik.',
      en: 'Submission of Transfer Pricing documentation (master file) to Skattestyrelsen.\n\nFor income years beginning on or after 1 January 2021, the documentation must be submitted within 60 days after the tax return filing deadline (oplysningsfristen).\n\nFor companies with a calendar year (31 December), the deadline is 30 August of the year following the income year.\n\nThe master file is prepared at group level and must contain general information about the multinational group structure, business activities, and transfer pricing policy.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { companySize: ['large'] },
    fiscalYearDependent: true,
  },
  {
    id: 'tp-cbc',
    name: { da: 'Transfer Pricing – CbC-rapport', en: 'Transfer Pricing – CbC Report' },
    category: 'skat',
    frequency: 'annual',
    deadlineMonth: 12,
    deadlineDay: 31,
    groupId: 'transfer-pricing',
    description: {
      da: 'Country-by-Country rapport for multinationale koncerner med konsolideret omsætning over 5,6 mia. kr.',
      en: 'Country-by-Country report for multinational groups with consolidated revenue exceeding DKK 5.6 billion.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { companySize: ['large'] },
  },

  // ═══════════════════════════════════════
  // DAC DIRECTIVES
  // ═══════════════════════════════════════
  {
    id: 'dac6',
    name: { da: 'DAC6-indberetning', en: 'DAC6 Reporting' },
    category: 'eu',
    frequency: 'ongoing',
    groupId: 'dac',
    description: {
      da: 'Indberetning af grænseoverskridende skatteordninger med kendetegn (hallmarks). Skal indberettes inden 30 dage efter ordningen er tilgængelig.',
      en: 'Reporting of cross-border tax arrangements with hallmarks. Must be reported within 30 days of the arrangement becoming available.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'dac7',
    name: { da: 'DAC7-indberetning', en: 'DAC7 Reporting' },
    category: 'eu',
    frequency: 'annual',
    deadlineMonth: 1,
    deadlineDay: 31,
    groupId: 'dac',
    description: {
      da: 'Platformsoperatørers indberetning af sælgeres aktiviteter (DAC7). Indberettes årligt senest den 31. januar.',
      en: 'Platform operators\' reporting of sellers\' activities (DAC7). Reported annually by January 31.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'dac8',
    name: { da: 'DAC8-indberetning', en: 'DAC8 Reporting' },
    category: 'eu',
    frequency: 'annual',
    deadlineMonth: 1,
    deadlineDay: 31,
    groupId: 'dac',
    description: {
      da: 'Indberetning vedr. kryptovaluta og digitale aktiver (DAC8). Træder i kraft 2026.',
      en: 'Reporting regarding cryptocurrencies and digital assets (DAC8). Takes effect 2026.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },

  // ═══════════════════════════════════════
  // PUNKTAFGIFTER (Excise Duties)
  // ═══════════════════════════════════════
  {
    id: 'oel-afgift',
    name: { da: 'Ølafgift', en: 'Beer Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på øl beregnet efter alkoholindhold. Indberettes månedligt.',
      en: 'Duty on beer calculated by alcohol content. Reported monthly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'vin-afgift',
    name: { da: 'Vin- og frugtvinafgift', en: 'Wine Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på vin og frugtvin. Indberettes månedligt.',
      en: 'Duty on wine and fruit wine. Reported monthly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'spiritus-afgift',
    name: { da: 'Spiritusafgift', en: 'Spirits Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på spiritus og liør. Indberettes månedligt.',
      en: 'Duty on spirits and liqueurs. Reported monthly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'tobak-afgift',
    name: { da: 'Tobaksafgift', en: 'Tobacco Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på tobaksvarer (cigaretter, cigarer, røgtobak). Indberettes månedligt.',
      en: 'Duty on tobacco products (cigarettes, cigars, pipe tobacco). Reported monthly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'chokolade-afgift',
    name: { da: 'Chokoladeafgift', en: 'Chocolate Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på chokolade- og sukkervarer samt is. Indberettes månedligt.',
      en: 'Duty on chocolate, confectionery and ice cream. Reported monthly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'kaffe-afgift',
    name: { da: 'Kaffeafgift', en: 'Coffee Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på kaffe, kaffeekstrakter og te. Indberettes månedligt.',
      en: 'Duty on coffee, coffee extracts and tea. Reported monthly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'emballage-afgift',
    name: { da: 'Emballageafgift', en: 'Packaging Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på emballage (volumen- og vægtbaseret). Indberettes månedligt.',
      en: 'Duty on packaging (volume and weight-based). Reported monthly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'engangsservice-afgift',
    name: { da: 'Engangsserviceafgift', en: 'Disposable Tableware Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på engangsservice (tallerkener, bestik, bægre). Indberettes månedligt.',
      en: 'Duty on disposable tableware (plates, cutlery, cups). Reported monthly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'baereposer-afgift',
    name: { da: 'Bæreposeafgift', en: 'Carrier Bag Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på bæreposer. Indberettes månedligt.',
      en: 'Duty on carrier bags. Reported monthly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'kvaelstof-afgift',
    name: { da: 'Kvælstofafgift', en: 'Nitrogen Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på kvælstofholdige gødninger. Indberettes månedligt.',
      en: 'Duty on nitrogen-containing fertilizers. Reported monthly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'gevinstafgift',
    name: { da: 'Gevinstafgift', en: 'Winnings Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på gevinster fra lotterier og væddemål. Indberettes månedligt.',
      en: 'Duty on winnings from lotteries and betting. Reported monthly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'voc-afgift',
    name: { da: 'VOC-afgift', en: 'VOC Duty' },
    category: 'afgifter',
    frequency: 'quarterly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på flygtige organiske forbindelser (VOC) i visse produkter. Indberettes kvartalsvis.',
      en: 'Duty on volatile organic compounds (VOC) in certain products. Reported quarterly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'gloedelamper',
    name: { da: 'Glødelampeafgift', en: 'Light Bulb Duty' },
    category: 'afgifter',
    frequency: 'quarterly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på glødelamper og visse lyskilder. Afgiften pålægges producenter og importører af glødelamper. Indberettes kvartalsvis.',
      en: 'Duty on incandescent light bulbs and certain light sources. Imposed on producers and importers. Reported quarterly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'konsum-is',
    name: { da: 'Konsum-is-afgift', en: 'Ice Cream Duty' },
    category: 'afgifter',
    frequency: 'quarterly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på konsum-is og isprodukter. Pålægges producenter og importører af konsumis. Indberettes kvartalsvis.',
      en: 'Excise duty on ice cream and ice products. Imposed on producers and importers. Reported quarterly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'pvc-ftalater',
    name: { da: 'PVC og ftalater-afgift', en: 'PVC and Phthalates Duty' },
    category: 'afgifter',
    frequency: 'quarterly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på PVC-folier og produkter indeholdende blødgørende ftalater. Pålægges producenter og importører. Indberettes kvartalsvis.',
      en: 'Duty on PVC film and products containing softening phthalates. Imposed on producers and importers. Reported quarterly.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'nikkel-cadmium',
    name: { da: 'Nikkel-cadmium batteri-afgift', en: 'Nickel-Cadmium Battery Duty' },
    category: 'afgifter',
    frequency: 'quarterly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på nikkel-cadmium-batterier (genopladelige). Pålægges producenter og importører af NiCd-batterier. Indberettes kvartalsvis.',
      en: 'Duty on nickel-cadmium batteries (rechargeable). Imposed on producers and importers of NiCd batteries. Reported quarterly.',
    },
    authority: 'Skattestyrelsen',
    triggerRules: { requiresImport: true },
  },
  {
    id: 'smoereolie',
    name: { da: 'Smøreolieafgift', en: 'Lubricating Oil Duty' },
    category: 'afgifter',
    frequency: 'quarterly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på smøreolie og lignende olier. Pålægges producenter og importører af smøreolier. Indberettes kvartalsvis.',
      en: 'Duty on lubricating oil and similar oils. Imposed on producers and importers. Reported quarterly.',
    },
    authority: 'Skattestyrelsen',
    triggerRules: { requiresProduction: true },
  },

  {
    id: 'klorende-oploesningsmidler',
    name: { da: 'Afgift på klorende opløsningsmidler', en: 'Duty on Chlorinated Solvents' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Månedlig angivelse og betaling af afgift på klorende opløsningsmidler. Afgiftsperioden er måneden, jf. KLORAL § 4. Virksomheden skal angive og indbetale beløbet til Skatteforvaltningen senest den 15. i den følgende kalendermåned.',
      en: 'Monthly reporting and payment of duty on chlorinated solvents. The tax period is the calendar month, cf. KLORAL § 4. The company must report and pay the amount to the Tax Administration by the 15th of the following calendar month.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'bekaempelsesmidler',
    name: { da: 'Bekæmpelsesmiddelafgift', en: 'Pesticide Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Månedlig angivelse og betaling af afgift på bekæmpelsesmidler. Afgiftsperioden er måneden, jf. BEKÆMPAL § 11. Virksomheden skal angive og indbetale beløbet til Skatteforvaltningen senest den 15. i den følgende kalendermåned.',
      en: 'Monthly reporting and payment of duty on pesticides. The tax period is the calendar month, cf. BEKÆMPAL § 11. The company must report and pay the amount to the Tax Administration by the 15th of the following calendar month.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'daekafgift',
    name: { da: 'Dækafgift', en: 'Tyre Duty' },
    category: 'afgifter',
    frequency: 'quarterly',
    deadlineDay: 0,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Kvartalsvis angivelse og betaling af dækafgift (gebyr). Gebyrperioden er et kalenderkvarter, jf. dækbekendtgørelsens § 6, stk. 1. Gebyret angives og indbetales til Skatteforvaltningen senest ved udgangen af den følgende måned, jf. dækbekendtgørelsens § 11.',
      en: 'Quarterly reporting and payment of tyre duty (fee). The fee period is a calendar quarter, cf. § 6(1) of the Tyre Order. The fee must be reported and paid to the Tax Administration by the end of the following month, cf. § 11 of the Tyre Order.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'raastofafgift',
    name: { da: 'Råstofafgift', en: 'Raw Materials Duty' },
    category: 'afgifter',
    frequency: 'quarterly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Kvartalsvis opgørelse, angivelse og betaling af råstofafgift. Registrerede virksomheder skal opgøre den afgiftspligtige mængde for hvert kvartal og angive samt indbetale beløbet senest den 15. i den første måned efter udløbet af kvartalet. Jf. AFFAL § 13.',
      en: 'Quarterly calculation, reporting and payment of raw materials duty. Registered companies must calculate the taxable quantity for each quarter and report and pay the amount by the 15th of the first month after the end of the quarter. Cf. AFFAL § 13.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'affaldsafgift',
    name: { da: 'Affaldsafgift', en: 'Waste Tax' },
    category: 'afgifter',
    frequency: 'quarterly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Kvartalsvis angivelse og betaling af affaldsafgift. Efter udløbet af hvert kvartal og senest den 15. i den følgende måned skal virksomheden angive: vægten af det tilførte affald, vægten af det fraførte affald og den afgiftspligtige vægt. Beløbet indbetales til Skatteforvaltningen senest den 15. i måneden efter afgiftsperiodens udløb.',
      en: 'Quarterly reporting and payment of waste tax. After the end of each quarter and no later than the 15th of the following month, the company must report: the weight of waste received, the weight of waste removed, and the taxable weight. Payment is made to the Tax Administration by the 15th of the month following the end of the tax period.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'spil-uden-indsats',
    name: { da: 'Spil uden indsats (konkurrencer og giveaways)', en: 'Games Without Stakes (Competitions and Giveaways)' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på spil uden indsats, herunder konkurrencer og giveaways. Registreringspligt gælder, hvis du udbyder kontantgevinster over 200 kr. eller varegevinster (fx gavekurve eller hotelophold) med en handelsværdi over 750 kr. Registrering sker via blanket 29.063. Indberetning og betaling skal ske senest den 15. i den efterfølgende måned.',
      en: 'Duty on games without stakes, including competitions and giveaways. Registration is required if you offer cash prizes over DKK 200 or prize goods (e.g. gift baskets or hotel stays) with a market value exceeding DKK 750. Registration via form 29.063. Reporting and payment must be made by the 15th of the following month.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'gevinst-spilleautomat',
    name: { da: 'Gevinst spilleautomat', en: 'Slot Machine Winnings Duty' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Månedlig opgørelse og betaling af afgift på gevinster fra spilleautomater. Afgiften opgøres for hver enkelt restauration eller spillehal og skal indberettes og betales senest den 15. i den efterfølgende måned.',
      en: 'Monthly calculation and payment of duty on slot machine winnings. The duty is calculated per individual restaurant or amusement arcade and must be reported and paid by the 15th of the following month.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'passagerafgift',
    name: { da: 'Passagerafgift på flyrejser', en: 'Passenger Tax on Air Travel' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Månedlig indberetning af passagerafgift for luftfartøjer. Senest den 15. i måneden efter skal I angive antallet af afgiftspligtige passagerer, der rejste med luftfartøj fra Danmark. Indberetning sker via TastSelv Erhverv.',
      en: 'Monthly reporting of passenger tax for aircraft. By the 15th of the following month, you must report the number of taxable passengers who travelled by aircraft from Denmark. Reported via TastSelv Erhverv.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
  },
  {
    id: 'emissionsafgift-maaned',
    name: { da: 'Emissionsafgift (månedlig)', en: 'Emissions Duty (Monthly)' },
    category: 'afgifter',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    groupId: 'punktafgifter',
    description: {
      da: 'Afgift på udledning af drivhusgasser (CO2e) som led i den grønne skattereform for industrien (gælder fra 1. januar 2025). Virksomheder, der er kvoteomfattede, skal månedligt angive foreløbige emissionsestimater via TastSelv Erhverv og betale afgiften senest den 15. i måneden efter afgiftsperioden.',
      en: 'Tax on greenhouse gas emissions (CO2e) as part of the green tax reform for industry (effective January 1, 2025). Quota-covered companies must submit preliminary monthly emission estimates via TastSelv Erhverv and pay by the 15th of the month following the reporting period.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk/erhverv/afgifter-paa-varer-og-ydelser-punktafgifter/emissionsafgift',
  },
  {
    id: 'emissionsafgift-aarlig',
    name: { da: 'Emissionsafgift – årlig regulering', en: 'Emissions Duty – Annual Adjustment' },
    category: 'afgifter',
    frequency: 'annual',
    deadlineMonth: 5,
    deadlineDay: 15,
    groupId: 'punktafgifter',
    description: {
      da: 'Årlig regulering af emissionsafgiften på baggrund af den verificerede emissionsrapport for det foregående kalenderår. Reguleringen foretages som en del af den månedlige angivelse for april måned med frist den 15. maj.',
      en: 'Annual adjustment of the emissions duty based on the verified emissions report for the previous calendar year. The adjustment is submitted as part of the April monthly return, with a deadline of May 15.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk/erhverv/afgifter-paa-varer-og-ydelser-punktafgifter/emissionsafgift',
  },

  // ═══════════════════════════════════════
  // MILJØ (Environment)
  // ═══════════════════════════════════════
  {
    id: 'weee',
    name: { da: 'WEEE (Elektronikaffald)', en: 'WEEE (E-waste)' },
    category: 'miljø',
    frequency: 'annual',
    deadlineMonth: 3,
    deadlineDay: 31,
    groupId: 'producentansvar',
    description: {
      da: 'Producentansvarsordning for elektrisk og elektronisk udstyr. Årlig indberetning af mængder markedsført og indsamlet.',
      en: 'Producer responsibility scheme for electrical and electronic equipment. Annual reporting of quantities marketed and collected.',
    },
    authority: 'DPA-System / Miljøstyrelsen',
    url: 'https://dpa-system.dk',
    triggerRules: { requiresImport: true },
  },
  {
    id: 'bat-batterier',
    name: { da: 'Batterier (BAT)', en: 'Batteries (BAT)' },
    category: 'miljø',
    frequency: 'annual',
    deadlineMonth: 3,
    deadlineDay: 31,
    groupId: 'producentansvar',
    description: {
      da: 'Producentansvarsordning for batterier og akkumulatorer. Indberetning af mængder markedsført.',
      en: 'Producer responsibility scheme for batteries and accumulators. Reporting of quantities marketed.',
    },
    authority: 'DPA-System / Miljøstyrelsen',
    url: 'https://dpa-system.dk',
    triggerRules: { requiresImport: true },
  },
  {
    id: 'skrotbiler',
    name: { da: 'Skrotbiler (ELV)', en: 'End-of-Life Vehicles' },
    category: 'miljø',
    frequency: 'annual',
    deadlineMonth: 3,
    deadlineDay: 31,
    groupId: 'producentansvar',
    description: {
      da: 'Producentansvar for udtjente køretøjer. Registrering og indberetning til DPA-System.',
      en: 'Producer responsibility for end-of-life vehicles. Registration and reporting to DPA-System.',
    },
    authority: 'DPA-System / Miljøstyrelsen',
    url: 'https://dpa-system.dk',
  },
  {
    id: 'sup-engangsplast',
    name: { da: 'Engangsplast (SUP)', en: 'Single-Use Plastics (SUP)' },
    category: 'miljø',
    frequency: 'annual',
    deadlineMonth: 3,
    deadlineDay: 31,
    groupId: 'producentansvar',
    description: {
      da: 'Producentansvar for engangsplastprodukter under EU\'s SUP-direktiv. Omfatter bl.a. kopper, mademballage, vådservietter.',
      en: 'Producer responsibility for single-use plastic products under the EU SUP Directive.',
    },
    authority: 'DPA-System / Miljøstyrelsen',
    url: 'https://dpa-system.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'fiskeredskaber',
    name: { da: 'Fiskeredskaber', en: 'Fishing Gear' },
    category: 'miljø',
    frequency: 'annual',
    deadlineMonth: 3,
    deadlineDay: 31,
    groupId: 'producentansvar',
    description: {
      da: 'Producentansvar for fiskeredskaber der indeholder plast. Indberetning af markedsførte mængder.',
      en: 'Producer responsibility for plastic-containing fishing gear. Reporting of marketed quantities.',
    },
    authority: 'Miljøstyrelsen',
    url: 'https://dpa-system.dk',
    triggerRules: { requiresProduction: true },
  },
  {
    id: 'producentansvar-emballage',
    name: { da: 'Producentansvar – Emballage', en: 'Producer Responsibility – Packaging' },
    category: 'miljø',
    frequency: 'annual',
    deadlineMonth: 6,
    deadlineDay: 1,
    groupId: 'producentansvar',
    description: {
      da: 'Producenter skal hvert år senest den 1. juni indberette mængderne af emballage, som de har tilgængeliggjort på det danske marked i det foregående kalenderår.\n\nIndberetningen sker via DPA-Systems portal. Første indberetning var den 1. juni 2025 (for kalenderåret 2024).\n\nHvem er omfattet?\nDu er producent, hvis du:\n• Fremstiller og sælger emballerede produkter i Danmark\n• Fylder emballage med produkter (pakker varer)\n• Importerer emballerede produkter fra andre EU-lande eller tredjelande\n• Sælger emballerede produkter via internethandel til danske forbrugere\n\nHvad skal indberettes?\n• De faktisk tilgængeliggjorte mængder emballage i Danmark (i kg pr. emballagetype og materiale)\n• Kategorier: salgsemballage, gruppemballage og transportemballage\n• Materialer: papir/pap, plastik, glas, metal, træ m.fl.\n\nVigtigt: Indberetningen danner grundlag for beregning af dit bidrag til emballagehåndtering og genanvendelse. Manglende indberetning kan medføre sanktioner.\n\nHvis fristen falder på en lørdag, søndag eller helligdag, rykkes den til næstkommende hverdag.',
      en: 'Producers must annually by 1 June report the quantities of packaging they have made available on the Danish market during the preceding calendar year.\n\nReporting is done via the DPA System portal. The first reporting deadline was 1 June 2025 (for calendar year 2024).\n\nWho is covered?\nYou are a producer if you:\n• Manufacture and sell packaged products in Denmark\n• Fill packaging with products (pack goods)\n• Import packaged products from other EU countries or third countries\n• Sell packaged products via e-commerce to Danish consumers\n\nWhat must be reported?\n• The actual quantities of packaging made available in Denmark (in kg per packaging type and material)\n• Categories: sales packaging, grouped packaging and transport packaging\n• Materials: paper/cardboard, plastic, glass, metal, wood, etc.\n\nImportant: The report forms the basis for calculating your contribution to packaging handling and recycling. Failure to report may result in sanctions.\n\nIf the deadline falls on a Saturday, Sunday or public holiday, it moves to the next business day.',
    },
    authority: 'DPA-System',
    url: 'https://dpa-system.dk',
  },
  {
    id: 'pant',
    name: { da: 'Pantordning', en: 'Deposit Return Scheme' },
    category: 'miljø',
    frequency: 'monthly',
    deadlineDay: 15,
    monthOffset: 1,
    description: {
      da: 'Tilmelding til og indberetning under den danske pantordning for emballage til drikkevarer (flasker og dåser).',
      en: 'Registration and reporting under the Danish deposit return scheme for beverage containers (bottles and cans).',
    },
    authority: 'Dansk Retursystem',
    url: 'https://danskretursystem.dk',
    triggerRules: { requiresImport: true },
  },

  // ═══════════════════════════════════════
  // EU COMPLIANCE
  // ═══════════════════════════════════════
  {
    id: 'cbam',
    name: { da: 'CBAM-indberetning', en: 'CBAM Reporting' },
    category: 'eu',
    frequency: 'annual',
    deadlineMonth: 9,
    deadlineDay: 30,
    description: {
      da: 'Carbon Border Adjustment Mechanism – årlig indberetning af CO₂-indhold i importerede varer (cement, jern, stål, aluminium, gødning, elektricitet, brint). Fra 2026 overgår CBAM til årlig indberetning med frist d. 30. september 2027 for indberetningsåret 2026.\n\nVigtige datoer:\n• Før 31. marts 2026: Virksomheder skal have opnået status som "autoriseret CBAM-klarerer" for at kunne importere CBAM-varer.\n• 1. februar 2027: CBAM-certifikater bliver tilgængelige for køb. Prisen beregnes baseret på et ugentligt gennemsnit af EU ETS-kvotepriser.',
      en: 'Carbon Border Adjustment Mechanism – annual reporting of CO₂ content in imported goods (cement, iron, steel, aluminum, fertilizer, electricity, hydrogen). From 2026, CBAM transitions to annual reporting with a deadline of 30 September 2027 for the 2026 reporting year.\n\nKey dates:\n• Before 31 March 2026: Companies must obtain "authorised CBAM declarant" status to import CBAM goods.\n• 1 February 2027: CBAM certificates become available for purchase. Price is based on a weekly average of EU ETS allowance prices.',
    },
    authority: 'EU / Energistyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresImport: true },
  },
  {
    id: 'csrd',
    name: { da: 'CSRD-rapportering', en: 'CSRD Reporting' },
    category: 'eu',
    frequency: 'annual',
    deadlineMonth: 6,
    deadlineDay: 30,
    description: {
      da: 'Corporate Sustainability Reporting Directive – bæredygtighedsrapportering iht. ESRS-standarderne. Gælder store virksomheder fra 2025, SMV fra 2026.',
      en: 'Corporate Sustainability Reporting Directive – sustainability reporting per ESRS standards. Applies to large companies from 2025, SMEs from 2026.',
    },
    authority: 'Erhvervsstyrelsen / EU',
    url: 'https://erhvervsstyrelsen.dk/baerekraftighed',
    triggerRules: { companySize: ['large'] },
  },
  {
    id: 'eudr',
    name: { da: 'EUDR (Skovrydning)', en: 'EUDR (Deforestation)' },
    category: 'eu',
    frequency: 'annual',
    deadlineMonth: 12,
    deadlineDay: 30,
    description: {
      da: 'EU Deforestation Regulation – due diligence krav for virksomheder der markedsfører produkter forbundet med skovrydning (soja, palmeolie, kvæg, kaffe, kakao, gummi, træ). EUDR erstatter den tidligere EU Timber Regulation (EUTR). Indberetningsfrist: 30. december 2026.',
      en: 'EU Deforestation Regulation – due diligence requirements for companies marketing deforestation-linked commodities (soy, palm oil, cattle, coffee, cocoa, rubber, wood). EUDR replaces the former EU Timber Regulation (EUTR). Reporting deadline: 30 December 2026.',
    },
    authority: 'Miljøstyrelsen / EU',
    url: 'https://mst.dk/natur-vand/skov/eu-skovforordning-eudr',
    triggerRules: { requiresImport: true },
  },
  {
    id: 'vies',
    name: { da: 'VIES-indberetning', en: 'VIES Reporting' },
    category: 'eu',
    frequency: 'monthly',
    deadlineDay: 25,
    monthOffset: 1,
    description: {
      da: 'EU-salg uden moms (listesystem). Indberettes månedligt for varesalg og kvartalsvis for ydelser til andre EU-lande.',
      en: 'EU sales without VAT (recapitulative statements). Reported monthly for goods and quarterly for services to other EU countries.',
    },
    authority: 'Skattestyrelsen',
    url: 'https://skat.dk',
    triggerRules: { requiresExport: true },
  },

  // ═══════════════════════════════════════
  // TOLD (Customs)
  // ═══════════════════════════════════════
  {
    id: 'told',
    name: { da: 'Toldangivelse', en: 'Customs Declaration' },
    category: 'skat',
    frequency: 'ongoing',
    description: {
      da: 'Toldangivelse ved import og eksport af varer til/fra lande uden for EU. Indberettes løbende per forsendelse.',
      en: 'Customs declaration for import and export of goods to/from non-EU countries. Filed per shipment.',
    },
    authority: 'Toldstyrelsen',
    url: 'https://toldstyrelsen.dk',
    triggerRules: { requiresImport: true },
  },

  // ═══════════════════════════════════════
  // HR / ARBEJDSGIVER
  // ═══════════════════════════════════════
  {
    id: 'arbejdsskadeforsikring',
    name: { da: 'Arbejdsskadeforsikring', en: 'Workers\' Comp Insurance' },
    category: 'hr',
    frequency: 'annual',
    deadlineMonth: 1,
    deadlineDay: 31,
    description: {
      da: 'Lovpligtig forsikring mod arbejdsulykker og erhvervssygdomme. Årlig fornyelse og anmeldelse af skader.',
      en: 'Mandatory insurance against workplace accidents and occupational diseases. Annual renewal and claims reporting.',
    },
    authority: 'Arbejdsmarkedets Erhvervssikring',
    url: 'https://www.aes.dk',
    triggerRules: { minEmployees: 1 },
  },
  {
    id: 'hvervgiverregisteret',
    name: { da: 'Hvervgiverregisteret', en: 'Client Register' },
    category: 'hr',
    frequency: 'ongoing',
    description: {
      da: 'Registrering i hvervgiverregisteret ved brug af udenlandsk arbejdskraft. Anmeldelse senest ved arbejdets start.',
      en: 'Registration in the client register when using foreign labor. Must be reported before work begins.',
    },
    authority: 'Skattestyrelsen',
  },
  {
    id: 'whistleblower',
    name: { da: 'Whistleblowerordning', en: 'Whistleblower Scheme' },
    category: 'hr',
    frequency: 'ongoing',
    description: {
      da: 'Virksomheder med 50+ ansatte skal etablere en intern whistleblowerordning med sikker indberetningskanal.',
      en: 'Companies with 50+ employees must establish an internal whistleblower scheme with a secure reporting channel.',
    },
    authority: 'Datatilsynet',
    url: 'https://datatilsynet.dk',
    triggerRules: { minEmployees: 50 },
  },

  // ═══════════════════════════════════════
  // REGNSKAB (Accounting)
  // ═══════════════════════════════════════
  {
    id: 'aarsrapport',
    name: { da: 'Årsrapport', en: 'Annual Report' },
    category: 'regnskab',
    frequency: 'annual',
    deadlineMonth: 6,
    deadlineDay: 30,
    description: {
      da: 'Indsendelse af årsrapport til Erhvervsstyrelsen. Frist afhænger af regnskabsklasse (A–D). Typisk 5–6 måneder efter regnskabsårets afslutning.',
      en: 'Filing of annual report with the Danish Business Authority. Deadline depends on accounting class (A–D). Typically 5–6 months after the fiscal year end.',
    },
    authority: 'Erhvervsstyrelsen',
    url: 'https://indberet.virk.dk',
    fiscalYearDependent: true,
  },
  // ═══════════════════════════════════════
  // ATP (Labour Market Supplementary Pension)
  // ═══════════════════════════════════════
  {
    id: 'atp-indberetning',
    name: { da: 'ATP – Indberetning', en: 'ATP – Reporting' },
    category: 'hr',
    frequency: 'quarterly',
    deadlineDay: 0,    // last day of the deadline month (May 31, Aug 31, Nov 30, Feb 28)
    monthOffset: 2,    // 2 months after quarter end
    groupId: 'atp',
    description: {
      da: 'Kvartalvis indberetning af ATP-bidrag via eIndkomst.\n\nFrister:\n• 1. kvartal (jan–mar): 31. maj\n• 2. kvartal (apr–jun): 31. august\n• 3. kvartal (jul–sep): 30. november\n• 4. kvartal (okt–dec): 28. februar\n\nATP-bidraget indbetales via Samlet Betaling – se ATP-betaling for betalingsfristen. Vigtigt: betal ikke forud, da betalingen ellers kan blive returneret.',
      en: 'Quarterly reporting of ATP contributions via eIndkomst.\n\nDeadlines:\n• Q1 (Jan–Mar): 31 May\n• Q2 (Apr–Jun): 31 August\n• Q3 (Jul–Sep): 30 November\n• Q4 (Oct–Dec): 28 February\n\nATP contributions are paid via Samlet Betaling – see ATP-betaling for the payment deadline. Important: do not pay in advance, as the payment may be returned.',
    },
    authority: 'ATP / eIndkomst',
    url: 'https://virk.dk/vejledning/atp/atp-arbejdsgiver/',
    triggerRules: { minEmployees: 1 },
  },
  {
    id: 'atp-betaling',
    name: { da: 'ATP – Betaling', en: 'ATP – Payment' },
    category: 'hr',
    frequency: 'quarterly',
    deadlineDay: 1,    // 1st of the deadline month (Jul 1, Oct 1, Jan 1, Apr 1)
    monthOffset: 4,    // 4 months after quarter end
    groupId: 'atp',
    description: {
      da: 'Kvartalvis betaling af ATP-bidrag via Samlet Betaling.\n\nFrister:\n• 1. kvartal (jan–mar): 1. juli\n• 2. kvartal (apr–jun): 1. oktober\n• 3. kvartal (jul–sep): 1. januar\n• 4. kvartal (okt–dec): 1. april\n\nBeløbet skal være trukket fra virksomhedens konto senest på betalingsdagen. Er betalingsfristen en lørdag, søndag eller helligdag, er fristen den første hverdag efter.',
      en: 'Quarterly payment of ATP contributions via Samlet Betaling.\n\nDeadlines:\n• Q1 (Jan–Mar): 1 July\n• Q2 (Apr–Jun): 1 October\n• Q3 (Jul–Sep): 1 January\n• Q4 (Oct–Dec): 1 April\n\nThe amount must be debited from the company account by the deadline date. If the deadline falls on a Saturday, Sunday or public holiday, the deadline moves to the first weekday after.',
    },
    authority: 'Samlet Betaling',
    url: 'https://virk.dk/vejledning/atp/atp-arbejdsgiver/',
    triggerRules: { minEmployees: 1 },
  },

  // ═══════════════════════════════════════
  // DA BARSEL (Employer-funded Maternity/Paternity)
  // ═══════════════════════════════════════
  {
    id: 'da-barsel',
    name: { da: 'DA Barsel – Indberetning og betaling', en: 'DA Barsel – Reporting and Payment' },
    category: 'hr',
    frequency: 'quarterly',
    deadlineDay: 14,   // 14th of the month after quarter end
    monthOffset: 1,    // Apr 14, Jul 14, Oct 14, Jan 14
    groupId: 'da-barsel',
    description: {
      da: 'Kvartalvis indberetning og betaling af DA Barsel-bidrag for privatansatte lønmodtagere.\n\nFrister:\n• 1. kvartal (jan–mar): 14. april\n• 2. kvartal (apr–jun): 14. juli\n• 3. kvartal (jul–sep): 14. oktober\n• 4. kvartal (okt–dec): 14. januar\n\nDA Barsel administrerer barselsudligningsordningen for private arbejdsgivere. Bidraget beregnes som en procentdel af den samlede lønsum og indberettes via DA Barsels selvbetjeningsportal på Virk.dk.\n\nHvis fristen falder på en lørdag, søndag eller helligdag, rykkes den til den næste hverdag.',
      en: 'Quarterly reporting and payment of DA Barsel contributions for private-sector employees.\n\nDeadlines:\n• Q1 (Jan–Mar): 14 April\n• Q2 (Apr–Jun): 14 July\n• Q3 (Jul–Sep): 14 October\n• Q4 (Oct–Dec): 14 January\n\nDA Barsel administers the maternity/paternity equalisation scheme for private employers. The contribution is calculated as a percentage of total payroll and reported via DA Barsel\'s self-service portal on Virk.dk.\n\nIf the deadline falls on a Saturday, Sunday or public holiday, it moves to the next business day.',
    },
    authority: 'DA Barsel',
    url: 'https://www.da-barsel.dk/',
    triggerRules: { minEmployees: 1 },
  },

  // ═══════════════════════════════════════
  // FERIEKONTO (Holiday Pay)
  // ═══════════════════════════════════════
  {
    id: 'feriekonto-timelonnet-slut',
    name: {
      da: 'Feriekonto – timelønnet (kort periode)',
      en: 'Feriekonto – Hourly (short period)',
    },
    category: 'hr',
    frequency: 'monthly',
    // deadlineDay 0 = last day of the month (engine special value)
    deadlineDay: 0,
    adjustBackward: true, // Feriekonto adjusts to previous business day, not next
    description: {
      da: 'Indberetning og betaling af feriepenge til Feriekonto for timelønnet personale, når lønperioden slutter senest den 15. i måneden.\n\nFrist: Sidste bankdag i samme måned som lønperiodens afslutning.\n\nHvis fristen falder på en weekend eller helligdag, rykkes den til den sidst bankdag inden.\n\nGælder for: Timelønnede, hvor lønperioden slutter 1.–15. i måneden.',
      en: 'Reporting and payment of holiday pay to Feriekonto for hourly-paid staff when the pay period ends on or before the 15th of the month.\n\nDeadline: Last banking day of the same month the pay period ends.\n\nIf the deadline falls on a weekend or public holiday, it moves to the last banking day before.\n\nApplies to: Hourly workers with pay periods ending on the 1st–15th of the month.',
    },
    authority: 'Feriekonto',
    url: 'https://virk.dk/vejledning/feriepenge/fp-arbejdsgiver/',
    triggerRules: { minEmployees: 1 },
  },
  {
    id: 'feriekonto-timelonnet-15',
    name: {
      da: 'Feriekonto – timelønnet (lang periode)',
      en: 'Feriekonto – Hourly (long period)',
    },
    category: 'hr',
    frequency: 'monthly',
    deadlineDay: 15,
    adjustBackward: true,
    description: {
      da: 'Indberetning og betaling af feriepenge til Feriekonto for timelønnet personale, når lønperioden slutter efter den 16. i måneden.\n\nFrist: Den 15. i måneden efter lønperiodens afslutning.\n\nHvis fristen falder på en weekend eller helligdag, rykkes den til den sidst bankdag inden.\n\nGælder for: Timelønnede, hvor lønperioden slutter 16.–31. i måneden.',
      en: 'Reporting and payment of holiday pay to Feriekonto for hourly-paid staff when the pay period ends after the 16th of the month.\n\nDeadline: The 15th of the month following the pay period end.\n\nIf the deadline falls on a weekend or public holiday, it moves to the last banking day before.\n\nApplies to: Hourly workers with pay periods ending on the 16th–31st of the month.',
    },
    authority: 'Feriekonto',
    url: 'https://virk.dk/vejledning/feriepenge/fp-arbejdsgiver/',
    triggerRules: { minEmployees: 1 },
  },
  {
    id: 'feriekonto-fratrådt',
    name: {
      da: 'Feriekonto – fratrådte funktionærer',
      en: 'Feriekonto – Resigned salaried employees',
    },
    category: 'hr',
    frequency: 'ad-hoc',
    description: {
      da: 'Indberetning og betaling af feriepenge til Feriekonto ved fratræden af en funktionær.\n\nFrist: Sidste bankdag i den måned, medarbejderen fratræder.\n\nUdløses ved fratræden – husk at indberette i fratrædelsesmåneden uanset hvornår i måneden fratræden sker.',
      en: 'Reporting and payment of holiday pay to Feriekonto when a salaried employee resigns.\n\nDeadline: Last banking day of the month the employee leaves.\n\nTriggered by resignation – remember to report in the resignation month regardless of when during the month the employee leaves.',
    },
    authority: 'Feriekonto',
    url: 'https://virk.dk/vejledning/feriepenge/fp-arbejdsgiver/',
    triggerRules: { minEmployees: 1 },
  },
  {
    id: 'vaegtafgift',
    name: { da: 'Vægtafgift', en: 'Weight Tax (Vehicles)' },
    category: 'afgifter',
    frequency: 'semi-annual',
    description: {
      da: 'Halvårlig afgift for motorkøretøjer baseret på vægt. Betales to gange årligt.',
      en: 'Semi-annual vehicle tax based on weight. Paid twice per year.',
    },
    authority: 'Motorstyrelsen',
    url: 'https://motorst.dk',
  },
];

// Category labels for UI
export const categoryLabels: Record<Category, Record<string, string>> = {
  skat: { da: 'Skat', en: 'Tax' },
  miljø: { da: 'Miljø', en: 'Environment' },
  eu: { da: 'EU', en: 'EU' },
  afgifter: { da: 'Afgifter', en: 'Duties' },
  hr: { da: 'HR', en: 'HR' },
  regnskab: { da: 'Regnskab', en: 'Accounting' },
};

// Frequency labels for UI
export const frequencyLabels: Record<Frequency, Record<string, string>> = {
  monthly: { da: 'Månedlig', en: 'Monthly' },
  quarterly: { da: 'Kvartal', en: 'Quarterly' },
  annual: { da: 'Årlig', en: 'Annual' },
  'semi-annual': { da: 'Halvårlig', en: 'Semi-annual' },
  'ad-hoc': { da: 'Ad hoc', en: 'Ad hoc' },
  ongoing: { da: 'Løbende', en: 'Ongoing' },
};
