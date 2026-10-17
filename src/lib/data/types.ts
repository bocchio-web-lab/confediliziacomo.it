export interface DocumentLink {
    title: string;
    description?: string;
    href: string;
}

export interface PricedItem {
    label: string;
    price: string;
}

/** Builds the URL of a PDF stored in `static/docs`. */
export const pdf = (fileName: string) => `/docs/${fileName}`;
