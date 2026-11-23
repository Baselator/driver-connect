import type { Transaction } from "@/models/types";
import { KEYS, readJSON, writeJSON } from "./storage";

export async function listTransactions(): Promise<Transaction[]> {
  const list = await readJSON<Transaction[]>(KEYS.transactions, []);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addTransaction(tx: Transaction): Promise<void> {
  const list = await readJSON<Transaction[]>(KEYS.transactions, []);
  await writeJSON(KEYS.transactions, [tx, ...list]);
}

export async function updateTransaction(id: string, patch: Partial<Transaction>): Promise<void> {
  const list = await readJSON<Transaction[]>(KEYS.transactions, []);
  await writeJSON(
    KEYS.transactions,
    list.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  );
}
