const customerClassifications:Record<string,string>={gold:"ذهبي",silver:"فضي",follow_up:"متابعة"};

export const customerClassificationLabel=(value:string)=>customerClassifications[value]??value;
