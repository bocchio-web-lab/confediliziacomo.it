export interface LegalInterestRate {
    effectiveFrom: string;
    rate: string;
}

export const LEGAL_INTEREST_RATES: readonly LegalInterestRate[] = [
    { effectiveFrom: "21 aprile 1942", rate: "5%" },
    { effectiveFrom: "16 dicembre 1990", rate: "10%" },
    { effectiveFrom: "1 gennaio 1997", rate: "5%" },
    { effectiveFrom: "1 gennaio 1999", rate: "2,5%" },
    { effectiveFrom: "1 gennaio 2001", rate: "3,5%" },
    { effectiveFrom: "1 gennaio 2002", rate: "3%" },
    { effectiveFrom: "1 gennaio 2004", rate: "2,5%" },
    { effectiveFrom: "1 gennaio 2008", rate: "3%" },
    { effectiveFrom: "1 gennaio 2010", rate: "1%" },
    { effectiveFrom: "1 gennaio 2011", rate: "1,5%" },
    { effectiveFrom: "1 gennaio 2012", rate: "2,5%" },
    { effectiveFrom: "1 gennaio 2014", rate: "1%" },
    { effectiveFrom: "1 gennaio 2015", rate: "0,5%" },
    { effectiveFrom: "1 gennaio 2016", rate: "0,2%" },
    { effectiveFrom: "1 gennaio 2017", rate: "0,1%" },
    { effectiveFrom: "1 gennaio 2018", rate: "0,3%" },
    { effectiveFrom: "1 gennaio 2019", rate: "0,8%" },
    { effectiveFrom: "1 gennaio 2020", rate: "0,05%" },
    { effectiveFrom: "1 gennaio 2021", rate: "0,01%" },
    { effectiveFrom: "1 gennaio 2022", rate: "1,25%" },
    { effectiveFrom: "1 gennaio 2023", rate: "5,00%" },
    { effectiveFrom: "1 gennaio 2024", rate: "2,50%" },
    { effectiveFrom: "1 gennaio 2025", rate: "2,00%" },
    { effectiveFrom: "1 gennaio 2026", rate: "1,60%" },
];
