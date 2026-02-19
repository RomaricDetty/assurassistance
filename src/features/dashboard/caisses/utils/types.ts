/* 
{
    "id": 152,
    "accountId": 3,
    "type": "TRANSFER_OUT",
    "reference": "TRA.20250429.22B62860A68A",
    "amount": -450,
    "balance": 3930,
    "operationDate": "2025-04-29T14:14:05.254978",
    "tag": null
  }, */

export type TransactionColumnSchema = {
  id: number;
  accountId: number;
  type: "TRANSFER_IN" | "TRANSFER_OUT" | "DEPOSIT" | "WITHDRAWAL";
  reference: string;
  amount: number;
  balance: number;
  operationDate: string;
  tag: string;
};